'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, LayoutGrid, Users, Music2, Home, Bot } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RoomMobileDockProps {
  unreadCount?: number
  activeTab: 'none' | 'chat' | 'activities' | 'people' | 'music' | 'menu' | 'ai'
  onTabChange: (tab: 'none' | 'chat' | 'activities' | 'people' | 'music' | 'menu' | 'ai') => void
}

export function RoomMobileDock({ unreadCount = 0, activeTab, onTabChange }: RoomMobileDockProps) {
  const [pressedTab, setPressedTab] = useState<string | null>(null)

  const tabs = [
    { id: 'home', icon: Home, label: 'Home', color: 'from-white/20 to-white/10' },
    {
      id: 'chat',
      icon: MessageSquare,
      label: 'Chat',
      color: 'from-indigo-500/30 to-indigo-600/20'
    },
    { id: 'ai', icon: Bot, label: 'AI', color: 'from-rose-500/30 to-rose-600/20' },
    {
      id: 'activities',
      icon: LayoutGrid,
      label: 'Apps',
      color: 'from-purple-500/30 to-purple-600/20'
    },
    { id: 'music', icon: Music2, label: 'Music', color: 'from-pink-500/30 to-pink-600/20' },
    { id: 'people', icon: Users, label: 'People', color: 'from-orange-500/30 to-orange-600/20' }
  ] as const

  const handleTabPress = (tabId: string) => {
    setPressedTab(tabId)
    setTimeout(() => setPressedTab(null), 150)

    const isHome = tabId === 'home'
    const isActive = activeTab === tabId
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onTabChange(isHome ? 'none' : isActive ? 'none' : (tabId as any))
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[70] pointer-events-auto pb-safe px-3">
      {/* Floating Capsule Container */}
      <motion.div
        className="relative mx-auto max-w-md bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[28px] overflow-hidden"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 30,
          delay: 0.2
        }}
      >
        {/* Subtle Inner Highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

        {/* Active tab background blob */}
        <AnimatePresence>
          {activeTab !== 'none' && (
            <motion.div
              layoutId="dock-active-blob"
              className={cn(
                'absolute top-2 bottom-2 w-16 rounded-2xl bg-gradient-to-b',
                tabs.find((t) => t.id === activeTab)?.color || 'from-white/20 to-white/10'
              )}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              style={{
                left: `${tabs.findIndex((t) => t.id === activeTab) * (100 / tabs.length) + 100 / tabs.length / 2 - 8}%`,
                transform: 'translateX(-50%)'
              }}
            />
          )}
        </AnimatePresence>

        {/* Navigation Items */}
        <div className="relative flex items-center justify-around p-2 gap-1">
          {/* eslint-disable-next-line @typescript-eslint/no-unused-vars */}
          {tabs.map((tab, index) => {
            const isActive = activeTab === tab.id
            const isPressed = pressedTab === tab.id
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const isHome = tab.id === 'home'

            return (
              <motion.button
                key={tab.id}
                onClick={() => handleTabPress(tab.id)}
                suppressHydrationWarning
                className="group relative flex flex-col items-center justify-center w-14 h-14 rounded-2xl focus:outline-none"
                whileTap={{ scale: 0.9 }}
                animate={{
                  scale: isPressed ? 0.9 : 1
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              >
                {/* Haptic-style flash on press */}
                <AnimatePresence>
                  {isPressed && (
                    <motion.div
                      className="absolute inset-0 bg-white/30 rounded-2xl"
                      initial={{ opacity: 1 }}
                      animate={{ opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </AnimatePresence>

                {/* Icon Container */}
                <motion.div
                  className={cn(
                    'relative p-2.5 rounded-xl transition-colors duration-300',
                    isActive ? 'text-white' : 'text-white/40'
                  )}
                  animate={{
                    y: isActive ? -2 : 0,
                    scale: isActive ? 1.1 : 1
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                >
                  <motion.div
                    animate={{
                      rotate: isActive ? [0, -5, 5, 0] : 0
                    }}
                    transition={{
                      duration: 0.4,
                      ease: 'easeInOut',
                      delay: isActive ? 0.1 : 0
                    }}
                  >
                    <tab.icon
                      className={cn(
                        'w-5 h-5 transition-all duration-300',
                        isActive && 'drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]'
                      )}
                      fill={isActive ? 'currentColor' : 'none'}
                    />
                  </motion.div>

                  {/* Notification Badge */}
                  {tab.id === 'chat' && unreadCount > 0 && !isActive && (
                    <motion.div
                      className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-red-500 rounded-full flex items-center justify-center border-2 border-black"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    >
                      <span className="text-[9px] font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    </motion.div>
                  )}
                </motion.div>

                {/* Active indicator dot */}
                <motion.div
                  className="absolute bottom-1.5 w-1 h-1 rounded-full bg-white"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: isActive ? 1 : 0,
                    opacity: isActive ? 1 : 0
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                />

                {/* Label (shown on hover/focus for accessibility) */}
                <span className="sr-only">{tab.label}</span>
              </motion.button>
            )
          })}
        </div>

        {/* Bottom glow line */}
        <div className="absolute bottom-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </motion.div>
    </div>
  )
}
