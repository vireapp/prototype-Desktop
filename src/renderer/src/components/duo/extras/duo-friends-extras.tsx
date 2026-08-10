import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Grid3x3, Type, Zap, RotateCcw, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = 'tictactoe' | 'wordchain' | 'thisorthat'

const TABS = [
  { id: 'tictactoe' as TabId, label: 'Tic Tac Toe', emoji: '✕○', icon: Grid3x3 },
  { id: 'wordchain' as TabId, label: 'Word Chain',   emoji: '🔤', icon: Type },
  { id: 'thisorthat' as TabId, label: 'This or That', emoji: '⚡', icon: Zap },
]

// ─── Tic Tac Toe ──────────────────────────────────────────────────────────────

type Cell = 'X' | 'O' | null
const WIN_LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
]

function checkWinner(board: Cell[]): { winner: Cell; line: number[] } | null {
  for (const line of WIN_LINES) {
    const [a,b,c] = line
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line }
    }
  }
  return null
}

function TicTacToe() {
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null))
  const [xIsNext, setXIsNext] = useState(true)
  const result = checkWinner(board)
  const isDraw = !result && board.every(Boolean)

  const handleClick = (i: number) => {
    if (board[i] || result) return
    const next = [...board]
    next[i] = xIsNext ? 'X' : 'O'
    setBoard(next)
    setXIsNext(x => !x)
  }

  const reset = () => {
    setBoard(Array(9).fill(null))
    setXIsNext(true)
  }

  const winLine = result?.line ?? []

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Status */}
      <AnimatePresence mode="wait">
        <motion.div
          key={result ? result.winner : isDraw ? 'draw' : xIsNext ? 'X' : 'O'}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          className={cn(
            'px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide',
            result
              ? 'bg-gradient-to-r from-violet-600/60 to-blue-600/60 text-white border border-violet-500/40'
              : isDraw
              ? 'bg-slate-700/50 text-slate-300 border border-slate-600/40'
              : 'bg-blue-950/50 text-blue-200 border border-blue-800/40'
          )}
        >
          {result
            ? `🎉 Player ${result.winner} wins!`
            : isDraw
            ? "It's a draw!"
            : `Player ${xIsNext ? 'X' : 'O'}'s turn`}
        </motion.div>
      </AnimatePresence>

      {/* Board */}
      <div className="grid grid-cols-3 gap-2">
        {board.map((cell, i) => {
          const isWinCell = winLine.includes(i)
          return (
            <motion.button
              key={i}
              whileHover={!cell && !result ? { scale: 1.06 } : {}}
              whileTap={!cell && !result ? { scale: 0.94 } : {}}
              onClick={() => handleClick(i)}
              className={cn(
                'w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold transition-all duration-200',
                'border bg-white/5 backdrop-blur-sm',
                isWinCell
                  ? 'border-violet-500/70 bg-violet-900/40 shadow-[0_0_16px_rgba(139,92,246,0.3)]'
                  : 'border-white/10 hover:border-blue-500/40 hover:bg-blue-900/20',
                !cell && !result ? 'cursor-pointer' : 'cursor-default'
              )}
            >
              <AnimatePresence>
                {cell && (
                  <motion.span
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                    className={cell === 'X' ? 'text-blue-300' : 'text-violet-300'}
                  >
                    {cell}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          )
        })}
      </div>

      {/* Reset */}
      <Button
        size="sm"
        onClick={reset}
        className="bg-blue-900/40 hover:bg-blue-800/50 text-blue-200 border border-blue-700/40 gap-1.5"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        New Game
      </Button>
    </div>
  )
}

// ─── Word Chain ───────────────────────────────────────────────────────────────

