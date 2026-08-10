'use client'

import { useEffect } from 'react'
import { useCall } from '@/lib/call-context'
import { useNotifications } from '@/stores/use-notifications'

/**
 * Automatically manages notification silence based on app state (e.g., active calls)
 */
export function NotificationSilenceManager() {
  const { isActive } = useCall()
  const { setAppSilenced } = useNotifications()

  useEffect(() => {
    setAppSilenced(isActive)
    
    if (isActive) {
      console.log('[SilenceManager] Notifications silenced due to active call')
    }
  }, [isActive, setAppSilenced])

  return null // Headless component
}
