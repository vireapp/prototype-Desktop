'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import {
  Tv,
  PenTool,
  LayoutGrid,
  Bot,
  Music2,
  ListTodo,
  Monitor,
  Gamepad2,
  StickyNote,
  Sparkles,
  MonitorUp,
  BarChart2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ActivityType } from './room-navigation'

interface RoomHomeOverlayProps {
  onSelectActivity: (activity: ActivityType) => void
  userName?: string
  isRoomPublic?: boolean
  onOpenPolls?: () => void
}

// Floating particle component
function FloatingParticle({
  delay,
  duration,
  size,
  x,
  y,
  driftX
}: {
  delay: number
  duration: number
  size: number
  x: number
  y: number
  driftX: number
}) {
  return (
    <motion.div
      className="absolute rounded-full bg-foreground/10 blur-sm"
      style={{ width: size, height: size, left: `${x}%`, top: `${y}%` }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 0.6, 0],
        scale: [0.5, 1, 0.5],
        y: [0, -30, 0],
        x: [0, driftX, 0]
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    />
  )
}

export function RoomHomeOverlay({
  onSelectActivity,
  userName,
  isRoomPublic = false,
  onOpenPolls
}: RoomHomeOverlayProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  // Track mouse for subtle parallax
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePosition({
      x: (e.clientX - rect.left - rect.width / 2) / rect.width,
      y: (e.clientY - rect.top - rect.height / 2) / rect.height
    })
  }

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
        delayChildren: 0.15
      }
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.3, ease: 'easeInOut' as const }
    }
  }

  const itemVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 30,
      scale: 0.9,
      rotateX: -15
    },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      rotateX: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 400,
        damping: 25,
        mass: 0.8
      }
    }
  }

  const headerVariants: Variants = {
    hidden: { opacity: 0, y: -20, filter: 'blur(10px)' },
    show: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 30,
        delay: 0.1
      }
    }
  }

  const apps = [
    {
      id: 'media',
      title: 'Watch Together',
      desc: 'YouTube & Streams',
      icon: Monitor,
      color: 'rgba(59, 130, 246, 1)',
      span: 'col-span-2 row-span-2'
    },
    {
      id: 'virtual_tv',
      title: 'Virtual TV',
      desc: 'Live 24/7 Channels',
      icon: Tv,
      color: 'rgba(99, 102, 241, 1)',
      span: 'col-span-1 row-span-2'
    },
    {
      id: 'whiteboard',
      title: 'Canvas',
      desc: 'Collaborative Board',
      icon: PenTool,
      color: 'rgba(245, 158, 11, 1)',
      span: 'col-span-1 row-span-1'
    },
    {
      id: 'polls',
      title: 'Polls',
      desc: 'Vote & Decide',
      icon: BarChart2,
      color: 'rgba(244, 63, 94, 1)',
      span: 'col-span-1 row-span-1'
    },
    {
      id: 'games',
      title: 'Arcade',
      desc: 'Multiplayer Games',
      icon: Gamepad2,
      color: 'rgba(168, 85, 247, 1)',
      span: 'col-span-2 row-span-1'
    },
    {
      id: 'notes',
      title: 'Notes',
      desc: 'Shared Docs',
      icon: StickyNote,
      color: 'rgba(20, 184, 166, 1)',
      span: 'col-span-1 row-span-1'
    },
    {
      id: 'tasks',
      title: 'Tasks',
      desc: 'Project Management',
      icon: ListTodo,
      color: 'rgba(16, 185, 129, 1)',
      span: 'col-span-1 row-span-1'
    },
    {
      id: 'music',
      title: 'Music',
      desc: 'Radio & Lo-Fi',
      icon: Music2,
      color: 'rgba(236, 72, 153, 1)',
      span: 'col-span-1 row-span-1'
    },
    {
      id: 'screen_share',
      title: 'Screen Share',
      desc: 'Share Your Screen',
      icon: MonitorUp,
      color: 'rgba(249, 115, 22, 1)',
      span: 'col-span-1 row-span-1'
    }
  ].filter((app) => !(app.id === 'virtual_tv' && isRoomPublic))

  const [particles, setParticles] = useState<
    {
      id: number
      delay: number
      duration: number
      size: number
      x: number
      y: number
      driftX: number
    }[]
  >([])

  useEffect(() => {
    queueMicrotask(() => {
      setParticles(
        Array.from({ length: 12 }, (_, i) => ({
          id: i,
          delay: i * 0.5,
          duration: 4 + Math.random() * 2,
          size: 4 + Math.random() * 8,
          x: Math.random() * 100,
          y: Math.random() * 100,
          driftX: Math.random() * 20 - 10
        }))
      )
    })
  }, [])

  return (
    <motion.div
      className="absolute inset-0 z-10 flex flex-col items-center p-8 md:p-12 overflow-y-auto bg-black/60 backdrop-blur-3xl"
      variants={container}
      initial="hidden"
      animate="show"
      exit="exit"
      onMouseMove={handleMouseMove}
    >
      {/* Organic Background */}
      {/* Crisp subtle texture overlay instead of heavy noise */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02]" />

      <div className="w-full max-w-6xl flex flex-col items-center relative z-10">
        {/* Header */}
        <motion.div variants={headerVariants} className="text-left w-full max-w-5xl mb-12 space-y-3">
          <motion.div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-semibold tracking-widest uppercase mb-2"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
          >
            <Sparkles className="w-3 h-3" />
            <span>Dashboard</span>
          </motion.div>

          <h1 className="text-4xl md:text-6xl font-medium tracking-tight text-white/90">
            {userName ? `Welcome, ${userName}.` : 'Welcome.'}
          </h1>
          <p className="text-base text-white/50 font-light max-w-md">
            Select an app to begin your collaborative session over a secure connection.
          </p>
        </motion.div>

        {/* Grid */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-5xl pb-24 md:pb-0"
          variants={container}
        >
          {apps.map((app) => (
            <motion.button
              key={app.id}
              variants={itemVariants}
              onHoverStart={() => setHoveredId(app.id)}
              onHoverEnd={() => setHoveredId(null)}
              onClick={() => {
                if (app.id === 'polls' && onOpenPolls) {
                  onOpenPolls()
                } else {
                  onSelectActivity(app.id as ActivityType)
                }
              }}
              className={cn(
                'group relative flex flex-col justify-between p-6 rounded-3xl transition-all duration-300',
                'bg-white/5 border border-white/10 overflow-hidden hover:bg-white/10',
                app.span
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Subtle accent glow */}
              <div
                className="absolute top-0 right-0 w-32 h-32 opacity-20 transition-opacity duration-500 rounded-full blur-3xl pointer-events-none"
                style={{
                  backgroundColor: app.color,
                  opacity: hoveredId === app.id ? 0.4 : 0.1,
                  transform: 'translate(30%, -30%)'
                }}
              />

              <div className="flex items-start justify-between w-full">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center border border-white/10 bg-black/40 shadow-inner"
                  style={{ color: app.color }}
                >
                  <app.icon className="w-6 h-6 z-10" />
                </div>
              </div>

              <div className="mt-8 text-left">
                <h3 className="text-xl font-medium text-white/90 mb-1">
                  {app.title}
                </h3>
                <p className="text-sm text-white/50 font-light">
                  {app.desc}
                </p>
              </div>
            </motion.button>
          ))}
        </motion.div>
      </div>
    </motion.div>
  )
}
