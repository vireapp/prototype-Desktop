'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'

interface RoomState {
  isActive: boolean
  roomId: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  roomData: any | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userData: any | null
  isDuo: boolean
  isMinimized: boolean
}

interface RoomContextType extends RoomState {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  startRoom: (roomId: string, roomData: any, userData: any, isDuo: boolean) => void
  endRoom: () => void
  minimizeRoom: () => void
  maximizeRoom: () => void
}

const RoomContext = createContext<RoomContextType | undefined>(undefined)

export function RoomProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<RoomState>({
    isActive: false,
    roomId: null,
    roomData: null,
    userData: null,
    isDuo: false,
    isMinimized: false
  })

  const startRoom = useCallback((roomId: string, roomData: any, userData: any, isDuo: boolean) => {
    setState({
      isActive: true,
      roomId,
      roomData,
      userData,
      isDuo,
      isMinimized: false
    })
  }, [])

  const endRoom = useCallback(() => {
    setState({
      isActive: false,
      roomId: null,
      roomData: null,
      userData: null,
      isDuo: false,
      isMinimized: false
    })
  }, [])

  const minimizeRoom = useCallback(() => {
    setState((prev) => ({ ...prev, isMinimized: true }))
  }, [])

  const maximizeRoom = useCallback(() => {
    setState((prev) => ({ ...prev, isMinimized: false }))
  }, [])

  return (
    <RoomContext.Provider value={{ ...state, startRoom, endRoom, minimizeRoom, maximizeRoom }}>
      {children}
    </RoomContext.Provider>
  )
}

export function useRoom() {
  const context = useContext(RoomContext)
  if (context === undefined) {
    throw new Error('useRoom must be used within a RoomProvider')
  }
  return context
}
