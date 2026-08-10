'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ArrowLeft, Timer, Trophy, CheckCircle2, HelpCircle } from 'lucide-react'

// Mock Data - In a real app this would come from an API
const QUESTIONS = [
  {
    id: 1,
    question: 'What is the capital of Japan?',
    options: ['Seoul', 'Beijing', 'Tokyo', 'Bangkok'],
    answer: 2 // Index
  },
  {
    id: 2,
    question: 'Which planet is known as the Red Planet?',
    options: ['Venus', 'Jupiter', 'Mars', 'Saturn'],
    answer: 2
  },
  {
    id: 3,
    question: 'What is the largest mammal in the world?',
    options: ['African Elephant', 'Blue Whale', 'Giraffe', 'Hippopotamus'],
    answer: 1
  },
  {
    id: 4,
    question: "Who wrote 'Romeo and Juliet'?",
    options: ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain'],
    answer: 1
  },
  {
    id: 5,
    question: 'What is the chemical symbol for Gold?',
    options: ['Ag', 'Au', 'Fe', 'Cu'],
    answer: 1
  },
  {
    id: 6,
    question: 'Which element has the atomic number 1?',
    options: ['Helium', 'Oxygen', 'Hydrogen', 'Carbon'],
    answer: 2
  },
  {
    id: 7,
    question: 'In which year did the Titanic sink?',
    options: ['1912', '1905', '1920', '1898'],
    answer: 0
  },
  {
    id: 8,
    question: 'What is the hardest natural substance on Earth?',
    options: ['Gold', 'Iron', 'Diamond', 'Platinum'],
    answer: 2
  }
]

interface PlayerState {
  id: string
  name: string // We don't have user names easily, we'll use IDs or fetch names
  score: number
  selectedAnswer: number | null
}

interface GameState {
  status: 'lobby' | 'playing' | 'round_result' | 'game_over'
  currentQuestionIndex: number
  roundEndTime: number
  players: PlayerState[]
}

