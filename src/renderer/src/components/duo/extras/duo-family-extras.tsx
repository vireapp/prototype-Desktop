import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutGrid, Clock, Pin, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Memory {
  id: string
  emoji: string
  title: string
  description: string
  createdAt: Date
  colorIdx: number
}

type ViewMode = 'grid' | 'timeline'

// ─── Constants ────────────────────────────────────────────────────────────────

const EMOJI_OPTIONS = ['📸', '🏖️', '🎂', '🎄', '🌻', '🐾', '🎉', '🌅']

const CARD_GRADIENTS = [
  'from-amber-900/60 to-orange-900/50',
  'from-orange-900/60 to-red-900/50',
  'from-yellow-900/60 to-amber-900/50',
  'from-rose-900/60 to-orange-900/50',
  'from-amber-800/60 to-yellow-900/50',
]

const CARD_BORDERS = [
  'border-amber-700/40',
  'border-orange-700/40',
  'border-yellow-700/40',
  'border-rose-700/40',
  'border-amber-600/40',
]

// ─── Add Memory Form ──────────────────────────────────────────────────────────

interface AddMemoryFormProps {
  onAdd: (memory: Omit<Memory, 'id' | 'createdAt' | 'colorIdx'>) => void
}

function AddMemoryForm({ onAdd }: AddMemoryFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState<string>('📸')
  const [open, setOpen] = useState(false)

  const handlePin = () => {
    const t = title.trim()
    const d = description.trim()
    if (!t) return
    onAdd({ emoji: selectedEmoji, title: t, description: d })
    setTitle('')
    setDescription('')
    setSelectedEmoji('📸')
    setOpen(false)
  }

  return (
    <div className="rounded-xl border border-amber-700/30 bg-amber-950/20 overflow-hidden">
      {/* Collapsed toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-amber-200/80 hover:text-amber-100 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Pin className="w-3.5 h-3.5 text-amber-400/70" />
          Add a Memory
        </span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-amber-400/60 text-lg leading-none"
        >
          +
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 flex flex-col gap-3">
              {/* Emoji picker */}
              <div>
                <p className="text-[11px] text-amber-400/50 mb-1.5 uppercase tracking-wider">Choose an emoji</p>
                <div className="flex gap-1.5 flex-wrap">
                  {EMOJI_OPTIONS.map(em => (
                    <motion.button
                      key={em}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setSelectedEmoji(em)}
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all',
                        selectedEmoji === em
                          ? 'bg-amber-600/50 border border-amber-500/60 ring-1 ring-amber-400/40'
                          : 'bg-amber-950/40 border border-amber-800/30 hover:border-amber-600/40'
                      )}
                    >
                      {em}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Memory title…"
                className="bg-amber-950/30 border-amber-800/40 text-amber-100 placeholder:text-amber-400/40 focus-visible:ring-amber-500/50"
              />

              {/* Description */}
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="A short description… (optional)"
                rows={2}
                className="w-full resize-none rounded-lg bg-amber-950/30 border border-amber-800/40 text-amber-100 placeholder:text-amber-400/40 text-sm px-3 py-2 outline-none focus:border-amber-600/60 transition-colors"
              />

              <Button
                onClick={handlePin}
                disabled={!title.trim()}
                className="self-end bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white border-0 gap-2 disabled:opacity-40"
              >
                <Pin className="w-3.5 h-3.5" />
                Pin It!
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Memory Card ──────────────────────────────────────────────────────────────

function MemoryCard({ memory, index }: { memory: Memory; index: number }) {
  const gradient = CARD_GRADIENTS[memory.colorIdx % CARD_GRADIENTS.length]
  const border   = CARD_BORDERS[memory.colorIdx % CARD_BORDERS.length]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.7, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.6, y: -10 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24, delay: index * 0.04 }}
      className={cn(
        'rounded-xl border p-3.5 bg-gradient-to-br flex flex-col gap-2',
        gradient, border
      )}
    >
      <span className="text-3xl">{memory.emoji}</span>
      <div>
        <p className="text-sm font-semibold text-amber-100 leading-tight">{memory.title}</p>
        {memory.description && (
          <p className="text-[11px] text-amber-300/60 mt-1 leading-relaxed line-clamp-3">
            {memory.description}
          </p>
        )}
      </div>
      <p className="text-[10px] text-amber-400/40 mt-auto pt-1">
        {memory.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </p>
    </motion.div>
  )
}

// ─── Grid View ────────────────────────────────────────────────────────────────

