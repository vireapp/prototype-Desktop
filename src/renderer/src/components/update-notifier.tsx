import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Download, Check, X } from 'lucide-react'
import { useUpdateStore } from '@/stores/use-update-store'

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

  const isVisible =
    !dismissed &&
    (update.status === 'available' ||
      update.status === 'downloading' ||
      update.status === 'downloaded' ||
      update.status === 'error')

  return (
    <div className="fixed bottom-6 right-6 z-[9999] pointer-events-none" style={{ fontFamily: '"Segoe UI Variable", "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif' }}>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            layout
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-[360px] pointer-events-auto bg-[#2C2C2C]/95 backdrop-blur-2xl border border-white/10 rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="h-10 flex items-center justify-between px-4 bg-white/[0.02]">
              <span className="text-[12px] font-semibold text-white/90">VIRE Desktop</span>
              <button
                onClick={() => setDismissed(true)}
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#c42b1c] hover:text-white text-white/70 transition-colors -mr-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4">
              <AnimatePresence mode="wait">
                {update.status === 'available' && (
                  <motion.div
                    key="available"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col gap-4"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-[14px] font-semibold text-white">Update available</span>
                      <p className="text-[13px] text-white/70">
                        Version {update.version} is ready to be downloaded.
                      </p>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        // @ts-ignore
                        onClick={() => window.api?.downloadUpdate?.()}
                        className="px-4 py-1.5 bg-[#60CDFF] hover:bg-[#60CDFF]/90 text-black text-[14px] rounded-[4px] font-medium transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]"
                      >
                        Download
                      </button>
                    </div>
                  </motion.div>
                )}

                {update.status === 'downloading' && (
                  <motion.div
                    key="downloading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col gap-3 py-1"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-[14px] font-semibold text-white">Downloading update</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center text-[12px] text-white/70">
                        <span>Downloading...</span>
                        <span>{Math.round(update.percent)}%</span>
                      </div>
                      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#60CDFF] rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${update.percent}%` }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {update.status === 'downloaded' && (
                  <motion.div
                    key="downloaded"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col gap-4"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-[14px] font-semibold text-white">Restart required</span>
                      <p className="text-[13px] text-white/70">
                        Restart to install the newest features.
                      </p>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setDismissed(true)}
                        className="px-4 py-1.5 bg-white/10 hover:bg-white/15 text-white text-[14px] rounded-[4px] font-medium transition-colors border border-white/10 shadow-[0_2px_4px_rgba(0,0,0,0.1)]"
                      >
                        Later
                      </button>
                      <button
                        // @ts-ignore
                        onClick={() => window.api?.installUpdate?.()}
                        className="px-4 py-1.5 bg-[#60CDFF] hover:bg-[#60CDFF]/90 text-black text-[14px] rounded-[4px] font-medium transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]"
                      >
                        Restart now
                      </button>
                    </div>
                  </motion.div>
                )}

                {update.status === 'error' && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col gap-4"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-[#FF99A4]" />
                        <span className="text-[14px] font-semibold text-white">Update failed</span>
                      </div>
                      <p className="text-[13px] text-white/70 line-clamp-2">
                        {update.message || 'An error occurred while downloading.'}
                      </p>
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => setDismissed(true)}
                        className="px-4 py-1.5 bg-white/10 hover:bg-white/15 text-white text-[14px] rounded-[4px] font-medium transition-colors border border-white/10 shadow-[0_2px_4px_rgba(0,0,0,0.1)]"
                      >
                        Dismiss
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
