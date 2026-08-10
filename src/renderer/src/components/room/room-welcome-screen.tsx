'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles, Volume2, Zap } from 'lucide-react'

interface RoomWelcomeScreenProps {
  roomName: string
  userName: string
  onEnter: () => void
}

// Tiny star dot
function Star({ x, y, size, opacity }: { x: number; y: number; size: number; opacity: number }) {
  return (
    <div
      className="absolute rounded-full bg-white"
      style={{ left: `${x}%`, top: `${y}%`, width: size, height: size, opacity }}
    />
  )
}

// Rising particle
function Particle({
  delay,
  size,
  x,
  duration,
  xOffset
}: {
  delay: number
  size: number
  x: number
  duration: number
  xOffset: number
}) {
  return (
    <motion.div
      className="absolute rounded-full bg-primary/30 blur-[1px]"
      style={{ width: size, height: size, left: `${x}%`, bottom: '-5%' }}
      initial={{ y: 0, opacity: 0 }}
      animate={{ y: [-10, -350], opacity: [0, 0.6, 0], x: [0, xOffset] }}
      transition={{ duration, delay, repeat: Infinity, ease: 'easeOut' }}
    />
  )
}

export function RoomWelcomeScreen({ roomName, userName, onEnter }: RoomWelcomeScreenProps) {
  const [isHovering, setIsHovering] = useState(false)
  const [nodeCount] = useState(() => Math.floor(Math.random() * 10 + 15))
  const [particles, setParticles] = useState<
    { id: number; delay: number; size: number; x: number; duration: number; xOffset: number }[]
  >([])
  const [stars, setStars] = useState<
    { id: number; x: number; y: number; size: number; opacity: number }[]
  >([])

  useEffect(() => {
    queueMicrotask(() => {
      setParticles(
        Array.from({ length: 20 }, (_, i) => ({
          id: i,
          delay: i * 0.4,
          size: 2 + Math.random() * 3,
          x: Math.random() * 100,
          duration: 5 + Math.random() * 3,
          xOffset: Math.random() * 50 - 25
        }))
      )
      setStars(
        Array.from({ length: 80 }, (_, i) => ({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() < 0.3 ? 2 : 1,
          opacity: 0.1 + Math.random() * 0.5
        }))
      )
    })
  }, [])

  return (
    <div className="fixed inset-0 top-8 z-[100] flex items-center justify-center overflow-hidden bg-background/95">
      {/* ─── Star field ─── */}
      <div className="absolute inset-0">
        {stars.map((s) => (
          <Star key={s.id} {...s} />
        ))}
      </div>

      {/* ─── Edge glow (blue) — matching Stitch screenshot border effect ─── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-600/60 via-primary/40 to-blue-600/60" />
        <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-transparent via-blue-600/30 to-blue-600/50" />
        <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-b from-transparent via-blue-600/30 to-blue-600/50" />
      </div>

      {/* ─── Rising particles ─── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p) => (
          <Particle key={p.id} {...p} />
        ))}
      </div>

      {/* ─── VIRE watermark top-left ─── */}
      <div className="absolute top-5 left-6 flex items-center gap-1.5 text-white/40">
        <Zap className="w-3.5 h-3.5 text-primary/60" strokeWidth={2.5} />
        <span className="text-xs font-bold tracking-[0.2em] uppercase">VIRE</span>
      </div>

      {/* ─── Node count bottom-right ─── */}
      <div className="absolute bottom-5 right-6 text-right">
        <p className="text-[9px] uppercase tracking-[0.15em] text-white/20 font-medium">Active Particles</p>
        <p className="text-[11px] font-bold text-white/30">{nodeCount} Nodes Connected</p>
      </div>

      {/* ─── Main Card ─── */}
      <motion.div
        initial={{ scale: 0.88, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[340px] px-4"
      >
        <div className="relative rounded-2xl bg-card/90 backdrop-blur-xl border border-white/[0.08] p-8 text-center overflow-hidden shadow-2xl">
          {/* Inner card glow */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-primary/[0.04] to-transparent pointer-events-none" />

          {/* Shimmer sweep */}
          <motion.div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)' }}
            animate={{ transform: ['translateX(-100%)', 'translateX(200%)'] }}
            transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 2.5, ease: 'easeInOut' }}
          />

          <div className="relative z-10 flex flex-col items-center gap-5">
            {/* ─── Icon ─── */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="relative"
            >
              <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-2xl border border-white/20 flex items-center justify-center shadow-2xl">
                <Sparkles className="w-7 h-7 text-white" strokeWidth={1.5} />
              </div>
              {/* Corner sparkle */}
              <motion.div
                className="absolute -top-1.5 -right-1.5"
                animate={{ scale: [1, 1.25, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="w-4 h-4 text-yellow-400 drop-shadow-[0_0_4px_rgba(250,204,21,0.8)]" />
              </motion.div>
            </motion.div>

            {/* ─── Username badge ─── */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35 }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-white/50 text-[11px] font-medium"
            >
              <span className="text-primary/80 font-bold">@</span>
              <span>{userName}</span>
            </motion.div>

            {/* ─── Room Name ─── */}
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="text-2xl font-bold text-white tracking-tight leading-tight"
            >
              {roomName}
            </motion.h1>

            {/* ─── Description ─── */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-[13px] text-white/40 leading-relaxed max-w-[220px] mx-auto"
            >
              Your shared space is ready. Connect your audio and enter when you're set.
            </motion.p>

            {/* ─── Enter Room button ─── */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="w-full"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              <Button
                onClick={onEnter}
                className="relative w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-[15px] rounded-xl overflow-hidden transition-all active:scale-[0.98] border-0"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
                  initial={{ x: '-100%' }}
                  animate={{ x: isHovering ? '100%' : '-100%' }}
                  transition={{ duration: 0.55, ease: 'easeInOut' }}
                />
                <span className="flex items-center justify-center gap-2.5 relative z-10">
                  Enter Room
                  <motion.span
                    animate={{ x: isHovering ? 4 : 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </motion.span>
                </span>
              </Button>
            </motion.div>

            {/* ─── Audio hint ─── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65 }}
              className="flex items-center gap-1.5 text-[10px] text-white/25 uppercase tracking-[0.12em] font-medium"
            >
              <Volume2 className="w-3 h-3" />
              <span>Audio &amp; Music Enabled on Entry</span>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
