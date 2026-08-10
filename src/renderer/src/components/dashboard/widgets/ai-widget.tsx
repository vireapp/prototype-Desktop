import { Sparkles, ArrowRight, ExternalLink } from 'lucide-react'
import { useAI } from '@/lib/ai-context'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export function AICompanionWidget() {
  const { setIsOpen, status, openFullPage } = useAI()
  const navigate = useNavigate()
  const [inputValue, setInputValue] = useState('')

  const handleOpen = () => setIsOpen(true)
  const handleFullPage = () => { openFullPage(); navigate('/dashboard/ai') }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return
    setIsOpen(true)
    setInputValue('')
  }

  const quickPrompts = ['Summarize my day', 'Ideas for tonight', 'Who\'s online?']

  return (
    <div
      className={cn(
        'rounded-xl overflow-hidden flex flex-col h-full bg-card border transition-colors duration-300',
        status === 'error'
          ? 'border-rose-500/30'
          : 'border-border hover:border-primary/30'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04]">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            'w-8 h-8 rounded-xl flex items-center justify-center shadow-sm',
            status === 'error'
              ? 'bg-rose-100 dark:bg-rose-500/15'
              : 'bg-indigo-100 dark:bg-indigo-500/15'
          )}>
            <Sparkles className={cn(
              'w-4 h-4',
              status === 'error'
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-indigo-600 dark:text-indigo-400'
            )} />
          </div>
          <div>
            <h3 className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider leading-none">AI Companion</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={cn(
                'w-1.5 h-1.5 rounded-full',
                status === 'error' ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'
              )} />
              <p className="text-[10px] text-muted-foreground">
                {status === 'error' ? 'Connection issue' : 'Ready'}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={handleFullPage}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent hover:border-border transition-all"
          title="Open full AI chat"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 px-5 py-4">
        <p className="text-xs text-muted-foreground leading-relaxed mb-4">
          {status === 'error'
            ? 'Unable to reach AI. Check your connection and try again.'
            : 'Ask me anything — I can summarize your notifications, suggest rooms, or just chat.'}
        </p>

        {/* Quick prompts */}
        {status !== 'error' && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => { setInputValue(prompt); setIsOpen(true) }}
                className="text-[10px] font-semibold px-3 py-1.5 rounded-lg bg-secondary/50 border border-border text-muted-foreground hover:text-primary hover:bg-primary/5 hover:border-primary/30 transition-all duration-200"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input footer */}
      <div className="px-5 pb-5">
        <form onSubmit={handleSubmit} className="relative group">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask AI something…"
            disabled={status === 'error'}
            className="w-full text-[11px] bg-secondary/40 border border-border rounded-xl py-3 pl-4 pr-12 text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/40 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all duration-300 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={status === 'error' || !inputValue.trim()}
            className="absolute right-1.5 top-1.5 w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-lg shadow-primary/20"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  )
}
