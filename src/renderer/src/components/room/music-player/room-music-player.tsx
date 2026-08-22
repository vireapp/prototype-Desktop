'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Disc,
  Minimize2,
  ListMusic
} from 'lucide-react'
import YouTube from 'react-youtube'
import { YouTubeSearch } from '@/components/room/youtube-search'
import { cn } from '@/lib/utils'

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" />
    </svg>
  )
}

interface RoomMusicPlayerProps {
  playing: boolean
  volume: number
  muted: boolean
  currentStationIndex: number
  stations: Array<{
    name: string
    url: string
    type: 'lofi' | 'radio' | 'youtube' | 'custom'
  }>
  onTogglePlay: () => void
  onToggleMute: () => void
  onVolumeChange: (vol: number) => void
  onStationSelect: (index: number) => void
  onNextStation: () => void
  onAddCustomStation?: (url: string, title?: string) => void
}

export function RoomMusicPlayer({
  playing,
  volume,
  muted,
  currentStationIndex,
  stations,
  onTogglePlay,
  onToggleMute,
  onVolumeChange,
  onStationSelect,
  onNextStation,
  onAddCustomStation
}: RoomMusicPlayerProps) {
  const [showSidebar, setShowSidebar] = useState(true)
  const [isHovering, setIsHovering] = useState(false)
  const playerRef = useRef<any>(null)

  const currentStation = stations[currentStationIndex]

  const getVideoId = (u: string) => {
    if (!u) return null
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = u.match(regExp)
    return match && match[2].length === 11 ? match[2] : null
  }
  const videoId = getVideoId(currentStation?.url)

  // Sync volume & mute
  useEffect(() => {
    if (playerRef.current) {
      if (muted) playerRef.current.mute()
      else {
        playerRef.current.unMute()
        playerRef.current.setVolume(volume)
      }
    }
  }, [volume, muted])

  // Sync playing state
  useEffect(() => {
    if (playerRef.current) {
      if (playing) playerRef.current.playVideo()
      else playerRef.current.pauseVideo()
    }
  }, [playing])

  const hash = currentStation?.name?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;
  const hue = hash % 360;
  
  return (
    <div
      className="flex w-full h-full bg-transparent text-foreground overflow-hidden relative group/player"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* 


      {/* LAYER 1: Ambient Overlay (pointer-events-none) */}
      <div 
        className="absolute inset-0 z-10 pointer-events-none transition-opacity duration-1000 bg-black/20"
      />

      {/* LAYER 2: Video Player Custom UI - Container is pointer-events-none, children are auto */}
      <div className="flex-1 flex flex-col relative z-30 pointer-events-none">
        
        {/* Show sidebar toggle if hidden */}
        {!showSidebar && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSidebar(true)}
            className="absolute top-6 right-6 z-50 text-white/70 hover:text-white hover:bg-white/10 backdrop-blur-md rounded-full transition-all pointer-events-auto"
          >
            <ListMusic className="w-5 h-5" />
          </Button>
        )}



        <div className="flex-1" />
      </div>

      {/* LAYER 3: Collapsible Sidebar */}
      <div
        className={cn(
          'border-l border-white/5 bg-black/60 backdrop-blur-2xl flex flex-col z-50 transition-all duration-500 overflow-hidden pointer-events-auto',
          'md:relative',
          showSidebar ? 'md:w-96 md:translate-x-0' : 'md:w-0 md:translate-x-full md:opacity-0',
          'absolute inset-0 w-full',
          !showSidebar && 'translate-x-full opacity-0 md:pointer-events-none'
        )}
      >
        <div className="flex items-center p-4 border-b border-white/5 gap-2 shrink-0 bg-white/5">
          <div className="flex-1 text-xs font-bold uppercase tracking-wider text-white pl-2">
            Discover
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSidebar(false)}
            className="shrink-0 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all"
          >
            <Minimize2 className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden bg-black/20">
          <YouTubeSearch
            categoryId="10"
            variant="list"
            onSelect={(url: string, title?: string) => {
              if (onAddCustomStation) {
                onAddCustomStation(url, title)
                setShowSidebar(false)
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}
