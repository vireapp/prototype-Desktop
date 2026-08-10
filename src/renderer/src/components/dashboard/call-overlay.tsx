'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Maximize2,
  Minimize2,
  MonitorUp,
  MonitorOff,
  Waves,
  Phone,
  Info
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { AudioPipeline } from '@/lib/audio/audio-manager'
import { useAudioSettings } from '@/stores/use-audio-settings'

interface CallOverlayProps {
  friend: {
    id: string
    username: string
    full_name?: string
    avatar_url?: string
    [key: string]: unknown
  }
  type: 'video' | 'voice'
  currentUser: {
    id: string
    username?: string
    user_metadata?: { full_name?: string; username?: string }
    email?: string
    avatar_url?: string
    [key: string]: unknown
  }
  isMinimized?: boolean
  onMinimize?: (minimized: boolean) => void
  onClose?: () => void
}

const DEFAULT_ICE_SERVERS = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302']
    }
  ]
}

export function CallOverlay({
  friend,
  type,
  currentUser,
  isMinimized: propIsMinimized,
  onMinimize,
  onClose
}: CallOverlayProps): JSX.Element {
  const navigate = useNavigate()
  const supabase = createClient()

  // State
  const [status, setStatus] = useState('Connecting...')
  const [duration, setDuration] = useState(0)
  const [currentCallType, setCurrentCallType] = useState<'video' | 'voice'>(type)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(type === 'voice')
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [internalIsMinimized, setInternalIsMinimized] = useState(false)
  const [callId, setCallId] = useState<string | null>(null)

  // Audio settings from persisted store
  const {
    noiseSettings,
    agcEnabled,
    echoCancellationEnabled,
    setNoiseSettings
  } = useAudioSettings()
  const isANCEnabled = noiseSettings.enabled

  const [disconnectReason, setDisconnectReason] = useState<string | null>(null)
  const [networkStats, setNetworkStats] = useState({ rtt: 0, ip: 'Connecting...', packetsLost: 0 })
  const [showStats, setShowStats] = useState(false)

  // ... minimize logic helper ...

  // 4. Network Stats Polling
  useEffect(() => {
    if (!peerConnection.current) return

    const interval = setInterval(async () => {
      const pc = peerConnection.current
      if (!pc || pc.connectionState !== 'connected') return

      try {
        const stats = await pc.getStats()
        let rtt = 0
        let ip = 'Relay/P2P'
        let packetsLost = 0

        stats.forEach((report) => {
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            rtt = report.currentRoundTripTime * 1000

            // Try to find remote candidate IP
            if (report.remoteCandidateId) {
              const remoteCandidate = stats.get(report.remoteCandidateId)
              if (remoteCandidate) {
                // Prefer address if available (standard), else ip
                const rawIp = remoteCandidate.address || remoteCandidate.ip || ''
                // Check candidate type for context
                const type = remoteCandidate.candidateType
                ip = `${rawIp} (${type})`
              }
            }
          }
          if (report.type === 'inbound-rtp' && report.kind === 'video') {
            packetsLost = report.packetsLost
          }
        })

        setNetworkStats({ rtt: Math.round(rtt), ip, packetsLost })
      } catch (e) {
        console.error('Stats error', e)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [status]) // Re-bind when status connects

  // Derived state for minimization
  const isMinimized = propIsMinimized ?? internalIsMinimized

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const peerConnection = useRef<RTCPeerConnection | null>(null)
  const localStream = useRef<MediaStream | null>(null)
  const remoteStream = useRef<MediaStream | null>(null)
  const screenStream = useRef<MediaStream | null>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const candidateQueue = useRef<RTCIceCandidateInit[]>([])
  // Audio pipeline (noise cancellation + compressor graph)
  const audioPipelineRef = useRef<AudioPipeline | null>(null)

  // 1. Initialize Call & Signaling
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel>
    let retryInterval: NodeJS.Timeout

    const initCall = async (): Promise<void> => {
      console.log(`Initializing Call Overlay as: ${currentUser.username} (${currentUser.id})`)
      try {
        // A. Determine who is who (find the active call row)
        // We look for a PENDING or ACTIVE call between these two user IDs.
        const { data: activeCalls } = await supabase
          .from('active_calls')
          .select('*')
          .or(`caller_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
          .in('status', ['pending', 'active'])
          .order('created_at', { ascending: false })
          .limit(1)

        const currentCall = activeCalls?.[0]
        const isCaller = currentCall?.caller_id === currentUser.id

        if (currentCall) {
          setCallId(currentCall.id)
          // If I am receiver and status is pending, I should probably mark it active?
          // Actually, let's just stick to WebRTC "Connected" status for UI.
        }

        // B. Get Local Stream (raw — NC is handled by AudioPipeline post-capture)
        const rawStream = await navigator.mediaDevices.getUserMedia({
          video: type === 'video',
          audio: {
            echoCancellation: echoCancellationEnabled,
            noiseSuppression: false, // let our worklet handle gating
            autoGainControl: agcEnabled,
            // @ts-expect-error MediaTrackConstraints is missing goog properties
            googEchoCancellation: echoCancellationEnabled,
            googAutoGainControl: agcEnabled,
            googNoiseSuppression: false
          }
        })

        // C-pre. Route audio through our noise-cancellation pipeline
        let processedStream = rawStream
        try {
          const pipeline = new AudioPipeline(noiseSettings)
          audioPipelineRef.current = pipeline
          processedStream = await pipeline.init(rawStream)
        } catch (pipelineErr) {
          console.warn('[CallOverlay] AudioPipeline failed, using raw stream:', pipelineErr)
        }

        localStream.current = processedStream
        if (localVideoRef.current && type === 'video') {
          localVideoRef.current.srcObject = processedStream
        }

        // Fetch ICE Servers from Supabase
        let iceServers = DEFAULT_ICE_SERVERS
        try {
          const { data, error } = await supabase.functions.invoke('get-turn-credentials')
          if (data?.iceServers) {
            iceServers = { iceServers: data.iceServers }
          }
        } catch (e) {
          console.error('[CallOverlay] Failed to fetch ICE servers, using fallback', e)
        }

        // C. Create Peer Connection
        const pc = new RTCPeerConnection(iceServers)
        peerConnection.current = pc

        // Add Tracks
        processedStream.getTracks().forEach((track) => pc.addTrack(track, processedStream))

        // On Remote Track
        pc.ontrack = (event) => {
          const rStream = event.streams[0]
          remoteStream.current = rStream // Store in Ref

          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = rStream
          }
          setStatus('Connected')
        }

        // ... ICE Candidate ...

        // ... (after initCall useEffect)

        // On ICE Candidate
        pc.onicecandidate = (event) => {
          if (event.candidate && channel) {
            channel.send({
              type: 'broadcast',
              event: 'candidate',
              payload: { candidate: event.candidate }
            })
          }
        }

        // D. Signaling Channel
        const channelId = `call_signaling_${[currentUser.id, friend.id].sort().join('_')}`
        channel = supabase.channel(channelId)
        channelRef.current = channel

        // Chain to serialize signaling operations
        const signalingChain = { current: Promise.resolve() }

        // Helper to enqueue tasks
        const enqueueSignaling = (task: () => Promise<void>): void => {
          signalingChain.current = signalingChain.current.then(task).catch((err) => {
            console.error('Signaling chain error:', err)
          })
        }

        // Subscribe to events
        channel
          .on(
            'broadcast',
            { event: 'offer' },
            ({ payload }: { payload: { offer: RTCSessionDescriptionInit } }) => {
              enqueueSignaling(async () => {
                if (isCaller) return // Caller ignores offers (collision avoidance)

                console.log('Received Offer')
                if (!pc) return

                // Guard: If we are not stable or having remote offer, we might be in race.
                // Since we are "Receiver", we expect to receive offers.
                // But if we somehow have a local offer (glare), rollback.
                if (pc.signalingState === 'have-local-offer') {
                  console.warn(
                    `[CallOverlay] Glare detected. Rolling back local offer to accept remote.`
                  )
                  try {
                    await pc.setLocalDescription({ type: 'rollback' })
                  } catch (e) {
                    console.warn('Rollback failed', e)
                  }
                }

                // Further guard against weird states
                if (pc.signalingState !== 'stable' && pc.signalingState !== 'have-remote-offer') {
                  // If still bad state, we might crash on setRemoteDescription, but let's try or return?
                  // Standard is to proceed if rollback worked.
                }

                await pc.setRemoteDescription(payload.offer)

                // Process Queued Candidates (for Callee)
                if (candidateQueue.current.length > 0) {
                  console.log(`Processing ${candidateQueue.current.length} queued candidates`)
                  for (const candidate of candidateQueue.current) {
                    try {
                      await pc.addIceCandidate(candidate)
                    } catch (e) {
                      console.error('Failed to add queued candidate', e)
                    }
                  }
                  candidateQueue.current = []
                }

                const answer = await pc.createAnswer()
                await pc.setLocalDescription(answer)

                channel.send({
                  type: 'broadcast',
                  event: 'answer',
                  payload: { answer }
                })
              })
            }
          )
          .on(
            'broadcast',
            { event: 'answer' },
            ({ payload }: { payload: { answer: RTCSessionDescriptionInit } }) => {
              enqueueSignaling(async () => {
                if (!isCaller) return // Receiver ignores answers

                console.log('Received Answer')
                if (!pc) return

                // Fix: Check if we are actually waiting for an answer
                if (pc.signalingState !== 'have-local-offer') {
                  // Suppress log to reduce noise for "stable" race condition
                  // console.log(`[WebRTC] Ignoring answer (State: ${pc.signalingState})`);
                  return
                }

                try {
                  // If we are "stable" but receive an answer, it might be a delayed duplicate
                  // OR we might have just sent an ICE Restart offer?
                  // Actually if we sent an ICE restart offer, we are in 'have-local-offer'.
                  // So standard state check applies.

                  await pc.setRemoteDescription(payload.answer)
                } catch (err: unknown) {
                  if (err instanceof Error && err.name === 'InvalidStateError') {
                    console.warn(
                      `[WebRTC] Answer ignored due to state mismatch: ${pc.signalingState}`
                    )
                    return
                  }
                  console.error('Error setting remote description for answer', err)
                  return
                }

                // Process Queued Candidates
                if (candidateQueue.current.length > 0) {
                  console.log(`Processing ${candidateQueue.current.length} queued candidates`)
                  for (const candidate of candidateQueue.current) {
                    try {
                      await pc.addIceCandidate(candidate)
                    } catch (e) {
                      console.error('Failed to add queued candidate', e)
                    }
                  }
                  candidateQueue.current = []
                }
              })
            }
          )
          .on(
            'broadcast',
            { event: 'upgrade-to-video' },
            ({ payload }: { payload: { offer: RTCSessionDescriptionInit } }) => {
              enqueueSignaling(async () => {
                console.log('Peer upgraded to video')
                if (!pc) return

                setCurrentCallType('video')

                await pc.setRemoteDescription(payload.offer)
                const answer = await pc.createAnswer()
                await pc.setLocalDescription(answer)

                channel.send({
                  type: 'broadcast',
                  event: 'answer',
                  payload: { answer }
                })

                toast.success(`${friend.full_name || friend.username} switched to video call`)
              })
            }
          )
          .on(
            'broadcast',
            { event: 'candidate' },
            ({ payload }: { payload: { candidate: RTCIceCandidateInit } }) => {
              enqueueSignaling(async () => {
                console.log('Received Candidate from peer')
                if (!pc) return
                // Queue if remote description is not set yet
                if (!pc.remoteDescription) {
                  // Only log if not stable (if stable, it's likely a zombie PC awaiting an ignored answer)
                  if (pc.signalingState !== 'stable') {
                    console.log('Queuing candidate (No Remote Description)')
                  }
                  candidateQueue.current.push(payload.candidate)
                  return
                }
                try {
                  await pc.addIceCandidate(payload.candidate)
                } catch (e) {
                  console.error('Error adding candidate', e)
                  // Fallback: Re-queue if it failed likely due to race
                  candidateQueue.current.push(payload.candidate)
                }
              })
            }
          )
          .on(
            'broadcast',
            { event: 'end-call' },
            ({
              payload
            }: {
              payload: { senderId?: string; username?: string; fullName?: string }
            }) => {
              console.log('Received end-call signal:', payload)

              // ID-based Self-Check (More Robust)
              const myId = currentUser.id
              const senderId = payload?.senderId

              if (senderId && senderId === myId) {
                return
              }

              // Fallback Username check
              const myUsername = (
                currentUser.username ||
                currentUser.user_metadata?.username ||
                currentUser.email?.split('@')[0] ||
                'User'
              ).toLowerCase()
              const senderUsername = (payload?.username || 'peer').toLowerCase()

              if (!senderId && senderUsername === myUsername) {
                return
              }

              // Received "end-call" signal from peer
              // Use payload name as the source of truth for who ended it
              const displayPeerName =
                payload?.fullName || payload?.username || friend.full_name || 'Peer'
              setDisconnectReason(`Call ended by ${displayPeerName}`)

              // Delay cleanup to show message
              setTimeout(() => {
                performCleanup()
              }, 2000)
            }
          )
          .on('broadcast', { event: 'request-offer' }, async () => {
            if (!isCaller) return
            console.log('Received Request for Offer (Reconnection suspected)')
            if (!pc) return

            // Create a NEW offer with ICE Restart to force new candidates
            try {
              const offer = await pc.createOffer({ iceRestart: true })
              await pc.setLocalDescription(offer)

              await channel.send({
                type: 'broadcast',
                event: 'offer',
                payload: { offer }
              })
            } catch (e) {
              console.error('Failed to restart ICE', e)
            }
          })
          .subscribe(async (status: string) => {
            if (status === 'SUBSCRIBED') {
              // E. Handshake Logic
              if (isCaller) {
                console.log('I am Caller. Creating Offer...')
                const offer = await pc.createOffer()
                await pc.setLocalDescription(offer)
                channel.send({
                  type: 'broadcast',
                  event: 'offer',
                  payload: { offer }
                })
              } else {
                console.log('I am Receiver. Requesting Offer...')
                const sendRequest = (): void => {
                  channel.send({
                    type: 'broadcast',
                    event: 'request-offer',
                    payload: {}
                  })
                }

                sendRequest()

                // Auto-retry mechanism
                retryInterval = setInterval(() => {
                  if (
                    pc &&
                    pc.iceConnectionState !== 'connected' &&
                    pc.iceConnectionState !== 'completed'
                  ) {
                    console.log('Retrying Request Offer...')
                    channel.send({
                      type: 'broadcast',
                      event: 'request-offer',
                      payload: {}
                    })
                  } else {
                    clearInterval(retryInterval)
                  }
                }, 2000)
              }
            }
          })
      } catch (err: any) {
        console.error('Error starting call:', err)
        toast.error(`Call Failed: ${err.message || err}`)
        setStatus('Call Failed')
      }
    }

    initCall()

    return () => {
      if (retryInterval) clearInterval(retryInterval)
      // Don't full cleanup on unmount if we want to support minimizing?
      // But currently unmount means closing component.
      if (channel) channel.unsubscribe()
      // Cleanup tracks is done in handleEndCall or here if component unmounts unexpectedly
      if (localStream.current) {
        localStream.current.getTracks().forEach((t) => t.stop())
      }
      if (screenStream.current) {
        screenStream.current.getTracks().forEach((t) => t.stop())
      }
      if (peerConnection.current) {
        peerConnection.current.close()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, currentUser.id, friend.id, supabase])

  // Re-attach streams when UI State changes (Minimize/Maximize)
  useEffect(() => {
    // Local
    if (localVideoRef.current && localStream.current) {
      localVideoRef.current.srcObject = localStream.current
      localVideoRef.current.muted = true // Always mute local
      localVideoRef.current.play().catch((e) => console.error('Local video play failed', e))
    }
    // Remote
    if (remoteVideoRef.current && remoteStream.current) {
      remoteVideoRef.current.srcObject = remoteStream.current
      remoteVideoRef.current.muted = false // Never mute remote
      remoteVideoRef.current.play().catch((e) => console.error('Remote video play failed', e))
    }
  }, [isMinimized, isScreenSharing, currentCallType])

  // 2. Listen for Database Call End (Fail-safe)
  useEffect(() => {
    if (!callId) return

    const channel = supabase
      .channel(`call_status_${callId}`)
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'active_calls',
          filter: `id=eq.${callId}`
        },
        () => {
          setDisconnectReason('Call ended')
          setTimeout(performCleanup, 2000)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callId, supabase])

  // Duration Timer (Synced with Server)
  useEffect(() => {
    let interval: NodeJS.Timeout
    let heartbeatInterval: NodeJS.Timeout

    const syncDuration = async (): Promise<void> => {
      if (!callId) return

      // Fetch the call's created_at to sync start time
      const { data: callData } = await supabase
        .from('active_calls')
        .select('created_at')
        .eq('id', callId)
        .single()

      if (callData?.created_at) {
        const startTime = new Date(callData.created_at).getTime()

        const updateTimer = (): void => {
          const now = Date.now()
          const diffInSeconds = Math.floor((now - startTime) / 1000)
          setDuration(diffInSeconds > 0 ? diffInSeconds : 0)
        }

        updateTimer() // Immediate update
        interval = setInterval(updateTimer, 1000)
      } else {
        // Fallback to local counting if no DB record found
        interval = setInterval(() => {
          setDuration((prev) => prev + 1)
        }, 1000)
      }

      // Start Heartbeat
      const performHeartbeat = async (): Promise<void> => {
        await supabase
          .from('active_calls')
          .update({ last_ping: new Date().toISOString() })
          .eq('id', callId)
      }
      performHeartbeat() // Immediate
      heartbeatInterval = setInterval(performHeartbeat, 5000) // Every 5s
    }

    if (status === 'Connected' || callId) {
      syncDuration()
    }

    return () => {
      clearInterval(interval)
      clearInterval(heartbeatInterval)
    }
  }, [status, callId, supabase])

  // --- Handlers ---

  async function performCleanup(): Promise<void> {
    if (localStream.current) {
      localStream.current.getTracks().forEach((t) => t.stop())
    }
    if (screenStream.current) {
      screenStream.current.getTracks().forEach((t) => t.stop())
    }
    if (peerConnection.current) {
      peerConnection.current.close()
    }
    // Tear down audio pipeline (closes AudioContext, frees resources)
    if (audioPipelineRef.current) {
      audioPipelineRef.current.destroy().catch(console.warn)
      audioPipelineRef.current = null
    }

    if (onClose) {
      onClose()
    } else {
      navigate(`/dashboard/messages?username=${friend.username}`, { replace: true })
    }
  }

  const handleEndCall = async (): Promise<void> => {
    // 1. Send signal to peer
    if (channelRef.current) {
      const rawUsername =
        currentUser.username ||
        currentUser.user_metadata?.username ||
        currentUser.email?.split('@')[0] ||
        'User'
      console.log(`Sending end-call signal as: ${rawUsername} (${currentUser.id})`)
      await channelRef.current.send({
        type: 'broadcast',
        event: 'end-call',
        payload: {
          username: rawUsername,
          fullName: currentUser.user_metadata?.full_name || rawUsername,
          senderId: currentUser.id
        }
      })
    }

    // 2. Delete from DB (active_calls) - either party can do this
    if (callId) {
      await supabase.from('active_calls').delete().eq('id', callId)
    }

    // 3. Local Feedback
    setDisconnectReason('You ended the call')
    setTimeout(performCleanup, 2000)
  }

  const toggleMute = (): void => {
    if (localStream.current) {
      localStream.current.getAudioTracks().forEach((t) => (t.enabled = !isMuted))
      setIsMuted(!isMuted)
    }
  }

  const toggleVideo = (): void => {
    if (localStream.current) {
      localStream.current.getVideoTracks().forEach((t) => (t.enabled = isVideoOff))
      setIsVideoOff(!isVideoOff)
    }
  }

  const toggleANC = useCallback((): void => {
    const newStatus = !isANCEnabled
    // Update persisted store (so settings page reflects live call state)
    setNoiseSettings({ enabled: newStatus })
    // Update the live AudioPipeline in real-time — no re-acquire needed
    if (audioPipelineRef.current) {
      audioPipelineRef.current.updateSettings({ enabled: newStatus })
    }
    toast.success(newStatus ? '🎙 Noise Cancellation On' : '🔇 Noise Cancellation Off')
  }, [isANCEnabled, setNoiseSettings])

  const toggleScreenShare = async (): Promise<void> => {
    if (isScreenSharing) {
      // Stop Screen Share -> Revert to Camera
      if (screenStream.current) {
        screenStream.current.getTracks().forEach((t) => t.stop())
        screenStream.current = null
      }

      if (peerConnection.current && localStream.current) {
        const videoTrack = localStream.current.getVideoTracks()[0]
        const sender = peerConnection.current.getSenders().find((s) => s.track?.kind === 'video')
        if (sender && videoTrack) {
          sender.replaceTrack(videoTrack)
        }
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream.current
        }
      }
      setIsScreenSharing(false)
    } else {
      // Start Screen Share
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true
        })
        screenStream.current = stream

        const screenTrack = stream.getVideoTracks()[0]

        if (peerConnection.current) {
          const sender = peerConnection.current.getSenders().find((s) => s.track?.kind === 'video')
          if (sender) {
            sender.replaceTrack(screenTrack)
          }
        }

        // Update Local View
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }

        // Handle system stop (e.g. user clicks "Stop Sharing" in browser UI)
        screenTrack.onended = () => {
          toggleScreenShare() // Revert logic
        }

        setIsScreenSharing(true)
      } catch (err) {
        console.error('Failed to share screen', err)
        toast.error('Failed to share screen')
      }
    }
  }

  const upgradeToVideo = async (): Promise<void> => {
    try {
      const videoStream = await navigator.mediaDevices.getUserMedia({ video: true })
      const videoTrack = videoStream.getVideoTracks()[0]

      if (localStream.current) {
        localStream.current.addTrack(videoTrack)
      } else {
        localStream.current = videoStream
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream.current
        localVideoRef.current.play().catch((e) => console.error('Local video play failed', e))
      }

      if (peerConnection.current) {
        peerConnection.current.addTrack(videoTrack, localStream.current)
        const offer = await peerConnection.current.createOffer()
        await peerConnection.current.setLocalDescription(offer)

        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'upgrade-to-video',
            payload: { offer }
          })
        }
      }

      setCurrentCallType('video')
      setIsVideoOff(false)
      toast.success('Switched to video call')
    } catch (e) {
      console.error(e)
      toast.error('Failed to access camera')
    }
  }

  const formatDuration = (seconds: number): string => {
    const min = Math.floor(seconds / 60)
    const sec = seconds % 60
    return `${min}:${sec.toString().padStart(2, '0')}`
  }

  // --- COMPACT MODE RENDER (CALL BAR) ---
  if (isMinimized) {
    return (
      <div className="absolute top-2 left-4 right-4 h-16 bg-zinc-900/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl flex items-center justify-between px-4 transition-all duration-300 animate-in slide-in-from-top-5 pointer-events-auto z-50">
        {/* Left: User Info */}
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => onMinimize && onMinimize(false)}
        >
          <div className="relative">
            <Avatar className="h-10 w-10 border border-white/10">
              <AvatarImage src={friend.avatar_url || ''} />
              <AvatarFallback>{friend.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-zinc-900 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white leading-none">
              {friend.full_name || friend.username}
            </span>
            <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
              {currentCallType === 'video' ? (
                <Video className="w-3 h-3" />
              ) : (
                <Phone className="w-3 h-3" />
              )}
              In Call • {formatDuration(duration)}
            </span>
          </div>
        </div>

        {/* Center: Waveform (Visual-only for now) */}
        <div className="hidden md:flex flex-1 mx-8 h-8 items-center justify-center gap-[2px] opacity-50">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-emerald-500/50 rounded-full animate-pulse"
              style={{ height: `${20 + ((i * 37) % 80)}%`, animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 hover:bg-white/10 rounded-full"
            onClick={toggleMute}
          >
            {isMuted ? (
              <MicOff className="w-4 h-4 text-red-400" />
            ) : (
              <Mic className="w-4 h-4 text-white" />
            )}
          </Button>
          {currentCallType === 'video' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 hover:bg-white/10 rounded-full"
              onClick={toggleVideo}
            >
              {isVideoOff ? (
                <VideoOff className="w-4 h-4 text-red-400" />
              ) : (
                <Video className="w-4 h-4 text-white" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 hover:bg-white/10 rounded-full"
            onClick={() => onMinimize && onMinimize(false)}
            title="Expand"
          >
            <Maximize2 className="w-4 h-4 text-white" />
          </Button>
          <Button
            variant="destructive"
            size="icon"
            className="h-9 w-9 rounded-full bg-red-500 hover:bg-red-600 border border-red-400/20"
            onClick={handleEndCall}
          >
            <PhoneOff className="w-4 h-4" />
          </Button>
        </div>

        {/* HIDDEN AUDIO FOR PERSISTENCE */}
        <audio
          autoPlay
          className="hidden"
          ref={(el) => {
            if (el && remoteStream.current) {
              el.srcObject = remoteStream.current
              el.play().catch((e) => console.error('Hidden audio play failed', e))
            }
          }}
        />
      </div>
    )
  }

  // --- FULL SCREEN MODE ---
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 text-white overflow-hidden animate-in fade-in duration-300 pointer-events-auto">
      {/* Disconnect Overlay */}
      {disconnectReason && (
        <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <Avatar className="w-24 h-24 mb-4 ring-2 ring-white/10 opacity-50 grayscale">
            <AvatarImage src={friend.avatar_url} />
            <AvatarFallback>{friend.username[0]}</AvatarFallback>
          </Avatar>
          <h2 className="text-2xl font-semibold text-white mb-2">{disconnectReason}</h2>
          <p className="text-zinc-400 text-sm">Avg Duration: {formatDuration(duration)}</p>
        </div>
      )}

      {/* BACKGROUND LAYER */}
      {/* If video call (and not audio-only mode), show remote video */}
      {currentCallType === 'video' ? (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center z-0">
          <Avatar className="w-64 h-64 md:w-96 md:h-96 opacity-5 blur-3xl animate-pulse">
            <AvatarImage src={friend.avatar_url} />
            <AvatarFallback>{friend.username[0]}</AvatarFallback>
          </Avatar>
          {/* Hidden audio element for voice calls */}
          <audio
            ref={remoteVideoRef as React.RefObject<HTMLAudioElement>}
            autoPlay
            onLoadedMetadata={(e) => {
              e.currentTarget
                .play()
                .catch((err: unknown) => console.error('Audio play failed', err))
            }}
          />
        </div>
      )}

      {/* OVERLAY GRADIENT */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 z-1 pointer-events-none" />

      {/* TOP BAR Controls */}
      <div className="absolute top-4 right-4 z-50">
        <Button
          variant="secondary"
          size="icon"
          className="rounded-full bg-black/40 border border-white/10 backdrop-blur-md text-white hover:bg-white/10"
          onClick={() => {
            if (onMinimize) onMinimize(true)
            else setInternalIsMinimized(true)
          }}
        >
          <Minimize2 className="w-5 h-5" />
        </Button>
      </div>

      {/* INFO BUTTON (Mobile/Toggle) */}
      <div className="absolute top-4 left-4 z-50">
        <Button
          variant="secondary"
          size="icon"
          className={cn(
            'rounded-full border border-white/10 backdrop-blur-md transition-all',
            showStats
              ? 'bg-white text-black hover:bg-white/90'
              : 'bg-black/40 text-white hover:bg-white/10'
          )}
          onClick={() => setShowStats(!showStats)}
        >
          <Info className="w-5 h-5" />
        </Button>
      </div>

      {/* NETWORK STATS OVERLAY */}
      {showStats && (
        <div className="absolute top-16 left-4 z-50 pointer-events-none animate-in slide-in-from-left-5 fade-in duration-200">
          <div className="bg-black/80 backdrop-blur-md border border-white/10 rounded-xl p-3 text-xs font-mono text-zinc-400 flex flex-col gap-1.5 shadow-2xl min-w-[160px]">
            <div className="flex items-center gap-2 border-b border-white/10 pb-1.5 mb-0.5">
              <div
                className={cn(
                  'w-2 h-2 rounded-full shadow-[0_0_8px_currentcolor]',
                  status === 'Connected'
                    ? 'bg-emerald-500 text-emerald-500'
                    : 'bg-amber-500 text-amber-500 animate-pulse'
                )}
              />
              <span className="text-white font-bold uppercase tracking-wider">{status}</span>
            </div>
            {status === 'Connected' && (
              <>
                <div className="flex justify-between items-center gap-4">
                  <span className="text-[10px] uppercase font-bold text-zinc-500">Ping</span>
                  <span
                    className={cn(
                      'font-bold',
                      networkStats.rtt > 150 ? 'text-amber-400' : 'text-emerald-400'
                    )}
                  >
                    {networkStats.rtt} ms
                  </span>
                </div>
                <div className="flex justify-between items-center gap-4">
                  <span className="text-[10px] uppercase font-bold text-zinc-500">IP Addr</span>
                  <span className="text-zinc-300 max-w-[100px] truncate" title={networkStats.ip}>
                    {networkStats.ip}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-4">
                  <span className="text-[10px] uppercase font-bold text-zinc-500">Loss</span>
                  <span
                    className={cn(
                      'font-bold',
                      networkStats.packetsLost > 0 ? 'text-rose-400' : 'text-zinc-500'
                    )}
                  >
                    {networkStats.packetsLost}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="relative z-10 flex flex-col items-center justify-between h-full w-full max-w-lg mx-auto py-12 px-4 md:px-6">
        {/* USER INFO / SELF VIEW */}
        <div className="flex flex-col items-center gap-6 mt-10 w-full">
          {/* SELF VIEW (Picture in Picture) */}
          {currentCallType === 'video' && (
            <div className="absolute top-4 left-4 w-28 h-36 md:w-32 md:h-44 rounded-2xl overflow-hidden ring-1 ring-white/20 shadow-2xl bg-black z-40 transition-all hover:scale-105 group">
              {!isVideoOff ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className={cn(
                    'w-full h-full object-cover',
                    isScreenSharing ? '' : 'transform scale-x-[-1]'
                  )}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                  <Avatar className="w-12 h-12 opacity-50">
                    <AvatarImage src={currentUser.avatar_url} />
                    <AvatarFallback>
                      {(currentUser.username || 'U')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}

              {/* Label for Self View */}
              <div className="absolute bottom-2 left-2 text-[10px] font-bold bg-black/60 px-2 py-0.5 rounded-full text-white/80 backdrop-blur-sm flex items-center gap-1">
                {isScreenSharing ? 'You (Screen)' : isVideoOff ? 'You (Off)' : 'You'}
                {isVideoOff && <VideoOff className="w-3 h-3 text-red-500" />}
              </div>
            </div>
          )}

          {/* AVATAR (Voice Mode or Connecting) */}
          {(currentCallType === 'voice' || status === 'Connecting...') && (
            <div className="relative mt-10">
              <Avatar
                className={cn(
                  'w-32 h-32 md:w-48 md:h-48 ring-1 ring-white/10 shadow-2xl transition-all duration-500',
                  status === 'Connecting...' && 'animate-pulse scale-95 opacity-80'
                )}
              >
                <AvatarImage src={friend.avatar_url} className="object-cover" />
                <AvatarFallback className="text-4xl bg-zinc-900">
                  {friend.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {status === 'Connected' && (
                <div className="absolute inset-0 rounded-full border-2 border-emerald-500/50 animate-ping" />
              )}
            </div>
          )}

          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white drop-shadow-lg">
              {friend.full_name || friend.username}
            </h2>
            <div className="flex items-center justify-center gap-2">
              <span
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md shadow-lg transition-colors',
                  status === 'Connected'
                    ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                )}
              >
                {status === 'Connected' ? (
                  <span className="font-mono text-sm tracking-widest">
                    {formatDuration(duration)}
                  </span>
                ) : (
                  status
                )}
              </span>
            </div>

            {/* BOTTOM CONTROLS */}
            <div className="w-full flex justify-center mb-8">
              <div className="flex items-center gap-2 sm:gap-4 md:gap-6 bg-black/60 backdrop-blur-xl p-3 sm:p-4 md:p-6 rounded-[2.5rem] border border-white/10 shadow-2xl ring-1 ring-white/5 mx-4 max-w-full overflow-x-auto scrollbar-hide">
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    'h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 shrink-0 rounded-full border-0 ring-1 ring-white/10 transition-all text-white',
                    isMuted
                      ? 'bg-white text-black hover:bg-white/90'
                      : 'bg-white/5 hover:bg-white/20'
                  )}
                  onClick={toggleMute}
                  title="Toggle Mute"
                >
                  {isMuted ? (
                    <MicOff className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                  ) : (
                    <Mic className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                  )}
                </Button>

                {type === 'video' && (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      className={cn(
                        'h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 shrink-0 rounded-full border-0 ring-1 ring-white/10 transition-all text-white',
                        isVideoOff
                          ? 'bg-white text-black hover:bg-white/90'
                          : 'bg-white/5 hover:bg-white/20'
                      )}
                      onClick={toggleVideo}
                      title="Toggle Camera"
                    >
                      {isVideoOff ? (
                        <VideoOff className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                      ) : (
                        <Video className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      size="icon"
                      className={cn(
                        'h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 shrink-0 rounded-full border-0 ring-1 ring-white/10 transition-all text-white',
                        isScreenSharing
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : 'bg-white/5 hover:bg-white/20'
                      )}
                      onClick={toggleScreenShare}
                      title="Share Screen"
                    >
                      {isScreenSharing ? (
                        <MonitorOff className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                      ) : (
                        <MonitorUp className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                      )}
                    </Button>
                  </>
                )}

                {currentCallType === 'voice' && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 shrink-0 rounded-full border-0 ring-1 ring-white/10 transition-all text-white bg-white/5 hover:bg-white/20"
                    onClick={upgradeToVideo}
                    title="Switch to Video Call"
                  >
                    <Video className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                  </Button>
                )}

                {/* NOISE CANCELLATION BUTTON */}
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    'h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 shrink-0 rounded-full border-0 ring-1 ring-white/10 transition-all text-white',
                    isANCEnabled
                      ? 'bg-purple-500 text-white hover:bg-purple-600 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                      : 'bg-white/5 hover:bg-white/20'
                  )}
                  onClick={toggleANC}
                  title={isANCEnabled ? 'Noise Cancellation On — click to disable' : 'Noise Cancellation Off — click to enable'}
                >
                  <Waves className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                </Button>

                <Button
                  variant="destructive"
                  size="icon"
                  className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 shrink-0 rounded-full bg-rose-500 text-white hover:bg-rose-600 shadow-[0_4px_20px_rgba(244,63,94,0.4)] hover:scale-105 transition-all"
                  onClick={handleEndCall}
                  title="End Call"
                >
                  <PhoneOff className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
