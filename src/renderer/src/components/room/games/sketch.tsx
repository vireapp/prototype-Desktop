'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import {
  ArrowLeft,
  Eraser,
  Palette,
  Trash2,
  Send,
  Trophy,
  Clock,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  User
} from 'lucide-react'

const WORDS = [
  'cat',
  'sun',
  'tree',
  'house',
  'car',
  'apple',
  'book',
  'smile',
  'flower',
  'fish',
  'cloud',
  'star',
  'moon',
  'bird',
  'pizza',
  'cookie',
  'ball',
  'chair',
  'bed',
  'door',
  'pencil',
  'phone',
  'key',
  'spoon',
  'fork',
  'shoe',
  'hat',
  'glasses',
  'clock',
  'train'
]

const COLORS = [
  '#000000',
  '#ffffff',
  '#ef4444',
  '#f97316',
  '#facc15',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#a855f7',
  '#ec4899',
  '#78716c'
]

interface Player {
  id: string
  name: string
  score: number
  hasGuessed: boolean
}

interface DrawEvent {
  x: number
  y: number
  prevX: number
  prevY: number
  color: string
  width: number
}

interface GameState {
  status: 'lobby' | 'selecting_word' | 'drawing' | 'round_end' | 'game_over'
  drawerId: string | null
  round: number
  totalRounds: number
  currentWord: string | null
  endTime: number
  players: Player[]
}

