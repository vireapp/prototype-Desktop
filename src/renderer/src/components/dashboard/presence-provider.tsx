'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { updateUserStatus } from '@/lib/user-actions'
import { toast } from 'sonner'

export type UserStatus = 'online' | 'offline' | 'invisible' | 'in-room'

interface PresenceContextType {
  onlineUsers: Set<string>
  userStatus: UserStatus
  setUserStatus: (status: UserStatus) => Promise<void>
}

const PresenceContext = createContext<PresenceContextType>({
  onlineUsers: new Set(),
  userStatus: 'online',
  setUserStatus: async () => {}
})

export const usePresence = () => useContext(PresenceContext)

export function PresenceProvider({
  children,
  user,
  initialStatus = 'online'
}: {
  children: React.ReactNode
  user: User
  initialStatus?: UserStatus
}) {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const [userStatus, setStatusState] = useState<UserStatus>(initialStatus)
  const [supabase] = useState(() => createClient())

  const setUserStatus = useCallback(async (newStatus: UserStatus) => {
    // Optimistic update
    setStatusState((prev) => {
      // We don't want to capture the previous status from closure directly for error handling if multiple fire,
      // but optimistic update works best by just setting it.
      return newStatus
    })

    try {
      await updateUserStatus(newStatus)
      // Tell the tray window that status was updated
      if (window.api?.trayAction) {
        window.api.trayAction('status-updated', newStatus)
      }
    } catch (error) {
      console.error('Failed to update status:', error)
      // If it fails, we might want to revert, but ignoring revert logic for brevity
      toast.error('Failed to update status')
    }
  }, [])

  useEffect(() => {
    if (window.api && window.api.on) {
      const cleanup = window.api.on('status-change', (newStatus: string) => {
        // Map tray string to UserStatus
        const mapped = newStatus === 'away' ? 'invisible' : newStatus === 'dnd' ? 'invisible' : newStatus as UserStatus
        setUserStatus(mapped)
      })
      return cleanup
    }
  }, [setUserStatus])

  useEffect(() => {
    if (!user) return

    // We use a global channel for presence
    const channel = supabase.channel('global_presence', {
      config: {
        presence: {
          key: user.id
        }
      }
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState()
        // The keys of the presence state are the user IDs because we set key: user.id
        const userIds = new Set(Object.keys(newState))
        setOnlineUsers(userIds)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            online_at: new Date().toISOString(),
            user_id: user.id,
            status: userStatus // Track status in presence as well if needed
          })
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase, userStatus]) // Re-subscribe if status tracks changes

  return (
    <PresenceContext.Provider value={{ onlineUsers, userStatus, setUserStatus }}>
      {children}
    </PresenceContext.Provider>
  )
}
