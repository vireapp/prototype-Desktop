'use client'

import { useTransition } from 'react'
import { Loader2, Check } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { usePresence, UserStatus } from '@/components/dashboard/presence-provider'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface UserStatusMenuProps {
  initialStatus?: UserStatus // Optional/unused now as context handles it
  username: string
  isSidebar?: boolean
}

export function UserStatusMenu({ username, isSidebar = false }: UserStatusMenuProps) {
  const { userStatus, setUserStatus } = usePresence()
  const [isPending, startTransition] = useTransition()

  const handleStatusChange = (newStatus: UserStatus) => {
    startTransition(async () => {
      await setUserStatus(newStatus)
    })
  }

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'online':
        return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
      case 'offline':
        return 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
      case 'invisible':
        return 'bg-zinc-500 shadow-[0_0_8px_rgba(113,113,122,0.5)]'
      case 'in-room':
        return 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]'
      default:
        return 'bg-emerald-500'
    }
  }

  const TriggerContent = isSidebar ? (
    <div className="relative cursor-pointer group hover:ring-2 hover:ring-primary/50 transition-all rounded-full outline-none" role="button" tabIndex={0}>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-bold text-primary-foreground shrink-0 shadow-sm relative pointer-events-none">
            {username?.[0]?.toUpperCase() || 'U'}
            <div className={cn("absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[hsl(230_22%_7%)] dark:border-[#0f111a]", getStatusColor(userStatus))} />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={14} className="bg-popover/95 backdrop-blur-md z-50">
          <p className="font-medium text-xs">@{username} <span className="text-muted-foreground ml-1 capitalize">({userStatus})</span></p>
        </TooltipContent>
      </Tooltip>
    </div>
  ) : (
    <div
      suppressHydrationWarning
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition-colors group"
      role="button"
      tabIndex={0}
    >
      <div
        className={cn(
          'w-2 h-2 rounded-full transition-all duration-300',
          getStatusColor(userStatus)
        )}
      />
      <span className="text-xs font-medium text-zinc-300 group-hover:text-white transition-colors">
        @{username}
      </span>
    </div>
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {TriggerContent}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={isSidebar ? "center" : "end"}
        side={isSidebar ? "right" : "bottom"}
        sideOffset={isSidebar ? 18 : 4}
        className="w-40 bg-black/80 backdrop-blur-xl border-white/10 text-zinc-200 p-1 z-50"
      >
        <DropdownMenuItem
          onClick={() => handleStatusChange('online')}
          className="flex items-center justify-between focus:bg-white/10 focus:text-white cursor-pointer rounded-sm"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Online</span>
          </div>
          {userStatus === 'online' && <Check className="w-3 h-3" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleStatusChange('in-room')}
          className="flex items-center justify-between focus:bg-white/10 focus:text-white cursor-pointer rounded-sm"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <span>In a Room</span>
          </div>
          {userStatus === 'in-room' && <Check className="w-3 h-3" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleStatusChange('offline')}
          className="flex items-center justify-between focus:bg-white/10 focus:text-white cursor-pointer rounded-sm"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span>Offline</span>
          </div>
          {userStatus === 'offline' && <Check className="w-3 h-3" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleStatusChange('invisible')}
          className="flex items-center justify-between focus:bg-white/10 focus:text-white cursor-pointer rounded-sm"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-zinc-500" />
            <span>Invisible</span>
          </div>
          {userStatus === 'invisible' && <Check className="w-3 h-3" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
