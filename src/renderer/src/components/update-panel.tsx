import { useEffect, useRef } from 'react'
import { X, RefreshCw, ArrowDown, CheckCheck, AlertTriangle, RotateCcw } from 'lucide-react'
import { useUpdateStore } from '@/stores/use-update-store'

declare const __APP_VERSION__: string

export function UpdatePanel() {
  const { update, panelOpen, setPanelOpen } = useUpdateStore()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPanelOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setPanelOpen])

  useEffect(() => {
    if (!panelOpen) return
    const onDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setPanelOpen(false)
    }
    const t = setTimeout(() => document.addEventListener('mousedown', onDown), 60)
    return () => { clearTimeout(t); document.removeEventListener('mousedown', onDown) }
  }, [panelOpen, setPanelOpen])

  if (!panelOpen) return null

  const { status } = update
  const version  = 'version' in update ? update.version : ''
  const percent  = status === 'downloading' && 'percent' in update ? update.percent : 0
  const errMsg   = 'message' in update ? update.message : ''

  return (
    <div
      ref={panelRef}
      className="fixed top-[34px] right-[130px] z-[9999] w-[300px] animate-in slide-in-from-top-1 fade-in duration-150"
      style={{ fontFamily: 'var(--font-body, Inter, system-ui, sans-serif)' }}
    >
      {/* Panel shell */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: 'rgb(11 12 18)',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03) inset',
        }}
      >
        {/* ── Title row ── */}
        <div className="flex items-center justify-between px-3.5 pt-3 pb-2.5">
          <span
            className="text-[11px] font-medium tracking-[0.08em] uppercase"
            style={{ color: 'rgba(255,255,255,0.28)', letterSpacing: '0.07em' }}
          >
            Software Update
          </span>
          <button
            onClick={() => setPanelOpen(false)}
            className="flex items-center justify-center w-5 h-5 rounded-md transition-colors"
            style={{ color: 'rgba(255,255,255,0.25)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}
          >
            <X className="w-3 h-3" strokeWidth={2} />
          </button>
        </div>

        {/* ── Rule ── */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '0 0 0 0' }} />

        {/* ── State body ── */}
        <div className="px-3.5 py-3.5">
          {status === 'idle'       && <IdleState    onCheck={() => window.api?.checkForUpdates?.()} />}
          {status === 'checking'   && <CheckingState />}
          {status === 'up-to-date' && <UpToDateState onCheck={() => window.api?.checkForUpdates?.()} />}
          {status === 'available'  && <AvailableState version={version} onDownload={() => window.api?.downloadUpdate?.()} />}
          {status === 'downloading'&& <DownloadingState percent={percent} />}
          {status === 'downloaded' && <DownloadedState version={version} onInstall={() => window.api?.installUpdate?.()} onLater={() => setPanelOpen(false)} />}
          {status === 'error'      && <ErrorState msg={errMsg} onRetry={() => window.api?.checkForUpdates?.()} />}
        </div>

        {/* ── Footer ── */}
        <div
          className="px-3.5 pb-3 flex items-center justify-between"
          style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '10px' }}
        >
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.18)', letterSpacing: '0.02em' }}>
            VIRE Desktop
          </span>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.18)', fontVariantNumeric: 'tabular-nums' }}>
            v{__APP_VERSION__}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Individual state views — each one designed from scratch, not from a template
// ─────────────────────────────────────────────────────────────────────────────

function IdleState({ onCheck }: { onCheck: () => void }) {
  return (
    <div className="flex flex-col gap-3">
      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', lineHeight: '1.5' }}>
        You're on the current release.
        Check manually to see if anything new is available.
      </p>
      <GhostBtn onClick={onCheck} icon={<RefreshCw className="w-3 h-3" strokeWidth={2} />}>
        Check for updates
      </GhostBtn>
    </div>
  )
}

function CheckingState() {
  return (
    <div className="flex items-center gap-3 py-1">
      {/* Animated dots instead of a spinning icon */}
      <div className="flex gap-1 shrink-0">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
        Reaching update server…
      </span>
    </div>
  )
}

function UpToDateState({ onCheck }: { onCheck: () => void }) {
  return (
    <div className="flex flex-col gap-3">
      {/* Version badge */}
      <div className="flex items-center gap-2.5">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.18)' }}
        >
          <CheckCheck className="w-3.5 h-3.5 text-emerald-400" strokeWidth={2.2} />
        </div>
        <div>
          <p style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.88)' }}>
            You're up to date
          </p>
          <p style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.35)', marginTop: '1px' }}>
            No newer version found.
          </p>
        </div>
      </div>
      <GhostBtn onClick={onCheck} icon={<RefreshCw className="w-3 h-3" strokeWidth={2} />}>
        Check again
      </GhostBtn>
    </div>
  )
}

