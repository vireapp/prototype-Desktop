'use client'

import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Users, MessageSquare, MonitorPlay } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function DashboardNav(): React.ReactElement {
  const { pathname } = useLocation()

  const navItems = [
    {
      href: '/dashboard',
      label: 'Home',
      icon: Home,
      exact: true
    },
    {
      href: '/dashboard/friends',
      label: 'Friends',
      icon: Users,
      exact: false
    },
    {
      href: '/dashboard/messages',
      label: 'Messages',
      icon: MessageSquare,
      exact: false
    },
    {
      href: '/dashboard/rooms',
      label: 'Rooms',
      icon: MonitorPlay,
      exact: false
    }
  ]

  return (
    <nav className="flex items-center gap-1">
      {navItems.map((item) => {
        const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)

        return (
          <Button
            key={item.href}
            variant="ghost"
            size="sm"
            asChild
            className={cn(
              'relative transition-all duration-300',
              isActive
                ? 'bg-primary/10 text-primary shadow-sm'
                : 'hover:bg-muted hover:text-foreground text-muted-foreground',
              'rounded-full h-9 md:h-10 px-3 md:px-4' // Oval shape
            )}
          >
            <Link to={item.href} draggable="false" onContextMenu={(e) => e.preventDefault()} className="flex items-center gap-2">
              <item.icon className={cn('w-4 h-4', isActive && 'text-primary-foreground')} />
              <span className={cn('hidden md:inline font-medium', isActive ? 'text-primary' : '')}>
                {item.label}
              </span>
              {/* Active Indicator Dot (Optional addition to the oval background) */}
              {isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full md:hidden" />
              )}
            </Link>
          </Button>
        )
      })}
    </nav>
  )
}
