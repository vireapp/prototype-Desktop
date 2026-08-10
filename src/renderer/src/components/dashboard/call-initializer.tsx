'use client'

import { useEffect } from 'react'
import { useCall } from '@/lib/call-context'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useNavigate } from 'react-router-dom'

interface CallInitializerProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  friend: any
  type: 'video' | 'voice'
}

export function CallInitializer({ friend, type }: CallInitializerProps): null {
  const { startCall, isActive, friend: currentFriend } = useCall()
  const navigate = useNavigate()

  useEffect(() => {
    // Prevent duplicate initiation if already active with same friend
    if (isActive && currentFriend?.id === friend.id) {
      console.log('[CallInitializer] Call already active with this friend. Ignoring.')
      return
    }

    console.log('[CallInitializer] Initializing call via URL params')
    startCall(friend, type)

    // CRITICAL FIX: Remove the 'call' param from URL so we don't auto-reconnect
    // when the user hangs up (which sets isActive=false, triggering this effect again).
    // We replace the URL with the clean version (just username).
    const newParams = new URLSearchParams(window.location.search)
    newParams.delete('call')
    // Keep username active so chat stays open
    navigate(`/dashboard/messages?${newParams.toString()}`, { replace: true })
  }, [friend, type, startCall, isActive, currentFriend, navigate])

  return null // This component renders nothing
}
