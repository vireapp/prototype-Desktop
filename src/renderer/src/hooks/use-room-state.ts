import { useState } from 'react'
import { ActivityType } from '@/components/room/activity-launcher'
import { GameType } from '@/components/room/games/game-center'
import { MediaService } from '@/components/room/media-selector'

export type SidebarView = 'chat' | 'participants' | 'ai'
export type MobileTab = 'none' | 'chat' | 'activities' | 'people' | 'music' | 'menu' | 'ai'
export type MediaMode = 'selector' | 'youtube' | 'external'

export interface ExternalService {
  name: string
  url: string
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useRoomState(initialIsOwner: boolean = false) {
  // UI View States
  const [sidebarView, setSidebarView] = useState<SidebarView>('chat')
  const [mobileTab, setMobileTab] = useState<MobileTab>('none')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Activities
  const [activity, setActivity] = useState<ActivityType>('home')
  const [activeGame, setActiveGame] = useState<GameType | null>(null)

  // Media State
  const [mediaMode, setMediaMode] = useState<MediaMode>('selector')
  const [selectedMediaUrl, setSelectedMediaUrl] = useState<string | undefined>(undefined)
  const [externalService, setExternalService] = useState<ExternalService | null>(null)
  const [musicPlaying, setMusicPlaying] = useState(false)
  const [musicMuted, setMusicMuted] = useState(false)
  const [musicVolume, setMusicVolume] = useState(100)

  // Overlays
  const [showWelcome, setShowWelcome] = useState(true)
  const [showReactions, setShowReactions] = useState(true)
  const [showDebug, setShowDebug] = useState(false)

  // Presenter
  const [presenterId, setPresenterId] = useState<string | null>(null)

  // Actions
  const resetMedia = () => {
    setMediaMode('selector')
    setSelectedMediaUrl(undefined)
    setExternalService(null)
  }

  const launchMedia = (service: MediaService, url?: string) => {
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

  const [virtualTVChannel, setVirtualTVChannel] = useState<string>('')

  return {
    ui: {
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
    },
    activity: {
      current: activity,
      set: setActivity,
      game: activeGame,
      setGame: setActiveGame,
      virtualChannel: virtualTVChannel,
      setVirtualChannel: setVirtualTVChannel
    },
    media: {
      mode: mediaMode,
      setMode: setMediaMode,
      url: selectedMediaUrl,
      setUrl: setSelectedMediaUrl,
      external: externalService,
      setExternal: setExternalService,
      reset: resetMedia,
      launch: launchMedia,
      music: {
        playing: musicPlaying,
        setPlaying: setMusicPlaying,
        muted: musicMuted,
        setMuted: setMusicMuted,
        volume: musicVolume,
        setVolume: setMusicVolume
      }
    },
    presenter: {
      id: presenterId,
      setId: setPresenterId
    }
  }
}
