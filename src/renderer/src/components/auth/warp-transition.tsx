'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'

interface WarpTransitionProps {
  onComplete: () => void
  /** 'fast' for login, 'full' for register/onboarding */
  mode?: 'fast' | 'full'
}

/**
 * A clean, human-feeling transition: the screen breathes in, shows a quiet
 * confirmation, then exhales into the next page. No radial lines. No portals.
 * Just something that feels intentional and calm.
 */
export function WarpTransition({ onComplete, mode = 'full' }: WarpTransitionProps) {
  const [phase, setPhase] = useState<'in' | 'confirm' | 'out'>('in')

  const confirmDuration = mode === 'fast' ? 600 : 1000

  useEffect(() => {
    // Fade in → show checkmark
    const t1 = setTimeout(() => setPhase('confirm'), 300)
    return () => clearTimeout(t1)
  }, [])

  useEffect(() => {
    if (phase !== 'confirm') return
    // Hold the confirmation, then fade out
    const t2 = setTimeout(() => setPhase('out'), confirmDuration)
    return () => clearTimeout(t2)
  }, [phase, confirmDuration])

  useEffect(() => {
    if (phase !== 'out') return
    const t3 = setTimeout(() => onComplete(), 500)
    return () => clearTimeout(t3)
  }, [phase, onComplete])

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backgroundColor: '#050507' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: phase === 'out' ? 0 : 1 }}
      transition={{ duration: phase === 'out' ? 0.45 : 0.25, ease: 'easeInOut' }}
    >
      {/* Soft ambient light — hand-placed, not programmatic */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute rounded-full"
          style={{
            width: '420px',
            height: '420px',
            top: '50%',
            left: '50%',
            transform: 'translate(-56%, -58%)',
            background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)',
            filter: 'blur(40px)'
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: '300px',
            height: '300px',
            bottom: '15%',
            right: '20%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)',
            filter: 'blur(60px)'
          }}
        />
      </div>

      {/* Central confirmation mark */}
      <AnimatePresence mode="wait">
        {phase === 'confirm' && (
          <motion.div
            key="confirm"
            className="relative flex flex-col items-center gap-5"
            initial={{ opacity: 0, scale: 0.88, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -6 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Circle check */}
            <div className="relative">
              {/* Glow ring behind */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  boxShadow: '0 0 0 0px rgba(139,92,246,0.35)'
                }}
                animate={{
                  boxShadow: [
                    '0 0 0 0px rgba(139,92,246,0.35)',
                    '0 0 0 14px rgba(139,92,246,0)',
                  ]
                }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
              <motion.div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(139,92,246,0.12)',
                  border: '1.5px solid rgba(139,92,246,0.3)'
                }}
                initial={{ scale: 0.7 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.05 }}
              >
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 22 }}
                >
                  <Check className="w-7 h-7 text-violet-300" strokeWidth={2.5} />
                </motion.div>
              </motion.div>
            </div>

            {/* Label */}
            <motion.p
              className="text-sm font-medium tracking-wide text-zinc-400"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              {mode === 'fast' ? 'Signing you in…' : 'Account created'}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
