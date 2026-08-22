import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare,
  Mic,
  Video,
  Gift,
  Lock,
  CheckCircle2,
  ChevronUp
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getDuoRoom, type DuoRoom, type RoomType } from './actions'

// ─── Types ────────────────────────────────────────────────────────────────────

interface UnlockBarProps {
  roomId: string
  /** If provided, uses this data instead of fetching */
  duoRoom?: DuoRoom
}

interface StageConfig {
  key: keyof Pick<DuoRoom, 'chat_unlocked' | 'voice_unlocked' | 'video_unlocked' | 'extras_unlocked'>
  label: string
  icon: React.ElementType
  color: string
  glow: string
  getProgress: (duo: DuoRoom) => { current: number; max: number }
  getHint: (duo: DuoRoom, roomType: RoomType) => string
}

// ─── Stage Definitions ────────────────────────────────────────────────────────

const EXTRAS_LABELS: Record<RoomType, string> = {
  romantic: 'Date Activities',
  friends: 'Mini Games',
  family: 'Memory Wall'
}

const STAGES: StageConfig[] = [
  {
    key: 'chat_unlocked',
    label: 'Chat',
    icon: MessageSquare,
    color: 'text-emerald-500',
    glow: 'bg-emerald-500/10 border-emerald-500/30',
    getProgress: () => ({ current: 1, max: 1 }),
    getHint: () => 'Chat is always available from the start'
  },
  {
    key: 'voice_unlocked',
    label: 'Voice',
    icon: Mic,
    color: 'text-blue-500',
    glow: 'bg-blue-500/10 border-blue-500/30',
    getProgress: (duo) => ({
      current: Math.min(duo.chat_message_count, duo.voice_unlock_at),
      max: duo.voice_unlock_at
    }),
    getHint: (duo) =>
      duo.voice_unlocked
        ? 'Voice calls unlocked!'
        : `${Math.max(0, duo.voice_unlock_at - duo.chat_message_count)} more messages to unlock voice`
  },
  {
    key: 'video_unlocked',
    label: 'Video',
    icon: Video,
    color: 'text-violet-500',
    glow: 'bg-violet-500/10 border-violet-500/30',
    getProgress: (duo) => ({
      current: Math.min(duo.call_count, duo.video_unlock_at),
      max: duo.video_unlock_at
    }),
    getHint: (duo) =>
      duo.video_unlocked
        ? 'Video calls unlocked!'
        : `${Math.max(0, duo.video_unlock_at - duo.call_count)} more voice calls to unlock video`
  },
  {
    key: 'extras_unlocked',
    label: 'Extras',
    icon: Gift,
    color: 'text-rose-500',
    glow: 'bg-rose-500/10 border-rose-500/30',
    getProgress: (duo) => ({ current: duo.video_unlocked ? 1 : 0, max: 1 }),
    getHint: (duo, rt) =>
      duo.extras_unlocked
        ? `${EXTRAS_LABELS[rt]} unlocked!`
        : `Unlock video first to access ${EXTRAS_LABELS[rt]}`
  }
]

// ─── Single Stage Item ────────────────────────────────────────────────────────

