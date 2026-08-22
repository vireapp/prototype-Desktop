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
        <div className="flex-1 flex flex-col min-h-0">
          <AIChatCore
            {...chat}
            status={status}
            variant="fullpage"
            onCollapse={handleSwitchToPanel}
          />
        </div>
      </div>
    </div>
  )
}
