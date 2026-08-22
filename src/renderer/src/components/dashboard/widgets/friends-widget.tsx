import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MessageSquare, UserPlus, ArrowUpRight, Users } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { usePresence } from '@/components/dashboard/presence-provider'

interface Friend {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  status: string | null
}

const STATUS_DOT: Record<string, string> = {
  online: 'bg-emerald-500',
  'in-room': 'bg-violet-500',
  invisible: 'bg-zinc-400',
  offline: 'bg-zinc-300 dark:bg-zinc-600',
}

const STATUS_LABEL: Record<string, string> = {
  online: 'Online',
  'in-room': 'In a Room',
  invisible: 'Away',
  offline: 'Offline',
}

export function FriendsWidget() {
  const supabase = createClient()
  const navigate = useNavigate()
  const { onlineUsers } = usePresence()
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: friendRows } = await supabase
        .from('friends_view')
        .select('friend_id')

      if (!friendRows || friendRows.length === 0) {
        setLoading(false)
        return
      }

      const ids = friendRows.map((r: { friend_id: string }) => r.friend_id)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, status')
        .in('id', ids)
        .order('username')

      if (profiles) setFriends(profiles)
      setLoading(false)
    }
    load()
  }, [supabase])

  // Sort: online first, then in-room, then others
  const sorted = [...friends].sort((a, b) => {
    const aActual = onlineUsers.has(a.id) ? (a.status || 'online') : 'offline'
    const bActual = onlineUsers.has(b.id) ? (b.status || 'online') : 'offline'
    const order = ['online', 'in-room', 'invisible', 'offline']
    return (order.indexOf(aActual) ?? 999) - (order.indexOf(bActual) ?? 999)
  })

  const onlineCount = friends.filter(f => onlineUsers.has(f.id) && f.status !== 'invisible').length

  return (
    <div className="rounded-xl overflow-hidden flex flex-col h-full bg-card border border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 shrink-0 border-b border-white/[0.04]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: 'rgba(var(--primary-rgb), 0.1)' }}>
            <Users className="w-3.5 h-3.5 text-primary" />
          </div>
          <div>
            <h3 className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider leading-none">Friends</h3>
            {!loading && onlineCount > 0 && (
              <p className="text-[10px] font-medium mt-0.5" style={{ color: 'rgb(52, 211, 153)' }}>
                {onlineCount} online
              </p>
            )}
            {!loading && onlineCount === 0 && (
              <p className="text-[10px] text-muted-foreground/50 mt-0.5">Everyone's away</p>
            )}
          </div>
        </div>
        <Link
          to="/dashboard/friends"
          className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-foreground transition-all"
          style={{ ':hover': { background: 'rgba(255,255,255,0.04)' } } as React.CSSProperties}
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-border border-t-primary rounded-full animate-spin" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Users className="w-5 h-5 text-muted-foreground/40" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">No friends yet</p>
              <Link to="/community" className="text-xs text-primary hover:underline mt-0.5 block">
                Discover people →
              </Link>
            </div>
          </div>
        ) : (
          <AnimatePresence>
            {sorted.map((friend, i) => {
              const isActuallyOnline = onlineUsers.has(friend.id)
              const displayStatus = isActuallyOnline ? (friend.status || 'online') : 'offline'
              
              const isOnline = displayStatus === 'online' || displayStatus === 'in-room'
              const dotColor = STATUS_DOT[displayStatus] || STATUS_DOT.offline
              const statusLabel = STATUS_LABEL[displayStatus] || STATUS_LABEL.offline

              return (
                <motion.div
                  key={friend.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.25 }}
                  className="group flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors cursor-pointer"
                  style={{ ':hover': { background: 'rgba(255,255,255,0.035)' } } as React.CSSProperties}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <Avatar className="w-8 h-8 border border-border">
                        <AvatarImage src={friend.avatar_url || ''} className="object-cover" />
                        <AvatarFallback className="text-xs bg-muted text-muted-foreground font-medium">
                          {friend.username?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card ${dotColor}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate leading-none">{friend.username}</p>
                      <p className={`text-[10px] mt-0.5 truncate ${isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                        {statusLabel}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/dashboard/messages')}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary"
                    title="Message"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Footer CTA */}
      <div className="px-5 py-3 shrink-0 border-t border-white/[0.04]">
        <Link
          to="/dashboard/friends?tab=pending"
          className="flex items-center gap-2 text-xs font-medium text-muted-foreground/50 hover:text-foreground transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Add Friends
        </Link>
      </div>
    </div>
  )
}