export function Trivia({
  roomId,
  user,
  onBackAction
}: {
  roomId: string
  user: { id: string; [key: string]: unknown }
  onBackAction: () => void
}) {
  const supabase = createClient()
  const [gameState, setGameState] = useState<GameState>({
    status: 'lobby',
    currentQuestionIndex: 0,
    roundEndTime: 0,
    players: []
  })
  const [timeLeft, setTimeLeft] = useState(0)

  // Derived state
  const myPlayer = gameState.players.find((p) => p.id === user.id)
  const currentQuestion = QUESTIONS[gameState.currentQuestionIndex % QUESTIONS.length]
  const isHost = gameState.players[0]?.id === user.id

  const broadcastState = useCallback(
    async (state: GameState) => {
      await supabase.channel(`room_${roomId}_trivia`).send({
        type: 'broadcast',
        event: 'state_update',
        payload: state
      })
    },
    [roomId, supabase]
  )

  const handleRoundEnd = useCallback(() => {
    // Calculate scores
    const correctAnswer = QUESTIONS[gameState.currentQuestionIndex % QUESTIONS.length].answer
    const newPlayers = gameState.players.map((p) => ({
      ...p,
      score: p.selectedAnswer === correctAnswer ? p.score + 100 : p.score
    }))

    // Limit to 5 questions for demo
    const isGameReallyOver = gameState.currentQuestionIndex >= 4

    const newState: GameState = {
      ...gameState,
      status: isGameReallyOver ? 'game_over' : 'round_result',
      players: newPlayers
    }
    setGameState(newState)
    broadcastState(newState)
  }, [gameState, broadcastState])

  useEffect(() => {
    const channel = supabase.channel(`room_${roomId}_trivia`)

    channel
      .on('broadcast', { event: 'state_update' }, ({ payload }) => {
        setGameState(payload)
      })
      .on('broadcast', { event: 'player_join' }, ({ payload }) => {
        setGameState((prev) => {
          if (prev.players.find((p) => p.id === payload.userId)) return prev
          const newPlayers = [
            ...prev.players,
            {
              id: payload.userId,
              name: 'Player ' + (prev.players.length + 1), // Simplistic naming
              score: 0,
              selectedAnswer: null
            }
          ]
          // If I am host, broadcast the new state with me in it
          if (prev.players.length === 0 || prev.players[0].id === user.id) {
            // Host logic to sync
          }
          return { ...prev, players: newPlayers }
        })
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Announce join
          // We need to fetch current state first actually, but broadcast doesn't support 'fetch'
          // Simple approach: Send 'join_request', Host replies with 'state_update'
          await channel.send({
            type: 'broadcast',
            event: 'join_request',
            payload: { userId: user.id }
          })
        }
      })

    // Listen for join requests if host
    channel.on('broadcast', { event: 'join_request' }, ({ payload }) => {
      setGameState((prev) => {
        // Only host responds (first player)
        if (prev.players.length > 0 && prev.players[0].id !== user.id) return prev

        const existing = prev.players.find((p) => p.id === payload.userId)
        if (existing) {
          broadcastState(prev)
          return prev
        }

        const newState = {
          ...prev,
          players: [
            ...prev.players,
            {
              id: payload.userId,
              name: 'Player ' + (prev.players.length + 1),
              score: 0,
              selectedAnswer: null
            }
          ]
        }
        broadcastState(newState)
        return newState
      })
    })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, supabase, user.id, broadcastState])

  // Timer Logic
  useEffect(() => {
    if (gameState.status !== 'playing') {
      queueMicrotask(() => setTimeLeft(0))
      return
    }

    const interval = setInterval(() => {
      const left = Math.max(0, Math.ceil((gameState.roundEndTime - Date.now()) / 1000))
      setTimeLeft(left)

      if (left <= 0 && isHost) {
        // Round Over
        handleRoundEnd()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [gameState.status, gameState.roundEndTime, isHost, handleRoundEnd])

  const handleStartGame = () => {
    if (!isHost) return
    const newState: GameState = {
      ...gameState,
      status: 'playing',
      currentQuestionIndex: 0,
      roundEndTime: Date.now() + 15000, // 15s per question
      players: gameState.players.map((p) => ({
        ...p,
        score: 0,
        selectedAnswer: null
      }))
    }
    setGameState(newState)
    broadcastState(newState)
  }

  const handleSelectAnswer = (idx: number) => {
    if (gameState.status !== 'playing' || myPlayer?.selectedAnswer !== null) return

    // Update local state temporarily? No, must sync.
    // We need to tell Host we selected?
    // Or just broadcast our individual update.
    // For simplicity, everyone updates the full state (optimistic) and broadcasts
    // Race conditions exist but acceptable for prototype.

    const newPlayers = gameState.players.map((p) =>
      p.id === user.id ? { ...p, selectedAnswer: idx } : p
    )

    const newState = { ...gameState, players: newPlayers }
    setGameState(newState)
    broadcastState(newState)
  }

  const handleNextQuestion = () => {
    if (!isHost) return
    const newState: GameState = {
      ...gameState,
      status: 'playing',
      currentQuestionIndex: gameState.currentQuestionIndex + 1,
      roundEndTime: Date.now() + 15000,
      players: gameState.players.map((p) => ({ ...p, selectedAnswer: null }))
    }
    setGameState(newState)
    broadcastState(newState)
  }

  const handleRestart = () => {
    if (!isHost) return
    handleStartGame()
  }

  return (
    <div className="flex flex-col h-full w-full bg-indigo-950/30 p-4 md:p-8 relative overflow-hidden">
      {/* Background Element */}
      <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-purple-600/20 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto w-full flex flex-col h-full z-10 relative">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={onBackAction} className="text-white/50 hover:text-white">
            <ArrowLeft className="w-5 h-5 mr-2" /> Back
          </Button>
          <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full border border-white/10">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span className="font-mono font-bold text-white">{myPlayer?.score || 0} pts</span>
          </div>
        </div>

        {gameState.status === 'lobby' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
            <HelpCircle className="w-24 h-24 text-indigo-400 mb-4 animate-bounce" />
            <h2 className="text-4xl font-bold font-heading text-white">Trivia Challenge</h2>
            <p className="text-white/50 text-lg">Test your knowledge against your friends!</p>

            <div className="bg-black/20 p-6 rounded-2xl w-full max-w-sm border border-white/10">
              <h3 className="text-sm font-medium text-white/70 mb-4 uppercase tracking-wider">
                Players Joined ({gameState.players.length})
              </h3>
              <div className="space-y-2">
                {gameState.players.length === 0 ? (
                  <div className="text-zinc-500 italic text-sm py-4">Waiting for lobby...</div>
                ) : (
                  gameState.players.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-2 text-white/90 bg-white/5 p-2 rounded"
                    >
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      {p.id === user.id ? 'You' : p.name}
                    </div>
                  ))
                )}
              </div>
            </div>

            {gameState.players.length === 0 ? (
              <Button
                size="lg"
                onClick={() => {
                  const newState = {
                    ...gameState,
                    players: [
                      {
                        id: user.id,
                        name: 'Player 1',
                        score: 0,
                        selectedAnswer: null
                      }
                    ]
                  }
                  setGameState(newState)
                  broadcastState(newState)
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8"
              >
                Create Game
              </Button>
            ) : isHost ? (
              <Button
                size="lg"
                onClick={handleStartGame}
                className="bg-white text-indigo-950 hover:bg-white/90 text-lg px-8 py-6 rounded-full font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              >
                Start Game
              </Button>
            ) : (
              <p className="animate-pulse text-indigo-300">Waiting for host to start...</p>
            )}
          </div>
        )}

        {gameState.status === 'playing' && (
          <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
            <div className="flex items-center justify-between mb-8">
              <div className="text-sm font-medium text-white/50 uppercase tracking-widest">
                Question {gameState.currentQuestionIndex + 1}
              </div>
              <div
                className={cn(
                  'flex items-center gap-2 font-mono font-bold text-xl',
                  timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-white'
                )}
              >
                <Timer className="w-5 h-5" />
                {timeLeft}s
              </div>
            </div>

            <h3 className="text-2xl md:text-3xl font-bold text-white mb-8 leading-relaxed">
              {currentQuestion.question}
            </h3>

            <div className="grid grid-cols-1 gap-4">
              {currentQuestion.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectAnswer(idx)}
                  disabled={myPlayer?.selectedAnswer !== null}
                  className={cn(
                    'p-6 rounded-xl border text-left transition-all relative overflow-hidden group',
                    myPlayer?.selectedAnswer === idx
                      ? 'bg-indigo-600 border-indigo-500 shadow-[0_0_30px_rgba(79,70,229,0.3)]'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  )}
                >
                  <span
                    className={cn(
                      'text-lg font-medium transition-colors',
                      myPlayer?.selectedAnswer === idx
                        ? 'text-white'
                        : 'text-white/80 group-hover:text-white'
                    )}
                  >
                    {opt}
                  </span>

                  {myPlayer?.selectedAnswer === idx && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 p-1 rounded-full">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {gameState.status === 'round_result' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-8">
            <div className="space-y-2">
              <h2 className="text-sm font-medium text-white/50 uppercase tracking-widest">
                Answer Revealed
              </h2>
              <div className="text-3xl font-bold text-emerald-400">
                {currentQuestion.options[currentQuestion.answer]}
              </div>
            </div>

            <div className="flex gap-4">
              <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-2xl w-40">
                <div className="text-2xl font-bold text-green-400 mb-1">
                  {
                    gameState.players.filter((p) => p.selectedAnswer === currentQuestion.answer)
                      .length
                  }
                </div>
                <div className="text-xs text-green-300/60 uppercase">Correct</div>
              </div>
              <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl w-40">
                <div className="text-2xl font-bold text-red-400 mb-1">
                  {
                    gameState.players.filter((p) => p.selectedAnswer !== currentQuestion.answer)
                      .length
                  }
                </div>
                <div className="text-xs text-red-300/60 uppercase">Incorrect</div>
              </div>
            </div>

            {isHost && (
              <Button
                onClick={handleNextQuestion}
                className="bg-white text-black hover:bg-zinc-200 min-w-[200px]"
              >
                Next Question
              </Button>
            )}
          </div>
        )}

        {gameState.status === 'game_over' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-8">
            <Trophy className="w-32 h-32 text-yellow-500 animate-bounce" />
            <h2 className="text-5xl font-bold text-white font-heading">Game Over!</h2>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 w-full max-w-md">
              {gameState.players
                .sort((a, b) => b.score - a.score)
                .map((p, i) => (
                  <div
                    key={p.id}
                    className={cn(
                      'flex items-center justify-between p-3 rounded mb-2',
                      i === 0 ? 'bg-yellow-500/20 border border-yellow-500/20' : 'bg-transparent'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'font-mono font-bold w-6',
                          i === 0 ? 'text-yellow-400' : 'text-white/30'
                        )}
                      >
                        #{i + 1}
                      </span>
                      <span className="text-white font-medium">
                        {p.id === user.id ? 'You' : p.name}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-white">{p.score}</span>
                  </div>
                ))}
            </div>

            {isHost && (
              <Button onClick={handleRestart} variant="secondary">
                Play Again
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
