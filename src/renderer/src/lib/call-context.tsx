'use client'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { createContext, useContext, useState, useCallback, useRef } from 'react'

type CallType = 'video' | 'voice'

interface CallState {
  isActive: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  friend: any | null
  type: CallType | null
  isMinimized: boolean
}

interface CallContextType extends CallState {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  startCall: (friend: any, type: CallType) => void
  endCall: () => void
  toggleMinimize: () => void
  setIsMinimized: (value: boolean) => void
}

const CallContext = createContext<CallContextType | undefined>(undefined)

export function CallProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CallState>({
    isActive: false,
    friend: null,
    type: null,
    isMinimized: false
  })

  // We can filter double-invocations if needed, but simple state set is fine.

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const startCall = useCallback((friend: any, type: CallType) => {
    console.log('[CallContext] Starting call with:', friend.username, type)
    setState({
      isActive: true,
      friend,
      type,
      isMinimized: false
    })
  }, [])

  const endCall = useCallback(() => {
    console.log('[CallContext] Ending call')
    setState((prev) => ({ ...prev, isActive: false, friend: null, type: null }))
  }, [])

  const toggleMinimize = useCallback(() => {
    setState((prev) => ({ ...prev, isMinimized: !prev.isMinimized }))
  }, [])

  const setIsMinimized = useCallback((value: boolean) => {
    setState((prev) => ({ ...prev, isMinimized: value }))
  }, [])

  return (
    <CallContext.Provider value={{ ...state, startCall, endCall, toggleMinimize, setIsMinimized }}>
      {children}
    </CallContext.Provider>
  )
}

export function useCall() {
  const context = useContext(CallContext)
  if (context === undefined) {
    throw new Error('useCall must be used within a CallProvider')
  }
  return context
}
