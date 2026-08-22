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

// ─── Minimal Waiting Animation ──────────────────────────────────────────────────

function ScanningRadar() {
  return (
    <div className="relative flex items-center justify-center w-32 h-32">
      <motion.div
        className="absolute inset-0 rounded-full border border-primary/20"
        animate={{ scale: [1, 1.5], opacity: [1, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
      />
      <motion.div
        className="absolute inset-0 rounded-full border border-primary/10"
        animate={{ scale: [1, 2], opacity: [1, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
      />
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
        <Heart className="w-6 h-6 text-primary" />
      </div>
    </div>
  )
}

// ─── Waiting Screen ───────────────────────────────────────────────────────────

function WaitingScreen({ elapsed, onCancel }: { elapsed: number; onCancel: () => void }) {
  const tips = [
    'Scanning for a perfect match...',
    'Looking for shared interests...',
    'Finding someone who complements you...',
    'Checking compatibility...'
  ]
  const [tipIndex, setTipIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setTipIndex((i) => (i + 1) % tips.length), 4000)
    return () => clearInterval(interval)
  }, [])

  const mins = Math.floor(elapsed / 60)
  const secs = elapsed % 60

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-12">
      <ScanningRadar />

      <h3 className="text-xl tracking-tight font-semibold text-foreground mt-8">Finding your Match</h3>
      
      {/* Timer */}
      <div className="flex items-center gap-2 mt-3">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground font-mono">
          {mins > 0 ? `${mins}:` : ''}{String(secs).padStart(2, '0')}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={tipIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="text-sm text-muted-foreground text-center mt-6 h-6"
        >
          {tips[tipIndex]}
        </motion.p>
      </AnimatePresence>

      <Button
        variant="ghost"
        onClick={onCancel}
        className="mt-12 text-sm text-muted-foreground hover:text-foreground"
      >
        Cancel Search
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
    navigate(`/room/${roomId}`, { state: { isDuo: true } })
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
    <div className="flex flex-col items-center px-6 py-10 flex-1 relative overflow-hidden bg-background">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center w-full max-w-sm"
      >
        <div className="px-3 py-1 rounded-full text-[10px] font-semibold text-muted-foreground border border-border/50 uppercase tracking-wider mb-8">
          Match Found
        </div>

        {/* Profile Avatar */}
        <div className="w-24 h-24 rounded-full overflow-hidden border border-border bg-muted flex items-center justify-center mb-6">
          {matchedWith.avatar_url ? (
            <img src={matchedWith.avatar_url} alt="match" className="w-full h-full object-cover" />
          ) : (
            <Users className="w-10 h-10 text-muted-foreground/50" />
          )}
        </div>

        <h3 className="text-2xl font-bold tracking-tight text-foreground text-center">
          {matchedWith.full_name || matchedWith.username || 'Anonymous'}
        </h3>
        {matchedWith.username && matchedWith.full_name && (
          <p className="text-sm text-muted-foreground mt-1">@{matchedWith.username}</p>
        )}

        {/* Minimal Score View */}
        <div className="flex flex-col items-center mt-8 w-full">
          <div className="flex items-baseline gap-2 mb-2">
            <span className={cn('text-3xl font-light', scoreColor)}>{matchScore}%</span>
            <span className="text-sm text-muted-foreground font-medium">Match Score</span>
          </div>
          
          <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${matchScore}%` }}
              transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
              className={cn(
                'h-full rounded-full',
                matchScore >= 75 ? 'bg-emerald-500' : matchScore >= 50 ? 'bg-amber-500' : 'bg-blue-500'
              )}
            />
          </div>
        </div>
      </motion.div>

      {/* Auto Join Status & Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="w-full mt-auto max-w-sm space-y-4"
      >
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Entering room in {countdown}s...</span>
        </div>

        <Button
          onClick={handleEnter}
          className="w-full h-12 text-base font-medium"
        >
          Enter Now
        </Button>
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
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 shrink-0 bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Heart className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground tracking-tight">
              {matched ? 'Match Found' : 'Searching'}
            </h2>
            <p className="text-xs text-muted-foreground capitalize">{roomType} Room</p>
          </div>
        </div>
        {!matched && (
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
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
