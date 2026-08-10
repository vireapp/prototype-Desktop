import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createClient } from '@/lib/supabase/client'
import { nativeNotify } from '@/lib/notifications'

export type NotificationType = 'friend_request' | 'message' | 'system' | 'mention' | 'invite' | 'activity' | 'ai' | 'inventory' | 'shop' | 'level_up'

export interface AppNotification {
  id: string
  title: string
  message: string
  type: NotificationType
  read: boolean
  link?: string
  metadata?: any
  createdAt: string
}

interface NotificationsState {
  notifications: AppNotification[]
  unreadCount: number
  isAppSilenced: boolean
  settings: {
    push: boolean
    email: boolean
    marketing: boolean
    sounds: boolean
    mentions: boolean
    roomEntry: boolean
    activityStarts: boolean
    inCallSilence: boolean
    friendOnline: boolean
    messagePreviews: boolean
    aiSuggestions: boolean
    systemStatus: boolean
    updateReady: boolean
    inventoryAlerts: boolean
    milestones: boolean
    shopDrops: boolean
    taskbarBadging: boolean
  }
  addNotification: (noti: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void
  setAppSilenced: (silenced: boolean) => void
  updateSettings: (settings: Partial<NotificationsState['settings']>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearAll: () => void
  initializeListeners: (userId: string) => void
  _hasInitializedListeners: boolean
}

const supabase = createClient()
let channel: ReturnType<typeof supabase.channel> | null = null

export const useNotifications = create<NotificationsState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      isAppSilenced: false,
      settings: {
        push: true,
        email: true,
        marketing: false,
        sounds: true,
        mentions: true,
        roomEntry: true,
        activityStarts: true,
        inCallSilence: true,
        friendOnline: true,
        messagePreviews: true,
        aiSuggestions: true,
        systemStatus: true,
        updateReady: true,
        inventoryAlerts: true,
        milestones: true,
        shopDrops: true,
        taskbarBadging: true
      },
      _hasInitializedListeners: false,

      addNotification: (noti) => {
        const id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15)
        const newNoti: AppNotification = {
          ...noti,
          id,
          read: false,
          createdAt: new Date().toISOString()
        }

        set((state) => {
          // Prevent exact duplicates within a short timeframe (last 10 items)
          const isDuplicate = state.notifications
            .slice(0, 10)
            .some((n) => n.title === noti.title && n.message === noti.message)

          if (isDuplicate) return state

          // Filter logic based on settings
          let shouldShowPush = state.settings.push
          
          if (noti.type === 'mention' && !state.settings.mentions) shouldShowPush = false
          if (noti.type === 'message' && !state.settings.push) shouldShowPush = false // Messages are primary push

          // Handle In-Call Silence
          if (state.isAppSilenced && state.settings.inCallSilence) {
            shouldShowPush = false
          }
          
          // Respect push notification setting
          if (shouldShowPush) {
            const displayMessage = state.settings.messagePreviews 
              ? noti.message 
              : 'You have a new message'

            nativeNotify({
              title: noti.title,
              body: displayMessage,
              playSound: state.settings.sounds,
              onClick: () => {
                // Navigation handle if link exists (needs to be handled by UI shell)
              }
            })

            // Handle taskbar badging if on desktop
            if (state.settings.taskbarBadging && window.api?.setBadgeCount) {
              window.api.setBadgeCount(state.unreadCount + 1)
            }
          }

          const newNotifications = [newNoti, ...state.notifications].slice(0, 100) // Keep last 100
          return {
            notifications: newNotifications,
            unreadCount: newNotifications.filter((n) => !n.read).length
          }
        })
      },

