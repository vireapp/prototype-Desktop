/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ArrowLeft,
  Keyboard,
  Trophy,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Timer,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  User,
  CheckCircle2,
  RefreshCcw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import confetti from 'canvas-confetti'

// Mock Sentences
const SENTENCES = [
  'The quick brown fox jumps over the lazy dog.',
  'Pack my box with five dozen liquor jugs.',
  'How vexingly quick daft zebras jump!',
  'Sphinx of black quartz, judge my vow.',
  'Two driven jocks help fax my big quiz.',
  'The five boxing wizards jump quickly.',
  "A wizard's job is to vex chumps quickly in fog.",
  "Watch 'Jeopardy!', Alex Trebek's fun TV quiz game.",
  'By Jove, my quick study of lexicography won a prize.',
  'Waltz, bad nymph, for quick jigs vex.'
]

interface Player {
  id: string
  name: string
  progress: number // 0 to 100
  wpm: number
  finished: boolean
  finishTime?: number
}

interface GameState {
  status: 'lobby' | 'countdown' | 'playing' | 'game_over'
  sentence: string
  startTime: number
  players: Player[]
}

export function WordRace({
  roomId,
  user,
  onBackAction
}: {
  roomId: string
  user: any
  onBackAction: () => void
}) {
  const supabase = createClient()
  const [gameState, setGameState] = useState<GameState>({
    status: 'lobby',
    sentence: '',
    startTime: 0,
    players: []
  })

  const [inputObj, setInputObj] = useState('')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [countdown, setCountdown] = useState(3)
  const inputRef = useRef<HTMLInputElement>(null)

  // Derived
  const me = gameState.players.find((p) => p.id === user.id)
  const isHost = gameState.players[0]?.id === user.id

  // Network Sync
  useEffect(() => {
    const channel = supabase.channel(`room_${roomId}_wordrace`)

    channel
      .on('broadcast', { event: 'state_update' }, ({ payload }) => {
        setGameState(payload)
      })
      .on('broadcast', { event: 'player_update' }, ({ payload }) => {
        setGameState((prev) => ({
          ...prev,
          players: prev.players.map((p) => (p.id === payload.id ? payload : p))
        }))
      })
      .on('broadcast', { event: 'join_request' }, ({ payload }) => {
        if (!isHost) return
        setGameState((prev) => {
          if (prev.players.find((p) => p.id === payload.id)) return prev
          const newPlayers = [
            ...prev.players,
            {
              id: payload.id,
              name: `Player ${prev.players.length + 1}`,
              progress: 0,
              wpm: 0,
              finished: false
            }
          ]
          const ns = { ...prev, players: newPlayers }
          broadcastState(ns)
          return ns
        })
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Request Join
          channel.send({
            type: 'broadcast',
            event: 'join_request',
            payload: { id: user.id }
          })
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, supabase, isHost, user.id])

  const broadcastState = async (state: GameState) => {
    await supabase.channel(`room_${roomId}_wordrace`).send({
      type: 'broadcast',
      event: 'state_update',
      payload: state
    })
  }

  const broadcastPlayerUpdate = async (player: Player) => {
    await supabase.channel(`room_${roomId}_wordrace`).send({
      type: 'broadcast',
      event: 'player_update',
      payload: player
    })
  }

  // Game Logic
  const handleCreateGame = () => {
    const newState: GameState = {
      status: 'lobby',
      sentence: SENTENCES[Math.floor(Math.random() * SENTENCES.length)],
      startTime: 0,
      players: [
        {
          id: user.id,
          name: 'You',
          progress: 0,
          wpm: 0,
          finished: false
        }
      ]
    }
    setGameState(newState)
    broadcastState(newState)
  }

  const handleStartCountdown = () => {
    if (!isHost) return
    const newState: GameState = {
      ...gameState,
      status: 'countdown'
    }
    setGameState(newState)
    broadcastState(newState)

    let count = 3
    const interval = setInterval(() => {
      count--
      if (count <= 0) {
        clearInterval(interval)
        startGame()
      }
    }, 1000)
  }

  const startGame = () => {
    const newState: GameState = {
      ...gameState,
      status: 'playing',
      startTime: Date.now(),
      players: gameState.players.map((p) => ({
        ...p,
        progress: 0,
        finished: false,
        finishTime: undefined,
        wpm: 0
      }))
    }
    setGameState(newState)
    broadcastState(newState)
    setInputObj('')
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (gameState.status !== 'playing' || me?.finished) return

    const val = e.target.value
    setInputObj(val)

    // Calc progress
    // Simple logic: Check validation
    // But ideally we force correct typing.
    // For now, let's just check length match relative to sentence start
    let matchLen = 0
    for (let i = 0; i < val.length; i++) {
      if (val[i] === gameState.sentence[i]) matchLen++
      else break // Break on first error? or flexible? Strict mode is better for race.
    }

    // Strict Mode: Input value must exactly match start of sentence
    // Actually, normally typing games block incorrect input.
    // Let's implement partial locking.
    if (!gameState.sentence.startsWith(val)) {
      // Find last valid char? Or just calculate progress based on correct prefix
      // Let's keep input but only count correct chars for progress
    }

    const correctChars = matchLen
    const progress = Math.floor((correctChars / gameState.sentence.length) * 100)

    const timeElapsed = (Date.now() - gameState.startTime) / 1000 / 60 // minutes
    const wpm = Math.round(correctChars / 5 / (timeElapsed || 0.001))

    const finished = val === gameState.sentence

    if (finished) {
      confetti()
      // Update local finish immediately
      const finishedPlayer = {
        ...me!,
        progress: 100,
        finished: true,
        finishTime: Date.now(),
        wpm
      }
      // Update local state optimistic
      setGameState((prev) => ({
        ...prev,
        players: prev.players.map((p) => (p.id === user.id ? finishedPlayer : p))
      }))
      broadcastPlayerUpdate(finishedPlayer)

      // Check if all finished (Host only check? Or distributed?)
      // Let's let host check periodically or on update
    } else {
      // Broadcast progress throttling (e.g. every 500ms or 10 chars)
      // For prototype, broadcast every change is risky for rate limits but responsive.
      // Let's rely on local state responsiveness and broadcast.
      const updatedPlayer = { ...me!, progress, wpm }
      // We set local state simply for rendering my progress bar smoothly
      // Actually we rely on 'gameState' which comes from network.
      // We should optimistic update local 'gameState.players'
      setGameState((prev) => ({
        ...prev,
        players: prev.players.map((p) => (p.id === user.id ? updatedPlayer : p))
      }))
      broadcastPlayerUpdate(updatedPlayer)
    }
  }

  // Host checks for Game Over
  useEffect(() => {
    if (!isHost || gameState.status !== 'playing') return

    const allFinished = gameState.players.length > 0 && gameState.players.every((p) => p.finished)
    if (allFinished) {
      const newState = { ...gameState, status: 'game_over' as const }
      setGameState(newState)
      broadcastState(newState)
    }
  }, [gameState.players, isHost, gameState.status])

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 p-4 md:p-8 relative overflow-hidden text-slate-100">
      <Button
        variant="ghost"
        onClick={onBackAction}
        className="absolute top-4 left-4 z-50 text-white/50 hover:text-white"
      >
        <ArrowLeft className="w-5 h-5 mr-2" /> Back
      </Button>

      <div className="max-w-4xl mx-auto w-full flex flex-col items-center py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-black font-heading tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-cyan-300 mb-4">
            Word Race
          </h1>
          <p className="text-lg text-slate-400 max-w-lg mx-auto">
            Type the sentence as fast as you can. First to 100% wins!
          </p>
        </div>

        {gameState.status === 'lobby' && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 w-full max-w-md flex flex-col items-center gap-6 backdrop-blur-sm">
            <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center mb-2">
              <Keyboard className="w-10 h-10 text-blue-400" />
            </div>

            <h2 className="text-xl font-bold">Lobby</h2>

            <div className="w-full space-y-2">
              {gameState.players.length === 0 ? (
                <div className="text-center py-8 text-slate-500">Starting connection...</div>
              ) : (
                gameState.players.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between bg-slate-800/50 p-3 rounded-xl border border-slate-700/50"
                  >
                    <span className="flex items-center gap-2 font-medium">
                      <div
                        className={`w-2 h-2 rounded-full ${p.id === user.id ? 'bg-green-400' : 'bg-slate-400'}`}
                      />
                      {p.id === user.id ? 'You' : p.name}
                    </span>
                    <span className="text-xs font-mono text-slate-500">Ready</span>
                  </div>
                ))
              )}
            </div>

            {gameState.players.length === 0 ? (
              <Button
                size="lg"
                onClick={handleCreateGame}
                className="w-full bg-blue-600 hover:bg-blue-500 font-bold"
              >
                Create Game
              </Button>
            ) : isHost ? (
              <Button
                size="lg"
                onClick={handleStartCountdown}
                className="w-full bg-green-600 hover:bg-green-500 font-bold shadow-lg shadow-green-900/20"
              >
                Start Race
              </Button>
            ) : (
              <div className="text-sm text-slate-500 animate-pulse">
                Waiting for host to start...
              </div>
            )}
          </div>
        )}

        {gameState.status === 'countdown' && (
          <div className="flex items-center justify-center flex-1">
            <div className="text-9xl font-black text-white animate-ping">Starting...</div>
          </div>
        )}

        {gameState.status === 'playing' && (
          <div className="w-full max-w-3xl flex flex-col gap-8">
            {/* Sentence Display */}
            <div className="p-6 md:p-10 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
              <p className="text-2xl md:text-3xl font-serif text-slate-400 leading-normal select-none relative z-10">
                {gameState.sentence.split('').map((char, i) => {
                  let matchClass = 'text-slate-400'
                  if (i < inputObj.length) {
                    matchClass =
                      inputObj[i] === char ? 'text-green-400' : 'text-red-400 bg-red-900/30'
                  }
                  return (
                    <span key={i} className={matchClass}>
                      {char}
                    </span>
                  )
                })}
              </p>
            </div>

            {/* Input Area */}
            <div className="relative">
              <Input
                ref={inputRef}
                value={inputObj}
                onChange={handleInput}
                disabled={me?.finished}
                className="h-16 text-xl md:text-2xl bg-slate-800/50 border-slate-700/50 focus:border-blue-500/50 focus:ring-blue-500/20 rounded-2xl px-6 font-mono text-white placeholder:text-slate-600"
                placeholder="Type here..."
                autoFocus
              />
              {me?.finished && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-green-400 font-bold bg-green-950/50 px-3 py-1 rounded-full border border-green-900">
                  <CheckCircle2 className="w-5 h-5" /> Finished!
                </div>
              )}
            </div>

            {/* Race Tracks */}
            <div className="space-y-4 mt-8">
              {gameState.players
                .sort((a, b) => b.progress - a.progress)
                .map((p) => (
                  <div key={p.id} className="relative">
                    <div className="flex items-center justify-between mb-2 text-sm">
                      <span
                        className={cn(
                          'font-bold',
                          p.id === user.id ? 'text-white' : 'text-slate-400'
                        )}
                      >
                        {p.id === user.id ? 'You' : p.name}
                      </span>
                      <span className="font-mono text-slate-500">{p.wpm} WPM</span>
                    </div>
                    <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full transition-all duration-300 ease-out flex justify-end',
                          p.finished
                            ? 'bg-green-500'
                            : p.id === user.id
                              ? 'bg-blue-500'
                              : 'bg-slate-600'
                        )}
                        style={{ width: `${p.progress}%` }}
                      >
                        {/* Car/Avatar */}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {gameState.status === 'game_over' && (
          <div className="flex flex-col items-center gap-8 animate-in zoom-in duration-300">
            <Trophy className="w-32 h-32 text-yellow-400 mb-4 drop-shadow-[0_0_30px_rgba(250,204,21,0.4)]" />
            <h2 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-yellow-300 to-yellow-600">
              Winner!
            </h2>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md">
              {gameState.players
                .sort((a, b) => (a.finishTime || Infinity) - (b.finishTime || Infinity))
                .map((p, i) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-4 border-b border-slate-800 last:border-0"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-black text-slate-600 w-8">#{i + 1}</span>
                      <div>
                        <div
                          className={cn(
                            'font-bold text-lg',
                            i === 0 ? 'text-yellow-400' : 'text-white'
                          )}
                        >
                          {p.id === user.id ? 'You' : p.name}
                        </div>
                        <div className="text-xs text-slate-500">{p.wpm} WPM</div>
                      </div>
                    </div>
                    {i === 0 && <Trophy className="w-6 h-6 text-yellow-500" />}
                  </div>
                ))}
            </div>

            {isHost && (
              <Button
                size="lg"
                onClick={handleCreateGame}
                className="gap-2 bg-slate-800 hover:bg-slate-700"
              >
                <RefreshCcw className="w-5 h-5" /> Play Again
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
