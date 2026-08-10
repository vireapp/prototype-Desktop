import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Bell, UserPlus, MessageSquare, ArrowUpRight, Check, CheckCheck, Play, Sparkles, Package, ShoppingBag, Trophy, X } from 'lucide-react'
import { useNotifications, AppNotification } from '@/stores/use-notifications'
import { formatDistanceToNow } from 'date-fns'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { acceptFriendRequest, rejectFriendRequest } from '@/components/friends/actions'
import { toast } from 'sonner'

const TYPE_CONFIG: Record<
  AppNotification['type'] | 'activity' | 'ai' | 'inventory' | 'shop' | 'level_up',
  { icon: React.ReactNode; color: string; bg: string }
> = {
  friend_request: {
    icon: <UserPlus className="w-3.5 h-3.5" />,
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-100 dark:bg-violet-500/15',
  },
  message: {
    icon: <MessageSquare className="w-3.5 h-3.5" />,
    color: 'text-sky-600 dark:text-sky-400',
    bg: 'bg-sky-100 dark:bg-sky-500/15',
  },
  mention: {
    icon: <Bell className="w-3.5 h-3.5" />,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-500/15',
  },
  invite: {
    icon: <ArrowUpRight className="w-3.5 h-3.5" />,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-100 dark:bg-emerald-500/15',
  },
  activity: {
    icon: <Play className="w-3.5 h-3.5" />,
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-100 dark:bg-rose-500/15',
  },
  ai: {
    icon: <Sparkles className="w-3.5 h-3.5" />,
    color: 'text-fuchsia-600 dark:text-fuchsia-400',
    bg: 'bg-fuchsia-100 dark:bg-fuchsia-500/15',
  },
  inventory: {
    icon: <Package className="w-3.5 h-3.5" />,
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-100 dark:bg-orange-500/15',
  },
  shop: {
    icon: <ShoppingBag className="w-3.5 h-3.5" />,
    color: 'text-pink-600 dark:text-pink-400',
    bg: 'bg-pink-100 dark:bg-pink-500/15',
  },
  level_up: {
    icon: <Trophy className="w-3.5 h-3.5" />,
    color: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-100 dark:bg-yellow-500/15',
  },
  system: {
    icon: <Bell className="w-3.5 h-3.5" />,
    color: 'text-muted-foreground',
    bg: 'bg-muted',
  },
}

export function NotificationsWidget() {
  const supabase = createClient()
  const navigate = useNavigate()
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification } = useNotifications()
  const [userId, setUserId] = useState<string | null>(null)
  const initialized = useRef(false)

  const handleAcceptFriend = async (notiId: string, requestId: string) => {
    const res = await acceptFriendRequest(requestId)
    if (res.error) {
      toast.error(res.error)
    } else {
      markAsRead(notiId)
      toast.success('Friend request accepted!')
    }
  }

  const handleDeclineFriend = async (notiId: string, requestId: string) => {
    const res = await rejectFriendRequest(requestId)
    if (res.error) {
      toast.error(res.error)
    } else {
      removeNotification(notiId)
      toast.success('Friend request declined')
    }
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user && !initialized.current) {
        initialized.current = true
        setUserId(user.id)
        useNotifications.getState().initializeListeners(user.id)
      }
    })
  }, [supabase])

  // Show most recent 6 notifications
  const recent = notifications.slice(0, 6)

  return (
    <div className="rounded-xl overflow-hidden flex flex-col h-full bg-card border border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center">
            <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center shadow">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider leading-none">Notifications</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted border border-transparent hover:border-border"
          >
            <CheckCheck className="w-3 h-3" />
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center h-full">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl scale-150 animate-pulse" />
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center shadow-inner">
                <Bell className="w-8 h-8 text-primary/40" strokeWidth={1.5} />
                <div className="absolute top-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-card" />
              </div>
            </div>
            <h4 className="text-base font-semibold text-foreground tracking-tight">All Caught Up</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-[200px] leading-relaxed">
              No new notifications at the moment. We'll let you know when something pops up.
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {recent.map((noti, i) => {
              const cfg = TYPE_CONFIG[noti.type] || TYPE_CONFIG.system
              return (
                <motion.div
                  key={noti.id}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.25 }}
                  className={`group flex items-start gap-3 px-3 py-2.5 rounded-xl border transition-colors cursor-pointer ${
                    !noti.read
                      ? 'bg-primary/3 border-primary/10 hover:bg-primary/5'
                      : 'border-transparent hover:bg-muted/60 hover:border-border'
                  }`}
                  onClick={() => {
                    markAsRead(noti.id)
                    if (noti.link) navigate(noti.link)
                  }}
                >
                  <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-0.5 ${cfg.bg} ${cfg.color}`}>
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold leading-tight ${!noti.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {noti.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                      {noti.message}
                    </p>
                    
                    {/* Quick Actions for Friend Requests */}
                    {noti.type === 'friend_request' && !noti.read && (
                      <div className="flex items-center gap-2 mt-3">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAcceptFriend(noti.id, noti.metadata.requestId)
                          }}
                          className="px-3 py-1 rounded-lg bg-primary text-primary-foreground text-[10px] font-bold hover:opacity-90 transition-opacity"
                        >
                          Accept
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeclineFriend(noti.id, noti.metadata.requestId)
                          }}
                          className="px-3 py-1 rounded-lg bg-muted border border-border text-muted-foreground text-[10px] font-bold hover:text-foreground transition-colors"
                        >
                          Decline
                        </button>
                      </div>
                    )}

                    <p className="text-[9px] text-muted-foreground/60 mt-2 font-medium uppercase tracking-wider">
                      {formatDistanceToNow(new Date(noti.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {!noti.read && (
                    <div className="shrink-0 w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
