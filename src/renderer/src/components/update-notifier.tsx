import { useEffect } from 'react'
import { AlertCircle, Download, CheckCircle2, X } from 'lucide-react'
import { useUpdateStore } from '@/stores/use-update-store'

/**
 * UpdateNotifier
 * - Registers the IPC `update-status` listener (single source of truth).
 * - Renders the bottom-right toast when an actionable update state arrives.
 * - The TitleBar icon reads from the same useUpdateStore.
 */
export function UpdateNotifier() {
  const { update, dismissed, setUpdate, setDismissed } = useUpdateStore()

  useEffect(() => {
    // @ts-ignore
    if (window.api?.onUpdateStatus) {
      // @ts-ignore
      window.api.onUpdateStatus((data: any) => {
        setUpdate(data)
      })
    }
  }, [setUpdate])

  // Don't render the popup for non-actionable or dismissed states
  if (dismissed) return null
  if (
    update.status === 'idle' ||
    update.status === 'checking' ||
    update.status === 'up-to-date'
  )
    return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 p-4 bg-[hsl(230,22%,8%)] text-white/90 border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden w-80 animate-in slide-in-from-bottom-5 fade-in duration-300">

      {update.status === 'available' && (
        <>
          <div className="flex justify-between items-start gap-2">
            <div>
              <h3 className="flex items-center gap-2 font-medium text-[hsl(220,15%,90%)]">
                <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                Update Available
              </h3>
              <p className="text-xs text-white/50 mt-1">
                Version {update.version} is ready to download.
              </p>
            </div>
            <button onClick={() => setDismissed(true)} className="text-white/40 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-2 mt-2">
            <button
              // @ts-ignore
              onClick={() => window.api.downloadUpdate()}
              className="flex-1 rounded-md bg-blue-600 hover:bg-blue-500 transition-colors py-2 px-3 text-xs font-semibold flex items-center justify-center gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              Download Now
            </button>
          </div>
        </>
      )}

      {update.status === 'downloading' && (
        <>
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-[hsl(220,15%,90%)]">Downloading Update...</h3>
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-blue-400">{Math.round(update.percent)}%</span>
              <button onClick={() => setDismissed(true)} className="text-white/40 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300 ease-out"
              style={{ width: `${update.percent}%` }}
            />
          </div>
        </>
      )}

      {update.status === 'downloaded' && (
        <>
          <div className="flex justify-between items-start gap-2">
            <div>
              <h3 className="flex items-center gap-2 font-medium text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                Update Ready
              </h3>
              <p className="text-xs text-white/50 mt-1">
                Version {update.version} has been downloaded.
              </p>
            </div>
            <button onClick={() => setDismissed(true)} className="text-white/40 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-2 mt-2">
            <button
              // @ts-ignore
              onClick={() => window.api.installUpdate()}
              className="flex-1 rounded-md bg-emerald-600 hover:bg-emerald-500 transition-colors py-2 px-3 text-xs font-semibold"
            >
              Restart & Install
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="flex-1 rounded-md bg-white/5 hover:bg-white/10 transition-colors py-2 px-3 text-xs font-medium"
            >
              Later
            </button>
          </div>
        </>
      )}

      {update.status === 'error' && (
        <>
          <div className="flex justify-between items-start gap-2">
            <div>
              <h3 className="flex items-center gap-2 font-medium text-red-400">
                <AlertCircle className="w-4 h-4" />
                Update Failed
              </h3>
              <p className="text-xs text-white/50 mt-1 line-clamp-2" title={update.message}>
                {update.message || 'Failed to download update.'}
              </p>
            </div>
            <button onClick={() => setDismissed(true)} className="text-white/40 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </>
      )}

    </div>
  )
}
