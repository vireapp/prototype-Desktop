'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export function RetroBackground() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    queueMicrotask(() => {
      setMounted(true)
    })
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-background pointer-events-none transition-colors duration-300">
      {/* Sun/Glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-purple-900/30 to-transparent dark:from-purple-900/30 dark:to-transparent from-purple-500/10 to-transparent rounded-full blur-[100px] opacity-50"
        style={{
          transform: `translate(-50%, ${mousePosition.y * 20}px)`
        }}
      />

      {/* Grid container with perspective */}
      <div
        className="absolute inset-0 flex items-center justify-center perspective-1000"
        style={{
          transform: 'perspective(100vh) rotateX(60deg) translateY(-100px) scale(2)',
          transformStyle: 'preserve-3d'
        }}
      >
        {/* Moving Grid */}
        <div className="absolute inset-[-100%] bg-[linear-gradient(to_right,rgba(128,0,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(128,0,255,0.1)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(128,0,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(128,0,255,0.1)_1px,transparent_1px)] bg-[linear-gradient(to_right,rgba(128,0,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(128,0,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] animate-grid-flow" />

        {/* Horizontal glowing lines for speed effect */}
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_40%,var(--background)_100%)] z-10" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0">
        {mounted && [...Array(20)].map((_, i) => <Particle key={i} />)}
      </div>

      {/* Scanline overlay for CRT feel */}
      <div className="absolute inset-0 z-50 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.05)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[size:100%_2px,3px_100%] opacity-20" />

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,var(--background)_100%)] z-40 opacity-60" />
    </div>
  )
}

function Particle() {
  const [config, setConfig] = useState<{
    x1: string
    y1: string
    y2: string
    op1: number
    op2: number
    dur: number
  } | null>(null)

  useEffect(() => {
    queueMicrotask(() => {
      setConfig({
        x1: Math.random() * 100 + '%',
        y1: Math.random() * 100 + '%',
        y2: Math.random() * 100 + '%',
        op1: Math.random() * 0.5 + 0.1,
        op2: Math.random() * 0.5 + 0.1,
        dur: Math.random() * 10 + 10
      })
    })
  }, [])

  if (!config) return null

  return (
    <motion.div
      className="absolute w-1 h-1 bg-foreground/20 rounded-full"
      initial={{
        x: config.x1,
        y: config.y1,
        opacity: config.op1
      }}
      animate={{
        y: [null, config.y2],
        opacity: [null, config.op2]
      }}
      transition={{
        duration: config.dur,
        repeat: Infinity,
        ease: 'linear'
      }}
    />
  )
}
