import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Music, Mail, UtensilsCrossed, Plus, Send, Heart, Play, Pause, RotateCcw, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Song {
  id: string
  title: string
  addedBy: string
  addedAt: Date
}

interface LoveNote {
  id: string
  text: string
  author: string
  sentAt: Date
}

// ─── Tab definitions ─────────────────────────────────────────────────────────

const TABS = [
  { id: 'playlist', label: 'Shared Playlist', icon: Music, emoji: '🎵' },
  { id: 'notes',    label: 'Love Notes',      icon: Mail,  emoji: '💌' },
  { id: 'dinner',   label: 'Virtual Dinner',  icon: UtensilsCrossed, emoji: '🍽️' },
] as const

type TabId = (typeof TABS)[number]['id']

// ─── Shared Playlist ─────────────────────────────────────────────────────────

function SharedPlaylist() {
  const [songs, setSongs] = useState<Song[]>([
    { id: '1', title: 'Perfect – Ed Sheeran', addedBy: 'You', addedAt: new Date() },
    { id: '2', title: 'Lover – Taylor Swift',  addedBy: 'Partner', addedAt: new Date() },
  ])
  const [input, setInput] = useState('')

  const addSong = () => {
    const trimmed = input.trim()
    if (!trimmed) return
    setSongs(prev => [
      ...prev,
      { id: Date.now().toString(), title: trimmed, addedBy: 'You', addedAt: new Date() },
    ])
    setInput('')
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Add song row */}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addSong()}
          placeholder="Add a song name…"
          className="flex-1 bg-rose-950/30 border-rose-800/40 text-rose-100 placeholder:text-rose-400/50 focus-visible:ring-rose-500/50"
        />
        <Button
          size="sm"
          onClick={addSong}
          className="bg-rose-600 hover:bg-rose-500 text-white border-0 shrink-0"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Song list */}
      <div className="overflow-y-auto max-h-52 flex flex-col gap-2 pr-1">
        <AnimatePresence initial={false}>
          {songs.map((song, i) => (
            <motion.div
              key={song.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-rose-950/30 border border-rose-800/30"
            >
              <Music className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="text-sm text-rose-100 flex-1 truncate">{song.title}</span>
              <span className="text-[10px] text-rose-400/60 shrink-0">{song.addedBy}</span>
              <button
                onClick={() => setSongs(prev => prev.filter(s => s.id !== song.id))}
                className="text-rose-500/40 hover:text-rose-400 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        {songs.length === 0 && (
          <p className="text-center text-rose-400/40 text-sm py-6">
            No songs yet — add your first one! 🎵
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Love Notes ──────────────────────────────────────────────────────────────

function LoveNotes() {
  const [notes, setNotes] = useState<LoveNote[]>([
    {
      id: '1',
      text: 'Thinking of you today 💕',
      author: 'Partner',
      sentAt: new Date(),
    },
  ])
  const [draft, setDraft] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const sendNote = () => {
    const trimmed = draft.trim()
    if (!trimmed) return
    setNotes(prev => [
      ...prev,
      { id: Date.now().toString(), text: trimmed, author: 'You', sentAt: new Date() },
    ])
    setDraft('')
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [notes])

  return (
    <div className="flex flex-col gap-4">
      {/* Notes list */}
      <div className="overflow-y-auto max-h-48 flex flex-col gap-3 pr-1">
        <AnimatePresence initial={false}>
          {notes.map((note, i) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ type: 'spring', stiffness: 280, damping: 26 }}
              className={cn(
                'px-3 py-2 rounded-xl text-sm max-w-[85%]',
                note.author === 'You'
                  ? 'self-end bg-gradient-to-br from-rose-600/70 to-pink-600/70 text-white ml-auto border border-rose-500/30'
                  : 'self-start bg-rose-950/50 border border-rose-800/30 text-rose-100'
              )}
            >
              <p className="leading-snug">{note.text}</p>
              <p className="text-[10px] opacity-50 mt-1 text-right">{note.author}</p>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Heart divider decoration */}
        {notes.length > 0 && (
          <div className="flex items-center gap-2 my-1">
            <div className="flex-1 h-px bg-rose-800/30" />
            <Heart className="w-3 h-3 text-rose-500/60 fill-rose-500/40" />
            <div className="flex-1 h-px bg-rose-800/30" />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Draft area */}
      <div className="flex flex-col gap-2">
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendNote())}
          placeholder="Write a love note…"
          rows={2}
          className="w-full resize-none rounded-lg bg-rose-950/30 border border-rose-800/40 text-rose-100 placeholder:text-rose-400/40 text-sm px-3 py-2 outline-none focus:border-rose-600/60 focus:ring-0 transition-colors"
        />
        <Button
          size="sm"
          onClick={sendNote}
          className="self-end bg-rose-600 hover:bg-rose-500 text-white border-0 gap-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          Send
        </Button>
      </div>
    </div>
  )
}

// ─── Virtual Dinner ───────────────────────────────────────────────────────────

const DINNER_SECONDS = 30 * 60 // 30 minutes

function VirtualDinner() {
  const [secondsLeft, setSecondsLeft] = useState(DINNER_SECONDS)
  const [running, setRunning] = useState(false)
  const [started, setStarted] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  const start = () => {
    setStarted(true)
    setRunning(true)
  }

  const toggle = () => setRunning(r => !r)

  const reset = () => {
    setRunning(false)
    setStarted(false)
    setSecondsLeft(DINNER_SECONDS)
  }

  useEffect(() => {
    if (running && secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) { clearInterval(intervalRef.current!); setRunning(false); return 0 }
          return s - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current!)
    }
    return () => clearInterval(intervalRef.current!)
  }, [running])

  const progress = 1 - secondsLeft / DINNER_SECONDS

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Candle animation */}
      <AnimatePresence>
        {started && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.4 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="flex flex-col items-center gap-1"
          >
            {/* Flame */}
            <motion.div
              animate={running ? {
                scaleX: [1, 1.15, 0.9, 1.1, 1],
                scaleY: [1, 0.95, 1.1, 0.9, 1],
              } : {}}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              className="text-4xl select-none"
            >
              🕯️
            </motion.div>
            <motion.div
              animate={running ? { opacity: [0.5, 1, 0.5] } : { opacity: 0.3 }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-xs text-amber-300/70 font-medium"
            >
              {running ? 'Date night is on! ✨' : 'Paused…'}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timer ring */}
      <div className="relative flex items-center justify-center w-32 h-32">
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r="56" fill="none" stroke="#3d0a14" strokeWidth="8" />
          <motion.circle
            cx="64" cy="64" r="56" fill="none"
            stroke="url(#roseGrad)" strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 56}`}
            strokeDashoffset={`${2 * Math.PI * 56 * (1 - progress)}`}
            transition={{ duration: 0.5 }}
          />
          <defs>
            <linearGradient id="roseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
        </svg>
        <div className="z-10 text-center">
          <p className="text-2xl font-bold text-rose-100 tabular-nums tracking-tight">
            {formatTime(secondsLeft)}
          </p>
          <p className="text-[10px] text-rose-400/60 uppercase tracking-wider mt-0.5">
            {secondsLeft === 0 ? 'Done! 🎉' : 'remaining'}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {!started ? (
          <Button
            onClick={start}
            className="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white border-0 gap-2"
          >
            <Play className="w-4 h-4 fill-current" />
            Start Date Night
          </Button>
        ) : (
          <>
            <Button
              size="sm"
              onClick={toggle}
              className="bg-rose-800/50 hover:bg-rose-700/60 text-rose-100 border border-rose-700/40 gap-1.5"
            >
              {running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              {running ? 'Pause' : 'Resume'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={reset}
              className="text-rose-400/70 hover:text-rose-300 hover:bg-rose-900/40 gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </Button>
          </>
        )}
      </div>

      {!started && (
        <p className="text-xs text-rose-400/50 text-center max-w-[200px] leading-relaxed">
          Start the timer for a cozy 30-minute virtual dinner together 🍷
        </p>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DuoRomanticExtras({ duoRoomId }: { duoRoomId: string }) {
  const [activeTab, setActiveTab] = useState<TabId>('playlist')

  return (
    <div className="flex flex-col gap-0 rounded-2xl overflow-hidden border border-rose-800/30 bg-black/30 backdrop-blur-xl shadow-2xl shadow-rose-950/30">
      {/* Header */}
      <div className="relative px-5 pt-5 pb-4 overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-rose-900/60 via-pink-900/40 to-rose-950/60 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(244,63,94,0.15),transparent_60%)] pointer-events-none" />

        <div className="relative">
          <motion.h2
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="text-lg font-semibold bg-gradient-to-r from-rose-200 via-pink-200 to-rose-100 bg-clip-text text-transparent tracking-tight"
          >
            Date Activities 🌹
          </motion.h2>
          <p className="text-[11px] text-rose-400/60 mt-0.5">Just the two of you</p>
        </div>

        {/* Tab pills */}
        <div className="relative flex gap-1.5 mt-4">
          {TABS.map(tab => {
            const active = activeTab === tab.id
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  'relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors duration-200 select-none',
                  active
                    ? 'text-white'
                    : 'text-rose-400/60 hover:text-rose-300/80'
                )}
              >
                {active && (
                  <motion.div
                    layoutId="romantic-tab-bg"
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-rose-600/70 to-pink-600/70 border border-rose-500/30"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative z-10">{tab.emoji}</span>
                <span className="relative z-10 hidden sm:inline">{tab.label}</span>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="p-5 pt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {activeTab === 'playlist' && <SharedPlaylist />}
            {activeTab === 'notes'    && <LoveNotes />}
            {activeTab === 'dinner'   && <VirtualDinner />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
