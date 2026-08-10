'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Monitor, Clapperboard, Tv } from 'lucide-react'

// Youtube icon removed from lucide-react v1.0 — using inline SVG
function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" />
    </svg>
  )
}
import { YouTubeSearch } from '@/components/room/youtube-search'

export type MediaService = 'youtube' | 'netflix' | 'prime' | 'hotstar' | 'disney'

interface MediaSelectorProps {
  onSelect: (service: MediaService, initialUrl?: string) => void
}

export function MediaSelector({ onSelect }: MediaSelectorProps) {
  const [mode, setMode] = useState<'grid' | 'youtube_search'>('grid')

  const apps = [
    {
      id: 'youtube',
      name: 'YouTube',
      icon: YoutubeIcon,
      color: 'text-red-500',
      bg: 'hover:bg-red-500/10'
    },
    {
      id: 'netflix',
      name: 'Netflix',
      icon: Monitor,
      color: 'text-red-600',
      bg: 'hover:bg-red-600/10'
    },
    {
      id: 'prime',
      name: 'Prime Video',
      icon: Tv,
      color: 'text-blue-400',
      bg: 'hover:bg-blue-400/10'
    },
    {
      id: 'hotstar',
      name: 'Hotstar',
      icon: Clapperboard,
      color: 'text-green-500',
      bg: 'hover:bg-green-500/10'
    },
    {
      id: 'disney',
      name: 'Disney+',
      icon: Monitor,
      color: 'text-blue-600',
      bg: 'hover:bg-blue-600/10'
    }
  ]

  const handleAppClick = (appId: string) => {
    if (appId === 'youtube') {
      setMode('youtube_search')
    } else {
      onSelect(appId as MediaService)
    }
  }

  if (mode === 'youtube_search') {
    return (
      <div className="flex flex-col h-full animate-in slide-in-from-bottom-4 duration-500">
        <div className="py-2 px-4 border-b border-white/5 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMode('grid')}
            className="mr-auto text-muted-foreground hover:text-white"
          >
            ← Back to Apps
          </Button>
        </div>
        <YouTubeSearch
          onSelect={(url) => {
            // We need a way to pass the URL up to the parent.
            // IMPORTANT: The parent `RoomClient` expects a callback `onSelect(service)`.
            // It doesn't currently accept a specific URL.
            // I need to trigger the parent to set 'youtube' mode, but also pass the URL effectively.
            // Tricky. `RoomClient` logic:
            // if (service === 'youtube') setMediaMode('youtube')
            // Then `renderMediaContent` renders `RoomMedia`.

            // `RoomMedia` handles its own URL state? Yes.
            // But we want to pre-fill it.

            // For now, let's just use the `onSelect('youtube')` behavior
            // BUT we have a problem: This search UI is *inside* MediaSelector.
            // If we just call `onSelect('youtube')`, the parent switches to `RoomMedia` (which is empty).
            // The user would lose the selected video.

            // Solution: We need to modify `onSelect` or `RoomClient` to accept an initial URL.
            // Or, we can emit a custom event? No.

            // Let's modify `MediaSelectorProps` to accept `onUrlSelect`?
            // Or cheat: `onSelect('youtube')` and somehow pass URL?

            // Let's update `onSelect` signature in `MediaSelectorProps` but that breaks `RoomClient`.
            // Let's stick to the plan:
            // 1. User selects video. 2. Copy to clipboard? No.

            // Pivot: I will modify `RoomClient` to accept an optional URL payload.
            // But first, let's finish this file. I'll invoke a new prop `onUrlSelect` if I can,
            // otherwise I'll need to refactor `RoomClient` too.

            // Actually, I can use a global store or context, but that's overkill.
            // Let's update the prop type right here.
            onSelect('youtube', url)
          }}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in fade-in duration-500">
      <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-white/50 bg-clip-text text-transparent mb-2">
        What are we watching?
      </h2>
      <p className="text-muted-foreground mb-8">Select an app to start streaming with friends.</p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-2xl">
        {apps.map((app) => (
          <Card
            key={app.id}
            onClick={() => handleAppClick(app.id)}
            className={`cursor-pointer border-white/5 bg-black/40 backdrop-blur-sm p-6 flex flex-col items-center gap-4 transition-all duration-300 hover:scale-105 hover:border-white/10 ${app.bg} group`}
          >
            <div
              className={`w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors`}
            >
              <app.icon className={`w-6 h-6 ${app.color}`} />
            </div>
            <span className="font-semibold text-white/90 group-hover:text-white">{app.name}</span>
          </Card>
        ))}
      </div>
    </div>
  )
}
