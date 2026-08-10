// eslint-disable-next-line @typescript-eslint/no-explicit-any
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useState } from 'react'
import { Button } from '@/components/ui/button'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Tv, Globe, LayoutGrid, PenTool, ListTodo, Music2, Monitor, BarChart2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ActivityType =
  | 'media'
  | 'screen_share'
  | 'whiteboard'
  | 'games'
  | 'notes'
  | 'timer'
  | 'tasks'
  | 'music'
  | 'virtual_tv'
  | 'home'
  | 'conference'

interface ActivityLauncherProps {
  activeActivity: ActivityType
  onActivityChange: (activity: ActivityType) => void
  isOwner: boolean
  virtualTVChannel?: string
  onVirtualTVChannelSelect?: (url: string, name: string) => void
  userRegion?: { code: string; name: string } | null
  isRoomPublic?: boolean
  onOpenPolls?: () => void
}

export function ActivityLauncher({
  activeActivity,
  onActivityChange,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isOwner,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  virtualTVChannel,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onVirtualTVChannelSelect,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  userRegion,
  isRoomPublic = false,
  onOpenPolls
}: ActivityLauncherProps) {
  return (
    <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md border border-white/5 p-1.5 rounded-full shadow-2xl overflow-x-auto max-w-[90vw] md:max-w-none scrollbar-hide">
      <Button
        variant="ghost"
        size="default"
        onClick={() => onActivityChange('media')}
        className={cn(
          'rounded-full px-6 h-10 gap-2 transition-all duration-300',
          activeActivity === 'media'
            ? 'bg-primary/20 text-primary hover:bg-primary/30 hover:text-primary shadow-[0_0_20px_rgba(var(--primary),0.3)] ring-1 ring-primary/20'
            : 'text-muted-foreground hover:text-white hover:bg-white/5'
        )}
      >
        <Monitor className="w-5 h-5" />
        <span className="hidden sm:inline text-sm font-medium">Watch</span>
      </Button>

      <Button
        variant="ghost"
        size="default"
        onClick={() => onActivityChange('whiteboard')}
        className={cn(
          'rounded-full px-6 h-10 gap-2 transition-all duration-300',
          activeActivity === 'whiteboard'
            ? 'bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30 hover:text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] ring-1 ring-emerald-500/20'
            : 'text-muted-foreground hover:text-white hover:bg-white/5'
        )}
      >
        <PenTool className="w-5 h-5" />
        <span className="hidden md:inline text-sm font-medium">Whiteboard</span>
      </Button>

      <Button
        variant="ghost"
        size="default"
        onClick={() => onActivityChange('notes')}
        className={cn(
          'rounded-full px-6 h-10 gap-2 transition-all duration-300',
          activeActivity === 'notes'
            ? 'bg-cyan-500/20 text-cyan-500 hover:bg-cyan-500/30 hover:text-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)] ring-1 ring-cyan-500/20'
            : 'text-muted-foreground hover:text-white hover:bg-white/5'
        )}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <path d="M12 13v6" />
          <path d="M9 16h6" />
        </svg>
        <span className="hidden md:inline text-sm font-medium">Notes</span>
      </Button>

      <Button
        variant="ghost"
        size="default"
        onClick={() => onActivityChange('games')}
        className={cn(
          'rounded-full px-6 h-10 gap-2 transition-all duration-300',
          activeActivity === 'games'
            ? 'bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30 hover:text-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.3)] ring-1 ring-yellow-500/20'
            : 'text-muted-foreground hover:text-white hover:bg-white/5'
        )}
      >
        <LayoutGrid className="w-5 h-5" />
        <span className="hidden md:inline text-sm font-medium">Games</span>
      </Button>
      <Button
        variant="ghost"
        size="default"
        onClick={() => onActivityChange('tasks')}
        className={cn(
          'rounded-full px-6 h-10 gap-2 transition-all duration-300',
          activeActivity === 'tasks'
            ? 'bg-blue-500/20 text-blue-500 hover:bg-blue-500/30 hover:text-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)] ring-1 ring-blue-500/20'
            : 'text-muted-foreground hover:text-white hover:bg-white/5'
        )}
      >
        <ListTodo className="w-5 h-5" />
        <span className="hidden md:inline text-sm font-medium">Tasks</span>
      </Button>
      <Button
        variant="ghost"
        size="default"
        onClick={() => onActivityChange('music')}
        className={cn(
          'rounded-full px-6 h-10 gap-2 transition-all duration-300',
          activeActivity === 'music'
            ? 'bg-purple-500/20 text-purple-500 hover:bg-purple-500/30 hover:text-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)] ring-1 ring-purple-500/20'
            : 'text-muted-foreground hover:text-white hover:bg-white/5'
        )}
      >
        <Music2 className="w-5 h-5" />
        <span className="hidden md:inline text-sm font-medium">Music</span>
      </Button>

      {/* Polls Button */}
      <Button
        variant="ghost"
        size="default"
        onClick={onOpenPolls}
        className={cn(
          'rounded-full px-6 h-10 gap-2 transition-all duration-300',
          // Use a distinct color for Polls, e.g., Orange
          'text-muted-foreground hover:text-white hover:bg-white/5'
        )}
      >
        <BarChart2 className="w-5 h-5" />
        <span className="hidden md:inline text-sm font-medium">Polls</span>
      </Button>

      {!isRoomPublic && (
        <Button
          variant="ghost"
          size="default"
          onClick={() => onActivityChange('virtual_tv')}
          className={cn(
            'rounded-full px-6 h-10 gap-2 transition-all duration-300',
            activeActivity === 'virtual_tv'
              ? 'bg-indigo-500/20 text-indigo-500 hover:bg-indigo-500/30 hover:text-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.3)] ring-1 ring-indigo-500/20'
              : 'text-muted-foreground hover:text-white hover:bg-white/5'
          )}
        >
          <Tv className="w-5 h-5" />
          <span className="hidden md:inline text-sm font-medium">Virtual TV</span>
        </Button>
      )}
    </div>
  )
}
