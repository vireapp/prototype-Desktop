'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Tv,
  LayoutGrid,
  PenTool,
  Music2,
  ListTodo,
  MessageSquare,
  Users,
  Bot,
  Monitor,
  Home
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

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

export type SidebarType = 'chat' | 'participants' | 'ai' | 'none'

interface RoomNavigationProps {
  currentActivity: ActivityType
  onActivityChange: (activity: ActivityType) => void
  activeSidebar: SidebarType
  onSidebarChange: (sidebar: SidebarType) => void
  isSidebarOpen: boolean
  onToggleSidebar: () => void
  activityCounts?: Record<string, number>
  isRoomPublic?: boolean
}

export function RoomNavigation({
  currentActivity,
  onActivityChange,
  activeSidebar,
  onSidebarChange,
  isSidebarOpen,
  onToggleSidebar,
  activityCounts = {},
  isRoomPublic = false
}: RoomNavigationProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  const mainApps = [
    {
      id: 'media',
      label: 'Watch',
      icon: Monitor,
      gradient: 'from-white/10 to-transparent',
      glowColor: '255, 255, 255'
    },
    {
      id: 'virtual_tv',
      label: 'TV',
      icon: Tv,
      gradient: 'from-white/10 to-transparent',
      glowColor: '255, 255, 255'
    },
    {
      id: 'whiteboard',
      label: 'Canvas',
      icon: PenTool,
      gradient: 'from-white/10 to-transparent',
      glowColor: '255, 255, 255'
    },
    {
      id: 'notes',
      label: 'Notes',
      icon: 'NotesIcon',
      gradient: 'from-white/10 to-transparent',
      glowColor: '255, 255, 255'
    },
    {
      id: 'games',
      label: 'Games',
      icon: LayoutGrid,
      gradient: 'from-white/10 to-transparent',
      glowColor: '255, 255, 255'
    }
  ].filter((app) => !(app.id === 'virtual_tv' && isRoomPublic))

  const utilityApps = [
    {
      id: 'tasks',
      label: 'Tasks',
      icon: ListTodo,
      gradient: 'from-white/10 to-transparent',
      glowColor: '255, 255, 255'
    },
    {
      id: 'music',
      label: 'Music',
      icon: Music2,
      gradient: 'from-white/10 to-transparent',
      glowColor: '255, 255, 255'
    }
  ]

  const sidebarTools = [
    {
      id: 'chat',
      label: 'Chat',
      icon: MessageSquare,
      gradient: 'from-white/10 to-transparent',
      glowColor: '255, 255, 255'
    },
    {
      id: 'participants',
      label: 'People',
      icon: Users,
      gradient: 'from-white/10 to-transparent',
      glowColor: '255, 255, 255'
    },
    {
      id: 'ai',
      label: 'AI',
      icon: Bot,
      gradient: 'from-white/10 to-transparent',
      glowColor: '255, 255, 255'
    }
  ]

  const handleSidebarClick = (id: string) => {
    // Special refactor: "participants" is now a floating overlay, not a sidebar
    if (id === 'participants') {
      onSidebarChange(id as SidebarType)
      return
    }

    if (activeSidebar === id && isSidebarOpen) {
      onToggleSidebar()
    } else {
      if (!isSidebarOpen) onToggleSidebar()
      onSidebarChange(id as SidebarType)
    }
  }

  const allApps = [{ id: 'home', glowColor: '255, 255, 255' }, ...mainApps, ...utilityApps]

  const activeApp = allApps.find((app) => app.id === currentActivity)
  const activeGlowColor = activeApp ? activeApp.glowColor : '255, 255, 255'

  return (
    <motion.div
      className="relative flex items-center gap-2 p-2 bg-black/40 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl"
      initial={{ y: -20, opacity: 0 }}
      animate={{
        y: 0,
        opacity: 1,
        boxShadow: `0 10px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)`
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      {/* Delicate Inner border */}
      <div className="absolute inset-0 rounded-2xl border border-white/5 pointer-events-none mix-blend-overlay" />

      {/* Main Apps Group */}
      <div className="flex items-center gap-1 px-1">
        {/* Home Button */}
        <NavButton
          id="home"
          active={currentActivity === 'home'}
          onClick={() => onActivityChange('home')}
          icon={Home}
          label="Home"
          gradient="from-foreground/10 to-foreground/5"
          glowColor="120, 120, 120"
          count={activityCounts?.['home']}
          isHovered={hoveredItem === 'home'}
          onHover={(hovered) => setHoveredItem(hovered ? 'home' : null)}
        />

        {/* Divider */}
        <div className="w-px h-6 bg-border mx-1" />

        {mainApps.map((app) => (
          <NavButton
            key={app.id}
            id={app.id}
            active={currentActivity === app.id}
            onClick={() => onActivityChange(app.id as ActivityType)}
            icon={app.icon}
            label={app.label}
            gradient={app.gradient}
            glowColor={app.glowColor}
            count={activityCounts[app.id]}
            isHovered={hoveredItem === app.id}
            onHover={(hovered) => setHoveredItem(hovered ? app.id : null)}
          />
        ))}
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-gradient-to-b from-transparent via-white/10 to-transparent" />

      {/* Utility Apps Group */}
      <div className="flex items-center gap-1 px-1">
        {utilityApps.map((app) => (
          <NavButton
            key={app.id}
            id={app.id}
            active={currentActivity === app.id}
            onClick={() => onActivityChange(app.id as ActivityType)}
            icon={app.icon}
            label={app.label}
            gradient={app.gradient}
            glowColor={app.glowColor}
            count={activityCounts[app.id]}
            isHovered={hoveredItem === app.id}
            onHover={(hovered) => setHoveredItem(hovered ? app.id : null)}
          />
        ))}
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-white/10" />

      {/* Sidebar Tools Group */}
      <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1.5 border border-white/5">
        {sidebarTools.map((tool) => (
          <SidebarButton
            key={tool.id}
            id={tool.id}
            active={isSidebarOpen && activeSidebar === tool.id}
            onClick={() => handleSidebarClick(tool.id)}
            icon={tool.icon}
            label={tool.label}
            gradient={tool.gradient}
            glowColor={tool.glowColor}
            isHovered={hoveredItem === `sidebar-${tool.id}`}
            onHover={(hovered) => setHoveredItem(hovered ? `sidebar-${tool.id}` : null)}
          />
        ))}
      </div>
    </motion.div>
  )
}

interface NavButtonProps {
  id: string
  active: boolean
  onClick: () => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any
  label: string
  gradient: string
  glowColor: string
  count?: number
  isHovered: boolean
  onHover: (hovered: boolean) => void
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function NavButton({
  id,
  active,
  onClick,
  icon: Icon,
  label,
  gradient,
  glowColor,
  count,
  isHovered,
  onHover
}: NavButtonProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            suppressHydrationWarning
            onClick={onClick}
            onMouseEnter={() => onHover(true)}
            onMouseLeave={() => onHover(false)}
            className={cn(
              'relative flex items-center justify-center w-11 h-11 rounded-xl transition-colors duration-300 focus:outline-none',
              active ? 'text-white' : 'text-white/60 hover:text-white/90'
            )}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
          >
            <AnimatePresence>
              {active && (
                <motion.div
                  className={cn('absolute inset-0 rounded-xl bg-white/15 backdrop-blur-md border border-white/20')}
                  layoutId="nav-active-bg"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  style={{
                    boxShadow: `0 4px 12px rgba(0,0,0, 0.2)`
                  }}
                />
              )}
            </AnimatePresence>

            {/* Hover glow */}
            <motion.div
              className="absolute inset-0 rounded-xl"
              animate={{
                backgroundColor: isHovered && !active ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0)'
              }}
              transition={{ duration: 0.2 }}
            />

            {/* Presence Badge */}
            {count && count > 0 && !active && (
              <motion.div
                className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center z-10"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500 }}
              >
                <span className="text-[9px] font-bold text-white">{count}</span>
              </motion.div>
            )}

            {/* Icon */}
            <motion.div
              className="relative z-10"
              animate={{
                rotate: active ? [0, -5, 5, 0] : 0
              }}
              transition={{ duration: 0.4, delay: active ? 0.1 : 0 }}
            >
              {Icon === 'NotesIcon' ? (
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
                  className="w-5 h-5"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                  <path d="M12 13v6" />
                  <path d="M9 16h6" />
                </svg>
              ) : (
                <Icon className="w-5 h-5" />
              )}
            </motion.div>
          </motion.button>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="bg-popover text-popover-foreground border-border text-xs font-medium px-3 py-1.5 flex gap-2 items-center rounded-lg shadow-xl"
        >
          {label}
          {count && count > 0 && <span className="text-zinc-400">({count})</span>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface SidebarButtonProps {
  id: string
  active: boolean
  onClick: () => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any
  label: string
  gradient: string
  glowColor: string
  isHovered: boolean
  onHover: (hovered: boolean) => void
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function SidebarButton({
  id,
  active,
  onClick,
  icon: Icon,
  label,
  gradient,
  glowColor,
  isHovered,
  onHover
}: SidebarButtonProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            suppressHydrationWarning
            onClick={onClick}
            onMouseEnter={() => onHover(true)}
            onMouseLeave={() => onHover(false)}
            className={cn(
              'relative flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-300 focus:outline-none',
              active ? 'text-white' : 'text-white/60 hover:text-white/90'
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Active background */}
            <AnimatePresence>
              {active && (
                <motion.div
                  className={cn('absolute inset-0 rounded-lg bg-white/15 border border-white/20')}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </AnimatePresence>

            {/* Hover effect */}
            {!active && (
              <motion.div
                className="absolute inset-0 rounded-lg bg-white/5"
                initial={{ opacity: 0 }}
                animate={{ opacity: isHovered ? 1 : 0 }}
                transition={{ duration: 0.15 }}
              />
            )}

            <Icon className="w-4 h-4 relative z-10" />

            {/* Active indicator dot */}
            <AnimatePresence>
              {active && (
                <motion.span
                  className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-black"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 500 }}
                />
              )}
            </AnimatePresence>
          </motion.button>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="bg-popover text-popover-foreground border-border text-xs rounded-lg shadow-xl"
        >
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
