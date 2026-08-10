'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Monitor, AppWindow, X, MonitorUp, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface DesktopSource {
  id: string
  name: string
  thumbnail?: string // fetched lazily on demand
}

interface ScreenSharePickerProps {
  open: boolean
  onClose: () => void
  onSelect: (sourceId: string, sourceName: string) => void
}

type SourceTab = 'screens' | 'windows'

export function ScreenSharePicker({ open, onClose, onSelect }: ScreenSharePickerProps) {
  const [sources, setSources] = useState<DesktopSource[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<SourceTab>('screens')
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [thumbnailCache, setThumbnailCache] = useState<Record<string, string>>({})

  const fetchSources = useCallback(async () => {
    setLoading(true)
    setError(null)
    setSelectedId(null)
    try {
      // get-desktop-sources now returns id + name only (no thumbnails)
      const result: DesktopSource[] = await (window as any).electron.ipcRenderer.invoke(
        'get-desktop-sources'
      )
      setSources(result)
    } catch (e) {
      console.error('[ScreenSharePicker] Failed to fetch sources:', e)
      setError('Could not load screen sources. Make sure the app has screen recording permission.')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchThumbnail = useCallback(async (sourceId: string) => {
    if (thumbnailCache[sourceId]) return
    try {
      const dataUrl: string | null = await (window as any).electron.ipcRenderer.invoke(
        'get-source-thumbnail',
        sourceId
      )
      if (dataUrl) {
        setThumbnailCache((prev) => ({ ...prev, [sourceId]: dataUrl }))
      }
    } catch {
      // silently ignore thumbnail errors
    }
  }, [thumbnailCache])

  useEffect(() => {
    if (open) {
      setActiveTab('screens')
      fetchSources()
    } else {
      setSources([])
      setSelectedId(null)
      setError(null)
    }
  }, [open, fetchSources])

  const screens = sources.filter((s) => s.id.startsWith('screen:'))
  const windows = sources.filter((s) => s.id.startsWith('window:'))

  const displayedSources = activeTab === 'screens' ? screens : windows

  const handleShare = () => {
    if (!selectedId) return
    const source = sources.find((s) => s.id === selectedId)
    if (source) {
      onSelect(source.id, source.name)
      onClose()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          >
            <div
              className="pointer-events-auto w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-3xl shadow-2xl shadow-black/60 overflow-hidden flex flex-col"
              style={{ maxHeight: '80vh' }}
              onKeyDown={handleKeyDown}
              tabIndex={-1}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/20 flex items-center justify-center">
                    <MonitorUp className="w-4 h-4 text-orange-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-white">Share your screen</h2>
                    <p className="text-xs text-white/40 mt-0.5">
                      Choose what you want to share with the room
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tabs */}
              <div className="px-6 pt-4 shrink-0">
                <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl w-fit border border-white/5">
                  <TabButton
                    active={activeTab === 'screens'}
                    icon={Monitor}
                    label={`Entire Screen${screens.length > 0 ? ` (${screens.length})` : ''}`}
                    onClick={() => {
                      setActiveTab('screens')
                      setSelectedId(null)
                    }}
                  />
                  <TabButton
                    active={activeTab === 'windows'}
                    icon={AppWindow}
                    label={`Window${windows.length > 0 ? ` (${windows.length})` : ''}`}
                    onClick={() => {
                      setActiveTab('windows')
                      setSelectedId(null)
                    }}
                  />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
                {loading && (
                  <div className="flex flex-col items-center justify-center h-48 gap-3">
                    <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />
                    <p className="text-sm text-white/40">Scanning available sources…</p>
                  </div>
                )}

                {error && !loading && (
                  <div className="flex flex-col items-center justify-center h-48 gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    </div>
                    <p className="text-sm text-white/50 text-center max-w-xs">{error}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/10 text-white/70 hover:bg-white/10"
                      onClick={fetchSources}
                    >
                      Retry
                    </Button>
                  </div>
                )}

                {!loading && !error && displayedSources.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-48 gap-2">
                    <Monitor className="w-8 h-8 text-white/20" />
                    <p className="text-sm text-white/40">
                      No {activeTab === 'screens' ? 'screens' : 'windows'} found
                    </p>
                  </div>
                )}

                {!loading && !error && displayedSources.length > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    {displayedSources.map((source) => (
                      <SourceTile
                        key={source.id}
                        source={{ ...source, thumbnail: thumbnailCache[source.id] }}
                        isSelected={selectedId === source.id}
                        isHovered={hoveredId === source.id}
                        onHover={(id) => {
                          setHoveredId(id)
                          if (id) fetchThumbnail(id)
                        }}
                        onClick={() => {
                          setSelectedId(source.id)
                          fetchThumbnail(source.id)
                        }}
                        onDoubleClick={() => {
                          setSelectedId(source.id)
                          onSelect(source.id, source.name)
                          onClose()
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 pb-6 pt-4 border-t border-white/5 flex items-center justify-between shrink-0 gap-3">
                <p className="text-xs text-white/30">
                  {selectedId
                    ? `"${sources.find((s) => s.id === selectedId)?.name}" selected`
                    : 'Click a source to select it, double-click to share immediately'}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="text-white/50 hover:text-white hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={!selectedId}
                    onClick={handleShare}
                    className={cn(
                      'gap-2 transition-all font-medium',
                      selectedId
                        ? 'bg-orange-500 hover:bg-orange-400 text-white'
                        : 'bg-white/5 text-white/30 cursor-not-allowed'
                    )}
                  >
                    <MonitorUp className="w-3.5 h-3.5" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/* ─── Sub-components ────────────────────────────────────────────────────────── */

function TabButton({
  active,
  icon: Icon,
  label,
  onClick
}: {
  active: boolean
  icon: React.ElementType
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all',
        active ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/70'
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  )
}

function SourceTile({
  source,
  isSelected,
  isHovered,
  onHover,
  onClick,
  onDoubleClick
}: {
  source: DesktopSource
  isSelected: boolean
  isHovered: boolean
  onHover: (id: string | null) => void
  onClick: () => void
  onDoubleClick: () => void
}) {
  return (
    <motion.button
      layout
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onHoverStart={() => onHover(source.id)}
      onHoverEnd={() => onHover(null)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'relative flex flex-col rounded-2xl overflow-hidden border transition-all text-left focus:outline-none',
        isSelected
          ? 'border-orange-500/70 ring-2 ring-orange-500/30 bg-orange-500/5'
          : isHovered
            ? 'border-white/20 bg-white/5'
            : 'border-white/8 bg-white/3'
      )}
    >
      {/* Thumbnail */}
      <div className="relative w-full aspect-video bg-zinc-900 overflow-hidden">
        {source.thumbnail ? (
          <img
            src={source.thumbnail}
            alt={source.name}
            className="w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            <Monitor className="w-8 h-8 text-white/20" />
          </div>
        )}

        {/* Selected indicator overlay */}
        {isSelected && (
          <motion.div
            className="absolute inset-0 bg-orange-500/20 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center shadow-lg">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </motion.div>
        )}
      </div>

      {/* Label */}
      <div className="px-3 py-2.5">
        <p
          className={cn(
            'text-xs font-medium truncate transition-colors',
            isSelected ? 'text-orange-300' : 'text-white/70'
          )}
        >
          {source.name}
        </p>
      </div>
    </motion.button>
  )
}
