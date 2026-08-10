'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Hand, Scissors, Square, RefreshCcw } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { getAiGameMove } from '@/lib/ai/game-agent'

interface RPSState {
  players: {
    [key: string]: {
      id: string
      name: string
      move: 'rock' | 'paper' | 'scissors' | null
      score: number
    }
  }
  status: 'waiting' | 'playing' | 'revealed'
  timer: number
}

export function RockPaperScissors({
  roomId,
  user,
  onBackAction
}: {
  roomId: string
  user: { id: string; name?: string; [key: string]: unknown }
  onBackAction: () => void
}): React.JSX.Element {
  const [gameState, setGameState] = useState<RPSState>({
    players: {},
    status: 'waiting',
    timer: 3
  })

  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`room_${roomId}_rps`)
      .on('broadcast', { event: 'state_update' }, ({ payload }) => {
        setGameState(payload)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, supabase])

  const broadcastState = async (newState: RPSState): Promise<void> => {
    await supabase.channel(`room_${roomId}_rps`).send({
      type: 'broadcast',
      event: 'state_update',
      payload: newState
    })
  }

  // AI State
  const [isAiGame, setIsAiGame] = useState(false)
  const [hasAiMoved, setHasAiMoved] = useState(false)

  // AI Logic
  const [isThinking, setIsThinking] = useState(false)
  const aiProcessingRef = useRef(false)

  const makeAiMove = (move: 'rock' | 'paper' | 'scissors', comment?: string): void => {
    const aiId = 'AI'
    const aiPlayer = gameState.players[aiId]
    if (!aiPlayer) return

    if (comment) {
      toast(comment, { icon: '🤖', duration: 4000 })
    }

    const newState: RPSState = {
      ...gameState,
      players: {
        ...gameState.players,
        [aiId]: { ...aiPlayer, move }
      }
    }

    // Check if game should end
    const players = Object.values(newState.players)
    if (players.every((p) => p.move)) {
      newState.status = 'revealed'
      const p1 = players[0]
      const p2 = players[1]
      const winner = getWinner(p1.move!, p2.move!)
      if (winner === 'p1') newState.players[p1.id].score++
      else if (winner === 'p2') newState.players[p2.id].score++
    }

    setHasAiMoved(true)
    setGameState(newState)
    broadcastState(newState)
  }

  useEffect(() => {
    if (!isAiGame) return

    // In RPS, players join then make moves.
    // If AI is joined, and hasn't moved, it should make a move.

    const aiId = 'AI'
    const aiPlayer = gameState.players[aiId]

    if (
      aiPlayer &&
      !hasAiMoved &&
      gameState.status !== 'revealed' &&
      !isThinking &&
      !aiProcessingRef.current
    ) {
      const fetchMove = async (): Promise<void> => {
        aiProcessingRef.current = true
        setIsThinking(true)

        const result = await getAiGameMove('rock-paper-scissors', {}) // RPS doesn't need state really, just context

        setIsThinking(false)
        aiProcessingRef.current = false

        if (result && result.move) {
          const move = result.move.toLowerCase()
          if (!['rock', 'paper', 'scissors'].includes(move)) {
            // Fallback random
            const moves = ['rock', 'paper', 'scissors'] as const
            const randomMove = moves[Math.floor(Math.random() * moves.length)]
            makeAiMove(randomMove, 'I panicked!')
          } else {
            makeAiMove(move as 'rock' | 'paper' | 'scissors', result.comment)
          }
        } else {
          // Fallback
          const moves = ['rock', 'paper', 'scissors'] as const
          const randomMove = moves[Math.floor(Math.random() * moves.length)]
          makeAiMove(randomMove, 'Connection glitch...')
        }
      }

      fetchMove()
    }

    // Reset AI move flag if new round
    if (gameState.status === 'playing' && hasAiMoved && !gameState.players[aiId]?.move) {
      setHasAiMoved(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, isAiGame, hasAiMoved])

  const joinGame = (): void => {
    const currentPlayers = Object.keys(gameState.players)
    if (currentPlayers.includes(user.id)) return
    if (currentPlayers.length >= 2) {
      toast.error('Game is full')
      return
    }

    const newState: RPSState = {
      ...gameState,
      players: {
        ...gameState.players,
        [user.id]: {
          id: user.id,
          name: user.name || 'Player',
          move: null,
          score: 0
        }
      }
    }

    setGameState(newState)
    broadcastState(newState)
  }

  const playVsAi = (): void => {
    setIsAiGame(true)
    // User joins
    const newState = { ...gameState }
    if (!newState.players[user.id]) {
      newState.players[user.id] = {
        id: user.id,
        name: user.name || 'Player',
        move: null,
        score: 0
      }
    }

    // AI Joins
    if (!newState.players['AI']) {
      newState.players['AI'] = {
        id: 'AI',
        name: 'VIRE (AI)',
        move: null,
        score: 0
      }
    }

    setGameState(newState)
    broadcastState(newState)
  }

  const makeMove = (move: 'rock' | 'paper' | 'scissors'): void => {
    if (!gameState.players[user.id]) return

    const newState: RPSState = {
      ...gameState,
      players: {
        ...gameState.players,
        [user.id]: { ...gameState.players[user.id], move }
      }
    }

    // Check if both moved
    const players = Object.values(newState.players) as RPSState['players'][string][]

    // Logic: In AI Game, AI moves automatically via Effect.
    // If standard game, waiting for other.

    if (players.length === 2 && players.every((p) => p.move)) {
      newState.status = 'revealed'

      // Score update
      const [p1, p2] = players
      const winner = getWinner(p1.move!, p2.move!)

      // p1 is first key, p2 is second.
      // If p1 wins, increment p1.
      // Note: getWinner returns "p1" if first arg wins.

      if (winner === 'p1') newState.players[p1.id].score++
      if (winner === 'p2') newState.players[p2.id].score++
    }

    setGameState(newState)
    broadcastState(newState)
  }

  const resetRound = (): void => {
    const newState: RPSState = {
      ...gameState,
      status: 'playing',
      players: Object.fromEntries(
        Object.entries(gameState.players).map(([k, v]) => [k, { ...v, move: null }])
      )
    }
    setGameState(newState)
    broadcastState(newState)
    // AI will see (move: null) and trigger move again via effect
  }

  const getWinner = (m1: string, m2: string): string => {
    if (m1 === m2) return 'draw'
    if (
      (m1 === 'rock' && m2 === 'scissors') ||
      (m1 === 'paper' && m2 === 'rock') ||
      (m1 === 'scissors' && m2 === 'paper')
    )
      return 'p1'
    return 'p2'
  }

  const opponentId = Object.keys(gameState.players).find((id) => id !== user.id)
  const me = gameState.players[user.id]
  const opponent = opponentId ? gameState.players[opponentId] : null

  // Determine result text
  let resultText = ''
  if (gameState.status === 'revealed' && me && opponent && me.move && opponent.move) {
    const res = getWinner(me.move, opponent.move)
    if (res === 'draw') resultText = 'Draw!'
    else if (res === 'p1') resultText = 'You Win!'
    else resultText = 'You Lose!'
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 bg-zinc-950/50 p-6 relative">
      <Button variant="ghost" onClick={onBackAction} className="absolute top-4 left-4 z-10">
        Back
      </Button>

      <h2 className="text-3xl font-bold font-heading text-white">Rock Paper Scissors</h2>

      {!me ? (
        <div className="flex flex-col items-center gap-4">
          <p className="text-white/60">Ready to challenge?</p>
          <div className="flex gap-4">
            <Button onClick={joinGame} size="lg" className="bg-indigo-500 hover:bg-indigo-600">
              Join Multiplayer
            </Button>
            <Button
              onClick={playVsAi}
              size="lg"
              variant="secondary"
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              Play vs VIRE
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col w-full max-w-2xl gap-8">
          {/* Score Board */}
          <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10">
            <div className="text-center">
              <h3 className="text-sm text-white/50">You</h3>
              <p className="text-3xl font-bold text-white">{me.score}</p>
            </div>
            <div className="text-xl font-bold text-white/20">VS</div>
            <div className="text-center">
              <h3 className="text-sm text-white/50">{opponent?.name || 'Waiting...'}</h3>
              <p className="text-3xl font-bold text-white">{opponent?.score || 0}</p>
            </div>
          </div>

          {/* Game Area */}
          <div className="flex justify-between items-center h-64 relative">
            {/* My Move */}
            <div className="flex-1 flex justify-center">
              {me.move ? (
                <div
                  className={cn(
                    'w-32 h-32 rounded-full flex items-center justify-center border-4 transition-all duration-500',
                    gameState.status === 'revealed'
                      ? getMoveColor(me.move)
                      : 'border-white/20 bg-white/5'
                  )}
                >
                  {gameState.status === 'revealed' || me.move ? (
                    <MoveIcon move={me.move} size={48} />
                  ) : null}
                </div>
              ) : (
                <div className="text-white/30 animate-pulse">Make your move...</div>
              )}
            </div>

            {/* Result / Status */}
            <div className="w-48 text-center flex flex-col items-center gap-4">
              {gameState.status === 'revealed' ? (
                <>
                  <div className="text-2xl font-black text-white animate-in zoom-in">
                    {resultText}
                  </div>
                  <Button onClick={resetRound} variant="secondary" size="sm">
                    <RefreshCcw className="w-4 h-4 mr-2" /> Next Round
                  </Button>
                </>
              ) : !opponent ? (
                <div className="text-white/40 italic">Waiting for opponent...</div>
              ) : opponent.move ? (
                <div className="text-emerald-400 font-medium">
                  {opponent.id === 'AI' ? 'VIRE is ready!' : 'Opponent moved!'}
                </div>
              ) : (
                <div className="text-white/40 italic">
                  {opponent.id === 'AI' ? 'VIRE thinking...' : 'Opponent thinking...'}
                </div>
              )}
            </div>

            {/* Opponent Move */}
            <div className="flex-1 flex justify-center">
              {opponent && (
                <div
                  className={cn(
                    'w-32 h-32 rounded-full flex items-center justify-center border-4 transition-all duration-500',
                    gameState.status === 'revealed' && opponent.move
                      ? getMoveColor(opponent.move)
                      : 'border-white/20 bg-white/5'
                  )}
                >
                  {gameState.status === 'revealed' && opponent.move ? (
                    <MoveIcon move={opponent.move} size={48} />
                  ) : opponent.move ? (
                    <div className="w-16 h-16 rounded-full bg-white/10 animate-pulse" />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-white/10" />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-4 justify-center">
            <MoveButton
              move="rock"
              onClick={() => makeMove('rock')}
              disabled={gameState.status === 'revealed' || !!me.move}
            />
            <MoveButton
              move="paper"
              onClick={() => makeMove('paper')}
              disabled={gameState.status === 'revealed' || !!me.move}
            />
            <MoveButton
              move="scissors"
              onClick={() => makeMove('scissors')}
              disabled={gameState.status === 'revealed' || !!me.move}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function MoveButton({
  move,
  onClick,
  disabled
}: {
  move: string
  onClick: () => void
  disabled: boolean
}): React.JSX.Element {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-24 h-24 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 transition-all hover:scale-105 active:scale-95',
        disabled
          ? 'opacity-50 cursor-not-allowed bg-white/5 border-transparent'
          : 'bg-white/10 border-white/10 hover:bg-white/20 hover:border-white/30'
      )}
    >
      <MoveIcon move={move} />
      <span className="uppercase font-bold text-xs tracking-widest text-white/70">{move}</span>
    </button>
  )
}

function MoveIcon({ move, size = 32 }: { move: string; size?: number }): React.JSX.Element | null {
  if (move === 'rock')
    return <Square className="fill-current" style={{ width: size, height: size }} /> // Visual approximation
  if (move === 'paper')
    return <Hand className="fill-current" style={{ width: size, height: size }} />
  if (move === 'scissors')
    return <Scissors className="rotate-90 fill-current" style={{ width: size, height: size }} />
  return null
}

function getMoveColor(move: string): string {
  if (move === 'rock') return 'border-amber-500 bg-amber-500/20 text-amber-500'
  if (move === 'paper') return 'border-blue-500 bg-blue-500/20 text-blue-500'
  return 'border-rose-500 bg-rose-500/20 text-rose-500'
}