function GridView({ memories }: { memories: Memory[] }) {
  if (memories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3 text-amber-400/40">
        <span className="text-4xl">📌</span>
        <p className="text-sm">No memories yet — pin your first one!</p>
      </div>
    )
  }

  return (
    <div className="columns-2 gap-2 space-y-2">
      <AnimatePresence>
        {memories.map((m, i) => (
          <div key={m.id} className="break-inside-avoid">
            <MemoryCard memory={m} index={i} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// ─── Timeline View ────────────────────────────────────────────────────────────

function TimelineView({ memories }: { memories: Memory[] }) {
  const sorted = [...memories].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3 text-amber-400/40">
        <span className="text-4xl">🕰️</span>
        <p className="text-sm">No memories yet</p>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col gap-0">
      {/* Vertical line */}
      <div className="absolute left-4 top-2 bottom-2 w-px bg-gradient-to-b from-amber-700/60 via-amber-600/30 to-transparent pointer-events-none" />

      {sorted.map((m, i) => (
        <motion.div
          key={m.id}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24, delay: i * 0.06 }}
          className="relative flex items-start gap-4 pl-10 pb-5"
        >
          {/* Dot */}
          <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 border-2 border-amber-950 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />

          {/* Card */}
          <div
            className={cn(
              'flex-1 rounded-xl border px-3 py-2.5 bg-gradient-to-br',
              CARD_GRADIENTS[m.colorIdx % CARD_GRADIENTS.length],
              CARD_BORDERS[m.colorIdx % CARD_BORDERS.length]
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{m.emoji}</span>
              <p className="text-sm font-semibold text-amber-100">{m.title}</p>
            </div>
            {m.description && (
              <p className="text-[11px] text-amber-300/60 leading-relaxed">{m.description}</p>
            )}
            <p className="text-[10px] text-amber-400/40 mt-1.5">
              {m.createdAt.toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
              })}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DuoFamilyExtras({ duoRoomId }: { duoRoomId: string }) {
  const [memories, setMemories] = useState<Memory[]>([
    {
      id: '1',
      emoji: '🎂',
      title: "Mom's Birthday",
      description: "The whole family came over — best day!",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      colorIdx: 0,
    },
    {
      id: '2',
      emoji: '🏖️',
      title: 'Summer Trip',
      description: 'Packed lunch at the beach 🌊',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      colorIdx: 2,
    },
  ])
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  const addMemory = (data: Omit<Memory, 'id' | 'createdAt' | 'colorIdx'>) => {
    setMemories(prev => [
      {
        ...data,
        id: Date.now().toString(),
        createdAt: new Date(),
        colorIdx: prev.length,
      },
      ...prev,
    ])
  }

  return (
    <div className="flex flex-col gap-0 rounded-2xl overflow-hidden border border-amber-800/30 bg-black/30 backdrop-blur-xl shadow-2xl shadow-amber-950/30">
      {/* Header */}
      <div className="relative px-5 pt-5 pb-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/60 via-orange-900/40 to-amber-950/60 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.15),transparent_60%)] pointer-events-none" />

        <div className="relative flex items-start justify-between">
          <div>
            <motion.h2
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="text-lg font-semibold bg-gradient-to-r from-amber-200 via-orange-200 to-amber-100 bg-clip-text text-transparent tracking-tight"
            >
              Memory Wall 📸
            </motion.h2>
            <p className="text-[11px] text-amber-400/60 mt-0.5">
              {memories.length} {memories.length === 1 ? 'memory' : 'memories'} pinned
            </p>
          </div>

          {/* View toggle */}
          <div className="relative flex items-center bg-amber-950/50 border border-amber-800/40 rounded-lg p-1 gap-0.5">
            {([
              { id: 'grid' as ViewMode, icon: LayoutGrid, label: 'Grid' },
              { id: 'timeline' as ViewMode, icon: Clock,     label: 'Timeline' },
            ] as const).map(({ id, icon: Icon, label }) => {
              const active = viewMode === id
              return (
                <motion.button
                  key={id}
                  onClick={() => setViewMode(id)}
                  whileTap={{ scale: 0.92 }}
                  title={label}
                  className={cn(
                    'relative p-1.5 rounded-md transition-colors',
                    active ? 'text-amber-100' : 'text-amber-400/50 hover:text-amber-300/70'
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="family-view-bg"
                      className="absolute inset-0 rounded-md bg-amber-600/50 border border-amber-500/40"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon className="relative z-10 w-3.5 h-3.5" />
                </motion.button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 pt-3 flex flex-col gap-4">
        {/* Add memory form */}
        <AddMemoryForm onAdd={addMemory} />

        {/* Memory display */}
        <div className="overflow-y-auto max-h-[340px] pr-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {viewMode === 'grid' ? (
                <GridView memories={memories} />
              ) : (
                <TimelineView memories={memories} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
