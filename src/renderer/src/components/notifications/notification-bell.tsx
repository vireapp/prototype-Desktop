'use client'

import { useEffect, useState } from 'react'
import { Bell, UserPlus, MessageSquare, Info, Check, Trash2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useNavigate } from 'react-router-dom'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useNotifications, AppNotification } from '@/stores/use-notifications'
import { ScrollArea } from '@/components/ui/scroll-area'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'

export function NotificationBell() {
  const {
    notifications,
    unreadCount,
    initializeListeners,
    markAsRead,
    markAllAsRead,
    removeNotification
  } = useNotifications()

  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  const supabase = createClient()

  useEffect(() => {
    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        initializeListeners(user.id)
      }
    }
    setup()
  }, [initializeListeners, supabase])

  const handleNotificationClick = (noti: AppNotification) => {
    markAsRead(noti.id)
    if (noti.link) {
      navigate(noti.link)
      setIsOpen(false)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'friend_request':
        return <UserPlus className="w-4 h-4 text-emerald-500" />
      case 'message':
        return <MessageSquare className="w-4 h-4 text-blue-500" />
      default:
        return <Info className="w-4 h-4 text-purple-500" />
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-foreground/70 hover:text-foreground hover:bg-accent/10 transition-colors"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-background"></span>
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-80 sm:w-96 p-0 border border-border shadow-2xl bg-card rounded-xl overflow-hidden"
        align="end"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm">Notifications</h4>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold">
                {unreadCount} new
              </span>
            )}
          </div>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => markAllAsRead()}
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              Mark all read
            </Button>
          )}
        </div>

        {/* List */}
        <ScrollArea className="h-[350px]">
          <div className="p-2 flex flex-col gap-1">
            <AnimatePresence initial={false}>
              {notifications.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Bell className="w-5 h-5 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-medium text-foreground">You're all caught up</p>
                  <p className="text-xs text-muted-foreground mt-1">No new notifications here.</p>
                </motion.div>
              ) : (
                notifications.map((noti) => (
                  <motion.div
                    key={noti.id}
                    layout
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className={`relative group flex gap-3 p-3 rounded-lg cursor-pointer transition-all hover:bg-muted/50 ${!noti.read ? 'bg-primary/5' : ''}`}
                    onClick={() => handleNotificationClick(noti)}
                  >
                    {!noti.read && (
                      <span className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                    )}

                    <div className="flex-shrink-0 mt-0.5 w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center shadow-sm">
                      {getIcon(noti.type)}
                    </div>

                    <div className="flex-1 min-w-0 pr-6">
                      <p
                        className={`text-sm tracking-tight ${!noti.read ? 'font-semibold text-foreground' : 'font-medium text-foreground/80'}`}
                      >
                        {noti.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-snug">
                        {noti.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1.5 font-medium">
                        {noti.createdAt ? formatDistanceToNow(new Date(noti.createdAt), { addSuffix: true }) : 'Just now'}
                      </p>
                    </div>

                    <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!noti.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-primary hover:bg-primary/10"
                          onClick={(e) => {
                            e.stopPropagation()
                            markAsRead(noti.id)
                          }}
                          title="Mark as read"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeNotification(noti.id)
                        }}
                        title="Delete notification"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
