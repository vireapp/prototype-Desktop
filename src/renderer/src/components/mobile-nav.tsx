'use client'

import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Home, Users, MessageSquare, MonitorPlay } from 'lucide-react'
import { motion } from 'framer-motion'

export function MobileNav() {
  const { pathname } = useLocation()

  const items = [
    {
      title: 'Home',
      href: '/dashboard',
      icon: Home,
      matchExact: true,
      color: 'text-blue-400'
    },
    {
      title: 'Friends',
      href: '/dashboard/friends',
      icon: Users,
      color: 'text-purple-400'
    },
    {
      title: 'Messages',
      href: '/dashboard/messages',
      icon: MessageSquare,
      color: 'text-emerald-400'
    },
    {
      title: 'Rooms',
      href: '/dashboard/rooms',
      icon: MonitorPlay,
      color: 'text-amber-400'
    }
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-safe pointer-events-none">
      <div className="flex justify-center mb-6 pointer-events-auto">
        {/* Floating Dock Container */}
        <motion.nav
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="mx-4 w-full max-w-md flex items-center justify-between p-2 rounded-2xl bg-background/80 backdrop-blur-xl border border-border shadow-2xl shadow-black/10 ring-1 ring-border"
        >
          {items.map((item) => {
            const isActive = item.matchExact
              ? pathname === item.href
              : pathname?.startsWith(item.href)

            return (
              <Link
                key={item.href}
                to={item.href}
                draggable="false"
                onContextMenu={(e) => e.preventDefault()}
                className="relative flex flex-col items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl"
              >
                {/* Active Background Pill */}
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-active"
                    className="absolute inset-0 bg-primary/10 rounded-xl"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}

                {/* Active Glow/Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-glow"
                    className={cn(
                      'absolute inset-0 rounded-xl opacity-20 blur-md',
                      item.color.replace('text-', 'bg-')
                    )}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}

                <div className="relative z-10 flex flex-col items-center justify-center gap-0.5">
                  <item.icon
                    className={cn(
                      'w-5 h-5 sm:w-6 sm:h-6 transition-all duration-300',
                      isActive
                        ? cn(item.color, 'scale-110')
                        : 'text-muted-foreground group-hover:text-foreground'
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />

                  {/* Tiny active dot instead of text for minimal look */}
                  {isActive && (
                    <motion.div
                      layoutId="mobile-nav-dot"
                      className={cn('w-1 h-1 rounded-full', item.color.replace('text-', 'bg-'))}
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </div>
              </Link>
            )
          })}
        </motion.nav>
      </div>
    </div>
  )
}