export function Sketch({
  roomId,
  user,
  onBackAction
}: {
  roomId: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any
  onBackAction: () => void
}) {
  // Canvas & Drawing
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useState('#000000')
  const [lineWidth, setLineWidth] = useState(3)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  // Game State
  const supabase = createClient()
  const [gameState, setGameState] = useState<GameState>({
    status: 'lobby',
    drawerId: null,
    round: 1,
    totalRounds: 5,
    currentWord: null,
    endTime: 0,
    players: []
  })
  const [timeLeft, setTimeLeft] = useState(0)
  const [guess, setGuess] = useState('')
  const [messages, setMessages] = useState<
    Array<{
      name: string
      text: string
      type: 'chat' | 'system' | 'guess_correct'
    }>
  >([])

  // Derived
  const me = gameState.players.find((p) => p.id === user.id)
  const isHost = gameState.players[0]?.id === user.id
  const isDrawer = gameState.drawerId === user.id

  // Network Sync
  useEffect(() => {
    const channel = supabase.channel(`room_${roomId}_sketch`)

    channel
      .on('broadcast', { event: 'state_update' }, ({ payload }) => {
        setGameState(payload)
      })
      .on('broadcast', { event: 'draw_event' }, ({ payload }) => {
        if (!isDrawer) drawLine(payload)
      })
      .on('broadcast', { event: 'clear_canvas' }, () => {
        const ctx = canvasRef.current?.getContext('2d')
        if (ctx) ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height)
      })
      .on('broadcast', { event: 'chat_message' }, ({ payload }) => {
        setMessages((prev) => [...prev, payload])
      })
      .on('broadcast', { event: 'join_request' }, ({ payload }) => {
        if (!isHost) return
        // Host logic to add player
        setGameState((prev) => {
          if (prev.players.find((p) => p.id === payload.id)) return prev
          const newPlayers = [
            ...prev.players,
            {
              id: payload.id,
              name: 'Player ' + (prev.players.length + 1), // Simple mock name
              score: 0,
              hasGuessed: false
            }
          ]
          const ns = { ...prev, players: newPlayers }
          broadcastState(ns)
          return ns // Host update locally too
        })
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channel.send({
            type: 'broadcast',
            event: 'join_request',
            payload: { id: user.id }
          })
        }
      })

    // Initial join for host if empty
    if (isHost && gameState.players.length === 0) {
      // Self add
    }

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, supabase, isHost, isDrawer])
  // Added isDrawer dependency to avoid re-binding drawing listener unnecessarily, though channel setup should be stable.
  // Actually, splitting draw listener might be better, but this works for prototype.

  const broadcastState = async (state: GameState) => {
    await supabase.channel(`room_${roomId}_sketch`).send({
      type: 'broadcast',
      event: 'state_update',
      payload: state
    })
  }

  // Timer Loop (Host Only)
  useEffect(() => {
    if (gameState.status === 'lobby' || gameState.status === 'game_over') {
      setTimeLeft(0)
      return
    }

    const interval = setInterval(() => {
      const now = Date.now()
      const left = Math.ceil((gameState.endTime - now) / 1000)
      setTimeLeft(Math.max(0, left))

      if (isHost && left <= 0) {
        if (gameState.status === 'drawing') handleRoundEnd()
        else if (gameState.status === 'selecting_word') {
          // Auto select if timeout
          handleWordSelect(WORDS[Math.floor(Math.random() * WORDS.length)])
        } else if (gameState.status === 'round_end') startNextRound()
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [gameState, isHost])

  // Canvas Logic
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Resize observer or simple fixed size for now to avoid complexity
    canvas.width = canvas.parentElement?.clientWidth || 800
    canvas.height = canvas.parentElement?.clientHeight || 600

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }
  }, [])

  const drawLine = ({ x, y, prevX, prevY, color, width }: DrawEvent) => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    ctx.strokeStyle = color
    ctx.lineWidth = width
    ctx.beginPath()
    ctx.moveTo(prevX, prevY)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isDrawer || gameState.status !== 'drawing') return
    const rect = canvasRef.current!.getBoundingClientRect()
    lastPos.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    setIsDrawing(true)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing || !isDrawer || !lastPos.current) return
    const rect = canvasRef.current!.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const event: DrawEvent = {
      x,
      y,
      prevX: lastPos.current.x,
      prevY: lastPos.current.y,
      color,
      width: lineWidth
    }

    drawLine(event) // Draw locally
    // Broadcast
    supabase.channel(`room_${roomId}_sketch`).send({
      type: 'broadcast',
      event: 'draw_event',
      payload: event
    })

    lastPos.current = { x, y }
  }

  const handlePointerUp = () => {
    setIsDrawing(false)
    lastPos.current = null
  }

  const clearCanvas = () => {
    if (!isDrawer) return
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx) ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height)
    supabase.channel(`room_${roomId}_sketch`).send({
      type: 'broadcast',
      event: 'clear_canvas'
    })
  }

  // Gameplay Actions
  const handleStartGame = () => {
    // Pick random drawer
    const drawer = gameState.players[0]
    const newState: GameState = {
      ...gameState,
      status: 'selecting_word',
      drawerId: drawer.id,
      endTime: Date.now() + 15000, // 15s to choose
      round: 1,
      players: gameState.players.map((p) => ({
        ...p,
        score: 0,
        hasGuessed: false
      }))
    }
    setGameState(newState)
    broadcastState(newState)
  }

  const handleWordSelect = (word: string) => {
    const newState: GameState = {
      ...gameState,
      status: 'drawing',
      currentWord: word,
      endTime: Date.now() + 60000 // 60s to draw
    }
    setGameState(newState)
    broadcastState(newState)
    // Clear canvas implicitly?
    clearCanvas()
  }

  const handleGuess = (e: React.FormEvent) => {
    e.preventDefault()
    if (!guess.trim()) return

    const isCorrect =
      gameState.status === 'drawing' &&
      !isDrawer &&
      !me?.hasGuessed &&
      guess.toLowerCase().trim() === gameState.currentWord?.toLowerCase()

    if (isCorrect) {
      // Send correct guess event logic
      // Ideally we tell host, but for simplicity we broadcast message and everyone updates?
      // No, update via host is cleaner but slower.
      // Let's optimistic update locally?

      // Send special message
      supabase.channel(`room_${roomId}_sketch`).send({
        type: 'broadcast',
        event: 'chat_message',
        payload: {
          name: me?.name || 'Someone',
          text: 'guessed the word!',
          type: 'guess_correct'
        }
      })

      // Host needs to see this
      // We can send a 'guess_attempt' to host
    } else {
      supabase.channel(`room_${roomId}_sketch`).send({
        type: 'broadcast',
        event: 'chat_message',
        payload: { name: me?.name || 'Player', text: guess, type: 'chat' }
      })
    }

    // Host watching chat messages logic embedded here is tricky.
    // Instead, let's send 'submit_guess' event
    if (gameState.status === 'drawing') {
      supabase.channel(`room_${roomId}_sketch`).send({
        type: 'broadcast',
        event: 'submit_guess',
        payload: { userId: user.id, text: guess }
      })
    }

    setGuess('')
  }

  // Host listens for guesses
  useEffect(() => {
    if (!isHost) return
    const channel = supabase.channel(`room_${roomId}_sketch`)
    channel.on('broadcast', { event: 'submit_guess' }, ({ payload }) => {
      const { userId, text } = payload
      const player = gameState.players.find((p) => p.id === userId)
      if (!player || player.hasGuessed) return

      if (text.toLowerCase().trim() === gameState.currentWord?.toLowerCase()) {
        // Correct!
        // Score calc based on time left
        const points = Math.ceil(timeLeft * 10) + 50
        const newPlayers = gameState.players.map((p) =>
          p.id === userId ? { ...p, score: p.score + points, hasGuessed: true } : p
        )

        // Check if everyone guessed
        const allGuessed =
          newPlayers.filter((p) => !p.hasGuessed && p.id !== gameState.drawerId).length === 0

        if (allGuessed) {
          // End Round Early
          handleRoundEnd(newPlayers)
        } else {
          const ns = { ...gameState, players: newPlayers }
          setGameState(ns)
          broadcastState(ns)
        }
      }
    })
    return () => {
      channel.unsubscribe()
    }
  }, [gameState, isHost, timeLeft])

  const handleRoundEnd = (currentPlayers = gameState.players) => {
    // Drawer gets points if people guessed
    const guessers = currentPlayers.filter((p) => p.hasGuessed).length
    const drawerPoints = guessers * 50
    const updatedPlayers = currentPlayers.map((p) =>
      p.id === gameState.drawerId ? { ...p, score: p.score + drawerPoints } : p
    )

    const newState: GameState = {
      ...gameState,
      status: 'round_end',
      endTime: Date.now() + 10000,
      players: updatedPlayers
    }
    setGameState(newState)
    broadcastState(newState)
  }

  const startNextRound = () => {
    // Rotate drawer
    const currentIdx = gameState.players.findIndex((p) => p.id === gameState.drawerId)
    const nextIdx = (currentIdx + 1) % gameState.players.length

    if (nextIdx === 0 && gameState.round >= gameState.totalRounds) {
      // Game Over
      setGameState({ ...gameState, status: 'game_over' })
      broadcastState({ ...gameState, status: 'game_over' })
      return
    }

    const newState: GameState = {
      ...gameState,
      status: 'selecting_word',
      drawerId: gameState.players[nextIdx].id,
      round: gameState.round + (nextIdx === 0 ? 1 : 0),
      endTime: Date.now() + 15000,
      currentWord: null,
      players: gameState.players.map((p) => ({ ...p, hasGuessed: false }))
    }
    setGameState(newState)
    broadcastState(newState)
  }

  // Render Helpers
  const getSystemMessage = () => {
    if (gameState.status === 'selecting_word') {
      return isDrawer
        ? 'Choose a word to draw!'
        : `${gameState.players.find((p) => p.id === gameState.drawerId)?.name} is choosing a word...`
    }
    if (gameState.status === 'drawing') {
      return isDrawer ? `Draw: ${gameState.currentWord}` : 'Guess the drawing!'
    }
    if (gameState.status === 'round_end') {
      return `Round Over! The word was: ${gameState.currentWord}`
    }
    return ''
  }

  return (
    <div className="flex w-full h-full bg-zinc-950 text-white overflow-hidden relative">
      <Button
        variant="ghost"
        className="absolute top-4 left-4 z-50 text-white/50 hover:text-white"
        onClick={onBackAction}
      >
        <ArrowLeft className="w-5 h-5 mr-2" /> Exit
      </Button>

      {/* Left Sidebar: Players */}
      <div className="w-64 border-r border-white/5 bg-black/20 p-4 flex flex-col gap-4">
        <div className="text-xl font-bold font-heading flex items-center gap-2">
          <Palette className="w-6 h-6 text-pink-500" /> Sketch
        </div>
        <div className="flex items-center justify-between text-xs font-mono text-zinc-500">
          <span>
            Round {gameState.round}/{gameState.totalRounds}
          </span>
          <span className={cn(timeLeft < 10 && 'text-red-500 animate-pulse')}>{timeLeft}s</span>
        </div>

        <ScrollArea className="flex-1 -mx-2 px-2">
          <div className="space-y-2">
            {gameState.players
              .sort((a, b) => b.score - a.score)
              .map((p, i) => (
                <div
                  key={p.id}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border transition-all',
                    p.id === gameState.drawerId
                      ? 'bg-pink-500/10 border-pink-500/50'
                      : 'bg-white/5 border-white/5',
                    p.hasGuessed ? 'bg-emerald-500/10 border-emerald-500/50' : ''
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-xs font-mono text-zinc-500">#{i + 1}</div>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm flex items-center gap-2">
                        {p.name}
                        {p.id === gameState.drawerId && (
                          <Palette className="w-3 h-3 text-pink-400" />
                        )}
                      </span>
                      <span className="text-xs text-zinc-500">{p.score} pts</span>
                    </div>
                  </div>
                  {p.hasGuessed && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                </div>
              ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Stage */}
      <div className="flex-1 flex flex-col">
        {/* Header / Status */}
        <div className="h-16 border-b border-white/5 bg-white/5 flex items-center justify-center relative">
          <h2 className="text-xl font-bold tracking-tight animate-in fade-in key={gameState.status}">
            {getSystemMessage()}
          </h2>
          {gameState.currentWord && !isDrawer && gameState.status === 'drawing' && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 flex gap-1">
              {gameState.currentWord.split('').map((_, i) => (
                <div key={i} className="w-6 h-8 border-b-2 border-white/20" />
              ))}
            </div>
          )}
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative bg-white touch-none cursor-crosshair overflow-hidden">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          />

          {/* Overlays */}
          {gameState.status === 'selecting_word' && isDrawer && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-8 z-20">
              <h3 className="text-3xl font-bold mb-8 text-white">Choose a Word</h3>
              <div className="grid grid-cols-3 gap-4">
                {WORDS.sort(() => 0.5 - Math.random())
                  .slice(0, 3)
                  .map((w) => (
                    <button
                      key={w}
                      onClick={() => handleWordSelect(w)}
                      className="px-8 py-6 rounded-xl bg-white text-black text-2xl font-bold hover:bg-zinc-200 transition-all hover:scale-105"
                    >
                      {w}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {gameState.status === 'lobby' && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-8 z-20">
              <h1 className="text-6xl font-bold font-heading mb-4 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500">
                Sketch
              </h1>
              <p className="text-xl text-zinc-400 mb-12">Draw, Guess, Win.</p>

              {gameState.players.length === 0 ? (
                <Button
                  size="lg"
                  className="text-lg px-12 py-6 rounded-full bg-pink-600 hover:bg-pink-500"
                  onClick={() => {
                    const newState = {
                      ...gameState,
                      players: [
                        {
                          id: user.id,
                          name: 'Player 1',
                          score: 0,
                          hasGuessed: false
                        }
                      ]
                    }
                    setGameState(newState)
                    broadcastState(newState)
                  }}
                >
                  Create Game
                </Button>
              ) : isHost ? (
                <Button
                  size="lg"
                  className="text-lg px-12 py-6 rounded-full"
                  onClick={handleStartGame}
                >
                  Start Game
                </Button>
              ) : (
                <div className="flex items-center gap-3 text-zinc-400 animate-pulse">
                  <Clock className="w-5 h-5" /> Waiting for host...
                </div>
              )}
            </div>
          )}

          {gameState.status === 'game_over' && (
            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-8 z-20">
              <Trophy className="w-32 h-32 text-yellow-500 mb-6" />
              <h2 className="text-4xl font-bold mb-2">Game Over!</h2>
              <div className="text-2xl text-zinc-400 mb-8">
                Winner:{' '}
                <span className="text-white font-bold">
                  {gameState.players.sort((a, b) => b.score - a.score)[0]?.name}
                </span>
              </div>
              {isHost && <Button onClick={handleStartGame}>Play Again</Button>}
            </div>
          )}
        </div>

        {/* Drawing Tools (Drawer Only) */}
        {isDrawer && gameState.status === 'drawing' && (
          <div className="h-20 border-t border-zinc-200 bg-white flex items-center justify-center gap-6 px-4">
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    'w-8 h-8 rounded-full border-2 transition-transform hover:scale-110',
                    color === c ? 'border-black scale-110' : 'border-transparent'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="w-px h-10 bg-zinc-200 mx-2" />
            <div className="flex items-center gap-2">
              {[2, 6, 12, 24].map((size) => (
                <button
                  key={size}
                  onClick={() => setLineWidth(size)}
                  className={cn(
                    'rounded-full bg-black transition-all hover:opacity-80',
                    lineWidth === size
                      ? 'opacity-100 ring-2 ring-pink-500 ring-offset-2'
                      : 'opacity-30'
                  )}
                  style={{ width: size, height: size }}
                />
              ))}
            </div>
            <div className="w-px h-10 bg-zinc-200 mx-2" />
            <Button variant="ghost" size="icon" onClick={() => setColor('#ffffff')} title="Eraser">
              <Eraser
                className={cn('w-6 h-6', color === '#ffffff' ? 'text-pink-600' : 'text-zinc-400')}
              />
            </Button>
            <Button variant="ghost" size="icon" onClick={clearCanvas} title="Clear All">
              <Trash2 className="w-6 h-6 text-red-500" />
            </Button>
          </div>
        )}
      </div>

      {/* Right Sidebar: Chat */}
      <div className="w-80 border-l border-white/5 bg-black/20 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col-reverse">
          {[...messages].reverse().map((m, i) => (
            <div
              key={i}
              className={cn(
                'text-sm p-2 rounded-lg',
                m.type === 'guess_correct'
                  ? 'bg-emerald-500/20 text-emerald-300 font-bold text-center'
                  : m.type === 'system'
                    ? 'text-zinc-500 text-center text-xs uppercase tracking-widest'
                    : 'bg-white/5'
              )}
            >
              {m.type === 'chat' && <span className="font-bold text-white/50">{m.name}: </span>}
              {m.text}
            </div>
          ))}
        </div>

        <form onSubmit={handleGuess} className="p-4 border-t border-white/5 bg-black/40">
          <div className="relative">
            <Input
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              disabled={isDrawer || gameState.status !== 'drawing' || me?.hasGuessed}
              placeholder={
                isDrawer
                  ? "It's your turn to draw!"
                  : me?.hasGuessed
                    ? 'You already guessed it!'
                    : 'Type your guess...'
              }
              className="pr-10 bg-black/50 border-white/10"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
              disabled={!guess.trim()}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CheckCircle({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}
