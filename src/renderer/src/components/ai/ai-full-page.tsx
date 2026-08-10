'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, PanelRightClose } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAI } from '@/lib/ai-context'
import { useAIChat } from '@/lib/ai/use-ai-chat'
import { AIChatCore } from '@/components/ai/ai-chat-core'
import { useNavigate } from 'react-router-dom'

export function AIFullPage() {
  const { setIsOpen, setMode, status } = useAI()
  const chat = useAIChat()
  const navigate = useNavigate()

  // Ensure we're in fullpage mode when this page mounts
  useEffect(() => {
    setMode('fullpage')
    setIsOpen(true)
  }, [setIsOpen, setMode])

  const handleSwitchToPanel = () => {
    setMode('panel')
    navigate(-1)
  }

  return (
    <div className="flex-1 min-h-0 w-full flex flex-col overflow-hidden rounded-2xl z-20 bg-[hsl(230,22%,5%)]">
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-fuchsia-600/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 flex-1 min-h-0 flex flex-col bg-[hsl(230,22%,5%)]/80">
        {/* Full-page header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.05] bg-white/[0.01] shrink-0">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1.1, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600/30 to-fuchsia-600/30 border border-violet-500/20 flex items-center justify-center"
            >
              <Sparkles className="w-5 h-5 text-violet-400" />
            </motion.div>
            <div>
              <h1 className="text-base font-bold text-white tracking-wide">VIRE Intelligence</h1>
              <p className="text-[11px] text-white/30 font-mono tracking-widest uppercase">
                AI Companion · Full Mode
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-white/40 hover:text-white hover:bg-white/10 text-xs h-8 px-3 rounded-lg"
            onClick={handleSwitchToPanel}
          >
            <PanelRightClose className="w-3.5 h-3.5" />
            Switch to Panel
          </Button>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-h-0">
          <AIChatCore
            {...chat}
            status={status}
            variant="fullpage"
          />
        </div>
      </div>
    </div>
  )
}