function AvailableState({ version, onDownload }: { version: string; onDownload: () => void }) {
  return (
    <div className="flex flex-col gap-3.5">
      {/* Version callout */}
      <div
        className="rounded-lg px-3 py-2.5"
        style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.15)' }}
      >
        <div className="flex items-baseline justify-between">
          <span style={{ fontSize: '11px', color: 'rgba(147,197,253,0.7)', fontWeight: 500 }}>
            New version
          </span>
          <span
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: '#93c5fd',
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.01em',
            }}
          >
            v{version}
          </span>
        </div>
      </div>

      <p style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.42)', lineHeight: '1.55' }}>
        A new build is ready. Download it now and we'll ask you to restart when it's ready.
      </p>

      {/* Primary download button */}
      <button
        onClick={onDownload}
        className="group relative w-full flex items-center justify-center gap-2 rounded-lg py-2 overflow-hidden transition-all duration-150"
        style={{
          background: 'rgba(59,130,246,0.9)',
          fontSize: '12.5px',
          fontWeight: 600,
          color: '#fff',
          border: '1px solid rgba(147,197,253,0.2)',
          boxShadow: '0 0 16px rgba(59,130,246,0.25), 0 1px 0 rgba(255,255,255,0.08) inset',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,1)'; e.currentTarget.style.boxShadow = '0 0 24px rgba(59,130,246,0.4), 0 1px 0 rgba(255,255,255,0.08) inset' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.9)'; e.currentTarget.style.boxShadow = '0 0 16px rgba(59,130,246,0.25), 0 1px 0 rgba(255,255,255,0.08) inset' }}
      >
        <ArrowDown className="w-3.5 h-3.5" strokeWidth={2.2} />
        Download
      </button>
    </div>
  )
}

function DownloadingState({ percent }: { percent: number }) {
  const rounded = Math.round(percent)
  const isAlmostDone = rounded >= 90

  return (
    <div className="flex flex-col gap-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
          Downloading…
        </span>
        <span
          style={{
            fontSize: '13px',
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            color: isAlmostDone ? '#6ee7b7' : '#93c5fd',
            transition: 'color 0.4s',
          }}
        >
          {rounded}%
        </span>
      </div>

      {/* Track */}
      <div
        className="relative w-full rounded-full overflow-hidden"
        style={{ height: '3px', background: 'rgba(255,255,255,0.06)' }}
      >
        {/* Fill */}
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${rounded}%`,
            background: isAlmostDone
              ? 'linear-gradient(90deg, #34d399, #10b981)'
              : 'linear-gradient(90deg, #3b82f6, #818cf8)',
          }}
        />
        {/* Shimmer */}
        {rounded < 100 && (
          <div
            className="absolute inset-y-0 rounded-full animate-pulse"
            style={{
              left: `${Math.max(0, rounded - 15)}%`,
              width: '20%',
              background: 'rgba(255,255,255,0.12)',
              filter: 'blur(2px)',
            }}
          />
        )}
      </div>

      <p style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.28)', lineHeight: 1.4 }}>
        {isAlmostDone
          ? 'Almost there — finishing up…'
          : "Keep the app open while we download."}
      </p>
    </div>
  )
}

function DownloadedState({
  version,
  onInstall,
  onLater,
}: {
  version: string
  onInstall: () => void
  onLater: () => void
}) {
  return (
    <div className="flex flex-col gap-3.5">
      {/* Ready callout */}
      <div
        className="rounded-lg px-3 py-2.5"
        style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.14)' }}
      >
        <div className="flex items-baseline justify-between">
          <span style={{ fontSize: '11px', color: 'rgba(110,231,183,0.65)', fontWeight: 500 }}>
            Ready to install
          </span>
          <span
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: '#6ee7b7',
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.01em',
            }}
          >
            v{version}
          </span>
        </div>
      </div>

      <p style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.55' }}>
        Restart VIRE to apply the update. This takes about 10 seconds and your data stays intact.
      </p>

      {/* Restart — full-width primary */}
      <button
        onClick={onInstall}
        className="w-full flex items-center justify-center gap-2 rounded-lg py-2 transition-all duration-150"
        style={{
          background: 'rgba(52,211,153,0.85)',
          fontSize: '12.5px',
          fontWeight: 600,
          color: 'rgba(0,0,0,0.85)',
          border: '1px solid rgba(110,231,183,0.2)',
          boxShadow: '0 0 16px rgba(52,211,153,0.2)',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(52,211,153,1)'; e.currentTarget.style.boxShadow = '0 0 24px rgba(52,211,153,0.35)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(52,211,153,0.85)'; e.currentTarget.style.boxShadow = '0 0 16px rgba(52,211,153,0.2)' }}
      >
        <RotateCcw className="w-3.5 h-3.5" strokeWidth={2.2} />
        Restart & Install
      </button>

      {/* Later — understated */}
      <button
        onClick={onLater}
        className="w-full text-center py-1 transition-colors"
        style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}
      >
        Remind me later
      </button>
    </div>
  )
}

function ErrorState({ msg, onRetry }: { msg: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-2.5">
        <AlertTriangle
          className="w-4 h-4 shrink-0 mt-0.5"
          style={{ color: 'rgba(252,165,165,0.7)' }}
          strokeWidth={1.8}
        />
        <p
          className="line-clamp-3"
          style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.55' }}
          title={msg}
        >
          {msg || "Couldn't reach the update server. Check your connection and try again."}
        </p>
      </div>
      <GhostBtn onClick={onRetry} icon={<RefreshCw className="w-3 h-3" strokeWidth={2} />}>
        Try again
      </GhostBtn>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared: ghost button (low-key secondary action)
// ─────────────────────────────────────────────────────────────────────────────

function GhostBtn({
  onClick,
  icon,
  children,
}: {
  onClick: () => void
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 transition-colors"
      style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.35)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
    >
      {icon}
      {children}
    </button>
  )
}
