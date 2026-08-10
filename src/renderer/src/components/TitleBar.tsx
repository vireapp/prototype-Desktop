import { useState, useEffect } from 'react'
import { Minus, Square, X, Copy, Gem, Plus, RefreshCw, ArrowUpCircle, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { useUpdateStore, UpdateStatus } from '@/stores/use-update-store'
import { useInventoryStore } from '@/stores/use-inventory'
import { createClient } from '@/lib/supabase/client'

export function TitleBar(): React.JSX.Element {
  const [isMaximized, setIsMaximized] = useState(false)
  const [isDev, setIsDev] = useState(false)
  const { coins, addCoins } = useInventoryStore()
  const { update, setDismissed, panelOpen, setPanelOpen } = useUpdateStore()

  useEffect(() => {
    const checkDevStatus = async () => {
      if (import.meta.env.DEV) {
        setIsDev(true)
        return
      }
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()
          if (profile?.role === 'developer') setIsDev(true)
        }
      } catch (err) {
        console.error('TitleBar: Error checking dev status:', err)
      }
    }
    checkDevStatus()
    window.api?.isMaximized?.().then(setIsMaximized).catch(() => {})
    window.api?.onMaximizedChanged?.((maximized: boolean) => setIsMaximized(maximized))
  }, [])

  useEffect(() => {
    if (update.status === 'available' || update.status === 'downloaded' || update.status === 'error') {
      setPanelOpen(true)
    }
  }, [update.status, setPanelOpen])

  const handleMinimize = (): void => window.api?.minimize()
  const handleMaximize = (): void => window.api?.maximize()
  const handleClose = (): void => window.api?.close()

  return (
    <div
      className="h-9 flex items-center justify-between select-none z-[9999] absolute top-0 left-0 right-0 w-full overflow-hidden bg-transparent"
    >
      {/* Iridescent bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent pointer-events-none" />

      {/* Left: Brand + Drag Region */}
      <div className="flex-1 h-full flex items-center px-4 drag-region">
        <div className="no-drag flex items-center gap-2.5">
          {/* App Logo */}
          <div className="relative shrink-0 flex items-center justify-center">
            <img src="/images/vire_logo.png" alt="VIRE Logo" className="w-[18px] h-[18px] object-contain" />
          </div>

          <div className="flex items-baseline gap-1.5">
            <span
              className="text-[11.5px] font-bold tracking-[0.18em] text-foreground/90 uppercase leading-none"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              VIRE
            </span>
          </div>
        </div>
      </div>

      {/* Dev: Coins Indicator */}
      {isDev && (
        <div className="no-drag flex items-center h-5 px-2.5 mr-3 rounded-full bg-amber-500/10 border border-amber-500/15">
          <Gem className="w-3 h-3 text-amber-400" strokeWidth={2} />
          <span className="ml-1 mr-1.5 text-[11px] font-bold text-amber-400 tabular-nums">
            {coins.toLocaleString()}
          </span>
          <button
            onClick={() => addCoins(1000)}
            className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-amber-500/20 hover:bg-amber-500/40 text-amber-400 transition-colors"
            title="Add 1000 Coins (Dev Only)"
          >
            <Plus className="w-2.5 h-2.5" strokeWidth={3} />
          </button>
        </div>
      )}

      {/* Update Icon */}
      <UpdateStatusIcon
        update={update}
        panelOpen={panelOpen}
        onAction={() => {
          if (update.status === 'idle' || update.status === 'up-to-date') {
            setPanelOpen(true)
            window.api?.checkForUpdates?.()
          } else {
            setPanelOpen(!panelOpen)
          }
          setDismissed(false)
        }}
      />

      {/* Window Controls */}
      <div className="flex h-full no-drag">
        <button
          onClick={handleMinimize}
          className="w-11 flex items-center justify-center hover:bg-foreground/10 transition-colors duration-150 group"
          aria-label="Minimize"
        >
          <Minus className="w-3 h-3 text-foreground/50 group-hover:text-foreground/90 transition-colors" strokeWidth={1.5} />
        </button>
        <button
          onClick={handleMaximize}
          className="w-11 flex items-center justify-center hover:bg-foreground/10 transition-colors duration-150 group"
          aria-label="Maximize"
        >
          {isMaximized ? (
            <Copy className="w-3 h-3 text-foreground/50 group-hover:text-foreground/90 transition-colors" strokeWidth={1.5} />
          ) : (
            <Square className="w-3 h-3 text-foreground/50 group-hover:text-foreground/90 transition-colors" strokeWidth={1.5} />
          )}
        </button>
        <button
          onClick={handleClose}
          className="w-11 flex items-center justify-center hover:bg-destructive/90 transition-colors duration-200 group"
          aria-label="Close"
        >
          <X className="w-3.5 h-3.5 text-foreground/50 group-hover:text-foreground transition-colors" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  )
}

// ─── UpdateStatusIcon ─────────────────────────────────────────────────────────

interface UpdateStatusIconProps {
  update: UpdateStatus
  panelOpen: boolean
  onAction: () => void
}

function UpdateStatusIcon({ update, panelOpen, onAction }: UpdateStatusIconProps) {
  const { status } = update

  const label =
    status === 'idle' ? 'Check for updates'
    : status === 'checking' ? 'Checking for updates…'
    : status === 'up-to-date' ? 'App is up to date'
    : status === 'available' ? `Update available — v${'version' in update ? update.version : ''}`
    : status === 'downloading' ? `Downloading… ${'percent' in update ? Math.round(update.percent) : 0}%`
    : status === 'downloaded' ? `Ready to install — v${'version' in update ? update.version : ''}`
    : status === 'error' ? 'Update error — click to retry'
    : 'Check for updates'

  return (
    <div className="no-drag group/update relative flex items-center mr-1">
      <button
        onClick={onAction}
        title={label}
        aria-label={label}
        className={`relative flex items-center justify-center w-7 h-7 rounded-md transition-colors duration-150 ${
          panelOpen ? 'bg-white/[0.07]' : 'hover:bg-foreground/10'
        }`}
      >
        {(status === 'idle' || status === 'up-to-date') && (
          <RefreshCw className="w-3 h-3 text-foreground/50 group-hover/update:text-foreground/90 transition-colors" strokeWidth={2} />
        )}
        {status === 'checking' && (
          <Loader2 className="w-3 h-3 text-blue-400 animate-spin" strokeWidth={2} />
        )}
        {status === 'available' && (
          <>
            <ArrowUpCircle className="w-3.5 h-3.5 text-blue-400" strokeWidth={2} />
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
            </span>
          </>
        )}
        {status === 'downloading' && (
          <>
            <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" strokeWidth={2} />
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-50" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-400" />
            </span>
          </>
        )}
        {status === 'downloaded' && (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" strokeWidth={2} />
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          </>
        )}
        {status === 'error' && (
          <>
            <AlertCircle className="w-3.5 h-3.5 text-red-400" strokeWidth={2} />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500" />
          </>
        )}
      </button>

      <div className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 rounded-md bg-popover border border-border text-[10px] text-muted-foreground whitespace-nowrap opacity-0 group-hover/update:opacity-100 transition-opacity duration-150 shadow-lg z-[9999]">
        {label}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-popover border-l border-t border-border rotate-45" />
      </div>
    </div>
  )
}

