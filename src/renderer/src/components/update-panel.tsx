import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, RefreshCcw, Download, Check, AlertCircle } from 'lucide-react'
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
  const version = 'version' in update ? update.version : ''
  const percent = status === 'downloading' && 'percent' in update ? update.percent : 0
  const errMsg = 'message' in update ? update.message : ''

  return (
    <div
      ref={panelRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/20"
      style={{ fontFamily: '"Segoe UI Variable", "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif' }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="w-[420px] bg-[#202020]/95 backdrop-blur-2xl rounded-lg border border-white/10 shadow-[0_32px_64px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden"
      >
        {/* Title Bar */}
        <div className="h-10 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold text-white/90">Software Update</span>
          </div>
          <button
            onClick={() => setPanelOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#c42b1c] hover:text-white text-white/70 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 flex flex-col min-h-[160px]">
          <AnimatePresence mode="wait">
            {status === 'idle' && <IdleView key="idle" onCheck={() => window.api?.checkForUpdates?.()} />}
            {status === 'checking' && <CheckingView key="checking" />}
            {status === 'up-to-date' && <UpToDateView key="uptodate" onCheck={() => window.api?.checkForUpdates?.()} />}
            {status === 'available' && <AvailableView key="available" version={version} onDownload={() => window.api?.downloadUpdate?.()} />}
            {status === 'downloading' && <DownloadingView key="downloading" percent={percent} />}
            {status === 'downloaded' && <DownloadedView key="downloaded" onInstall={() => window.api?.installUpdate?.()} />}
            {status === 'error' && <ErrorView key="error" msg={errMsg} onRetry={() => window.api?.checkForUpdates?.()} />}
          </AnimatePresence>
        </div>

        {/* Status Bar */}
        <div className="h-8 bg-white/[0.02] border-t border-white/5 flex items-center px-4">
          <span className="text-[11px] text-white/50">Current version: {__APP_VERSION__}</span>
        </div>
      </motion.div>
    </div>
  )
}

function IdleView({ onCheck }: { onCheck: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full justify-between gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-[20px] font-semibold text-white">Check for updates</h2>
        <p className="text-[14px] text-white/70">Ensure you have the latest features and security improvements.</p>
      </div>
      <div className="flex justify-end">
        <button
          onClick={onCheck}
          className="px-6 py-1.5 bg-[#60CDFF] hover:bg-[#60CDFF]/90 text-black text-[14px] rounded-[4px] font-medium transition-colors border border-transparent shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]"
        >
          Check for updates
        </button>
      </div>
    </motion.div>
  )
}

function CheckingView() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full justify-center items-center gap-4">
      {/* Native-style indeterminate progress */}
      <div className="w-6 h-6 border-2 border-[#60CDFF] border-t-transparent rounded-full animate-spin" />
      <span className="text-[14px] text-white/90">Checking for updates...</span>
    </motion.div>
  )
}

function UpToDateView({ onCheck }: { onCheck: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full justify-between gap-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 mb-1">
          <Check className="w-5 h-5 text-[#60CDFF]" />
          <h2 className="text-[20px] font-semibold text-white">You're up to date</h2>
        </div>
        <p className="text-[14px] text-white/70">No new updates are available for VIRE at this time.</p>
      </div>
      <div className="flex justify-end">
        <button
          onClick={onCheck}
          className="px-6 py-1.5 bg-white/10 hover:bg-white/15 text-white text-[14px] rounded-[4px] font-medium transition-colors border border-white/10 shadow-[0_2px_4px_rgba(0,0,0,0.1)]"
        >
          Check again
        </button>
      </div>
    </motion.div>
  )
}

function AvailableView({ version, onDownload }: { version: string; onDownload: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full justify-between gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-[20px] font-semibold text-white">Updates available</h2>
        <p className="text-[14px] text-white/70">A new update (v{version}) is ready to be downloaded.</p>
      </div>
      <div className="flex justify-end">
        <button
          onClick={onDownload}
          className="flex items-center gap-2 px-6 py-1.5 bg-[#60CDFF] hover:bg-[#60CDFF]/90 text-black text-[14px] rounded-[4px] font-medium transition-colors border border-transparent shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]"
        >
          <Download className="w-4 h-4" />
          Download now
        </button>
      </div>
    </motion.div>
  )
}

function DownloadingView({ percent }: { percent: number }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full justify-center gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-[20px] font-semibold text-white">Downloading update</h2>
        <p className="text-[14px] text-white/70">Please wait while the update is downloaded.</p>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center text-[12px] text-white/70">
          <span>Downloading...</span>
          <span>{Math.round(percent)}%</span>
        </div>
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#60CDFF] rounded-full transition-all duration-300 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </motion.div>
  )
}

function DownloadedView({ onInstall }: { onInstall: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full justify-between gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-[20px] font-semibold text-white">Restart required</h2>
        <p className="text-[14px] text-white/70">The update has been downloaded. Save your work and restart the application to complete the installation.</p>
      </div>
      <div className="flex justify-end gap-2">
        <button
          onClick={onInstall}
          className="px-6 py-1.5 bg-[#60CDFF] hover:bg-[#60CDFF]/90 text-black text-[14px] rounded-[4px] font-medium transition-colors border border-transparent shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]"
        >
          Restart now
        </button>
      </div>
    </motion.div>
  )
}

function ErrorView({ msg, onRetry }: { msg: string; onRetry: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full justify-between gap-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 mb-1">
          <AlertCircle className="w-5 h-5 text-[#FF99A4]" />
          <h2 className="text-[20px] font-semibold text-white">Something went wrong</h2>
        </div>
        <p className="text-[14px] text-white/70 line-clamp-3">
          {msg || "We couldn't connect to the update service. Please check your internet connection and try again."}
        </p>
      </div>
      <div className="flex justify-end">
        <button
          onClick={onRetry}
          className="px-6 py-1.5 bg-white/10 hover:bg-white/15 text-white text-[14px] rounded-[4px] font-medium transition-colors border border-white/10 shadow-[0_2px_4px_rgba(0,0,0,0.1)]"
        >
          Retry
        </button>
      </div>
    </motion.div>
  )
}

