'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Zap } from 'lucide-react'
import { useAI } from '@/lib/ai-context'
import { cn } from '@/lib/utils'

export function AICompanionCard() {
  const { setIsOpen, status } = useAI()

  return (
    <Card
      onClick={() => setIsOpen(true)}
      className="h-full relative overflow-hidden group border-0 ring-1 ring-border bg-card shadow-sm cursor-pointer hover:ring-indigo-500/50 transition-all duration-500"
    >
      {/* Organic Glass Texture */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay" />

      {/* Dynamic Background */}
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-background to-purple-500/5 opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-[80px] group-hover:bg-indigo-500/20 transition-all duration-700" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-[80px] group-hover:bg-purple-500/20 transition-all duration-700" />

      <CardHeader className="pb-2 relative z-10">
        <CardTitle className="text-lg font-medium text-card-foreground flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
          <span className="bg-gradient-to-r from-card-foreground to-card-foreground/70 bg-clip-text text-transparent">
            VIRE Chat
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="relative z-10 flex flex-col items-center justify-center h-[calc(100%-60px)] text-center p-6 space-y-6">
        {/* Central visual element: Status Orb */}
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-10 group-hover:opacity-30 transition-opacity duration-700" />
          <div className="relative">
            {/* Status Ring */}
            <div
              className={cn(
                'w-24 h-24 rounded-full border-2 flex items-center justify-center transition-colors duration-500 shadow-xl dark:shadow-[0_0_30px_inset_rgba(0,0,0,0.5)]',
                status === 'error'
                  ? 'border-red-500/30 bg-red-500/10 dark:bg-red-900/10'
                  : 'border-indigo-500/30 bg-indigo-500/10 dark:bg-indigo-900/10'
              )}
            >
              <div
                className={cn(
                  'w-16 h-16 rounded-full shadow-lg dark:shadow-[0_0_20px_rgba(0,0,0,0.5)] flex items-center justify-center transition-all duration-500',
                  status === 'error'
                    ? 'bg-gradient-to-br from-red-500 to-red-700'
                    : 'bg-gradient-to-br from-indigo-500 to-purple-600'
                )}
              >
                <Sparkles className="w-8 h-8 text-white opacity-90 mix-blend-overlay" />
              </div>

              {/* Ping Dot */}
              <div className="absolute top-0 right-0">
                <span
                  className={cn(
                    'flex h-3 w-3 relative',
                    status === 'error' ? 'text-red-500' : 'text-emerald-500'
                  )}
                >
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-current border-2 border-card"></span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold text-card-foreground tracking-tight">
            Your AI Companion
          </h3>
          <p className="text-sm text-muted-foreground max-w-[200px] mx-auto leading-relaxed">
            {status === 'error'
              ? 'System experiencing issues.'
              : 'Ready to discuss movies, music, or keep you company.'}
          </p>
        </div>

        <div
          className={cn(
            'flex items-center gap-3 text-xs font-medium px-4 py-2 rounded-full border transition-colors duration-300',
            status === 'error'
              ? 'text-red-400 bg-red-500/10 border-red-500/20'
              : 'text-indigo-400/80 bg-indigo-500/5 border-indigo-500/10'
          )}
        >
          <Zap className="w-3 h-3" />
          <span>{status === 'error' ? 'Connection Error' : 'Always Active'}</span>
        </div>
      </CardContent>
    </Card>
  )
}
