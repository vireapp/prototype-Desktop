'use client'

import { useState, useEffect } from 'react'
import { Search, Edit } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { usePresence } from '@/components/dashboard/presence-provider'
import { cn } from '@/lib/utils'

export function MessagesSidebar({
  initialFriends,
  selectedUsername
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialFriends: any[]
  selectedUsername?: string
}) {
  const [friends, setFriends] = useState(initialFriends)
  const [searchQuery, setSearchQuery] = useState('')
  const { onlineUsers } = usePresence()
  const supabase = createClient()

  useEffect(() => {
    setFriends(initialFriends)
  }, [initialFriends])

  // Subscribe to profile updates
  useEffect(() => {
    const channel = supabase
      .channel('public:profiles')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          setFriends((currentFriends) =>
            currentFriends.map((item) => {
              if (item.friend.id === payload.new.id) {
                return {
                  ...item,
                  friend: {
                    ...item.friend,
                    ...payload.new
                  }
                }
              }
              return item
            })
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const filteredFriends = friends?.filter(
    (item) =>
      item.friend.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.friend.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div
      className={`w-full md:w-72 flex flex-col border-b md:border-b-0 md:border-r border-border bg-card/20 ${selectedUsername ? 'hidden md:flex' : 'flex'} transition-all duration-500 relative`}
    >
      {/* ─── Sidebar Header — Stitch style ─── */}
      <div className="p-4 pb-3 space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg tracking-tight text-foreground">Messages</h2>
          <Button
            size="icon"
            className="h-8 w-8 bg-primary/15 hover:bg-primary/25 text-primary rounded-lg transition-all"
          >
            <Edit className="w-3.5 h-3.5" strokeWidth={2} />
          </Button>
        </div>

        {/* Search */}
        <div className="relative group">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground/40 group-focus-within:text-primary transition-colors duration-300 z-10" />
          <Input
            placeholder="Search conversations..."
            className="pl-9 bg-muted/30 border-border/50 focus:border-primary/20 focus:bg-muted/50 h-8 rounded-lg text-xs transition-all duration-300 text-foreground placeholder:text-muted-foreground/40"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* ─── Conversation List ─── */}
      <ScrollArea className="flex-1 px-2 pb-2">
        <div className="space-y-0.5">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {filteredFriends?.map((item: any) => {
            const isPresent = onlineUsers.has(item.friend.id)
            const dbStatus = item.friend.status

            const isOnline = isPresent && dbStatus !== 'invisible' && dbStatus !== 'offline'
            const isInRoom = isPresent && (dbStatus === 'in-room' || dbStatus === 'playing')

            const showGreen = isOnline && !isInRoom
            const showPurple = isInRoom
            const isSelected = selectedUsername === item.friend.username

            // Status text for preview
            const statusPreview = item.friend.status_text
              ? item.friend.status_text
              : showPurple
                ? 'In a Room'
                : showGreen
                  ? 'Online'
                  : 'Offline'

            return (
              <Link
                key={item.friend.id}
                to={`/dashboard/messages?username=${item.friend.username}`}
                className={cn(
                  'group relative flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200',
                  isSelected
                    ? 'bg-primary/10 border border-primary/15'
                    : 'text-muted-foreground hover:bg-muted/40 border border-transparent'
                )}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <Avatar
                    className={cn(
                      'w-10 h-10 transition-transform duration-200 ring-1',
                      isSelected ? 'ring-primary/30' : 'ring-border/50 group-hover:ring-border'
                    )}
                  >
                    <AvatarImage src={item.friend.avatar_url} className="object-cover" />
                    <AvatarFallback className="bg-muted text-xs text-muted-foreground font-medium">
                      {item.friend.username[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  {/* Status Indicator */}
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full ring-2 ring-card bg-card">
                    <span
                      className={cn(
                        'h-2 w-2 rounded-full transition-all duration-500',
                        showGreen && 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]',
                        showPurple && 'bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.5)]',
                        !showGreen && !showPurple && 'bg-muted-foreground/30'
                      )}
                    />
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span
                      className={cn(
                        'font-semibold text-sm truncate',
                        isSelected ? 'text-primary' : 'text-foreground'
                      )}
                    >
                      {item.friend.full_name || item.friend.username}
                    </span>
                    {/* Timestamp placeholder */}
                    <span className="text-[10px] text-muted-foreground/50 shrink-0 ml-2">
                      {showGreen ? 'Now' : ''}
                    </span>
                  </div>
                  <p className="text-[11px] truncate text-muted-foreground/60 mt-0.5">
                    {statusPreview}
                  </p>
                </div>

                {/* Online indicator dot on the right edge for selected */}
                {isSelected && showGreen && (
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                )}
              </Link>
            )
          })}
          {(!filteredFriends || filteredFriends.length === 0) && (
            <div className="py-10 text-center">
              <p className="text-xs text-muted-foreground/40">No conversations found.</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