      setAppSilenced: (silenced) => {
        set({ isAppSilenced: silenced })
      },

      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings }
        }))
      },

      markAsRead: (id) => {
        set((state) => {
          const newNotifications = state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          )
          const unreadCount = newNotifications.filter((n) => !n.read).length
          
          // Update badge count
          if (state.settings.taskbarBadging && window.api?.setBadgeCount) {
            window.api.setBadgeCount(unreadCount)
          }

          return {
            notifications: newNotifications,
            unreadCount
          }
        })
      },

      markAllAsRead: () => {
        set((state) => {
          if (state.settings.taskbarBadging && window.api?.setBadgeCount) {
            window.api.setBadgeCount(0)
          }
          return {
            notifications: state.notifications.map((n) => ({ ...n, read: true })),
            unreadCount: 0
          }
        })
      },

      removeNotification: (id) => {
        set((state) => {
          const newNotifications = state.notifications.filter((n) => n.id !== id)
          const unreadCount = newNotifications.filter((n) => !n.read).length
          
          if (state.settings.taskbarBadging && window.api?.setBadgeCount) {
            window.api.setBadgeCount(unreadCount)
          }

          return {
            notifications: newNotifications,
            unreadCount
          }
        })
      },

      clearAll: () => {
        if (window.api?.setBadgeCount) window.api.setBadgeCount(0)
        set({ notifications: [], unreadCount: 0 })
      },

      initializeListeners: async (userId: string) => {
        if (get()._hasInitializedListeners) return
        set({ _hasInitializedListeners: true })

        // Fetch initial pending friend requests to sync state
        const { data: pendingRequests } = await supabase
          .from('friend_requests')
          .select('*, sender:profiles!sender_id(username)')
          .eq('receiver_id', userId)
          .eq('status', 'pending')

        if (pendingRequests) {
          pendingRequests.forEach((req: any) => {
            // add if it doesn't exist
            const existing = get().notifications.find((n) => n.metadata?.requestId === req.id)
            if (!existing) {
              get().addNotification({
                title: 'New Friend Request',
                message: `${req.sender?.username || 'Someone'} sent you a friend request.`,
                type: 'friend_request',
                link: '/dashboard/friends?tab=pending',
                metadata: { requestId: req.id }
              })
            }
          })
        }

        // Setup Realtime Listeners
        if (channel) {
          await supabase.removeChannel(channel)
        }

        channel = supabase
          .channel('global-notifications')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'friend_requests',
              filter: `receiver_id=eq.${userId}`
            },
            async (payload) => {
              // try to fetch sender username
              const senderId = payload.new.sender_id
              const { data: profile } = await supabase
                .from('profiles')
                .select('username')
                .eq('id', senderId)
                .single()

              get().addNotification({
                title: 'New Friend Request',
                message: `${profile?.username || 'Someone'} sent you a friend request!`,
                type: 'friend_request',
                link: '/dashboard/friends?tab=pending',
                metadata: { requestId: payload.new.id }
              })
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'direct_messages',
              filter: `receiver_id=eq.${userId}`
            },
            async (payload) => {
              const senderId = payload.new.sender_id
              const { data: profile } = await supabase
                .from('profiles')
                .select('username')
                .eq('id', senderId)
                .single()

              get().addNotification({
                title: 'New Message',
                message: `From ${profile?.username || 'Someone'}: ${payload.new.content}`,
                type: 'message',
                link: `/dashboard/messages`,
                metadata: { messageId: payload.new.id, senderId }
              })
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'friend_requests',
              filter: `receiver_id=eq.${userId}`
            },
            (payload) => {
              if (payload.new.status !== 'pending') {
                // Remove the notification if it exists (e.g., accepted or rejected elsewhere)
                const noti = get().notifications.find(
                  (n) => n.metadata?.requestId === payload.new.id
                )
                if (noti) get().removeNotification(noti.id)
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'DELETE',
              schema: 'public',
              table: 'friend_requests',
              filter: `receiver_id=eq.${userId}`
            },
            (payload) => {
              const noti = get().notifications.find((n) => n.metadata?.requestId === payload.old.id)
              if (noti) get().removeNotification(noti.id)
            }
          )
          .subscribe()
      }
    }),
    {
      name: 'vire-notifications',
      partialize: (state) => ({
        // Strip message body from persisted notifications to avoid plaintext storage of message content.
        // Message-type notifications lose their body; all other types keep their title/message (non-sensitive).
        notifications: state.notifications.map((n) => ({
          ...n,
          message: n.type === 'message' ? '' : n.message
        })),
        unreadCount: state.unreadCount,
        settings: state.settings
      })
    }
  )
)
