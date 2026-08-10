import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Loader2, X, Sparkles, Users, Clock, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  pollForMatch,
  leaveDuoQueue,
  type DuoProfile,
  type RoomType
} from './actions'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface MatchingScreenProps {
  queueId: string
  roomType: RoomType
  onClose: () => void
}

// ─── Animated Orbs (waiting background) ──────────────────────────────────────

function PulsingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${120 + i * 60}px`,
            height: `${120 + i * 60}px`,
            left: '50%',
            top: '50%',
            x: '-50%',
            y: '-50%',
            background: `radial-gradient(circle, rgba(var(--primary-rgb), ${0.12 - i * 0.03}) 0%, transparent 70%)`
          }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2.5 + i * 0.5, repeat: Infinity, delay: i * 0.4, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

// ─── Waiting Screen ───────────────────────────────────────────────────────────

function WaitingScreen({ elapsed, onCancel }: { elapsed: number; onCancel: () => void }) {
  const dots = [0, 1, 2]
  const tips = [
    'Our AI is scanning for your perfect match ✨',
    'Looking for shared interests and vibes 🎯',
    'Finding someone who complements you 💫',
    'Checking compatibility scores 🧠',
    'Almost there — great matches take a moment ⏳'
  ]
  const [tipIndex, setTipIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setTipIndex((i) => (i + 1) % tips.length), 3500)
    return () => clearInterval(interval)
  }, [])

  const mins = Math.floor(elapsed / 60)
  const secs = elapsed % 60

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-8 relative">
      <PulsingOrbs />

      {/* Main orb with icon */}
      <div className="relative z-10 mb-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-rose-500/25 to-pink-500/25 border border-rose-500/30 flex items-center justify-center shadow-[0_0_40px_rgba(244,63,94,0.2)]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          >
            <Heart className="w-10 h-10 text-rose-400" />
          </motion.div>
        </div>

        {/* Spinning dots around orb */}
        {dots.map((d) => (
          <motion.div
            key={d}
            className="absolute w-2.5 h-2.5 rounded-full bg-rose-400/70"
            style={{ top: '50%', left: '50%' }}
            animate={{
              x: Math.cos((d * 2 * Math.PI) / 3) * 44 - 5,
              y: Math.sin((d * 2 * Math.PI) / 3) * 44 - 5,
              rotate: 360
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear', delay: d * 0.3 }}
          />
        ))}
      </div>

      <h3 className="text-lg font-bold text-foreground text-center z-10">Finding your Duo</h3>

      {/* Timer */}
      <div className="flex items-center gap-1.5 mt-2 z-10">
        <Clock className="w-3.5 h-3.5 text-muted-foreground/60" />
        <span className="text-sm font-mono text-muted-foreground/70">
          {mins > 0 ? `${mins}m ` : ''}{String(secs).padStart(2, '0')}s
        </span>
      </div>

      {/* Rotating tip */}
      <AnimatePresence mode="wait">
        <motion.p
          key={tipIndex}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3 }}
          className="text-xs text-muted-foreground/70 text-center mt-4 max-w-[220px] z-10"
        >
          {tips[tipIndex]}
        </motion.p>
      </AnimatePresence>

      {/* Stats bar */}
      <div className="flex items-center gap-4 mt-6 z-10">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_5px_rgba(52,211,153,0.7)]" />
          <span className="text-[11px] text-muted-foreground/60 font-medium">Queue active</span>
        </div>
        <div className="w-px h-3 bg-border/50" />
        <div className="flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-amber-400" />
          <span className="text-[11px] text-muted-foreground/60 font-medium">AI matching</span>
        </div>
      </div>

      <Button
        variant="ghost"
        onClick={onCancel}
        className="mt-8 h-9 text-xs text-muted-foreground/60 hover:text-foreground hover:bg-muted/30 rounded-xl gap-1.5 z-10"
      >
        <X className="w-3.5 h-3.5" /> Cancel Search
      </Button>
    </div>
  )
}

// ─── Match Reveal Screen ──────────────────────────────────────────────────────

function MatchRevealScreen({
  matchedWith,
  matchScore,
  roomType,
  roomId,
  onClose
}: {
  matchedWith: DuoProfile
  matchScore: number
  roomType: RoomType
  roomId: string
  onClose: () => void
}) {
  const [countdown, setCountdown] = useState(4)
  const navigate = useNavigate()

  const typeConfig = {
    romantic: { label: 'Romantic', emoji: '🌹', color: 'from-rose-500 to-pink-600' },
    friends: { label: 'Friends', emoji: '👫', color: 'from-blue-500 to-violet-600' },
    family: { label: 'Family', emoji: '👨‍👩‍👧', color: 'from-amber-500 to-orange-600' }
  }
  const config = typeConfig[roomType]

  const handleEnter = useCallback(() => {
    navigate(`/room/${roomId}`)
    onClose()
  }, [navigate, roomId, onClose])

  // Auto-join countdown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      handleEnter()
    }
  }, [countdown, handleEnter])

  const scoreColor =
    matchScore >= 75 ? 'text-emerald-400' : matchScore >= 50 ? 'text-amber-400' : 'text-blue-400'
  const scoreLabel =
    matchScore >= 75 ? 'Excellent Match!' : matchScore >= 50 ? 'Good Match!' : 'Potential Match!'

  return (
    <div className="flex flex-col items-center px-6 py-6 flex-1 relative overflow-hidden">
      {/* Confetti particles */}
      {Array.from({ length: 18 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full pointer-events-none"
          style={{
            background: ['#f43f5e', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'][i % 6],
            left: `${10 + (i * 80) / 18}%`,
            top: '-8px'
          }}
          animate={{
            y: ['0%', '110%'],
            x: [0, (i % 2 === 0 ? 1 : -1) * (Math.random() * 40 + 10)],
            rotate: [0, (i % 2 === 0 ? 1 : -1) * 360],
            opacity: [1, 0.4]
          }}
          transition={{ duration: 2 + Math.random(), repeat: Infinity, delay: i * 0.15, ease: 'linear' }}
        />
      ))}

      {/* Matched badge */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 80, damping: 12 }}
        className="flex flex-col items-center z-10"
      >
        <div className={cn(
          'px-4 py-1.5 rounded-full text-xs font-bold text-white mb-4 bg-gradient-to-r',
          config.color
        )}>
          {config.emoji} {config.label} Match Found!
        </div>

        {/* Avatar */}
        <div className="relative">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/50 shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)]">
            {matchedWith.avatar_url ? (
              <img src={matchedWith.avatar_url} alt="match" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                <Users className="w-8 h-8 text-primary/60" />
              </div>
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center">
            <Heart className="w-3 h-3 text-white" />
          </div>
        </div>

        <h3 className="text-lg font-bold text-foreground mt-3">
          {matchedWith.full_name || matchedWith.username || 'Anonymous'}
        </h3>
        {matchedWith.username && matchedWith.full_name && (
          <p className="text-xs text-muted-foreground">@{matchedWith.username}</p>
        )}

        {/* Match score */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col items-center mt-4 mb-2"
        >
          <div className={cn('text-4xl font-black', scoreColor)}>{matchScore}%</div>
          <div className={cn('text-xs font-semibold', scoreColor)}>{scoreLabel}</div>
        </motion.div>

        {/* Score bar */}
        <div className="w-48 h-2 bg-muted/40 rounded-full overflow-hidden mt-1">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${matchScore}%` }}
            transition={{ duration: 1, delay: 0.6, ease: 'easeOut' }}
            className={cn(
              'h-full rounded-full bg-gradient-to-r',
              matchScore >= 75
                ? 'from-emerald-500 to-emerald-400'
                : matchScore >= 50
                  ? 'from-amber-500 to-amber-400'
                  : 'from-blue-500 to-blue-400'
            )}
          />
        </div>
      </motion.div>

      {/* AI Room Name + Enter */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="w-full mt-6 space-y-2 z-10"
      >
        {/* Auto Join Status */}
        <div className="flex flex-col items-center gap-1.5 mt-2 bg-muted/20 border border-border/30 rounded-xl px-4 py-3">
          <Sparkles className="w-3.5 h-3.5 text-primary/60 shrink-0" />
          <div className="flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary/60" />
            <span className="text-sm font-semibold text-foreground">Joining automatically...</span>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground/50 text-center">
          You will be redirected in {countdown} seconds
        </p>

        <button
          onClick={handleEnter}
          className={cn(
            'w-full h-11 font-bold rounded-xl gap-2 flex items-center justify-center text-white transition-all',
            'bg-gradient-to-r from-rose-500 to-pink-600 hover:opacity-90 shadow-lg shadow-rose-500/25'
          )}
        >
          <Sparkles className="w-4 h-4" /> Enter Now ({countdown}s)
        </button>
      </motion.div>
    </div>
  )
}




