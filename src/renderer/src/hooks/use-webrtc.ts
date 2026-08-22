/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'
import { useAudioSettings } from '@/stores/use-audio-settings'

const DEFAULT_ICE_SERVERS = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302']
    }
  ]
}

export type PeerStream = {
  userId: string
  stream: MediaStream
  username?: string
  videoEnabled: boolean
  audioEnabled: boolean
}

import { setOpusConfig } from '@/lib/webrtc/sdp-utils'

export type PeerMetadata = {
  name: string
  avatarUrl?: string
}

export function useWebRTC(
  roomId: string,
  user: any,
  videoConstraints: MediaTrackConstraints = {
    width: { ideal: 1280 },
    height: { ideal: 720 }
  }
) {
  const { noiseSettings, agcEnabled, echoCancellationEnabled } = useAudioSettings()
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStreams, setRemoteStreams] = useState<PeerStream[]>([])
  const [participants, setParticipants] = useState<Record<string, PeerMetadata>>({})
  // We keep state for UI if needed, but primary logic uses Ref for stability
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const [micActive, setMicActive] = useState(true)
  const [cameraActive, setCameraActive] = useState(true)

  // Debug State
  const [debugInfo, setDebugInfo] = useState<{
    peers: {
      userId: string
      ice: string
      signaling: string
      direction: string
      audioRx: boolean
      audioEnabled: boolean
    }[]
    logs: string[]
  }>({ peers: [], logs: [] })

  const localStreamRef = useRef<MediaStream | null>(null)
  const peersRef = useRef<Record<string, RTCPeerConnection>>({})
  const candidateQueuesRef = useRef<Record<string, RTCIceCandidateInit[]>>({}) // Queue for ICE candidates per peer
  const channelRef = useRef<RealtimeChannel | null>(null)
  const iceServersRef = useRef<RTCConfiguration>(DEFAULT_ICE_SERVERS)
  const supabase = createClient()

  useEffect(() => {
    const fetchIceServers = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-turn-credentials')
        if (data?.iceServers) {
          iceServersRef.current = { iceServers: data.iceServers }
        }
      } catch (e) {
        console.error('[WebRTC] Failed to fetch ICE servers, using fallback', e)
      }
    }
    fetchIceServers()
  }, [])

  const addLog = (msg: string) => {
    console.log(msg)
    setDebugInfo((prev) => ({ ...prev, logs: [...prev.logs.slice(-20), msg] }))
  }

  const updateDebugPeers = () => {
    const peerData = Object.entries(peersRef.current).map(([userId, pc]) => {
      const audioReceiver = pc.getReceivers().find((r) => r.track.kind === 'audio')
      return {
        userId,
        ice: pc.iceConnectionState,
        signaling: pc.signalingState,
        direction: (pc as any)._isInitiator ? 'Outgoing' : 'Incoming',
        audioRx: !!audioReceiver,
        audioEnabled: audioReceiver?.track?.enabled ?? false
      }
    })
    setDebugInfo((prev) => ({ ...prev, peers: peerData }))
  }

  // --- 1. Local Media ---

  useEffect(() => {
    let mounted = true
    addLog('[WebRTC] Initializing Local Media...')

    const startMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: {
            echoCancellation: echoCancellationEnabled,
            noiseSuppression: noiseSettings.enabled, // browser-level suppression as fallback
            autoGainControl: agcEnabled
          }
        })

        if (mounted) {
          addLog(`[WebRTC] Local Media Access Granted ${stream.id}`)
          setLocalStream(stream)
          localStreamRef.current = stream
          setMicActive(stream.getAudioTracks().some(t => t.enabled))
          setCameraActive(stream.getVideoTracks().some(t => t.enabled && !t.label.toLowerCase().includes('screen')))

          // Add tracks to existing peers (if any connected before media was ready)
          Object.entries(peersRef.current).forEach(([userId, pc]) => {
            if (pc.connectionState === 'closed') return
            addLog(`[WebRTC] Adding late tracks to ${userId}`)
            stream.getTracks().forEach((track) => {
              try {
                pc.addTrack(track, stream)
              } catch (e: any) {
                console.warn(`[WebRTC] Error adding track to ${userId}:`, e)
              }
            })
          })
        }
      } catch (err) {
        console.error('[WebRTC] Error accessing media devices:', err)
        addLog(`[WebRTC] Media Error: ${err}`)
      }
    }

    if (!localStreamRef.current) {
      startMedia()
    }

    return () => {
      mounted = false
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      addLog('[WebRTC] Unmounting hook, cleaning up...')
      localStreamRef.current?.getTracks().forEach((track) => track.stop())
      Object.keys(peersRef.current).forEach((key) => {
        peersRef.current[key].close()
        delete peersRef.current[key]
      })
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [])

  // Constraints
  useEffect(() => {
    if (localStreamRef.current && localStreamRef.current.getVideoTracks().length > 0) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0]
      if (videoTrack.label.indexOf('screen') === -1) {
        videoTrack.applyConstraints(videoConstraints).catch((err) => {
          console.warn('[WebRTC] Failed to apply video constraints', err)
        })
      }
    }
  }, [videoConstraints])

  // --- 2. Signaling ---

  useEffect(() => {
    if (!user || !roomId) return

    // Clean existing
    if (channelRef.current) {
      addLog('[WebRTC] Cleaning up existing channel')
      supabase.removeChannel(channelRef.current)
    }

    addLog(`[WebRTC] Connecting to signaling channel: room-signaling:${roomId}`)
    const newChannel = supabase.channel(`room-signaling:${roomId}`)

    // Set ref IMMEDIATELY so handlers can use it
    channelRef.current = newChannel
    setChannel(newChannel)

    newChannel
      .on('presence', { event: 'sync' }, () => {
        const state = newChannel.presenceState()
        handlePresenceSync(state)
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        handlePeerJoin(newPresences)
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        handlePeerLeave(leftPresences)
      })
      .on('broadcast', { event: 'offer' }, ({ payload }) => handleReceiveOffer(payload))
      .on('broadcast', { event: 'answer' }, ({ payload }) => handleReceiveAnswer(payload))
      .on('broadcast', { event: 'ice-candidate' }, ({ payload }) =>
        handleReceiveIceCandidate(payload)
      )
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const username =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split('@')[0] ||
            'Guest'
          addLog(`[WebRTC] Joining presence as ${username}`)

          await newChannel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
            username: username
          })
        }
      })

    return () => {}
  }, [roomId, user?.id])

  // --- Logic ---

  const handlePresenceSync = (state: Record<string, any[]>) => {
    const allUsers = Object.values(state).flat()
    addLog(`[WebRTC] Presence Sync Users: ${allUsers.length}`)

    const newParticipants: Record<string, PeerMetadata> = {}
    allUsers.forEach((presence) => {
      if (presence.user_id !== user.id) {
        newParticipants[presence.user_id] = {
          name: presence.username || 'Guest',
          avatarUrl: presence.avatar_url // Assuming avatar_url might be in presence, if not, it's undefined
        }
      }
    })
    setParticipants(newParticipants)

    allUsers.forEach((presence) => {
      if (presence.user_id === user.id) return

      const myId = user.id
      const theirId = presence.user_id

      // Only initiate if Higher ID (Polite Peer Pattern: Impolite initiates)
      if (myId > theirId) {
        addLog(`[WebRTC] Sync: I am Higher ID. Initiating to ${theirId}`)
        createPeerConnection(theirId, true, presence.username)
      }
    })
  }

  const handlePeerJoin = (newPresences: any[]) => {
    newPresences.forEach((presence) => {
      if (presence.user_id === user.id) return
      addLog(`[WebRTC] Join: ${presence.user_id}`)

      setParticipants((prev) => ({
        ...prev,
        [presence.user_id]: {
          name: presence.username || 'Guest',
          avatarUrl: presence.avatar_url
        }
      }))

      const myId = user.id
      const theirId = presence.user_id

      if (myId > theirId) {
        addLog(`[WebRTC] Join: I am Higher ID. Initiating to ${theirId}`)
        createPeerConnection(presence.user_id, true, presence.username)
      }
    })
  }

  const handlePeerLeave = (leftPresences: any[]) => {
    leftPresences.forEach((presence: any) => {
      const userId = presence.user_id
      addLog(`[WebRTC] Leave: ${userId}`)

      setParticipants((prev) => {
        const newParticipants = { ...prev }
        delete newParticipants[userId]
        return newParticipants
      })

      if (peersRef.current[userId]) {
        peersRef.current[userId].close()
        delete peersRef.current[userId]
        delete candidateQueuesRef.current[userId] // Cleanup queue
        setRemoteStreams((prev) => prev.filter((s) => s.userId !== userId))
        updateDebugPeers()
      }
    })
  }

  async function createPeerConnection(targetUserId: string, initiator: boolean, username?: string) {
    if (peersRef.current[targetUserId]) {
      const cs = peersRef.current[targetUserId].connectionState
      if (cs === 'closed' || cs === 'failed') {
        peersRef.current[targetUserId].close()
        delete peersRef.current[targetUserId]
      } else {
        return peersRef.current[targetUserId]
      }
    }

    addLog(`[WebRTC] Creating PC for ${targetUserId} (Init: ${initiator})`)
    const pc = new RTCPeerConnection(iceServersRef.current)
    ;(pc as any)._isInitiator = initiator
    ;(pc as any)._makingOffer = false // Perfect Negotiation State
    peersRef.current[targetUserId] = pc
    candidateQueuesRef.current[targetUserId] = [] // Init queue
    updateDebugPeers()

    // Monitor State Changes
    pc.oniceconnectionstatechange = () => {
      updateDebugPeers()
      if (pc.iceConnectionState === 'failed') {
        addLog(`[WebRTC] ICE Failed for ${targetUserId}. Restarting ICE...`)
        pc.restartIce()
      }
    }
    pc.onsignalingstatechange = () => updateDebugPeers()

    // Add Tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!)
      })
    }

    // Handlers
    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: { target: targetUserId, candidate: event.candidate, sender: user.id }
        })
      }
    }

    pc.ontrack = (event) => {
      addLog(`[WebRTC] Track Rx: ${targetUserId} ${event.streams[0].id}`)
      const [remoteStream] = event.streams

      // Handle Track Mute/Unmute for UI updates
      event.track.onmute = () => {
        console.log(`[WebRTC] Track Muted: ${event.track.kind} from ${targetUserId}`)
        updateRemoteStreamState(targetUserId, event.track.kind, false)
      }

      event.track.onunmute = () => {
        console.log(`[WebRTC] Track Unmuted: ${event.track.kind} from ${targetUserId}`)
        updateRemoteStreamState(targetUserId, event.track.kind, true)
      }

      setRemoteStreams((prev) => {
        const found = prev.find((s) => s.userId === targetUserId)
        const videoTrack = remoteStream.getVideoTracks()[0]
        const audioTrack = remoteStream.getAudioTracks()[0]

        if (found) {
          if (found.stream.id !== remoteStream.id) {
            return prev.map((p) =>
              p.userId === targetUserId
                ? {
                    ...p,
                    stream: remoteStream,
                    videoEnabled: videoTrack ? videoTrack.enabled && !videoTrack.muted : false,
                    audioEnabled: audioTrack ? audioTrack.enabled && !audioTrack.muted : false
                  }
                : p
            )
          }
          return prev
        }
        return [
          ...prev,
          {
            userId: targetUserId,
            stream: remoteStream,
            username,
            videoEnabled: videoTrack ? videoTrack.enabled && !videoTrack.muted : false,
            audioEnabled: audioTrack ? audioTrack.enabled && !audioTrack.muted : false
          }
        ]
      })
    }

    // Perfect Negotiation Logic
    pc.onnegotiationneeded = async () => {
      addLog(`[WebRTC] Negotiation needed for ${targetUserId}`)
      try {
        ;(pc as any)._makingOffer = true
        await pc.setLocalDescription()

        if (!channelRef.current) {
          addLog('[WebRTC] No channel for negotiation')
          ;(pc as any)._makingOffer = false
          return
        }

        // Apply High-Fidelity settings to SDP if possible (hacky with simple setLocalDescription,
        // but we might need createOffer to control it better if setOpusConfig requires it.
        // Standard Perfect Negotiation uses setLocalDescription() without arguments.)
        // To keep setOpusConfig, we might need to intercept the description from pc.localDescription

        const offer = pc.localDescription
        if (offer && offer.type === 'offer') {
          // Check if we can safely modify SDP
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const modifiedSdp = setOpusConfig(offer.sdp)
          // We can't easily update localDescription after set, so we send the modified one
          // Ideally we use createOffer -> setOpus -> setLocal, but that breaks the 'perfect negotiation'
          // simplicity of just setLocalDescription().
          // Let's rely on setLocalDescription() for state, but send modified SDP.

          // ACTUALLY: createOffer pattern is still compatible if wrapped in makingOffer guards.
        }

        channelRef.current.send({
          type: 'broadcast',
          event: 'offer',
          payload: {
            target: targetUserId,
            offer: { type: offer?.type, sdp: setOpusConfig(offer?.sdp || '') },
            sender: user.id,
            username:
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.email?.split('@')[0] ||
              'Guest'
          }
        })
      } catch (err) {
        console.error(`[WebRTC] Negotiation failed for ${targetUserId}`, err)
      } finally {
        ;(pc as any)._makingOffer = false
      }
    }

    return pc
  }

  async function handleReceiveOffer(payload: any) {
    if (payload.target !== user.id) return
    const { sender, offer, username } = payload

    // We treat Peer Connection creation as idempotent-ish
    let pc = peersRef.current[sender]
    if (!pc) {
      pc = await createPeerConnection(sender, false, username)
    }
    if (!pc) return

    addLog(`[WebRTC] Handle Offer from ${sender} (State: ${pc.signalingState})`)

    const isPolite = user.id < sender // Lower ID is polite? Or Higher?
    // Convention: Higher ID is impolite (initiates), Lower ID is polite (accepts/yields)
    // Previous code: if (myId > theirId) initiate. So My ID (High) = Impolite.
    // Polite peer (Low ID) is the one that rolls back.

    const offerCollision =
      offer.type === 'offer' && ((pc as any)._makingOffer || pc.signalingState !== 'stable')

    ;(pc as any)._ignoreOffer = !isPolite && offerCollision

    if ((pc as any)._ignoreOffer) {
      addLog(`[WebRTC] Glare: Ignoring offer from ${sender} (I am Impolite)`)
      return
    }

    if (offerCollision) {
      addLog(`[WebRTC] Glare: Rolling back to accept offer from ${sender} (I am Polite)`)
      await pc.setLocalDescription({ type: 'rollback' })
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer))

      // Process Queued Candidates
      const queue = candidateQueuesRef.current[sender] || []
      if (queue.length > 0) {
        addLog(`[WebRTC] Processing ${queue.length} queued candidates for ${sender}`)
        for (const candidate of queue) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate))
          } catch (e) {
            console.warn('[WebRTC] Failed to add queued candidate during offer handling', e)
          }
        }
        candidateQueuesRef.current[sender] = []
      }

      if (offer.type === 'offer') {
        await pc.setLocalDescription() // Create Answer implicitly
        const answer = pc.localDescription

        channelRef.current?.send({
          type: 'broadcast',
          event: 'answer',
          payload: {
            target: sender,
            answer: { type: answer?.type, sdp: setOpusConfig(answer?.sdp || '') },
            sender: user.id
          }
        })
        addLog(`[WebRTC] Sent Answer to ${sender}`)
      }
    } catch (err) {
      console.error('[WebRTC] Handle Offer Error:', err)
      addLog(`[WebRTC] Fatal Error Handling Offer: ${err}`)
    }
  }

  async function handleReceiveAnswer(payload: any) {
    if (payload.target !== user.id) return
    const { sender, answer } = payload

    const pc = peersRef.current[sender]
    if (pc) {
      addLog(`[WebRTC] Handle Answer from ${sender} (State: ${pc.signalingState})`)
      try {
        if (pc.signalingState === 'stable') {
          addLog(`[WebRTC] Ignoring answer from ${sender} (Already Stable)`)
          return
        }

        await pc.setRemoteDescription(new RTCSessionDescription(answer))
        addLog(`[WebRTC] Remote Description Set (Answer) for ${sender}`)

        // Process Queued Candidates
        const queue = candidateQueuesRef.current[sender] || []
        if (queue.length > 0) {
          addLog(`[WebRTC] Processing ${queue.length} queued candidates for ${sender}`)
          for (const candidate of queue) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate))
            } catch (e) {
              console.warn('[WebRTC] Failed to add queued candidate during answer handling', e)
            }
          }
          candidateQueuesRef.current[sender] = []
        }
      } catch (err: any) {
        console.error('[WebRTC] Handle Answer Error:', err)
        addLog(`[WebRTC] Error Handling Answer: ${err}`)
      }
    }
  }

  async function handleReceiveIceCandidate(payload: any) {
    if (payload.target !== user.id) return
    const { sender, candidate } = payload

    const pc = peersRef.current[sender]
    if (pc) {
      // Fix: Queue if no remote description or not ready
      if (!pc.remoteDescription) {
        addLog(`[WebRTC] Queued candidate from ${sender} (No Remote Desc)`)
        if (!candidateQueuesRef.current[sender]) candidateQueuesRef.current[sender] = []
        candidateQueuesRef.current[sender].push(candidate)
      } else {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate))
        } catch (err: any) {
          console.warn(`[WebRTC] Failed to add candidate from ${sender}:`, err)
          // Re-queue if it failed due to missing remote description (race condition)
          if (err.message && err.message.includes('remote description was null')) {
            addLog(`[WebRTC] Re-queuing candidate from ${sender} (Add Failed)`)
            if (!candidateQueuesRef.current[sender]) candidateQueuesRef.current[sender] = []
            candidateQueuesRef.current[sender].push(candidate)
          }
        }
      }
    }
  }

  // --- Controls ---
  const toggleMic = useCallback(async () => {
    if (localStreamRef.current) {
      addLog('[WebRTC] Toggling Mic')
      let newState = false
      localStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = !t.enabled
        newState = t.enabled
        addLog(`[WebRTC] Set Local Track ${t.id} enabled=${t.enabled}`)
      })
      setMicActive(newState)

      // Explicitly sync with PC senders to be sure
      Object.values(peersRef.current).forEach((pc) => {
        pc.getSenders().forEach((sender) => {
          if (sender.track && sender.track.kind === 'audio') {
            // Just verifying identity
            const isSame = localStreamRef.current
              ?.getAudioTracks()
              .some((t) => t.id === sender.track?.id)
            addLog(
              `[WebRTC] PC Sender Track ${sender.track.id} (Match Local: ${isSame}) enabled=${sender.track.enabled}`
            )

            // Force update if for some reason it's different logic
            if (isSame) {
              sender.track.enabled = localStreamRef
                .current!.getAudioTracks()
                .find((t) => t.id === sender.track!.id)!.enabled
            }
          }
        })
      })
      return true
    } else {
      addLog('[WebRTC] Toggle Mic Failed: No local stream')
      return false
    }
  }, [])

  const toggleCamera = useCallback(async () => {
    if (localStreamRef.current) {
      addLog('[WebRTC] Toggling Camera')
      let newState = false
      localStreamRef.current.getVideoTracks().forEach((t) => {
        t.enabled = !t.enabled
        newState = t.enabled
        addLog(`[WebRTC] Set Local Video Track ${t.id} enabled=${t.enabled}`)
      })
      setCameraActive(newState)
      // Explicitly sync PC senders
      Object.values(peersRef.current).forEach((pc) => {
        pc.getSenders().forEach((sender) => {
          if (sender.track && sender.track.kind === 'video') {
            const isSame = localStreamRef.current
              ?.getVideoTracks()
              .some((t) => t.id === sender.track?.id)
            if (isSame) {
              sender.track.enabled = localStreamRef
                .current!.getVideoTracks()
                .find((t) => t.id === sender.track!.id)!.enabled
            }
          }
        })
      })
      return true
    }
    return false
  }, [])

  const toggleScreenShare = useCallback(async (sourceId?: string) => {
    if (!localStreamRef.current) return false

    const videoTrack = localStreamRef.current.getVideoTracks()[0]
    // Check if we're already screen sharing (track exists and label contains 'screen')
    const isScreen = videoTrack ? videoTrack.label.toLowerCase().includes('screen') : false

    if (isScreen && videoTrack && !sourceId) {
      // Stop screen share → revert to camera
      videoTrack.stop()
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        const camTrack = stream.getVideoTracks()[0]

        localStreamRef.current.removeTrack(videoTrack)
        localStreamRef.current.addTrack(camTrack)
        setCameraActive(camTrack.enabled)

        Object.values(peersRef.current).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video')
          if (sender) sender.replaceTrack(camTrack)
        })
      } catch (e) {
        console.warn('[WebRTC] Could not revert to camera after screen share', e)
        if (videoTrack) localStreamRef.current.removeTrack(videoTrack)
      }

      setLocalStream(new MediaStream(localStreamRef.current.getTracks()))
      return false
    } else {
      // Start screen share
      try {
        let screenStream: MediaStream

        if (sourceId) {
          // Electron path: use getUserMedia with the specific desktop source ID.
          // This is the reliable approach that uses exactly the source the user picked.
          screenStream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              // @ts-ignore — Electron-specific chromeMediaSource constraint
              mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: sourceId,
                maxWidth: 1920,
                maxHeight: 1080,
                maxFrameRate: 30
              }
            }
          })
        } else {
          // Fallback: standard getDisplayMedia (non-Electron or no sourceId)
          screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: false
          })
        }

        const screenTrack = screenStream.getVideoTracks()[0]

        // Remove existing video track if any
        if (videoTrack) {
          videoTrack.stop()
          localStreamRef.current.removeTrack(videoTrack)
        }
        localStreamRef.current.addTrack(screenTrack)

        Object.values(peersRef.current).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video')
          if (sender) {
            sender.replaceTrack(screenTrack)
          } else {
            pc.addTrack(screenTrack, localStreamRef.current!)
          }
        })

        screenTrack.onended = () => {
          toggleScreenShare() // user stopped sharing via OS stop button
        }

        setLocalStream(new MediaStream(localStreamRef.current.getTracks()))
        return true
      } catch (e) {
        console.error('Screen share failed', e)
        return false
      }
    }
  }, [])

  const updateRemoteStreamState = (userId: string, kind: string, enabled: boolean) => {
    setRemoteStreams((prev) =>
      prev.map((p) => {
        if (p.userId === userId) {
          return {
            ...p,
            videoEnabled: kind === 'video' ? enabled : p.videoEnabled,
            audioEnabled: kind === 'audio' ? enabled : p.audioEnabled
          }
        }
        return p
      })
    )
  }

  return {
    localStream,
    remoteStreams,
    participants,
    micActive,
    cameraActive,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    debugInfo
  }
}
