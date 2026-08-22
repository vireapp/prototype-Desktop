'use client'

import ReactMarkdown from 'react-markdown'
import { Sparkles, Send, Trash2, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import type { Message } from '@/lib/ai/use-ai-chat'
import { useNavigate } from 'react-router-dom'
import { processAiCommands } from '@/lib/ai/command-handler'

interface AIChatCoreProps {
  messages: Message[]
  input: string
  setInput: (val: string) => void
  isLoading: boolean
  showClearConfirm: boolean
  setShowClearConfirm: (val: boolean) => void
  scrollEndRef: React.RefObject<HTMLDivElement | null>
  inputRef?: React.RefObject<HTMLInputElement | null>
  handleSend: (overrideInput?: string) => Promise<void>
  handleClearHistory: () => Promise<boolean>
  /** If true, shows "expand to full page" button */
  onExpand?: () => void
  /** If true, shows "collapse to panel" button */
  onCollapse?: () => void
  status: 'online' | 'thinking' | 'error'
  /** compact = panel, full = fullpage */
  variant?: 'panel' | 'fullpage'
  /** When true, the internal header row is hidden (panel renders its own) */
  hideHeader?: boolean
}

export function AIChatCore({
  messages,
  input,
  setInput,
  isLoading,
  showClearConfirm,
  setShowClearConfirm,
  scrollEndRef,
  inputRef,
  handleSend,
  handleClearHistory,
  onExpand,
  onCollapse,
  status,
  variant = 'panel',
  hideHeader = false
}: AIChatCoreProps) {
  const navigate = useNavigate()

  // Helper to extract options and clean message
  const processMessage = (text: string) => {
    // 1. Strip raw commands
    let cleanText = text.replace(/<<<COMMAND:[\s\S]*?>>>/g, '')

    // 2. Extract options
    const options: any[] = []
    const optionRegex = /<<<OPTION:(.*?)>>>/gs
    const matches = [...cleanText.matchAll(optionRegex)]
    
    for (const match of matches) {
      try {
        options.push(JSON.parse(match[1]))
      } catch (e) {
        console.error('Failed to parse option', e)
      }
    }

    // 3. Strip options from text
    cleanText = cleanText.replace(/<<<OPTION:[\s\S]*?>>>/g, '')

    return { cleanText, options }
  }

  return (
    <div className="flex-1 min-h-0 w-full flex flex-col">
      {/* Header */}
      {!hideHeader && (
      <div className={cn("flex items-center justify-between px-4 py-3 border-b shrink-0", variant === 'fullpage' ? 'border-white/[0.05] bg-white/[0.01]' : 'border-border bg-background')}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground tracking-tight">VIRE AI</span>
          <span className={cn('text-[10px] font-medium uppercase tracking-widest ml-2',
            status === 'error' ? 'text-destructive' : status === 'thinking' ? 'text-amber-400' : 'text-emerald-500'
          )}>
            {status === 'error' ? 'Offline' : status === 'thinking' ? 'Thinking...' : 'Online'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Clear Button */}
          <Button
            variant={showClearConfirm ? 'destructive' : 'ghost'}
            size={showClearConfirm ? 'sm' : 'icon'}
            className={cn(
              'transition-all duration-300',
              showClearConfirm
                ? 'h-7 px-2.5 text-[11px] font-bold bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                : 'h-8 w-8 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg'
            )}
            onClick={async (e) => {
              e.preventDefault()
              if (!showClearConfirm) {
                setShowClearConfirm(true)
                setTimeout(() => setShowClearConfirm(false), 3000)
                return
              }
              await handleClearHistory()
              setShowClearConfirm(false)
            }}
          >
            {showClearConfirm ? <span>CONFIRM?</span> : <Trash2 className="w-3.5 h-3.5" />}
          </Button>

          {/* Expand to Full Page Button (panel only) */}
          {onExpand && variant === 'panel' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white/30 hover:text-white hover:bg-white/10 rounded-lg"
              onClick={onExpand}
              title="Open full page"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </Button>
          )}

          {/* Collapse to Panel Button (fullpage only) */}
          {onCollapse && variant === 'fullpage' && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-white/40 hover:text-white hover:bg-white/10 text-xs h-8 px-3 rounded-lg ml-2"
              onClick={onCollapse}
            >
              Switch to Panel
            </Button>
          )}
        </div>
      </div>
      )}

      {/* Messages — plain div avoids Radix's display:table wrapper that breaks overflow-x */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden w-full">
        <div className={cn('flex flex-col gap-5 p-4 w-full box-border', variant === 'fullpage' && 'max-w-3xl mx-auto')}>
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center mt-24 gap-4 opacity-40 select-none">
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center shadow-sm">
                <Sparkles className="w-7 h-7 text-zinc-400" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm text-white/60 font-medium">VIRE Intelligence</p>
                <p className="text-xs text-white/30 max-w-[200px]">
                  Ask me anything about VIRE — rooms, friends, or just chat.
                </p>
              </div>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                style={{ width: '100%', minWidth: 0, display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}
              >
                {msg.role === 'model' && (
                  <div className="w-6 h-6 shrink-0 mr-2 mt-1 rounded-lg bg-zinc-800/50 border border-white/5 flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-zinc-400" />
                  </div>
                )}
                <div className="flex flex-col gap-2" style={{ maxWidth: '85%', minWidth: 0 }}>
                  <div
                    style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                    className={cn(
                      'rounded-2xl px-4 py-3 text-[14px] leading-relaxed shadow-sm',
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-sm'
                        : 'bg-zinc-800/80 text-zinc-100 rounded-bl-sm border border-white/5'
                    )}
                  >
                    <div
                      className={cn(
                        'prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-black/40 prose-pre:p-2 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-p:my-1',
                        msg.role === 'user' && 'prose-p:text-white'
                      )}
                      style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                    >
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>
                        }}
                      >
                        {processMessage(msg.content[0].text).cleanText}
                      </ReactMarkdown>
                    </div>
                  </div>

                  {/* Render Options if any */}
                  {msg.role === 'model' && processMessage(msg.content[0].text).options.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {processMessage(msg.content[0].text).options.map((opt, i) => (
                        <Button
                          key={i}
                          variant="secondary"
                          size="sm"
                          className="h-7 text-[12px] bg-zinc-800 hover:bg-indigo-600 hover:text-white border border-white/10 transition-colors rounded-lg"
                          onClick={() => {
                            if (opt.command) {
                              processAiCommands(`<<<COMMAND:${JSON.stringify(opt.command)}>>>`, navigate)
                            } else if (opt.label) {
                              handleSend(opt.label)
                            }
                          }}
                        >
                          {opt.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start items-end gap-2"
            >
              <div className="w-6 h-6 shrink-0 rounded-lg bg-zinc-800/50 border border-white/5 flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-zinc-400 animate-pulse" />
              </div>
              <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center">
                <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-[bounce_0.9s_infinite_-0.3s]" />
                <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-[bounce_0.9s_infinite_-0.15s]" />
                <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-[bounce_0.9s_infinite]" />
              </div>
            </motion.div>
          )}

          <div ref={scrollEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className={cn('p-4 shrink-0 border-t border-white/5', variant === 'fullpage' && 'pb-6')}>
        <div className={cn('relative group', variant === 'fullpage' && 'max-w-3xl mx-auto')}>
          <div className="relative flex gap-2 bg-white/[0.06] shadow-inner rounded-2xl p-1.5 border border-white/10 transition-colors items-center focus-within:border-indigo-500/50">
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="text"
              placeholder="Ask VIRE anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 bg-transparent border-0 focus:ring-0 focus:outline-none focus:border-transparent text-sm h-10 px-3 placeholder:text-white/20 text-white min-w-0"
              disabled={isLoading}
            />
            <Button
              size="icon"
              className={cn(
                'rounded-xl w-9 h-9 shrink-0 transition-all duration-300',
                input.trim()
                  ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm'
                  : 'bg-white/5 text-white/20 cursor-not-allowed'
              )}
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
