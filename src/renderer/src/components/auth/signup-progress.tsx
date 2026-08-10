'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'

const STEPS = [
  { text: 'Creating your account' },
  { text: 'Setting up your profile' },
  { text: 'Getting things ready' },
  { text: 'Almost there' },
  { text: "You're all set" }
]

export function SignupProgress({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (currentStep >= STEPS.length) {
      setDone(true)
      const t = setTimeout(onComplete, 900)
      return () => clearTimeout(t)
    }

    // Slightly uneven timing — feels natural, not robotic
    const durations = [900, 700, 650, 600, 0]
    const t = setTimeout(() => setCurrentStep((p) => p + 1), durations[currentStep] ?? 700)
    return () => clearTimeout(t)
  }, [currentStep, onComplete])

  const progress = Math.min((currentStep / STEPS.length) * 100, 100)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050507]">
      {/* Soft ambient glow */}
      <div
        className="absolute pointer-events-none rounded-full"
        style={{
          width: '500px',
          height: '500px',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)',
          filter: 'blur(40px)'
        }}
      />

      <div className="relative w-full max-w-sm mx-auto px-6">
        {/* Top: animated check / spinner */}
        <div className="flex justify-center mb-8">
          <AnimatePresence mode="wait">
            {!done ? (
              <motion.div
                key="spinner"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.25 }}
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(139,92,246,0.08)',
                  border: '1.5px solid rgba(139,92,246,0.2)'
                }}
              >
                {/* Rotating arc */}
                <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="rgba(139,92,246,0.2)"
                    strokeWidth="2"
                  />
                  <path
                    d="M12 3a9 9 0 0 1 9 9"
                    stroke="rgba(139,92,246,0.8)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </motion.div>
            ) : (
              <motion.div
                key="check"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(139,92,246,0.12)',
                  border: '1.5px solid rgba(139,92,246,0.35)'
                }}
              >
                <Check className="w-6 h-6 text-violet-300" strokeWidth={2.5} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Step label */}
        <div className="text-center mb-8 min-h-[1.75rem]">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentStep}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="text-sm text-zinc-400 font-medium"
            >
              {STEPS[Math.min(currentStep, STEPS.length - 1)].text}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Progress track */}
        <div className="h-[2px] w-full rounded-full overflow-hidden bg-white/[0.06]">
          <motion.div
            className="h-full rounded-full bg-violet-500"
            style={{ width: `${progress}%` }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />
        </div>

        {/* Step dots */}
        <div className="flex justify-between mt-3">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="transition-all duration-300"
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                backgroundColor:
                  i < currentStep
                    ? 'rgba(139,92,246,0.8)'
                    : i === currentStep
                      ? 'rgba(255,255,255,0.6)'
                      : 'rgba(255,255,255,0.1)'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