// ─── Main Matching Screen ─────────────────────────────────────────────────────

export function DuoMatchingScreen({ queueId, roomType, onClose }: MatchingScreenProps) {
  const [elapsed, setElapsed] = useState(0)
  const [matched, setMatched] = useState(false)
  const [matchedWith, setMatchedWith] = useState<DuoProfile | null>(null)
  const [matchScore, setMatchScore] = useState(0)
  const [roomId, setRoomId] = useState('')
  const [duoRoomId, setDuoRoomId] = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current)
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

  const handleCancel = useCallback(async () => {
    stopPolling()
    await leaveDuoQueue(queueId)
    onClose()
  }, [queueId, onClose, stopPolling])

  useEffect(() => {
    // Timer
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000)

    // Polling every 4 seconds
    const doPoll = async () => {
      const res = await pollForMatch(queueId)
      if (res.matched && res.matchedWith) {
        stopPolling()
        setMatchedWith(res.matchedWith)
        setMatchScore(res.matchScore || 0)
        setRoomId(res.roomId || '')
        setDuoRoomId(res.duoRoomId || '')
        setMatched(true)
      }
    }

    doPoll()
    pollRef.current = setInterval(doPoll, 4000)

    return stopPolling
  }, [queueId, stopPolling])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500/30 to-pink-500/30 border border-rose-500/30 flex items-center justify-center">
            <Heart className="w-4 h-4 text-rose-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">
              {matched ? 'Match Found! 🎉' : 'Searching...'}
            </h2>
            <p className="text-[10px] text-muted-foreground capitalize">{roomType} room</p>
          </div>
        </div>
        {!matched && (
          <div className="flex items-center gap-1.5">
            <Loader2 className="w-3.5 h-3.5 text-primary/70 animate-spin" />
            <span className="text-[11px] text-muted-foreground/60 font-medium">Live</span>
          </div>
        )}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {!matched ? (
          <motion.div
            key="waiting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            <WaitingScreen elapsed={elapsed} onCancel={handleCancel} />
          </motion.div>
        ) : (
          <motion.div
            key="matched"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 60, damping: 14 }}
            className="flex-1 flex flex-col"
          >
            <MatchRevealScreen
              matchedWith={matchedWith!}
              matchScore={matchScore}
              roomType={roomType}
              roomId={roomId}
              onClose={onClose}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
