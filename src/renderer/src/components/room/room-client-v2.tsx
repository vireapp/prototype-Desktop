/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useWebRTC } from '../../hooks/use-webrtc'
import { RoomHomeOverlay } from './room-home-overlay'
import { RoomMedia } from '@/components/room/room-media'
import { VideoConference } from './video-conference'
import { RoomChat } from '@/components/room/chat'
import { ParticipantsStrip } from './participants-strip'
import { RoomNavigation, SidebarType } from '@/components/room/room-navigation'
import { MediaSelector, MediaService } from '@/components/room/media-selector'
import { ExternalServiceView } from '@/components/room/external-service-view'
import { Button } from '@/components/ui/button'
import { RoomAIChat } from '@/components/room/ai-chat'
import { RoomWhiteboard } from '@/components/room/whiteboard'
import { RoomReactionOverlay, ReactionItem } from '@/components/room/reaction-overlay'
import { VirtualTV } from '@/components/room/activities/virtual-tv'
import { RoomReactionBar } from '@/components/room/reaction-bar'
import { RoomPolls } from '@/components/room/polls'
import { GameCenter, GameType } from '@/components/room/games/game-center'
import { RoomNotes } from '@/components/room/notes'
import { RoomTaskBoard } from '@/components/room/task-board'
import { RoomMusicPlayer } from '@/components/room/music-player/room-music-player'
import { ActiveRoomTimer } from '@/components/room/active-room-timer'
import { RoomMobileDock } from '@/components/room/room-mobile-dock'
import {
  PhoneOff,
  Copy,
  Check,
  LayoutGrid,
  Users,
  Monitor,
  Maximize2,
  Minimize2,
  PartyPopper,
  BarChart2, // Import BarChart2 for Polls
  PanelRightClose,
  PanelRightOpen,
  Smile,
  X,
  MoreVertical,
  Settings,
  Tv
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { joinRoom, getRoomRole, RoomRole } from '@/components/rooms/actions'
import { toast } from 'sonner'
const useRouter = (): {
  push: (path: string) => void
  replace: (path: string) => void
  refresh: () => void
  back: () => void
} => {
  const navigate = useNavigate()
  return {
    push: (path: string) => navigate(path),
    replace: (path: string) => navigate(path, { replace: true }),
    refresh: () => window.location.reload(),
    back: () => navigate(-1)
  }
}
import { RoomSettingsDialog } from '@/components/room/room-settings-dialog'
import { cn } from '@/lib/utils'
import confetti from 'canvas-confetti'
import { RoomWelcomeScreen } from '@/components/room/room-welcome-screen'
import YouTube from 'react-youtube'
import { createClient } from '@/lib/supabase/client'
import { useRoomState } from '@/hooks/use-room-state'
import { useRoomSubscriptions } from '@/hooks/use-room-subscriptions'
import { RoomMembersList } from './room-members-list'
import { RoomAudioRenderer } from '@/components/room/room-audio-renderer'
import { searchYouTube } from '@/lib/youtube'
import { ScreenSharePicker } from '@/components/room/screen-share-picker'
import { DuoUnlockBar } from '@/components/duo/duo-room-unlock'
import { getDuoRoom, type DuoRoom } from '@/components/duo/actions'

import ReactPlayer from 'react-player'

const BASE_STATIONS = [
  {
    id: 'lofi',
    name: 'Lo-Fi Girl',
    url: 'https://www.youtube.com/watch?v=5qap5aO4i9A',
    description: 'Beats to relax/study to',
    color: 'text-rose-400'
  },
  {
    id: 'synthwave',
    name: 'Synthwave',
    url: 'https://www.youtube.com/watch?v=4xDzrJKXOOY',
    description: 'Retro futuristic chill',
    color: 'text-violet-400'
  },
  {
    id: 'coffee',
    name: 'Coffee Shop',
    url: 'https://www.youtube.com/watch?v=e3L1PIY1lN8',
    description: 'Jazz & Rain ambience',
    color: 'text-amber-400'
  },
  {
    id: 'classical',
    name: 'Classical',
    url: 'https://www.youtube.com/watch?v=BMuknRb7woc',
    description: 'Dark Academia Classical',
    color: 'text-slate-300'
  }
]

const INITIAL_STATIONS = BASE_STATIONS.map((s) => ({
  ...s,
  type: 'lofi' as const
}))

interface Room {
  id: string
  name: string
  description: string | null
  code: string | null
  created_by: string
  created_at?: string
  is_public: boolean
  appearance?: {
    theme?: string
    background?: string
    videoQuality?: 'hd' | 'sd' | 'low'
    hideParticipants?: boolean
  }
  permissions?: {
    lockRoom?: boolean
    syncActivities?: boolean
    lockMic?: boolean
    lockCam?: boolean
    lockScreen?: boolean
    canScreenShare?: string
    canUseMic?: string
    canUseCamera?: string
    maxParticipants?: number
    waitingRoom?: boolean
  }
  chat_settings?: {
    slowModeSeconds: number
    emojiOnly: boolean
    blockLinks: boolean
    welcomeMessage?: string
  }
}

interface User {
  id: string
  email?: string
  name?: string
  user_metadata?: {
    full_name?: string
    avatar_url?: string
    name?: string
  }
}

interface RoomClientV2Props {
  room: Room
  user: User
}

export function RoomClientV2({ room, user }: RoomClientV2Props): React.JSX.Element {
  const supabase = createClient()
  const [currentRoom, setCurrentRoom] = useState<Room>(room) // Local state for realtime updates
  const isOwner = user?.id === room.created_by

  // Realtime Subscription for Room Updates handled by useRoomSubscriptions now

  // Dynamic Video Constraints
  const videoConstraints = React.useMemo(() => {
    let width = 1280
    let height = 720
    const quality = currentRoom.appearance?.videoQuality || 'hd'

    if (quality === 'sd') {
      width = 640
      height = 480
    }
    if (quality === 'low') {
      width = 320
      height = 240
    }

    return {
      width: { ideal: width },
      height: { ideal: height },
      frameRate: { ideal: 24 }
    }
  }, [currentRoom.appearance?.videoQuality])

  const {
    localStream,
    remoteStreams,
    participants,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    debugInfo
  } = useWebRTC(currentRoom.id, user, videoConstraints)

  const peersMetadata = participants

  const { ui, activity: activityState, media, presenter } = useRoomState(isOwner)

  // Destructure for compatibility
  const {
    sidebarView,
    setSidebarView,
    mobileTab,
    setMobileTab,
    isSidebarOpen,
    setIsSidebarOpen,
    showWelcome,
    setShowWelcome,
    showReactions,
    setShowReactions,
    showDebug,
    setShowDebug
  } = ui
  const {
    current: activity,
    set: setActivity,
    game: activeGame,
    setGame: setActiveGame,
    virtualChannel: virtualTVChannel,
    setVirtualChannel: setVirtualTVChannel
  } = activityState

  // NOTE: Renaming activity state variable locally to match old code usage if needed,
  // but old code used 'activity' string state and 'activeGame' object.
  // My hook has 'activity.current' which maps to 'activity'.
  // CONSTANT NAME CLASH: 'activity' is used in old code.

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {
    mode: mediaMode,
    setMode: setMediaMode,
    url: selectedMediaUrl,
    setUrl: setSelectedMediaUrl,
    external: externalService,
    setExternal: setExternalService,
    music
  } = media
  const {
    playing: musicPlaying,
    setPlaying: setMusicPlaying,
    muted: musicMuted,
    setMuted: setMusicMuted,
    volume: musicVolume,
    setVolume: setMusicVolume
  } = music
  const { id: presenterId, setId: setPresenterId } = presenter

  const [player, setPlayer] = useState<any>(null)
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [copied, setCopied] = useState(false)

  const [reactions, setReactions] = useState<ReactionItem[]>([])
  const [userRole, setUserRole] = useState<RoomRole>(isOwner ? 'owner' : 'member')
  const [mobilePeopleView, setMobilePeopleView] = useState<'grid' | 'list'>('grid') // New state for mobile toggle

  // Personal Settings State
  const [personalSettings, setPersonalSettings] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vire_room_settings')
      try {
        return saved
          ? {
              masterVolume: 100,
              bandwidthSaver: false,
              hideReactions: false,
              compactMode: false,
              ...JSON.parse(saved)
            }
          : {
              masterVolume: 100,
              bandwidthSaver: false,
              hideReactions: false,
              compactMode: false
            }
      } catch (e) {
        console.error('Failed to load settings', e)
      }
    }
    return {
      masterVolume: 100,
      bandwidthSaver: false,
      hideReactions: false,
      compactMode: false
    }
  })

  // User Region State (for optimizing Virtual TV)
  const [userRegion, setUserRegion] = useState<{
    code: string
    name: string
  } | null>(null)

  /* State for Presence */
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([])

  /* Screen Share Picker State */
  const [isScreenSharePickerOpen, setIsScreenSharePickerOpen] = useState(false)
  const [isPeopleOverlayOpen, setIsPeopleOverlayOpen] = useState(false)

  /* Polls State (Modal) */
  const [isPollsOpen, setIsPollsOpen] = useState(false)

  /* Duo Room State */
  const [duoRoom, setDuoRoom] = useState<DuoRoom | null>(null)

  // Auto-detect User Region
  const detectRegion = async (force: boolean = false): Promise<void> => {
    try {
      // Check session storage first unless forced
      if (!force) {
        const cached = sessionStorage.getItem('user_region')
        if (cached) {
          setUserRegion(JSON.parse(cached))
          return
        }
      }

      toast.info('Detecting region...')
      const res = await fetch('https://ipwho.is/')
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          const region = {
            code: data.country_code?.toLowerCase(),
            name: data.country
          }
          setUserRegion(region)
          sessionStorage.setItem('user_region', JSON.stringify(region))
          toast.success(`Region detected: ${data.country}`)
        }
      }
    } catch (e) {
      console.warn('Failed to pre-fetch region', e)
      toast.error('Region detection failed')
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    detectRegion()
  }, [])

  // Load Persisted Settings

  useEffect(() => {
    // Initial settings load handled by initializer above
  }, [])

  const updatePersonalSettings = (newSettings: any): void => {
    setPersonalSettings(newSettings)
    localStorage.setItem('vire_room_settings', JSON.stringify(newSettings))
  }

  useEffect(() => {
    const initRole = async (): Promise<void> => {
      await joinRoom(room.id)
      const role = await getRoomRole(room.id)
      setUserRole(role)
    }
    initRole()
  }, [room.id])

  // Detect if this is a Duo Room
  useEffect(() => {
    getDuoRoom(room.id).then((data) => {
      if (data) setDuoRoom(data)
    })
  }, [room.id])

  // Music State

  const [currentStationIndex, setCurrentStationIndex] = useState(0)
  const [playlist, setPlaylist] = useState<
    Array<{
      name: string
      url: string
      type: 'lofi' | 'radio' | 'youtube' | 'custom'
    }>
  >(INITIAL_STATIONS)

  const handleAddCustomStation = (url: string): void => {
    const name = 'Custom Track ' + (playlist.length + 1)
    const newStation = { name, url, type: 'custom' as const }
    setPlaylist((prev) => [...prev, newStation])
    setCurrentStationIndex(playlist.length)
    setMusicPlaying(true)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.ctrlKey && e.code === 'Backquote') {
        // Ctrl + Tilde/Backtick
        setShowDebug((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setShowDebug])

  const router = useRouter()

  const handleAICommand = async (command: {
    type: 'play_video' | 'launch_game' | 'launch_service'
    query?: string
    game?: string
    service?: string
  }): Promise<void> => {
    console.log('AI Command:', command)
    if (command.type === 'play_video' && command.query) {
      if (mobileTab !== 'none') setMobileTab('none')
      // Search YouTube
      try {
        const items = await searchYouTube(command.query)
        if (items && items.length > 0) {
          const videoId = items[0].id.videoId
          const url = `https://www.youtube.com/watch?v=${videoId}`
          setSelectedMediaUrl(url)
          setMediaMode('youtube')
          setActivity('media')
          toast.success(`Playing: ${items[0].snippet.title}`)
        } else {
          toast.error('No video found for ' + command.query)
        }
      } catch (e) {
        console.error('AI Search Error', e)
        toast.error('Failed to search video')
      }
    }

    if (command.type === 'launch_game' && command.game) {
      if (mobileTab !== 'none') setMobileTab('none')
      setActivity('games')
      setActiveGame(command.game as GameType)
      toast.success('Launching ' + command.game)
    }

    if (command.type === 'launch_service' && command.service) {
      if (mobileTab !== 'none') setMobileTab('none')
      // Map service string to proper format if needed, but we can reuse handleMediaSelect logic slightly or just set state
      const service = command.service.toLowerCase()
      const serviceUrls: Record<string, string> = {
        netflix: 'https://www.netflix.com',
        prime: 'https://www.primevideo.com',
        hotstar: 'https://www.hotstar.com',
        disney: 'https://www.disneyplus.com'
      }

      if (serviceUrls[service]) {
        setExternalService({
          name: service.charAt(0).toUpperCase() + service.slice(1),
          url: serviceUrls[service]
        })
        setMediaMode('external')
        setActivity('media')
        toast.success(`Launching ${service}...`)
      } else {
        toast.error('Unknown service: ' + service)
      }
    }
  }

  const hideParticipants = room.appearance?.hideParticipants && !isOwner

  useEffect(() => {
    // Lock Room Logic
    if (room.permissions?.lockRoom && !isOwner) {
      // Redirect or show blocked message
      // For now, simple redirect
      toast.error('This room is currently locked by the host.')
      router.push('/dashboard/rooms')
      return
    }

    const hasSeen = localStorage.getItem(`seen_welcome_${room.id}`)
    if (hasSeen) {
      setShowWelcome(false)
      // If we skip welcome, we might can't auto-play audio reliably without interaction,
      // but the user has "entered" before. We'll leave it to them to press play if needed.
    }
  }, [room.id, room.permissions?.lockRoom, isOwner, router, setShowWelcome])

  useEffect(() => {
    if (hideParticipants && sidebarView === 'participants') {
      setSidebarView('chat')
    }
  }, [hideParticipants, sidebarView, setSidebarView])

  // Subscriptions
  const {
    broadcastReaction: sendReaction,
    broadcastVirtualTV: sendTV,
    broadcastScreenShare: sendScreen
  } = useRoomSubscriptions({
    roomId: room.id,
    userId: user.id,
    supabase,
    callbacks: {
      onRoomUpdate: (newRoom) => setCurrentRoom((prev: Room) => ({ ...prev, ...newRoom })),
      onReaction: (emoji) => addReaction(emoji),
      onVirtualTVChange: ({ url }) => setVirtualTVChannel(url),
      onScreenShareChange: ({ presenterId }) => {
        setPresenterId(presenterId)
        // Toast logic moved to hook but if we need local toast here:
        // already handled in hook.
      }
    }
  })

  const handleVirtualTVChannelSelect = async (url: string, name: string): Promise<void> => {
    setVirtualTVChannel(url)
    await sendTV(url, name)
  }

  const addReaction = (emoji: string): void => {
    const id = Math.random().toString(36).substring(7)
    const x = Math.random() * 80 + 10 // 10% to 90% width
    setReactions((prev) => [...prev, { id, emoji, x, y: 100 }])
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id))
    }, 2000)
  }

  const broadcastReaction = async (emoji: string): Promise<void> => {
    addReaction(emoji) // Show locally
    await sendReaction(emoji)
  }

  const handleLocalScreenShare = async (sourceId?: string): Promise<boolean> => {
    const isSharing = await toggleScreenShare(sourceId)
    if (isSharing) {
      // Don't force activity change - let presenter stay on their current view
      setPresenterId(user.id)
      // Broadcast to other users that screen sharing has started
      await sendScreen(true)
      toast.success('Screen sharing started')
    } else {
      setPresenterId(null)
      // Broadcast to other users that screen sharing has stopped
      await sendScreen(false)
      toast.info('Screen sharing stopped')
    }
    return isSharing
  }

  const copyCode = (): void => {
    if (room.code) {
      navigator.clipboard.writeText(room.code as string)
      setCopied(true)
      toast.success('Code copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const triggerConfetti = (): void => {
    const duration = 3000
    const end = Date.now() + duration

    const frame = (): void => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#6366f1', '#a855f7', '#ec4899']
      })
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#6366f1', '#a855f7', '#ec4899']
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }
    frame()
  }

  const handleMediaSelect = (service: MediaService, url?: string): void => {
    if (service === 'youtube') {
      setSelectedMediaUrl(url)
      setMediaMode('youtube')
    } else {
      const serviceUrls: Record<string, string> = {
        netflix: 'https://www.netflix.com',
        prime: 'https://www.primevideo.com',
        hotstar: 'https://www.hotstar.com',
        disney: 'https://www.disneyplus.com'
      }
      setExternalService({
        name: service.charAt(0).toUpperCase() + service.slice(1),
        url: serviceUrls[service] || 'https://google.com'
      })
      setMediaMode('external')
    }
  }

  const renderMediaContent = (): React.JSX.Element => {
    if (mediaMode === 'selector') {
      return <MediaSelector onSelect={handleMediaSelect} />
    }
    if (mediaMode === 'external' && externalService) {
      return (
        <ExternalServiceView
          serviceName={externalService.name}
          serviceUrl={externalService.url}
          onBack={() => setMediaMode('selector')}
          onLaunch={handleLocalScreenShare}
        />
      )
    }
    return (
      <RoomMedia
        roomId={room.id}
        user={user}
        onBack={() => setMediaMode('selector')}
        initialUrl={selectedMediaUrl}
      />
    )
  }

  const renderScreenShare = (): React.JSX.Element => {
    let streamToRender: MediaStream | null = null
    let presenterName = ''
    const isPresenting = presenterId === user.id

    if (isPresenting) {
      // Current user is presenting
      streamToRender = localStream
      presenterName = 'You'
    } else if (presenterId) {
      // Another user is presenting - find their stream in remoteStreams
      const presenterStream = remoteStreams.find((s) => s.userId === presenterId)
      if (presenterStream) {
        streamToRender = presenterStream.stream
        presenterName = presenterStream.username || 'Someone'
      }
    }

    return (
      <div className="absolute inset-0 bg-black flex items-center justify-center overflow-hidden">
        {streamToRender ? (
          <video
            autoPlay
            playsInline
            muted={isPresenting}
            ref={(video) => {
              if (video) video.srcObject = streamToRender
            }}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="text-white/50 flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-white/5 animate-pulse">
              <Monitor className="w-8 h-8 opacity-50" />
            </div>
            <p>
              {presenterId
                ? `${presenterName} is sharing screen...`
                : 'Waiting for screen share...'}
            </p>
          </div>
        )}

        {/* Stop Sharing control bar — only visible to the presenter */}
        {isPresenting && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/10 shadow-2xl">
            {/* Live indicator */}
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
              <span className="text-xs text-white/60 font-medium">You are sharing your screen</span>
            </div>

            <div className="w-px h-4 bg-white/15" />

            {/* Stop button */}
            <button
              onClick={async () => {
                await handleLocalScreenShare() // toggles off (no sourceId = stop)
                setActivity('home')
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500 hover:bg-red-400 active:scale-95 transition-all text-white text-xs font-semibold shadow-lg"
            >
              <Monitor className="w-3.5 h-3.5" />
              Stop Sharing
            </button>
          </div>
        )}
      </div>
    )
  }


  const containerRef = React.useRef<HTMLDivElement>(null)

  // Layout Lock: Force the body to be fixed to prevent any scrolling or gaps
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow
    const originalPos = document.body.style.position

    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'
    document.body.style.height = '100%'
    document.body.style.inset = '0'

    // Prevent standard scroll
    const handleScroll = (): void => {
      // Relaxed window scroll lock for mobile support
      // if (window.scrollY !== 0) window.scrollTo(0, 0)
      if (containerRef.current && containerRef.current.scrollTop !== 0) {
        containerRef.current.scrollTop = 0
      }
    }

    // Prevent wheel events from propagating to window
    const handleWheel = (e: WheelEvent): void => {
      if (e.target === document.body || e.target === document.documentElement) {
        e.preventDefault()
      }
    }

    // Handle visual viewport resizing (mobile keyboard etc)
    const handleVisualViewportResize = (): void => {
      document.body.style.height = window.visualViewport?.height + 'px'
      window.scrollTo(0, 0)
    }

    window.addEventListener('scroll', handleScroll, { passive: false })
    window.addEventListener('wheel', handleWheel, { passive: false })

    // Also listen to container scroll
    const container = containerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: false })
    }

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportResize)
      window.visualViewport.addEventListener('scroll', handleVisualViewportResize)
    }

    return () => {
      document.body.style.overflow = originalStyle
      document.body.style.position = originalPos
      document.body.style.width = ''
      document.body.style.height = ''
      document.body.style.inset = ''
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('wheel', handleWheel)
      if (container) {
        container.removeEventListener('scroll', handleScroll)
      }
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportResize)
        window.visualViewport.removeEventListener('scroll', handleVisualViewportResize)
      }
    }
  }, [])

  const themeColor = room.appearance?.theme === 'modern' ? '#ffffff' : '#000000'

  const isSpotify = playlist[currentStationIndex]?.url?.includes('spotify')
  const isYouTube = playlist[currentStationIndex]?.url?.includes('youtu')

  const extractVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return match && match[2].length === 11 ? match[2] : null
  }

  const handleEnterRoom = async (): Promise<void> => {
    // Attempt to enter full screen
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen()
      } else if ((document.documentElement as any).webkitRequestFullscreen) {
        await (document.documentElement as any).webkitRequestFullscreen()
      } else if ((document.documentElement as any).msRequestFullscreen) {
        await (document.documentElement as any).msRequestFullscreen()
      }
    } catch (e) {
      // Sliently fail or log debug only, as this is expected on some devices/interactions
      console.debug('Full screen request failed:', e)
      // Optional: Toast to inform user if they expected it
      // toast.error("Could not enter full screen. Browser blocked the request.");
    }

    localStorage.setItem(`seen_welcome_${room.id}`, 'true')
    setShowWelcome(false)
    if (!musicPlaying) {
      setMusicPlaying(true)
    }
  }

  const handleLeaveRoom = (): void => {
    try {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch((err) => {
          console.warn('Could not exit full screen:', err)
        })
      }
    } catch (e) {
      console.warn('Exit full screen not supported or blocked', e)
    }
  }

  // Media State
  const [isMicOn, setIsMicOn] = useState(true)
  const [isCamOn, setIsCamOn] = useState(true)

  // Mute All Listener
  useEffect(() => {
    const channel = supabase
      .channel(`room-controls:${room.id}`)
      .on('broadcast', { event: 'mute_all' }, () => {
        if (isMicOn) {
          toggleMic()
          setIsMicOn(false)
          toast.info('Microphone muted by host')
        }
      })
      .on('broadcast', { event: 'sync_activity' }, ({ payload }) => {
        // Only members follow the sync, or everyone if we want consistency
        // If I am the one who sent it (Owner), I already have the state.
        // So this is mainly for members.
        if (!isOwner && currentRoom.permissions?.syncActivities) {
          setActivity(payload.activity)
          toast.info(`Host switched activity to ${payload.activity}`)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [
    room.id,
    isMicOn,
    toggleMic,
    isOwner,
    currentRoom.permissions?.syncActivities,
    supabase,
    setActivity
  ])

  // Broadcast Activity Change (Owner Only)
  useEffect(() => {
    if (isOwner && currentRoom.permissions?.syncActivities) {
      const channel = supabase.channel(`room-controls:${room.id}`)
      channel.send({
        type: 'broadcast',
        event: 'sync_activity',
        payload: { activity }
      })
    }
  }, [activity, isOwner, currentRoom.permissions?.syncActivities, room.id, supabase])

  // Handler wrappers
  const handleToggleMic = (): void => {
    toggleMic()
    setIsMicOn(!isMicOn)
  }

  const handleToggleCam = (): void => {
    toggleCamera()
    setIsCamOn(!isCamOn)
  }

  // Activity Presence
  const [presenceChannel, setPresenceChannel] = useState<any>(null)
  const [activityCounts, setActivityCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    const channel = supabase.channel(`room-presence:${room.id}`)
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()

        // Convert presence state to activity counts AND online users list
        const counts: Record<string, number> = {}
        const onlineIds = new Set<string>()

        Object.values(state)
          .flat()
          .forEach((p: any) => {
            if (p.activity) counts[p.activity] = (counts[p.activity] || 0) + 1
            if (p.user_id) onlineIds.add(p.user_id)
          })

        setActivityCounts(counts)
        setOnlineUserIds(Array.from(onlineIds))
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setPresenceChannel(channel)
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [room.id, supabase])

  // Update Presence when Activity Changes
  useEffect(() => {
    if (presenceChannel && activity) {
      presenceChannel.track({
        user_id: user.id,
        activity: activity
      })
    }
  }, [presenceChannel, activity, user.id])

  return (
    <div
      ref={containerRef}
      suppressHydrationWarning
      className="absolute inset-0 top-8 z-50 overflow-hidden font-sans selection:bg-primary/30 grid grid-rows-[auto_1fr]"
      style={{
        backgroundColor: themeColor,
        color: room.appearance?.theme === 'modern' ? '#000' : '#fff'
      }}
    >
      {showWelcome && (
        <RoomWelcomeScreen
          roomName={room.name}
          userName={user.email?.split('@')[0] || 'Guest'}
          onEnter={handleEnterRoom}
        />
      )}

      {/* Duo Room Unlock Bar — shown only when this is a duo room */}
      {duoRoom && (
        <div className="relative z-[55]">
          <DuoUnlockBar roomId={room.id} duoRoom={duoRoom} />
        </div>
      )}

      {/* Mobile Dock (Only visible on mobile) */}
      <RoomMobileDock activeTab={mobileTab} onTabChange={setMobileTab} />

      {/* Mobile Overlays (Sheet-like) */}
      {mobileTab !== 'none' && (
        <div
          className={cn(
            'md:hidden fixed inset-0 z-[60] flex flex-col animate-in slide-in-from-bottom-10 duration-300',
            mobileTab === 'music'
              ? 'bg-black/0 pointer-events-none' // Transparent & Pass-through for music
              : 'bg-black/95 backdrop-blur-2xl'
          )}
        >
          <div className="flex items-center justify-between p-4 border-b border-white/5 bg-black/80 backdrop-blur-md z-10 shrink-0 pointer-events-auto">
            <h2 className="text-lg font-bold text-white capitalize">{mobileTab}</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileTab('none')}
              className="rounded-full"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
          <div
            className={cn('flex-1 overflow-hidden relative', mobileTab === 'music' ? 'p-0' : 'p-4')}
          >
            {mobileTab === 'chat' && (
              <RoomChat
                roomId={room.id}
                welcomeMessage={room.chat_settings?.welcomeMessage}
                slowModeSeconds={room.chat_settings?.slowModeSeconds}
                emojiOnly={room.chat_settings?.emojiOnly}
                blockLinks={room.chat_settings?.blockLinks}
              />
            )}
            {mobileTab === 'people' && (
              <div className="flex flex-col h-full">
                {/* Mobile Header Toggle */}
                <div className="flex items-center justify-center p-2 mb-2">
                  <div className="flex items-center p-1 bg-white/10 rounded-xl border border-white/5 w-full max-w-xs">
                    <button
                      onClick={() => setMobilePeopleView('grid')}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all',
                        mobilePeopleView === 'grid'
                          ? 'bg-white/10 text-white shadow-sm'
                          : 'text-white/50 hover:text-white'
                      )}
                    >
                      <LayoutGrid className="w-4 h-4" /> Grid
                    </button>
                    <button
                      onClick={() => setMobilePeopleView('list')}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all',
                        mobilePeopleView === 'list'
                          ? 'bg-white/10 text-white shadow-sm'
                          : 'text-white/50 hover:text-white'
                      )}
                    >
                      <Users className="w-4 h-4" /> List
                    </button>
                  </div>
                </div>

                <div className="flex-1 min-h-0 relative">
                  {mobilePeopleView === 'grid' ? (
                    <VideoConference
                      roomId={room.id}
                      user={user}
                      localStream={localStream}
                      remoteStreams={remoteStreams}
                      peersMetadata={peersMetadata}
                      toggleMic={handleToggleMic}
                      toggleCamera={handleToggleCam}
                      toggleScreenShare={handleLocalScreenShare}
                      permissions={room.permissions}
                      isOwner={isOwner}
                      disableVideo={personalSettings.bandwidthSaver}
                      volume={personalSettings.masterVolume / 100}
                      isMicOn={isMicOn}
                      isCamOn={isCamOn}
                    />
                  ) : (
                    <div className="h-full overflow-hidden bg-white/5 rounded-xl border border-white/5 mx-2 mb-2">
                      <RoomMembersList
                        roomId={room.id}
                        currentUserRole={userRole}
                        onlineUserIds={onlineUserIds}
                        hideHeader={true} // Hide header since we have mobile toggles
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
            {mobileTab === 'activities' && (
              <div className="flex flex-col gap-4">
                <p className="text-white/50 text-sm text-center">
                  Select an activity to launch on stage
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col gap-2 bg-white/5 border-white/10"
                    onClick={() => {
                      setActivity('media')
                      setMobileTab('none')
                    }}
                  >
                    <Monitor className="w-8 h-8 text-blue-400" /> Watch
                  </Button>

                  <Button
                    variant="outline"
                    className="h-24 flex flex-col gap-2 bg-white/5 border-white/10"
                    onClick={() => {
                      setActivity('whiteboard')
                      setMobileTab('none')
                    }}
                  >
                    <Monitor className="w-8 h-8 text-yellow-400" /> Whiteboard
                  </Button>
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col gap-2 bg-white/5 border-white/10"
                    onClick={() => {
                      setActivity('notes')
                      setMobileTab('none')
                    }}
                  >
                    <Monitor className="w-8 h-8 text-cyan-400" /> Notes
                  </Button>
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col gap-2 bg-white/5 border-white/10"
                    onClick={() => {
                      setActivity('games')
                      setMobileTab('none')
                    }}
                  >
                    <Monitor className="w-8 h-8 text-purple-400" /> Games
                  </Button>
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col gap-2 bg-white/5 border-white/10"
                    onClick={() => {
                      setActivity('tasks')
                      setMobileTab('none')
                    }}
                  >
                    <Check className="w-8 h-8 text-emerald-400" /> Tasks
                  </Button>
                  {!room.is_public && (
                    <Button
                      variant="outline"
                      className="h-24 flex flex-col gap-2 bg-white/5 border-white/10"
                      onClick={() => {
                        setActivity('virtual_tv')
                        setMobileTab('none')
                      }}
                    >
                      <Tv className="w-8 h-8 text-indigo-400" /> Virtual TV
                    </Button>
                  )}
                </div>
              </div>
            )}
            {mobileTab === 'ai' && (
              <RoomAIChat
                roomId={room.id}
                roomName={room.name}
                roomDescription={room.description || undefined}
                currentActivity={activity}
                onCommand={handleAICommand}
              />
            )}
            {mobileTab === 'music' && (
              <RoomMusicPlayer
                playing={musicPlaying}
                volume={musicVolume}
                muted={musicMuted}
                currentStationIndex={currentStationIndex}
                stations={playlist}
                onTogglePlay={() => setMusicPlaying(!musicPlaying)}
                onToggleMute={() => setMusicMuted(!musicMuted)}
                onVolumeChange={(vol) => setMusicVolume(vol)}
                onStationSelect={setCurrentStationIndex}
                onNextStation={() => setCurrentStationIndex((prev) => (prev + 1) % playlist.length)}
                onAddCustomStation={handleAddCustomStation}
              />
            )}
            {mobileTab === 'menu' && (
              <div className="flex flex-col gap-6 p-2">
                {/* Room Info Card */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Room Details
                  </h3>

                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">{room.name}</span>
                    <ActiveRoomTimer createdAt={room.created_at || ''} />
                  </div>

                  {room.code && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-black/40 rounded-lg border border-white/5 px-3 py-2 font-mono text-sm text-center tracking-widest text-white/90">
                        {room.code}
                      </div>
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={copyCode}
                        className="shrink-0 bg-white/10 hover:bg-white/20 border-0"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Controls Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-14 bg-white/5 border-white/10 hover:bg-white/10 flex flex-col gap-1"
                    onClick={triggerConfetti}
                  >
                    <PartyPopper className="w-5 h-5 text-pink-500" />
                    <span className="text-xs">Confetti</span>
                  </Button>

                  <Button
                    variant="outline"
                    className={cn(
                      'h-14 bg-white/5 border-white/10 hover:bg-white/10 flex flex-col gap-1',
                      !showReactions && 'opacity-50'
                    )}
                    onClick={() => setShowReactions(!showReactions)}
                  >
                    <Smile className="w-5 h-5 text-yellow-500" />
                    <span className="text-xs">{showReactions ? 'Hide' : 'Show'} Reactions</span>
                  </Button>

                  <div className="col-span-2">
                    {/* We render the settings dialog trigger button manually to style it */}
                    <RoomSettingsDialog
                      room={{
                        ...currentRoom,
                        permissions: currentRoom.permissions ? {
                          ...currentRoom.permissions,
                          canScreenShare: currentRoom.permissions.canScreenShare ?? 'all',
                          canUseMic: currentRoom.permissions.canUseMic ?? 'all',
                          canUseCamera: currentRoom.permissions.canUseCamera ?? 'all',
                        } : undefined,
                        appearance: currentRoom.appearance ? {
                          ...currentRoom.appearance,
                          theme: currentRoom.appearance.theme ?? '',
                          background: currentRoom.appearance.background ?? '',
                        } : undefined
                      }}
                      userRole={userRole}
                      personalSettings={personalSettings}
                      onUpdatePersonalSettings={updatePersonalSettings}
                    >
                      <Button
                        variant="outline"
                        className="w-full h-14 bg-white/5 border-white/10 hover:bg-white/10 flex items-center justify-center gap-2"
                      >
                        <Settings className="w-5 h-5" />
                        Room Settings
                      </Button>
                    </RoomSettingsDialog>
                  </div>
                </div>

                {/* Leave Option */}
                <Button variant="destructive" className="w-full mt-auto mb-4" asChild>
                  <Link to="/dashboard/rooms" onClick={handleLeaveRoom}>
                    <PhoneOff className="w-4 h-4 mr-2" /> Leave Room
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Background Layer */}
      <div
        className={cn(
          'absolute inset-0 z-0 pointer-events-none transition-all duration-700',
          room.appearance?.theme === 'minimal'
            ? 'bg-zinc-950'
            : room.appearance?.theme === 'modern'
              ? 'bg-white text-black'
              : 'bg-black/95 text-white'
        )}
      >
        <div
          className={cn(
            'absolute inset-0',
            room.appearance?.background === 'dots'
              ? 'bg-[radial-gradient(#404040_1px,transparent_1px)] [background-size:16px_16px] opacity-20'
              : room.appearance?.background === 'waves'
                ? 'bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_24px]'
                : room.appearance?.background === 'none'
                  ? ''
                  : 'bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]'
          )}
        />

        {(!room.appearance?.theme || room.appearance?.theme === 'cyberpunk') && (
          <>
            <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />
          </>
        )}
      </div>

      {/* Hidden Player 2: Universal Fallback (SoundCloud, Twitch, etc.) */}
      {!isSpotify && !isYouTube && (
        <div className="fixed top-0 left-[-9999px] w-10 h-10 opacity-0 pointer-events-none">
          <ReactPlayer
            url={playlist[currentStationIndex].url}
            playing={musicPlaying && !showWelcome}
            volume={musicVolume / 100}
            muted={musicMuted}
            width="100%"
            height="100%"
            onStart={() => console.log('Universal Player Started')}
            onError={(e: any) => {
              if (e?.name === 'AbortError' || e?.message?.includes('interrupted')) return
              console.error('Universal Player Error', e)
            }}
          />
        </div>
      )}

      {/* Polls & Reactions Overlay */}
      <RoomPolls
        roomId={room.id}
        user={user}
        isOpen={isPollsOpen}
        onClose={() => setIsPollsOpen(false)}
      />
      {!personalSettings.hideReactions && <RoomReactionOverlay reactions={reactions} />}

      {/* Mobile Header (Minimal) */}
      <header className="md:hidden flex-none h-14 w-full flex items-center justify-between px-4 z-40 relative bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-2">
          <Link
            to="/dashboard/rooms"
            className="p-2 bg-white/10 rounded-full backdrop-blur-md"
            onClick={handleLeaveRoom}
          >
            <PhoneOff className="w-4 h-4 text-white" />
          </Link>
          <h1 className="text-sm font-bold text-white shadow-black drop-shadow-md">{room.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 bg-white/10 rounded-full backdrop-blur-md border border-white/5 text-[10px] uppercase font-bold tracking-widest text-white/80">
            {activity}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileTab('menu')}
            className="text-white hover:bg-white/10 rounded-full"
          >
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Header */}
      <header
        className={cn(
          'hidden md:flex flex-none h-16 w-full border-b backdrop-blur-xl items-center justify-between px-6 z-50 shadow-lg relative',
          isFocusMode && 'h-0 overflow-hidden border-b-0 opacity-0',
          room.appearance?.theme === 'modern'
            ? 'bg-white/80 border-zinc-200 text-black shadow-zinc-200/50'
            : 'bg-black/95 border-white/5 shadow-black/50 text-white'
        )}
      >
        <div className="flex items-center gap-6">
          <h1 className="text-lg font-bold font-heading tracking-tight flex items-center gap-2 text-white/90">
            {room.name}
          </h1>
          <ActiveRoomTimer createdAt={room.created_at || ''} />
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className={cn('text-muted-foreground hover:text-white', !showReactions && 'opacity-50')}
            onClick={() => setShowReactions(!showReactions)}
            title={showReactions ? 'Hide Reactions' : 'Show Reactions'}
          >
            <Smile className="w-5 h-5" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/20 text-white/80 hover:text-white hidden sm:flex transition-all"
            onClick={triggerConfetti}
          >
            <PartyPopper className="w-4 h-4 mr-2" />
            Fun
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/20 text-white/80 hover:text-white sm:hidden p-2 h-auto transition-all"
            onClick={triggerConfetti}
          >
            <PartyPopper className="w-4 h-4" />
          </Button>
          {room.code && (
            <button
              onClick={copyCode}
              suppressHydrationWarning={true}
              className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all text-xs font-mono text-muted-foreground hover:text-white hidden sm:flex"
            >
              <span className="tracking-widest text-white font-bold">{room.code}</span>
              {copied ? (
                <Check className="w-3 h-3 text-emerald-500" />
              ) : (
                <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-white"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title={isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar'}
          >
            {isSidebarOpen ? (
              <PanelRightClose className="w-5 h-5" />
            ) : (
              <PanelRightOpen className="w-5 h-5" />
            )}
          </Button>

          <RoomSettingsDialog
            room={{
              ...currentRoom,
              permissions: currentRoom.permissions ? {
                ...currentRoom.permissions,
                canScreenShare: currentRoom.permissions.canScreenShare ?? 'all',
                canUseMic: currentRoom.permissions.canUseMic ?? 'all',
                canUseCamera: currentRoom.permissions.canUseCamera ?? 'all',
              } : undefined,
              appearance: currentRoom.appearance ? {
                ...currentRoom.appearance,
                theme: currentRoom.appearance.theme ?? '',
                background: currentRoom.appearance.background ?? '',
              } : undefined
            }}
            userRole={userRole}
            personalSettings={personalSettings}
            onUpdatePersonalSettings={updatePersonalSettings}
            userRegion={userRegion}
            onRefreshRegion={() => detectRegion(true)}
          />
          <Button
            variant="secondary"
            size="sm"
            className="rounded-full px-5 bg-white/10 hover:bg-white/20 text-white border-0 shadow-none backdrop-blur-md"
            asChild
          >
            <Link to="/dashboard/rooms" onClick={handleLeaveRoom}>
              <PhoneOff className="w-4 h-4 mr-2 opacity-70" /> Leave
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Body - Grid Layout Fix */}
      <main
        className="relative flex w-full overflow-hidden min-h-0 z-10"
        style={{ backgroundColor: themeColor }}
      >
        {/* Left Content Stage */}
        <div className="flex-1 flex flex-col min-w-0 bg-transparent relative">
          {/* Toolbar */}
          {/* Toolbar - Unified Navigation */}
          <div
            className={cn(
              'hidden md:flex w-full items-center justify-center relative px-6 py-4 bg-transparent z-30 shrink-0',
              (isFocusMode || (activity === 'games' && activeGame)) &&
                'absolute top-0 opacity-0 pointer-events-none'
            )}
          >
            <RoomNavigation
              currentActivity={activity}
              onActivityChange={setActivity}
              activeSidebar={isPeopleOverlayOpen ? 'participants' : (sidebarView as SidebarType)}
              onSidebarChange={(id) => {
                if (id === 'participants') {
                  setIsPeopleOverlayOpen(!isPeopleOverlayOpen)
                } else {
                  if (id !== 'none') setSidebarView(id as 'chat' | 'participants' | 'ai')
                }
              }}
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              activityCounts={activityCounts}
              isRoomPublic={room.is_public}
            />

            <div className="absolute right-6 flex items-center gap-2">
              {/* Polls Button (Desktop) */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPollsOpen(true)}
                className="text-white/50 hover:text-white hover:bg-white/10 rounded-full"
                title="Polls"
              >
                <BarChart2 className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFocusMode(!isFocusMode)}
                className="text-white/50 hover:text-white hover:bg-white/10 rounded-full"
                title="Focus Mode"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden relative group/stage bg-black/20">
            {/* Persistent Audio Renderer - Ensures audio works even if sidebar is closed */}
            <RoomAudioRenderer
              remoteStreams={remoteStreams}
              volume={personalSettings.masterVolume / 100}
            />

            <div className="w-full h-full relative overflow-hidden">
              <AnimatePresence mode="wait">
                {activity === 'home' ? (
                  <RoomHomeOverlay
                    key="home"
                    onSelectActivity={(act) => {
                      if (act === 'screen_share') {
                        // Open our custom picker instead of switching activity directly
                        setIsScreenSharePickerOpen(true)
                      } else {
                        setActivity(act)
                      }
                    }}
                    userName={user?.name}
                    isRoomPublic={room.is_public}
                    onOpenPolls={() => setIsPollsOpen(true)}
                  />
                ) : (
                  <motion.div
                    key={activity}
                    initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                    transition={{ duration: 0.4, ease: 'circOut' }}
                    className={cn(
                      'w-full h-full relative',
                      (activity === 'music' || mobileTab === 'music') && 'pointer-events-none'
                    )}
                  >
                    {activity === 'media' && mobileTab !== 'music' && renderMediaContent()}

                    {/* Conference / Video Grid View */}
                    {activity === 'conference' && (
                      <div className="w-full h-full flex items-center justify-center p-4">
                        <VideoConference
                          roomId={room.id}
                          user={user}
                          localStream={localStream}
                          remoteStreams={remoteStreams}
                          peersMetadata={peersMetadata}
                          toggleMic={handleToggleMic}
                          toggleCamera={handleToggleCam}
                          toggleScreenShare={handleLocalScreenShare}
                          permissions={room.permissions}
                          isOwner={isOwner}
                          disableVideo={personalSettings.bandwidthSaver}
                          volume={personalSettings.masterVolume / 100}
                          isMicOn={isMicOn}
                          isCamOn={isCamOn}
                        />
                      </div>
                    )}

                    {activity === 'screen_share' && renderScreenShare()}
                    {activity === 'whiteboard' && (
                      <RoomWhiteboard
                        roomId={room.id}
                        user={{ ...user } as { id: string; name?: string; [key: string]: unknown }}
                        onBack={() => setActivity('media')}
                      />
                    )}
                    {activity === 'notes' && <RoomNotes roomId={room.id} user={user} />}
                    {/* {activity === 'timer' && <RoomTimer roomId={room.id} user={user} />} */}
                    {activity === 'games' && (
                      <GameCenter
                        roomId={room.id}
                        user={user}
                        activeGame={activeGame}
                        onGameChangeAction={setActiveGame}
                      />
                    )}
                    {activity === 'tasks' && <RoomTaskBoard roomId={room.id} user={user} />}
                    {activity === 'virtual_tv' && !room.is_public && (
                      <VirtualTV
                        currentChannelUrl={virtualTVChannel}
                        onChannelSelect={handleVirtualTVChannelSelect}
                        isOwner={isOwner}
                        userRegion={userRegion}
                      />
                    )}
                    {activity === 'music' && (
                      <RoomMusicPlayer
                        playing={musicPlaying}
                        volume={musicVolume}
                        muted={musicMuted}
                        currentStationIndex={currentStationIndex}
                        stations={playlist}
                        onTogglePlay={() => setMusicPlaying(!musicPlaying)}
                        onToggleMute={() => setMusicMuted(!musicMuted)}
                        onVolumeChange={(vol) => setMusicVolume(vol)}
                        onStationSelect={setCurrentStationIndex}
                        onNextStation={() =>
                          setCurrentStationIndex((prev) => (prev + 1) % playlist.length)
                        }
                        onAddCustomStation={handleAddCustomStation}
                      />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bottom Center Floating Reactions Bar */}
              {showReactions && !personalSettings.hideReactions && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2 shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-5 fade-in duration-500">
                  <RoomReactionBar onReaction={broadcastReaction} />
                </div>
              )}

              {/* Exit Focus Button */}
              {isFocusMode && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsFocusMode(false)}
                  className="absolute top-4 right-4 z-50 opacity-0 group-hover/stage:opacity-100 transition-opacity bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10"
                >
                  <Minimize2 className="w-4 h-4 mr-2" /> Exit Focus
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Floating Strip + Collapsable Panel */}

        {/* Floating People Overlay (Replaces Sidebar View) */}
        {isPeopleOverlayOpen && !isFocusMode && (
          <div className="absolute right-4 top-24 bottom-24 w-[320px] z-[60] flex flex-col animate-in fade-in slide-in-from-right-10 duration-500 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between shrink-0">
              <h2 className="text-lg font-medium text-white">People</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsPeopleOverlayOpen(false)}
                className="h-8 w-8 text-white/50 hover:text-white rounded-full hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden relative">
              <RoomMembersList
                roomId={room.id}
                currentUserRole={userRole}
                onlineUserIds={onlineUserIds}
                isGridView={activity === 'conference'}
                onSwitchToGrid={() => {
                  setActivity('conference')
                  // In floating mode, we just switch the main stage
                }}
                onSwitchToList={() => {
                  if (activity === 'conference') setActivity('home')
                }}
              />
            </div>
          </div>
        )}

        {/* Floating Participants Strip (Summary View) - Hide if overlay is open */}
        {!isSidebarOpen && !isFocusMode && !isPeopleOverlayOpen && (
          <div className="hidden md:block absolute right-4 top-1/2 -translate-y-1/2 z-[60] animate-in fade-in slide-in-from-right-10 duration-500">
            <ParticipantsStrip
              localStream={localStream}
              remoteStreams={remoteStreams}
              peersMetadata={peersMetadata}
              user={user}
              onExpand={() => {
                setIsPeopleOverlayOpen(true)
              }}
              isMicOn={isMicOn}
            />
          </div>
        )}

        {/* Collapsible Sidebar Panel */}
        <div
          className={cn(
            'hidden md:flex flex-col h-full shrink-0 transition-all duration-300 ease-in-out border-l border-white/5 bg-black/40 backdrop-blur-xl',
            isFocusMode || !isSidebarOpen ? 'w-0 border-l-0 opacity-0 overflow-hidden' : 'w-[400px]'
          )}
        >
          {/* Mobile Close Handle (only visible on mobile) */}
          <div className="md:hidden flex items-center justify-center p-2 border-b border-white/5">
            <div className="w-12 h-1.5 rounded-full bg-white/20" />
          </div>

          <div className="h-4" />

          <div className="flex-1 overflow-hidden relative">
            {sidebarView === 'chat' && (
              <RoomChat
                roomId={room.id}
                user={user}
                welcomeMessage={room.chat_settings?.welcomeMessage}
                slowModeSeconds={room.chat_settings?.slowModeSeconds}
                emojiOnly={room.chat_settings?.emojiOnly}
                blockLinks={room.chat_settings?.blockLinks}
              />
            )}
            {sidebarView === 'participants' && !hideParticipants && (
              <div className="flex-1 flex items-center justify-center text-white/50 text-sm">
                {/* Deprecated Sidebar View - now handled by Floating Overlay */}
                <p>Moved to People Overlay</p>
              </div>
            )}
            {sidebarView === 'ai' && (
              <RoomAIChat
                roomId={room.id}
                roomName={room.name}
                roomDescription={room.description || undefined}
                currentActivity={activity}
                onCommand={handleAICommand}
              />
            )}
            {/* Music Sidebar View Removed */}
          </div>
        </div>
      </main>

      {/* Debug Overlay */}
      {showDebug && (
        <div className="absolute bottom-4 left-4 z-50 p-4 bg-black/90 border border-white/10 text-xs font-mono text-green-400 rounded-lg shadow-2xl max-w-sm max-h-[300px] overflow-y-auto">
          <div className="flex justify-between items-center mb-2 border-b border-green-900/50 pb-2">
            <span className="font-bold">WebRTC Debug ({user?.id?.slice(0, 8)})</span>
            <button
              onClick={() => setShowDebug(false)}
              className="text-red-400 hover:text-red-300 text-lg px-2"
            >
              ×
            </button>
          </div>
          <div className="mb-2">Local Stream: {localStream?.id ? 'Active' : 'None'}</div>
          <div className="mb-2">Remote Streams: {remoteStreams.length}</div>
          <div className="border-t border-green-900/50 my-2 pt-2">
            {debugInfo?.peers.map((p) => (
              <div key={p.userId} className="mb-1">
                Peer: {p.userId.slice(0, 8)}
                <br />
                ICE: {p.ice}, Sig: {p.signaling}
                <br />
                Dir: {p.direction}
                <br />
                Audio Rx: {p.audioRx ? 'Yes' : 'No'}, En: {p.audioEnabled ? 'T' : 'F'}
              </div>
            ))}
            {debugInfo?.peers.length === 0 && <div>No Peers</div>}
          </div>
          <div className="border-t border-green-900/50 my-2 pt-2 opacity-50">
            {debugInfo?.logs.map((l, i) => (
              <div key={i}>{l}</div>
            ))}
          </div>
        </div>
      )}
      {/* Polls Overlay */}
      <RoomPolls
        roomId={room.id}
        user={user}
        isOpen={isPollsOpen}
        onClose={() => setIsPollsOpen(false)}
      />

      {/* Screen Share Source Picker */}
      <ScreenSharePicker
        open={isScreenSharePickerOpen}
        onClose={() => setIsScreenSharePickerOpen(false)}
        onSelect={async (sourceId) => {
          await handleLocalScreenShare(sourceId)
          setActivity('screen_share')
        }}
      />
    </div>
  )
}
