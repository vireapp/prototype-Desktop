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
            'relative flex items-center justify-center w-11 h-11 mx-auto rounded-2xl transition-all duration-200 group',
            isActive
              ? 'text-primary'
              : 'text-muted-foreground/50 hover:text-foreground/90'
          )}
        >
          {/* Active solid background */}
          {isActive && (
            <motion.div
              layoutId="sidebar-active-bg"
              className="absolute inset-0 rounded-xl bg-white/[0.08]"
            />
          )}

          {/* Hover background */}
          <div
            className={cn(
              'absolute inset-0 rounded-xl transition-opacity duration-150 opacity-0 group-hover:opacity-100 bg-white/[0.04]',
              isActive ? 'opacity-0' : ''
            )}
          />

          {/* Active left accent */}
          {isActive && (
            <motion.div
              layoutId="sidebar-active-indicator"
              className="absolute rounded-r-full"
              style={{
                left: '-8px',
                width: '3px',
                height: '16px',
                background: 'hsl(var(--primary))'
              }}
            />
          )}

          <motion.div
            whileTap={{ scale: 0.88 }}
            className="relative z-10 flex items-center justify-center"
          >
            {Icon && (
              <Icon
                className={cn(
                  'w-5 h-5 shrink-0 transition-all duration-300',
                  isActive ? 'text-primary' : '',
                  !isActive && label === 'Rooms' && 'group-hover:-rotate-12',
                  !isActive && label === 'Home' && 'group-hover:-rotate-6',
                  !isActive && label === 'Shop' && 'group-hover:scale-110',
                  !isActive && label === 'Messages' && 'group-hover:-translate-y-0.5',
                  !isActive && label === 'Friends' && 'group-hover:scale-110'
                )}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
            )}
          </motion.div>

          {badge && badge > 0 && (
            <span className="absolute top-1.5 right-1.5 flex w-2 h-2 rounded-full bg-primary border border-background" />
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
          whileTap={{ scale: 0.88 }}
          onContextMenu={(e) => e.preventDefault()}
          onClick={() => {
            if (isOnAIPage) return
            togglePanel()
          }}
          className={cn(
            'relative flex items-center justify-center w-11 h-11 mx-auto rounded-2xl transition-all duration-300 group',
            isActive
              ? 'text-violet-400'
              : 'text-muted-foreground/50 hover:text-violet-400'
          )}
        >
          {/* Active background */}
          {isActive && (
            <motion.div
              layoutId="sidebar-active-bg"
              className="absolute inset-0 rounded-xl bg-violet-500/10"
            />
          )}

          {/* Hover background */}
          {!isActive && (
            <div
              className="absolute inset-0 rounded-xl transition-opacity duration-150 opacity-0 group-hover:opacity-100 bg-violet-500/5"
            />
          )}

          {/* Active left accent */}
          {isActive && (
            <motion.div
              layoutId="sidebar-active-indicator"
              className="absolute rounded-r-full"
              style={{
                left: '-8px',
                width: '3px',
                height: '16px',
                background: 'rgb(139,92,246)'
              }}
            />
          )}

          <Sparkles
            className={cn(
              'relative z-10 w-5 h-5 shrink-0 transition-all duration-300',
              isActive && 'text-violet-400 drop-shadow-[0_0_6px_rgba(167,139,250,0.7)]',
              status === 'thinking' && 'animate-pulse'
            )}
            strokeWidth={isActive ? 2.5 : 1.8}
          />

          {/* Status dot */}
          <span
            className={cn(
              'absolute top-1.5 right-1.5 w-2 h-2 rounded-full border border-background transition-colors',
              status === 'error'
                ? 'bg-red-500'
                : status === 'thinking'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.5)]'
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
