'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Maximize2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAI } from '@/lib/ai-context'
import { useAIChat } from '@/lib/ai/use-ai-chat'
import { AIChatCore } from '@/components/ai/ai-chat-core'
import { useNavigate } from 'react-router-dom'

export function AIPanel() {
  const { isOpen, setIsOpen, mode, status, openFullPage } = useAI()
  const chat = useAIChat()
  const navigate = useNavigate()

  const isVisible = isOpen && mode === 'panel'

  const handleExpand = () => {
    openFullPage()
    navigate('/dashboard/ai')
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop tint — covers content area, non-blocking */}
          <motion.div
            key="panel-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-30 pointer-events-none"
            style={{
              background:
                'linear-gradient(to left, rgba(0,0,0,0.25) 0%, transparent 60%)'
            }}
          />

          {/* Panel — absolute so it respects the windowed container */}
          <motion.div
            key="ai-panel"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
            className="absolute top-0 right-0 h-full z-40 flex flex-col"
            style={{ width: 'clamp(300px, 22vw, 380px)' }}
          >
            {/* Glass container */}
            <div className="flex flex-col h-full relative overflow-hidden"
              style={{
                background: 'linear-gradient(180deg, hsl(250,25%,7%) 0%, hsl(240,22%,5%) 100%)',
                borderLeft: '1px solid rgba(139,92,246,0.12)',
                boxShadow: '-24px 0 80px rgba(0,0,0,0.55), -1px 0 0 rgba(139,92,246,0.08)'
              }}
            >
              {/* Top violet glow */}
              <div className="absolute top-0 left-0 right-0 h-40 pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse at 50% -20%, rgba(139,92,246,0.18) 0%, transparent 70%)'
                }}
              />

              {/* Bottom fuchsia glow */}
              <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse at 50% 120%, rgba(217,70,239,0.08) 0%, transparent 70%)'
                }}
              />

              {/* Header */}
              <div className="relative shrink-0 flex items-center justify-between px-4 pt-4 pb-3"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div className="flex items-center gap-2.5">
                  {/* Animated AI orb */}
                  <div className="relative shrink-0">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(135deg, rgba(139,92,246,0.25) 0%, rgba(217,70,239,0.15) 100%)',
                        border: '1px solid rgba(139,92,246,0.3)',
                        boxShadow: '0 0 14px rgba(139,92,246,0.2)'
                      }}
                    >
                      <Sparkles
                        className={`w-3.5 h-3.5 text-violet-300 ${status === 'thinking' ? 'animate-pulse' : ''}`}
                      />
                    </div>
                    {/* Status dot */}
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
                      style={{
                        background:
                          status === 'error'
                            ? '#ef4444'
                            : status === 'thinking'
                              ? '#fbbf24'
                              : '#34d399',
                        border: '2px solid hsl(240,22%,5%)',
                        boxShadow:
                          status === 'error'
                            ? '0 0 6px rgba(239,68,68,0.7)'
                            : status === 'thinking'
                              ? '0 0 6px rgba(251,191,36,0.7)'
                              : '0 0 6px rgba(52,211,153,0.7)'
                      }}
                    />
                  </div>

                  <div>
                    <p className="text-[13px] font-bold text-white tracking-wide leading-none mb-0.5">
                      VIRE AI
                    </p>
                    <p
                      className="text-[9px] font-semibold uppercase tracking-[0.18em] leading-none"
                      style={{
                        color:
                          status === 'error'
                            ? '#f87171'
                            : status === 'thinking'
                              ? '#fbbf24'
                              : '#6ee7b7'
                      }}
                    >
                      {status === 'error'
                        ? 'Offline'
                        : status === 'thinking'
                          ? 'Thinking…'
                          : 'Online'}
                    </p>
                  </div>
                </div>

                {/* Header actions */}
                <div className="flex items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Open full page"
                    className="h-7 w-7 rounded-lg text-white/25 hover:text-violet-300 hover:bg-violet-500/10 transition-all"
                    onClick={handleExpand}
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-lg text-white/25 hover:text-white hover:bg-white/10 transition-all"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Chat core (no internal header — we have a panel header above) */}
              <div className="relative flex-1 min-h-0 flex flex-col">
                <AIChatCore
                  {...chat}
                  status={status}
                  variant="panel"
                  onExpand={handleExpand}
                  hideHeader
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