function WordChain() {
  const [words, setWords] = useState<{ word: string; player: string }[]>([
    { word: 'apple', player: 'Player 1' },
  ])
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [currentPlayer, setCurrentPlayer] = useState<'Player 1' | 'Player 2'>('Player 2')

  const lastWord = words[words.length - 1]?.word ?? ''
  const requiredStart = lastWord.slice(-1).toUpperCase()

  const submit = () => {
    const w = input.trim().toLowerCase()
    if (!w) return

    if (w[0] !== lastWord.slice(-1).toLowerCase()) {
      setError(`Must start with "${requiredStart}"!`)
      return
    }
    if (words.some(x => x.word === w)) {
      setError('Word already used!')
      return
    }

    setWords(prev => [...prev, { word: w, player: currentPlayer }])
    setCurrentPlayer(p => (p === 'Player 1' ? 'Player 2' : 'Player 1'))
    setInput('')
    setError('')
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Word chain display */}
      <div className="overflow-y-auto max-h-44 flex flex-wrap gap-1.5 content-start pr-1">
        <AnimatePresence initial={false}>
          {words.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 360, damping: 26 }}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border',
                item.player === 'Player 1'
                  ? 'bg-blue-900/40 border-blue-700/40 text-blue-200'
                  : 'bg-violet-900/40 border-violet-700/40 text-violet-200'
              )}
            >
              {i > 0 && <ChevronRight className="w-3 h-3 opacity-40" />}
              {item.word}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Turn indicator */}
      <div className="flex items-center gap-2 text-xs">
        <span className={cn(
          'px-2 py-0.5 rounded-full font-medium border',
          currentPlayer === 'Player 1'
            ? 'bg-blue-900/50 border-blue-700/40 text-blue-300'
            : 'bg-violet-900/50 border-violet-700/40 text-violet-300'
        )}>
          {currentPlayer}'s turn
        </span>
        <span className="text-blue-400/50">
          Start with <span className="font-bold text-blue-300">"{requiredStart}"</span>
        </span>
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={e => { setInput(e.target.value); setError('') }}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder={`Type a word starting with "${requiredStart}"…`}
          className="flex-1 bg-blue-950/30 border-blue-800/40 text-blue-100 placeholder:text-blue-400/40 focus-visible:ring-blue-500/50 text-sm"
        />
        <Button
          size="sm"
          onClick={submit}
          className="bg-violet-600 hover:bg-violet-500 text-white border-0 shrink-0"
        >
          Go
        </Button>
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-red-400 font-medium"
        >
          {error}
        </motion.p>
      )}

      <Button
        size="sm"
        variant="ghost"
        onClick={() => {
          setWords([{ word: 'apple', player: 'Player 1' }])
          setCurrentPlayer('Player 2')
          setInput('')
          setError('')
        }}
        className="self-start text-blue-400/50 hover:text-blue-300 text-xs gap-1"
      >
        <RotateCcw className="w-3 h-3" />
        Reset
      </Button>
    </div>
  )
}

// ─── This or That ─────────────────────────────────────────────────────────────

const PROMPTS: [string, string][] = [
  ['Morning person ☀️', 'Night owl 🦉'],
  ['Coffee ☕', 'Tea 🍵'],
  ['Movies 🎬', 'TV shows 📺'],
  ['Beach 🏖️', 'Mountains ⛰️'],
  ['Pizza 🍕', 'Sushi 🍣'],
  ['Cats 🐱', 'Dogs 🐶'],
  ['Summer 🌞', 'Winter ❄️'],
  ['Texts 💬', 'Calls 📱'],
  ['City life 🏙️', 'Countryside 🌾'],
  ['Spicy 🌶️', 'Sweet 🍬'],
]

