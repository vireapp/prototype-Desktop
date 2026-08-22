'use client'

import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  UsersRound,
  MessageSquareText,
  DoorOpen,
  Store,
  Settings,
  LogOut,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { UserStatusMenu } from '@/components/dashboard/UserStatusMenu'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { useAI } from '@/lib/ai-context'

interface NavItemProps {
  href: string
  label: string
  icon?: React.ElementType
  exact?: boolean
  badge?: number
}

function NavItem({
  href,
  label,
  icon: Icon,
  exact = false,
  badge
}: NavItemProps): React.ReactElement {
  const { pathname } = useLocation()
  const isActive = exact ? pathname === href : pathname.startsWith(href)

  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <Link
          to={href}
          draggable="false"
          onContextMenu={(e) => e.preventDefault()}
          className={cn(
            'relative flex items-center justify-center w-11 h-11 mx-auto rounded-xl transition-all duration-200 group',
            isActive
              ? 'text-foreground bg-zinc-800/80 shadow-sm border border-white/5'
              : 'text-muted-foreground/60 hover:text-foreground/90 hover:bg-zinc-800/40'
          )}
        >
          <motion.div
            whileTap={{ scale: 0.92 }}
            className="relative z-10 flex items-center justify-center"
          >
            {Icon && (
              <Icon
                className={cn(
                  'w-5 h-5 shrink-0 transition-all duration-200',
                  isActive ? 'text-zinc-100' : ''
                )}
                strokeWidth={isActive ? 2 : 1.8}
              />
            )}
          </motion.div>

          {badge && badge > 0 && (
            <span className="absolute top-1 right-1 flex w-2 h-2 rounded-full bg-blue-500 border-[1.5px] border-background shadow-sm" />
          )}
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={14} className="font-medium bg-popover/95 backdrop-blur-md">
        {label}
      </TooltipContent>
    </Tooltip>
  )
}

/** Special AI button */
function AINavButton(): React.ReactElement {
  const { togglePanel, openFullPage, isOpen, mode, status } = useAI()
  const { pathname } = useLocation()
  const isOnAIPage = pathname === '/dashboard/ai'
  const isPanelActive = isOpen && mode === 'panel'
  const isActive = isOnAIPage || isPanelActive

  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onContextMenu={(e) => e.preventDefault()}
          onClick={() => {
            if (isOnAIPage) return
            togglePanel()
          }}
          className={cn(
            'relative flex items-center justify-center w-11 h-11 mx-auto rounded-xl transition-all duration-200 group',
            isActive
              ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 shadow-sm'
              : 'text-muted-foreground/60 hover:text-indigo-300 hover:bg-indigo-500/10'
          )}
        >
          <Sparkles
            className={cn(
              'relative z-10 w-5 h-5 shrink-0 transition-all duration-200',
              isActive && 'text-indigo-400',
              status === 'thinking' && 'animate-pulse opacity-80'
            )}
            strokeWidth={isActive ? 2 : 1.8}
          />

          {/* Status dot */}
          <span
            className={cn(
              'absolute top-1 right-1 w-2 h-2 rounded-full border-[1.5px] border-background transition-colors',
              status === 'error'
                ? 'bg-red-400'
                : status === 'thinking'
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
            )}
          />
        </motion.button>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={14} className="font-medium bg-popover/95 backdrop-blur-md">
        <div className="flex flex-col gap-0.5">
          <span>VIRE AI</span>
          <span className="text-[10px] text-muted-foreground">Click to toggle panel</span>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

interface DesktopSidebarProps {
  onLogout: () => Promise<void>
  username?: string
}

export function DesktopSidebar({ onLogout, username }: DesktopSidebarProps): React.ReactElement {
  return (
    <TooltipProvider>
      <motion.aside
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="w-[68px] pt-9 h-full flex flex-col shrink-0 z-20 relative bg-background border-r border-border"
      >



        {/* Navigation Links */}
        <div className="flex flex-col gap-1.5 flex-1 w-full px-2">
          <NavItem href="/dashboard" label="Home" icon={LayoutDashboard} exact />
          <NavItem href="/dashboard/friends" label="Friends" icon={UsersRound} />
          <NavItem href="/dashboard/messages" label="Messages" icon={MessageSquareText} />
          <NavItem href="/dashboard/rooms" label="Rooms" icon={DoorOpen} />
          <NavItem href="/dashboard/shop" label="Shop" icon={Store} />

          {/* Divider before AI */}
          <div className="flex items-center justify-center my-1">
            <div className="w-8 h-px bg-border" />
          </div>

          {/* AI Toggle */}
          <AINavButton />
        </div>

        {/* Bottom: User controls */}
        <div className="flex flex-col items-center gap-1 w-full pt-3 mt-auto px-2 pb-3 border-t border-border">
          <NotificationBell />
          <UserStatusMenu username={username || 'user'} isSidebar={true} />

          <div className="flex flex-col gap-1 w-full mt-1">
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  to="/dashboard/settings"
                  draggable="false"
                  onContextMenu={(e) => e.preventDefault()}
                  className="flex items-center justify-center w-full h-10 rounded-2xl text-muted-foreground/45 hover:text-foreground/80 transition-all group"
                  style={{ ':hover': { background: 'rgba(255,255,255,0.04)' } } as React.CSSProperties}
                >
                  <motion.div whileTap={{ scale: 0.88 }} className="flex items-center justify-center hover:bg-white/[0.04] w-full h-full rounded-2xl transition-colors">
                    <Settings className="w-5 h-5 transition-transform duration-700 group-hover:rotate-90" strokeWidth={1.8} />
                  </motion.div>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={14} className="font-medium bg-popover/95 backdrop-blur-md">
                Settings
              </TooltipContent>
            </Tooltip>

            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={onLogout}
                  className="flex items-center justify-center w-full h-10 rounded-2xl text-muted-foreground/45 hover:text-red-400 transition-all group"
                >
                  <motion.div whileTap={{ scale: 0.88 }} className="flex items-center justify-center hover:bg-red-500/[0.08] w-full h-full rounded-2xl transition-colors">
                    <LogOut className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-0.5" strokeWidth={1.8} />
                  </motion.div>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={14} className="font-medium text-red-400 bg-popover/95 backdrop-blur-md">
                Sign Out
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </motion.aside>
    </TooltipProvider>
  )
}
