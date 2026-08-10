'use client'

import { useEffect, useRef } from 'react'
import { logActivity } from '@/lib/gamification'

const ACTIVITY_INTERVAL = 5 * 60 * 1000 // Check every 5 minutes
const IDLE_TIMEOUT = 2 * 60 * 1000 // 2 minutes to be considered idle

export function ActivityTracker(): null {
  const lastActivityRef = useRef(0)

  useEffect(() => {
    lastActivityRef.current = Date.now()
    const updateActivity = (): void => {
      lastActivityRef.current = Date.now()
    }

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']
    events.forEach((event) => window.addEventListener(event, updateActivity))

    // Periodic check
    const interval = setInterval(() => {
      const now = Date.now()
      if (now - lastActivityRef.current < IDLE_TIMEOUT) {
        // User is active
        logActivity().catch(console.error)
      }
    }, ACTIVITY_INTERVAL)

    // Initial log
    logActivity().catch(console.error)

    return () => {
      events.forEach((event) => window.removeEventListener(event, updateActivity))
      clearInterval(interval)
    }
  }, [])

  return null
}
