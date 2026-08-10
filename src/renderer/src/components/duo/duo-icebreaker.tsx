import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Send, Clock, Loader2, CheckCircle2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  saveIcebreakerAnswers,
  getIcebreakerAnswers,
  type IcebreakerAnswers,
  type DuoRoom
} from './actions'
import { createClient } from '@/lib/supabase/client'

// ─── Question Bank ────────────────────────────────────────────────────────────

const QUESTIONS_BY_TYPE = {
  romantic: [
    "What's your idea of a perfect evening?",
    'The thing that makes you laugh most is…',
    'Your biggest dream in life is…'
  ],
  friends: [
    "Your go-to activity when you're bored is…",
    'The most fun you\'ve ever had was…',
    'Your unpopular opinion is…'
  ],
  family: [
    'Your happiest childhood memory is…',
    'The value you hold closest is…',
    'Something you\'d love to do together is…'
  ]
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface IcebreakerProps {
  duoRoom: DuoRoom
  partnerProfile: { full_name?: string; avatar_url?: string; username?: string } | null
  onComplete: () => void
}

// ─── Answer Reveal Card ───────────────────────────────────────────────────────

function AnswerCard({
  question,
  myAnswer,
  theirAnswer,
  theirName,
  index
}: {
  question: string
  myAnswer?: string
  theirAnswer?: string
  theirName: string
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.12, type: 'spring', stiffness: 60, damping: 14 }}
      className="space-y-3"
    >
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Q{index + 1}: {question}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {/* My answer */}
        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
          <p className="text-[10px] font-bold text-primary/70 mb-1">You</p>
          <p className="text-sm text-foreground leading-relaxed">{myAnswer || '—'}</p>
        </div>
        {/* Their answer */}
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
          <p className="text-[10px] font-bold text-rose-400/70 mb-1">{theirName}</p>
          <p className="text-sm text-foreground leading-relaxed">{theirAnswer || '—'}</p>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main Icebreaker Component ────────────────────────────────────────────────

export function DuoIcebreaker({ duoRoom, partnerProfile, onComplete }: IcebreakerProps) {
  const questions = QUESTIONS_BY_TYPE[duoRoom.room_type] || QUESTIONS_BY_TYPE.friends
  const [answers, setAnswers] = useState<Record<number, string>>(
    Object.fromEntries(questions.map((_, i) => [i, '']))
  )
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [theirAnswers, setTheirAnswers] = useState<IcebreakerAnswers | null>(null)
  const [pollCount, setPollCount] = useState(0)
  const [currentQ, setCurrentQ] = useState(0)

  const partnerName = partnerProfile?.full_name || partnerProfile?.username || 'Your match'

  // After submission, poll for their answers
  useEffect(() => {
    if (!submitted) return
    const interval = setInterval(async () => {
      const res = await getIcebreakerAnswers(duoRoom.id)
      setPollCount((c) => c + 1)
      if (res.theirs) {
        setTheirAnswers(res.theirs)
        clearInterval(interval)
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [submitted, duoRoom.id])

  const handleSubmit = async () => {
    const answersMap: IcebreakerAnswers = {}
    questions.forEach((q, i) => { answersMap[q] = answers[i] || '' })
    setIsSubmitting(true)
    await saveIcebreakerAnswers(duoRoom.id, answersMap)
    setIsSubmitting(false)
    setSubmitted(true)
  }

  const allAnswered = questions.every((_, i) => answers[i]?.trim())

  const typeConfig = {
    romantic: { emoji: '🌹', color: 'from-rose-500/20 to-pink-500/20', border: 'border-rose-500/30', accent: 'text-rose-400' },
    friends: { emoji: '👫', color: 'from-blue-500/20 to-violet-500/20', border: 'border-blue-500/30', accent: 'text-blue-400' },
    family: { emoji: '👨‍👩‍👧', color: 'from-amber-500/20 to-orange-500/20', border: 'border-amber-500/30', accent: 'text-amber-400' }
  }
  const cfg = typeConfig[duoRoom.room_type]

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <div className={cn('px-6 py-5 bg-gradient-to-r border-b', cfg.color, cfg.border)}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-background/30 backdrop-blur flex items-center justify-center text-xl">
            {cfg.emoji}
          </div>
          <div>
            <h2 className="font-bold text-foreground text-base">Ice Breakers ✨</h2>
            <p className="text-xs text-muted-foreground">
              Answer 3 questions — then see what {partnerName} said!
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        <AnimatePresence mode="wait">

          {/* ── Phase 1: Answering ── */}
          {!submitted && (
            <motion.div
              key="answering"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              {/* Step indicator */}
              <div className="flex items-center gap-2">
                {questions.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentQ(i)}
                    className={cn(
                      'flex-1 h-1.5 rounded-full transition-all duration-300',
                      i <= currentQ ? 'bg-primary' : 'bg-muted/40'
                    )}
                  />
                ))}
              </div>

              {/* Current question */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQ}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3"
                >
                  <div className="flex items-start gap-2">
                    <span className={cn('text-2xl font-black', cfg.accent)}>Q{currentQ + 1}</span>
                    <h3 className="text-base font-semibold text-foreground leading-snug pt-1">
                      {questions[currentQ]}
                    </h3>
                  </div>
                  <textarea
                    value={answers[currentQ]}
                    onChange={(e) => setAnswers((a) => ({ ...a, [currentQ]: e.target.value }))}
                    placeholder="Type your answer..."
                    rows={4}
                    autoFocus
                    maxLength={200}
                    className="w-full rounded-xl border border-border/40 bg-muted/20 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 resize-none focus:outline-none focus:border-primary/40 transition-colors"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground/50">{answers[currentQ]?.length || 0}/200</span>
                    <div className="flex gap-2">
                      {currentQ > 0 && (
                        <Button variant="ghost" size="sm" onClick={() => setCurrentQ((q) => q - 1)} className="h-8 text-xs rounded-lg">
                          ← Back
                        </Button>
                      )}
                      {currentQ < questions.length - 1 ? (
                        <Button
                          size="sm"
                          onClick={() => setCurrentQ((q) => q + 1)}
                          disabled={!answers[currentQ]?.trim()}
                          className="h-8 text-xs rounded-lg bg-primary hover:bg-primary/90"
                        >
                          Next →
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={handleSubmit}
                          disabled={!allAnswered || isSubmitting}
                          className="h-8 text-xs rounded-lg bg-gradient-to-r from-rose-500 to-pink-600 hover:opacity-90 text-white gap-1.5"
                        >
                          {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                          Submit
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* All questions summary dots */}
              <div className="grid grid-cols-3 gap-2">
                {questions.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentQ(i)}
                    className={cn(
                      'p-2.5 rounded-xl border text-xs font-medium transition-all',
                      answers[i]?.trim()
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : i === currentQ
                          ? 'bg-primary/10 border-primary/30 text-primary'
                          : 'bg-muted/10 border-border/30 text-muted-foreground/50'
                    )}
                  >
                    {answers[i]?.trim() ? '✓ ' : ''}Q{i + 1}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Phase 2: Waiting for partner ── */}
          {submitted && !theirAnswers && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12 gap-5"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-500/20 to-pink-500/20 border border-rose-500/30 flex items-center justify-center">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}>
                    <Heart className="w-7 h-7 text-rose-400" />
                  </motion.div>
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="font-bold text-foreground">Your answers are in!</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Waiting for {partnerName} to answer...
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
                <Clock className="w-3.5 h-3.5" />
                <span>Checking every 3 seconds ({pollCount} checks)</span>
              </div>
              <div className="flex gap-1">
                {[0,1,2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-primary/60"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Phase 3: Reveal ── */}
          {submitted && theirAnswers && (
            <motion.div
              key="reveal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-5"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 60 }}
                className="text-center py-3"
              >
                <div className="text-3xl mb-2">🎉</div>
                <h3 className="font-bold text-foreground">Both answers are in!</h3>
                <p className="text-xs text-muted-foreground">See how you compare with {partnerName}</p>
              </motion.div>

              {questions.map((q, i) => (
                <AnswerCard
                  key={i}
                  question={q}
                  myAnswer={answers[i]}
                  theirAnswer={theirAnswers[q]}
                  theirName={partnerName}
                  index={i}
                />
              ))}

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="pt-2"
              >
                <Button
                  onClick={onComplete}
                  className="w-full h-11 font-bold rounded-xl gap-2 bg-gradient-to-r from-primary to-primary/80 hover:opacity-90"
                >
                  <Users className="w-4 h-4" />
                  Enter Your Duo Room
                </Button>
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