function StageItem({
  stage,
  duo,
  isExpanded,
  onClick
}: {
  stage: StageConfig
  duo: DuoRoom
  isExpanded: boolean
  onClick: () => void
}) {
  const unlocked = duo[stage.key] as boolean
  const { current, max } = stage.getProgress(duo)
  const pct = unlocked ? 100 : Math.round((current / max) * 100)
  const hint = stage.getHint(duo, duo.room_type as RoomType)
  const Icon = stage.icon

  return (
    <div className="flex-1 min-w-0">
      <button
        onClick={onClick}
        className={cn(
          'w-full flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all duration-200 group',
          unlocked
            ? 'cursor-default'
            : 'hover:bg-muted/20 cursor-pointer'
        )}
      >
        {/* Icon ring */}
        <div
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300',
            unlocked
              ? stage.glow
              : 'bg-muted/30 border-border/40'
          )}
        >
          {unlocked ? (
            <Icon className={cn('w-4 h-4', stage.color)} />
          ) : (
            <Lock className="w-3.5 h-3.5 text-muted-foreground/40" />
          )}
        </div>

        {/* Label */}
        <span className={cn(
          'text-[10px] font-semibold',
          unlocked ? stage.color : 'text-muted-foreground/50'
        )}>
          {stage.label}
        </span>

        {/* Mini progress bar */}
        {!unlocked && (
          <div className="w-full h-0.5 bg-muted/30 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full bg-primary/40 rounded-full"
            />
          </div>
        )}

        {unlocked && (
          <CheckCircle2 className={cn('w-3 h-3', stage.color)} />
        )}
      </button>

      {/* Expanded hint */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-1 mx-1 p-2 rounded-lg bg-muted/20 border border-border/30">
              <p className="text-[10px] text-muted-foreground leading-relaxed text-center">{hint}</p>
              {!unlocked && (
                <div className="mt-1.5 flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground/60">{current}/{max}</span>
                  <span className="font-semibold text-primary/70">{pct}%</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Connector Line Between Stages ───────────────────────────────────────────

function Connector({ active }: { active: boolean }) {
  return (
    <div className="flex items-center justify-center pt-4 shrink-0">
      <div
        className={cn(
          'h-px w-6 transition-all duration-500',
          active ? 'bg-primary/60' : 'bg-border/30'
        )}
      />
    </div>
  )
}

// ─── Main Unlock Bar ──────────────────────────────────────────────────────────

export function DuoUnlockBar({ roomId, duoRoom: initialDuo }: UnlockBarProps) {
  const [duo, setDuo] = useState<DuoRoom | null>(initialDuo || null)
  const [expandedStage, setExpandedStage] = useState<string | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    if (initialDuo) {
      setDuo(initialDuo)
      return
    }
    getDuoRoom(roomId).then(setDuo)
    // Refresh every 15s
    const interval = setInterval(() => getDuoRoom(roomId).then(setDuo), 15000)
    return () => clearInterval(interval)
  }, [roomId, initialDuo])

  if (!duo) return null

  const toggleStage = (key: string) => {
    setExpandedStage((prev) => (prev === key ? null : key))
  }

  const unlockedCount = STAGES.filter((s) => duo[s.key]).length

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-background/80 backdrop-blur-xl border-b border-border/40 shadow-sm"
    >
      {/* Collapsed / Expanded toggle */}
      <button
        onClick={() => setIsCollapsed((c) => !c)}
        className="w-full flex items-center justify-between px-4 py-2 hover:bg-muted/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Gift className="w-3.5 h-3.5 text-rose-400" />
          <span className="text-[11px] font-semibold text-foreground">Duo Unlocks</span>
          <span className="text-[10px] text-muted-foreground/60">
            {unlockedCount}/{STAGES.length} stages
          </span>
        </div>
        <motion.div animate={{ rotate: isCollapsed ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronUp className="w-3.5 h-3.5 text-muted-foreground/50" />
        </motion.div>
      </button>

      {/* Stage row */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3">
              <div className="flex items-start">
                {STAGES.map((stage, i) => (
                  <div key={stage.key} className="flex items-start flex-1 min-w-0">
                    <StageItem
                      stage={stage}
                      duo={duo}
                      isExpanded={expandedStage === stage.key}
                      onClick={() => toggleStage(stage.key)}
                    />
                    {i < STAGES.length - 1 && (
                      <Connector active={!!duo[STAGES[i + 1].key]} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Unlock Toast (shown when a new stage unlocks) ───────────────────────────

export function showUnlockToast(stage: 'voice' | 'video' | 'extras', roomType?: RoomType) {
  const config = {
    voice: { emoji: '🎙️', label: 'Voice calls unlocked!', sub: 'You can now call each other' },
    video: { emoji: '📹', label: 'Video calls unlocked!', sub: 'Switch on your camera' },
    extras: {
      emoji: '🎁',
      label: `${roomType ? EXTRAS_LABELS[roomType] : 'Extras'} unlocked!`,
      sub: 'New features are now available'
    }
  }
  return config[stage]
}
