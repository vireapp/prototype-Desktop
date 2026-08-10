'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

type AIStatus = 'online' | 'thinking' | 'error'
type AIMode = 'panel' | 'fullpage'

interface AIContextType {
  isOpen: boolean
  setIsOpen: (value: boolean) => void
  mode: AIMode
  setMode: (value: AIMode) => void
  status: AIStatus
  setStatus: (value: AIStatus) => void
  /** Toggle AI panel open/closed */
  togglePanel: () => void
  /** Open in fullpage mode (navigate to /dashboard/ai) */
  openFullPage: () => void
}

const AIContext = createContext<AIContextType | undefined>(undefined)

export function AIContextProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<AIMode>('panel')
  const [status, setStatus] = useState<AIStatus>('online')

  const togglePanel = () => {
    setMode('panel')
    setIsOpen((prev) => !prev)
  }

  const openFullPage = () => {
    setMode('fullpage')
    setIsOpen(true)
  }

  return (
    <AIContext.Provider value={{ isOpen, setIsOpen, mode, setMode, status, setStatus, togglePanel, openFullPage }}>
      {children}
    </AIContext.Provider>
  )
}

export function useAI() {
  const context = useContext(AIContext)
  if (context === undefined) {
    throw new Error('useAI must be used within an AIContextProvider')
  }
  return context
}
