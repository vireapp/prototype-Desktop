'use client'

import { useState } from 'react'
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
  const [panelWidth, setPanelWidth] = useState(380)
  const [isDragging, setIsDragging] = useState(false)

  const isVisible = isOpen && mode === 'panel'

  const handleExpand = () => {
    openFullPage()
    navigate('/dashboard/ai')
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Panel — structurally integrated into the flex layout */}
          <motion.div
            key="ai-panel"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: panelWidth, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={isDragging ? { duration: 0 } : { type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
            className="flex flex-col shrink-0 pt-9 bg-background border-l border-border h-full relative"
          >
            {/* Drag Handle */}
            <div
              className="absolute top-0 left-[-4px] bottom-0 w-[8px] cursor-col-resize z-50 group/resize flex justify-center"
              onPointerDown={(e) => {
                e.preventDefault()
                setIsDragging(true)
                const startX = e.clientX
                const startWidth = panelWidth
                
                const onPointerMove = (moveEvent: PointerEvent) => {
                  const delta = startX - moveEvent.clientX
                  setPanelWidth(Math.min(800, Math.max(300, startWidth + delta)))
                }
                
                const onPointerUp = () => {
                  setIsDragging(false)
                  document.removeEventListener('pointermove', onPointerMove)
                  document.removeEventListener('pointerup', onPointerUp)
                  document.body.style.cursor = ''
                }
                
                document.addEventListener('pointermove', onPointerMove)
                document.addEventListener('pointerup', onPointerUp)
                document.body.style.cursor = 'col-resize'
              }}
            >
              <div className={`w-[2px] h-full transition-colors ${
                isDragging ? "bg-primary" : "bg-transparent group-hover/resize:bg-primary/50"
              }`} />
            </div>

            <div className="flex flex-col h-full overflow-hidden w-full min-w-[300px]">
              {/* Header */}
              <div className="relative shrink-0 flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground tracking-tight">VIRE AI</span>
                </div>

                {/* Header actions */}
                <div className="flex items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Open full page"
                    className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground transition-all"
                    onClick={handleExpand}
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground transition-all"
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
