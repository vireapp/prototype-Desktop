'use client'

import ReactMarkdown from 'react-markdown'
import { Sparkles, Send, Trash2, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import type { Message } from '@/lib/ai/use-ai-chat'

interface AIChatCoreProps {
  messages: Message[]
  input: string
  setInput: (val: string) => void
  isLoading: boolean
  showClearConfirm: boolean
  setShowClearConfirm: (val: boolean) => void
  scrollEndRef: React.RefObject<HTMLDivElement | null>
  inputRef?: React.RefObject<HTMLInputElement | null>
  handleSend: () => Promise<void>
  handleClearHistory: () => Promise<boolean>
  /** If true, shows "expand to full page" button */
  onExpand?: () => void
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
  status,
  variant = 'panel',
  hideHeader = false
}: AIChatCoreProps) {
  return (
    <div className="flex-1 min-h-0 w-full flex flex-col">
      {/* Header */}
      {!hideHeader && (
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.02] shrink-0">
        <div className="flex items-center gap-3">
          {/* Animated AI orb */}
          <div className="relative">
            <div
              className={cn(
                'w-9 h-9 rounded-xl flex items-center justify-center border',
                status === 'error'
                  ? 'bg-red-500/15 border-red-500/20'
                  : 'bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border-violet-500/20'
              )}
            >
              <Sparkles
                className={cn(
                  'w-4 h-4',
                  status === 'error' ? 'text-red-400' : 'text-violet-400',
                  status === 'thinking' && 'animate-pulse'
                )}
              />
            </div>
            <span
              className={cn(
                'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background',
                status === 'error'
                  ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.7)]'
                  : status === 'thinking'
                    ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.7)] animate-pulse'
                    : 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]'
              )}
            />
          </div>

          <div>
            <p className="text-sm font-semibold text-white tracking-wide">VIRE AI</p>
            <p
              className={cn(
                'text-[10px] font-medium uppercase tracking-widest',
                status === 'error'
                  ? 'text-red-400'
                  : status === 'thinking'
                    ? 'text-amber-400'
                    : 'text-emerald-400/80'
              )}
            >
              {status === 'error' ? 'Offline' : status === 'thinking' ? 'Thinking...' : 'Online'}
            </p>
          </div>
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
        </div>
      </div>
      )}

      {/* Messages — plain div avoids Radix's display:table wrapper that breaks overflow-x */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden w-full">
        <div className={cn('flex flex-col gap-5 p-4 w-full box-border', variant === 'fullpage' && 'max-w-3xl mx-auto')}>
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center mt-24 gap-4 opacity-40 select-none">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/20 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-violet-400" />
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
                  <div className="w-6 h-6 shrink-0 mr-2 mt-1 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-violet-400" />
                  </div>
                )}
                <div
                  style={{ maxWidth: '80%', minWidth: 0, wordBreak: 'break-word', overflowWrap: 'break-word' }}
                  className={cn(
                    'rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-lg',
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-br-sm border border-violet-500/30 shadow-violet-900/30'
                      : 'bg-white/[0.04] text-zinc-100 rounded-bl-sm border border-white/[0.06] shadow-black/20'
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
                      {msg.content[0].text}
                    </ReactMarkdown>
                  </div>
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
              <div className="w-6 h-6 shrink-0 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-violet-400 animate-pulse" />
              </div>
              <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center">
                <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-[bounce_0.9s_infinite_-0.3s]" />
                <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-[bounce_0.9s_infinite_-0.15s]" />
                <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-[bounce_0.9s_infinite]" />
              </div>
            </motion.div>
          )}

          <div ref={scrollEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className={cn('p-4 shrink-0 border-t border-white/5', variant === 'fullpage' && 'pb-6')}>
        <div className={cn('relative group', variant === 'fullpage' && 'max-w-3xl mx-auto')}>
          <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-2xl opacity-0 group-focus-within:opacity-20 transition-opacity duration-500 blur-sm" />
          <div className="relative flex gap-2 bg-white/[0.04] rounded-2xl p-1.5 border border-white/[0.08] group-focus-within:border-violet-500/30 transition-colors items-center">
            <Input
              ref={inputRef}
              placeholder="Ask VIRE anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 bg-transparent border-0 focus-visible:ring-0 text-sm h-10 px-3 placeholder:text-white/20 text-white"
              disabled={isLoading}
            />
            <Button
              size="icon"
              className={cn(
                'rounded-xl w-9 h-9 shrink-0 transition-all duration-300',
                input.trim()
                  ? 'bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.4)] hover:shadow-[0_0_20px_rgba(139,92,246,0.6)] hover:scale-105'
                  : 'bg-white/5 text-white/20 cursor-not-allowed'
              )}
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <p className="text-center text-[9px] text-white/15 font-mono tracking-[0.2em] uppercase mt-2.5">
          V I R E &nbsp; I N T E L L I G E N C E
        </p>
      </div>
    </div>
  )
}
