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
  onAddCustomStation?: (url: string) => void
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
  const [activeTab, setActiveTab] = useState<'stations' | 'search'>('stations')
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
      className="flex w-full h-full bg-black text-foreground overflow-hidden relative group/player"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* 
        LAYER 0: YouTube Player 
        Crucially, this is pointer-events-auto so the user CAN click the video directly 
        to satisfy Chrome's strict autoplay policy for unmuted audio!
      */}
      <div className="absolute inset-0 z-0">
        {videoId ? (
          <YouTube
            videoId={videoId}
            opts={{
              width: '100%',
              height: '100%',
              playerVars: {
                autoplay: playing ? 1 : 0,
                controls: 0,
                modestbranding: 1,
                rel: 0,
                playsinline: 1,
                disablekb: 1,
                iv_load_policy: 3
              }
            }}
            onReady={(e) => {
              playerRef.current = e.target
              if (muted) e.target.mute()
              else {
                e.target.unMute()
                e.target.setVolume(volume)
              }
              if (playing) e.target.playVideo()
            }}
            onPlay={() => { if (!playing) onTogglePlay() }}
            onPause={() => { if (playing) onTogglePlay() }}
            className="w-full h-full absolute top-0 left-0 border-0"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/50">
            Invalid Station URL
          </div>
        )}
      </div>

      {/* LAYER 0.5: Hover & Pause Catcher */}
      <div 
        className={cn(
          "absolute inset-0 z-[5]", 
          playing ? "pointer-events-auto cursor-pointer" : "pointer-events-none"
        )}
        onClick={() => { if (playing) onTogglePlay() }}
      />

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

        {/* Top Gradient & Title */}
        <div
          className={cn(
            'absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-black/80 via-black/40 to-transparent p-8 transition-opacity duration-500 pointer-events-none',
            isHovering || !playing ? 'opacity-100' : 'opacity-0'
          )}
        >
          <div className="pointer-events-auto max-w-2xl">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-[10px] font-bold uppercase tracking-widest text-white/80 border border-white/5">
                {currentStation?.type || 'station'}
              </span>
              {playing && (
                <div className="flex items-end gap-1 h-3">
                  <div className="w-1 h-3 bg-white/80 rounded-full animate-[music-bar_0.6s_ease-in-out_infinite]" />
                  <div className="w-1 h-4 bg-white/80 rounded-full animate-[music-bar_0.8s_ease-in-out_infinite_0.1s]" />
                  <div className="w-1 h-2 bg-white/80 rounded-full animate-[music-bar_0.5s_ease-in-out_infinite_0.2s]" />
                </div>
              )}
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight line-clamp-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 drop-shadow-xl">
              {currentStation?.name || 'Unknown Station'}
            </h2>
          </div>
        </div>

        <div className="flex-1" />

        {/* Bottom Control Bar */}
        <div
          className={cn(
            'w-full bg-gradient-to-t from-black via-black/80 to-transparent pt-24 pb-8 px-8 transition-all duration-500 flex flex-col gap-6 pointer-events-auto',
            isHovering || !playing
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-8 pointer-events-none'
          )}
        >
          {/* Progress Bar (Mock for radio/live) */}
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden relative group/timeline cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-r from-white/50 to-white w-1/3 rounded-full relative shadow-[0_0_10px_rgba(255,255,255,0.5)]">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/timeline:opacity-100 shadow-lg scale-150 transition-all duration-200" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  onStationSelect((currentStationIndex - 1 + stations.length) % stations.length)
                }
                className="text-white/70 hover:text-white hover:bg-white/10 rounded-full w-10 h-10 transition-colors"
              >
                <SkipBack className="w-5 h-5 fill-current" />
              </Button>

              <Button
                size="icon"
                onClick={onTogglePlay}
                className="h-14 w-14 rounded-full bg-white text-black hover:bg-white/90 hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
              >
                {playing ? (
                  <Pause className="w-6 h-6 fill-current" />
                ) : (
                  <Play className="w-6 h-6 fill-current ml-1" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={onNextStation}
                className="text-white/70 hover:text-white hover:bg-white/10 rounded-full w-10 h-10 transition-colors"
              >
                <SkipForward className="w-5 h-5 fill-current" />
              </Button>

              <div className="flex items-center gap-3 group/vol ml-4 pl-4 border-l border-white/10">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleMute}
                  className="text-white/70 hover:text-white hover:bg-white/10 rounded-full w-10 h-10 transition-colors"
                >
                  {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </Button>
                <div className="w-28 opacity-70 group-hover/vol:opacity-100 transition-opacity">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={muted ? 0 : volume}
                    onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-white/20 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white cursor-pointer hover:[&::-webkit-slider-thumb]:scale-125 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab('stations')}
            className={cn(
              'flex-1 text-xs font-bold uppercase tracking-wider rounded-lg transition-all',
              activeTab === 'stations' 
                ? 'bg-white/10 text-white shadow-sm' 
                : 'text-white/50 hover:bg-white/5 hover:text-white/80'
            )}
          >
            Library
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab('search')}
            className={cn(
              'flex-1 text-xs font-bold uppercase tracking-wider rounded-lg transition-all',
              activeTab === 'search' 
                ? 'bg-white/10 text-white shadow-sm' 
                : 'text-white/50 hover:bg-white/5 hover:text-white/80'
            )}
          >
            Discover
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSidebar(false)}
            className="shrink-0 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all"
          >
            <Minimize2 className="w-4 h-4" />
          </Button>
        </div>

        {activeTab === 'stations' && (
          <ScrollArea className="flex-1 p-3">
            <div className="space-y-2">
              {stations.map((station, i) => {
                const isActive = i === currentStationIndex;
                return (
                  <button
                    key={i}
                    onClick={() => onStationSelect(i)}
                    className={cn(
                      'w-full flex items-center gap-4 p-3 rounded-xl text-left transition-all group relative overflow-hidden',
                      isActive
                        ? 'bg-white/10 text-white shadow-[0_4px_20px_rgba(0,0,0,0.2)] border border-white/10'
                        : 'text-white/70 hover:bg-white/5 hover:text-white border border-transparent'
                    )}
                  >
                    <div 
                      className={cn(
                        'w-12 h-12 rounded-lg flex items-center justify-center shrink-0 relative bg-black/40 overflow-hidden shadow-inner transition-all',
                        isActive && 'shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                      )}
                    >
                      {station.type === 'youtube' ? (
                        <YoutubeIcon className={cn("w-5 h-5", isActive ? "text-red-500" : "text-white/50")} />
                      ) : (
                        <Disc className={cn('w-5 h-5', isActive ? "text-white" : "text-white/50", isActive && playing && 'animate-spin-slow')} />
                      )}
                      
                      {isActive && playing && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center gap-0.5">
                          <div className="w-0.5 h-3 bg-white animate-[music-bar_0.6s_ease-in-out_infinite]" />
                          <div className="w-0.5 h-4 bg-white animate-[music-bar_0.8s_ease-in-out_infinite_0.1s]" />
                          <div className="w-0.5 h-2 bg-white animate-[music-bar_0.5s_ease-in-out_infinite_0.2s]" />
                        </div>
                      )}
                    </div>
                    
                    <div className="min-w-0 flex-1 z-10">
                      <div className={cn("font-semibold text-sm truncate transition-colors", isActive ? "text-white" : "text-white/80 group-hover:text-white")}>
                        {station.name}
                      </div>
                      <div className="text-[10px] opacity-60 uppercase font-bold tracking-widest mt-1">
                        {station.type}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {activeTab === 'search' && (
          <div className="flex-1 flex flex-col overflow-hidden bg-black/20">
            <YouTubeSearch
              categoryId="10"
              variant="list"
              onSelect={(url: string) => {
                if (onAddCustomStation) {
                  onAddCustomStation(url)
                  setActiveTab('stations')
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