function ThisOrThat() {
  const [promptIdx, setPromptIdx] = useState(0)
  const [picks, setPicks] = useState<{ p1: 0 | 1 | null; p2: 0 | 1 | null }>({ p1: null, p2: null })
  const [revealed, setRevealed] = useState(false)

  const [optA, optB] = PROMPTS[promptIdx]

  const selectP1 = (choice: 0 | 1) => {
    if (revealed) return
    setPicks(p => ({ ...p, p1: choice }))
  }
  const selectP2 = (choice: 0 | 1) => {
    if (revealed) return
    setPicks(p => ({ ...p, p2: choice }))
  }

  const canReveal = picks.p1 !== null && picks.p2 !== null

  const next = () => {
    setPromptIdx(i => (i + 1) % PROMPTS.length)
    setPicks({ p1: null, p2: null })
    setRevealed(false)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Prompt */}
      <AnimatePresence mode="wait">
        <motion.div
          key={promptIdx}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="text-center text-sm font-medium text-blue-300/70 tracking-wide uppercase"
        >
          Would You Rather…
        </motion.div>
      </AnimatePresence>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3">
        {([optA, optB] as const).map((opt, idx) => {
          const isIdx = idx as 0 | 1
          return (
            <div key={idx} className="flex flex-col gap-2">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => !revealed && (idx === 0 ? selectP1(0) : selectP2(1))}
                className={cn(
                  'relative px-3 py-3 rounded-xl border text-sm font-medium transition-all text-center leading-snug',
                  idx === 0
                    ? picks.p1 === isIdx
                      ? 'bg-blue-600/50 border-blue-500/60 text-blue-100'
                      : 'bg-blue-950/30 border-blue-800/30 text-blue-300/70 hover:border-blue-700/50'
                    : picks.p2 === isIdx
                    ? 'bg-violet-600/50 border-violet-500/60 text-violet-100'
                    : 'bg-violet-950/30 border-violet-800/30 text-violet-300/70 hover:border-violet-700/50'
                )}
              >
                {opt}
              </motion.button>

              {/* Player label */}
              <div className="flex flex-col gap-1.5">
                {(['P1', 'P2'] as const).map((player, pi) => {
                  const pick = player === 'P1' ? picks.p1 : picks.p2
                  const chose = pick === isIdx
                  if (!revealed && pick === null) return (
                    <motion.button
                      key={pi}
                      whileTap={{ scale: 0.94 }}
                      onClick={() => {
                        if (player === 'P1') selectP1(isIdx)
                        else selectP2(isIdx)
                      }}
                      className={cn(
                        'text-[11px] px-2 py-1 rounded-md border transition-colors',
                        idx === 0
                          ? 'border-blue-800/30 text-blue-400/50 hover:border-blue-600/50 hover:text-blue-300'
                          : 'border-violet-800/30 text-violet-400/50 hover:border-violet-600/50 hover:text-violet-300'
                      )}
                    >
                      {player} pick
                    </motion.button>
                  )
                  return (
                    <div
                      key={pi}
                      className={cn(
                        'text-[11px] px-2 py-1 rounded-md text-center font-medium',
                        chose
                          ? idx === 0
                            ? 'bg-blue-700/30 text-blue-300'
                            : 'bg-violet-700/30 text-violet-300'
                          : 'text-slate-500/40'
                      )}
                    >
                      {revealed ? (chose ? `${player} ✓` : `${player} ✗`) : `${player} ✓`}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Reveal / Next */}
      <div className="flex gap-2 justify-center">
        {!revealed ? (
          <Button
            size="sm"
            disabled={!canReveal}
            onClick={() => setRevealed(true)}
            className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white border-0 disabled:opacity-40 gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" />
            Reveal Picks!
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={next}
            className="bg-blue-900/50 hover:bg-blue-800/60 text-blue-200 border border-blue-700/40 gap-1.5"
          >
            Next Question
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DuoFriendsExtras({ duoRoomId }: { duoRoomId: string }) {
  const [activeTab, setActiveTab] = useState<TabId>('tictactoe')

  return (
    <div className="flex flex-col gap-0 rounded-2xl overflow-hidden border border-blue-800/30 bg-black/30 backdrop-blur-xl shadow-2xl shadow-blue-950/30">
      {/* Header */}
      <div className="relative px-5 pt-5 pb-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/60 via-violet-900/40 to-blue-950/60 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.15),transparent_60%)] pointer-events-none" />

        <div className="relative">
          <motion.h2
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="text-lg font-semibold bg-gradient-to-r from-blue-200 via-violet-200 to-blue-100 bg-clip-text text-transparent tracking-tight"
          >
            Mini Games 👾
          </motion.h2>
          <p className="text-[11px] text-blue-400/60 mt-0.5">Play together, right here</p>
        </div>

        {/* Tabs */}
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
                  active ? 'text-white' : 'text-blue-400/60 hover:text-blue-300/80'
                )}
              >
                {active && (
                  <motion.div
                    layoutId="friends-tab-bg"
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-600/70 to-violet-600/70 border border-blue-500/30"
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
            {activeTab === 'tictactoe'  && <TicTacToe />}
            {activeTab === 'wordchain'  && <WordChain />}
            {activeTab === 'thisorthat' && <ThisOrThat />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
