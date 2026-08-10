'use client'

import { motion, useMotionValue, useSpring, MotionValue } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

export function OrbitalBackground() {
  const [mounted, setMounted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Mouse position for interactive subtle parallax
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  // Smooth out the mouse movement
  const springConfig = { damping: 25, stiffness: 700 }
  const springX = useSpring(mouseX, springConfig)
  const springY = useSpring(mouseY, springConfig)

  useEffect(() => {
    queueMicrotask(() => {
      setMounted(true)
    })

    const handleMouseMove = (e: MouseEvent) => {
      // Avoid errors if window is not defined (SSR)
      if (typeof window === 'undefined') return

      const { innerWidth, innerHeight } = window
      const x = e.clientX / innerWidth
      const y = e.clientY / innerHeight

      mouseX.set(x)
      mouseY.set(y)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY])

  if (!mounted) return null

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-0 overflow-hidden bg-[#0A0A0B] pointer-events-none"
    >
      {/* 1. Deep Space Gradient Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#1a103c_0%,#000000_100%)] opacity-80" />

      {/* 2. Animated Nebula Effects */}
      <motion.div
        className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-900/10 blur-[120px]"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-blue-900/10 blur-[150px]"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />

      {/* 3. Orbital Rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Inner Ring */}
        <div className="absolute w-[60vh] h-[60vh] rounded-full border border-white/[0.03] animate-spin-slow-reverse" />

        {/* Middle Ring */}
        <div className="absolute w-[90vh] h-[90vh] rounded-full border border-white/[0.02] border-dashed animate-spin-slow" />

        {/* Outer Ring */}
        <div className="absolute w-[120vh] h-[120vh] rounded-full border border-white/[0.02] animate-spin-slower" />
      </div>

      {/* 4. Floating Particles (Stars/Nodes) */}
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <Particle key={i} index={i} />
        ))}
      </div>

      {/* 5. Grid Overlay for depth */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]"
        style={{
          maskImage: 'radial-gradient(circle at center, transparent 30%, black 100%)'
        }}
      />
    </div>
  )
}

function Particle({ index }: { index: number }) {
  const [config, setConfig] = useState<{
    randomX: number
    randomY: number
    size: number
    duration: number
    delay: number
  } | null>(null)

  useEffect(() => {
    queueMicrotask(() => {
      setConfig({
        randomX: Math.random() * 100,
        randomY: Math.random() * 100,
        size: Math.random() * 2 + 1,
        duration: Math.random() * 20 + 10,
        delay: Math.random() * 5
      })
    })
  }, [])

  if (!config) return null

  return (
    <motion.div
      className={cn(
        'absolute rounded-full bg-white',
        index % 3 === 0
          ? 'bg-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.4)]'
          : index % 3 === 1
            ? 'bg-blue-200 shadow-[0_0_10px_rgba(59,130,246,0.4)]'
            : 'bg-white shadow-[0_0_5px_rgba(255,255,255,0.3)]'
      )}
      style={{
        left: `${config.randomX}%`,
        top: `${config.randomY}%`,
        width: config.size,
        height: config.size
      }}
      animate={{
        y: [0, -30, 0],
        opacity: [0.2, 0.8, 0.2],
        scale: [1, 1.5, 1]
      }}
      transition={{
        duration: config.duration,
        repeat: Infinity,
        delay: config.delay,
        ease: 'linear'
      }}
    />
  )
}
