'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { RefreshCcw, Trophy } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { getAiGameMove } from '@/lib/ai/game-agent'

interface GameState {
  board: (string | null)[]
  isXNext: boolean
  winner: string | null
  xPlayer: string | null
  oPlayer: string | null
}

export function TicTacToe({
  roomId,
  user,
  onBackAction
}: {
  roomId: string
  user: { id: string; name?: string; [key: string]: unknown }
  onBackAction: () => void
}): React.JSX.Element {
  const [gameState, setGameState] = useState<GameState>({
    board: Array(9).fill(null),
    isXNext: true,
    winner: null,
    xPlayer: null,
    oPlayer: null
  })

  const [isAiGame, setIsAiGame] = useState(false)

  const supabase = createClient()

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    const channel = supabase.channel(`room_${roomId}_tictactoe`)
    channelRef.current = channel

    channel
      .on('broadcast', { event: 'state_update' }, ({ payload }) => {
        setGameState(payload)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [roomId, supabase])

  // AI Logic
  const [isThinking, setIsThinking] = useState(false)

  useEffect(() => {
    if (!isAiGame) return

    const aiPlayer = 'AI'
    const isAiTurn = gameState.isXNext
      ? gameState.xPlayer === aiPlayer
      : gameState.oPlayer === aiPlayer

    if (isAiTurn && !gameState.winner && !gameState.board.every(Boolean) && !isThinking) {
      const fetchMove = async (): Promise<void> => {
        setIsThinking(true)
        // Small artificial delay for visual effect if API is too fast, but API is likely slow enough
        const result = await getAiGameMove('tic-tac-toe', {
          board: gameState.board,
          isXNext: gameState.isXNext
        })
        setIsThinking(false)

        if (result && typeof result.move === 'number') {
          const moveIndex = result.move
          // Validate move
          if (gameState.board[moveIndex] !== null) {
            console.error('AI tried to take taken spot', moveIndex)
            return
          }

          if (result.comment) {
            toast(result.comment, { icon: '🤖', duration: 4000 })
            
            // Broadcast AI comment to main chat so it acts like a real player
            supabase.channel(`room_${roomId}_chat`).send({
              type: 'broadcast',
              event: 'chat_message',
              payload: {
                id: Math.random().toString(36).substring(7),
                senderId: 'vire_ai',
                senderName: 'VIRE AI',
                senderAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=vire',
                content: result.comment,
                timestamp: Date.now(),
                isSystem: false
              }
            })
          }

          const newBoard = [...gameState.board]
          newBoard[moveIndex] = gameState.isXNext ? 'X' : 'O'

          const winner = calculateWinner(newBoard)
          const isDraw = !winner && newBoard.every((sq) => sq !== null)

          const newState = {
            ...gameState,
            board: newBoard,
            isXNext: !gameState.isXNext,
            winner: winner || (isDraw ? 'Draw' : null)
          }

          setGameState(newState)
          broadcastState(newState)

          if (winner) {
            const winnerName =
              (winner === 'X' && gameState.xPlayer === 'AI') ||
              (winner === 'O' && gameState.oPlayer === 'AI')
                ? 'VIRE'
                : winner
            toast.success(`${winnerName} Wins!`)
          } else if (isDraw) toast('Draw!')
        } else {
          toast.error('VIRE got confused...')
        }
      }

      fetchMove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, isAiGame]) // Check deps carefully

  const broadcastState = async (newState: GameState): Promise<void> => {
    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'state_update',
        payload: newState
      })
    }
  }

  const handleJoin = (player: 'X' | 'O'): void => {
    if ((player === 'X' && gameState.xPlayer) || (player === 'O' && gameState.oPlayer)) return

    const newState = {
      ...gameState,
      [player === 'X' ? 'xPlayer' : 'oPlayer']: user.id
    }
    setGameState(newState)
    broadcastState(newState)
  }

  const handlePlayVsAi = (): void => {
    setIsAiGame(true)
    // User joins as X, AI joins as O by default if empty
    // Or we fill the empty slot with AI
    const newState = { ...gameState }

    if (!newState.xPlayer) {
      newState.xPlayer = user.id
      newState.oPlayer = 'AI'
    } else if (!newState.oPlayer) {
      newState.oPlayer = 'AI'
    }

    setGameState(newState)
    broadcastState(newState)
  }

  const handleClick = (index: number): void => {
    if (gameState.winner || gameState.board[index]) return

    // Check turn
    const isMyTurn = gameState.isXNext
      ? gameState.xPlayer === user.id
      : gameState.oPlayer === user.id

    // Allow clicking if it's local AI game and it's our turn (handled by isMyTurn logically if we set ID correctly)
    if (!isMyTurn) {
      toast.error('Not your turn!')
      return
    }

    const newBoard = [...gameState.board]
    newBoard[index] = gameState.isXNext ? 'X' : 'O'

    const winner = calculateWinner(newBoard)
    const isDraw = !winner && newBoard.every((sq) => sq !== null)

    const newState = {
      ...gameState,
      board: newBoard,
      isXNext: !gameState.isXNext,
      winner: winner || (isDraw ? 'Draw' : null)
    }

    setGameState(newState)
    broadcastState(newState)

    if (winner) {
      toast.success(`${winner} Wins!`)
    } else if (isDraw) {
      toast('Draw!')
    }
  }

  const resetGame = (): void => {
    const newState = {
      board: Array(9).fill(null),
      isXNext: true,
      winner: null,
      xPlayer: gameState.xPlayer, // Keep players
      oPlayer: gameState.oPlayer
    }
    setGameState(newState)
    broadcastState(newState)
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 bg-zinc-950/50">
      <div className="flex flex-col items-center gap-2">
        <h2 className="text-2xl font-bold font-heading text-white">Tic Tac Toe</h2>

        {/* Play AI Button */}
        {!gameState.xPlayer && !gameState.oPlayer && (
          <Button
            onClick={handlePlayVsAi}
            variant="secondary"
            className="mb-4 bg-violet-600 hover:bg-violet-700 text-white border-0"
          >
            Play vs VIRE (AI)
          </Button>
        )}

        <div className="flex gap-4 text-sm mt-2">
          <div
            className={cn(
              'px-4 py-2 rounded-lg border',
              gameState.isXNext && !gameState.winner
                ? 'border-blue-500 bg-blue-500/20 text-blue-200'
                : 'border-white/10 text-muted-foreground'
            )}
          >
            Player X:{' '}
            {gameState.xPlayer ? (
              gameState.xPlayer === user.id ? (
                'You'
              ) : gameState.xPlayer === 'AI' ? (
                <span className="flex items-center gap-1 text-violet-300">
                  VIRE <Trophy className="w-3 h-3" />
                </span>
              ) : (
                'Joined'
              )
            ) : (
              <Button
                variant="link"
                className="p-0 h-auto text-blue-400"
                onClick={() => handleJoin('X')}
              >
                Join
              </Button>
            )}
          </div>
          <div
            className={cn(
              'px-4 py-2 rounded-lg border',
              !gameState.isXNext && !gameState.winner
                ? 'border-red-500 bg-red-500/20 text-red-200'
                : 'border-white/10 text-muted-foreground'
            )}
          >
            Player O:{' '}
            {gameState.oPlayer ? (
              gameState.oPlayer === user.id ? (
                'You'
              ) : gameState.oPlayer === 'AI' ? (
                <span className="flex items-center gap-1 text-violet-300">
                  VIRE <Trophy className="w-3 h-3" />
                </span>
              ) : (
                'Joined'
              )
            ) : (
              <Button
                variant="link"
                className="p-0 h-auto text-red-400"
                onClick={() => handleJoin('O')}
              >
                Join
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 p-4 bg-white/5 rounded-2xl border border-white/10 shadow-2xl">
        {gameState.board.map((sq, i) => (
          <button
            key={i}
            className={cn(
              'w-24 h-24 rounded-xl text-4xl font-black transition-all flex items-center justify-center',
              sq === 'X'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                : sq === 'O'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                  : 'bg-white/5 hover:bg-white/10 text-transparent'
            )}
            onClick={() => handleClick(i)}
            disabled={!!gameState.winner || !!sq}
          >
            {sq}
          </button>
        ))}
      </div>

      {gameState.winner && (
        <div className="flex flex-col items-center gap-4 animate-in zoom-in fade-in duration-300">
          <div className="flex items-center gap-2 text-2xl font-bold text-yellow-500">
            <Trophy className="w-8 h-8" />
            {gameState.winner === 'Draw'
              ? 'Draw!'
              : `${(gameState.winner === 'X' && gameState.xPlayer === 'AI') || (gameState.winner === 'O' && gameState.oPlayer === 'AI') ? 'VIRE' : gameState.winner} Wins!`}
          </div>
          <Button onClick={resetGame} variant="outline" className="gap-2">
            <RefreshCcw className="w-4 h-4" /> Play Again
          </Button>
        </div>
      )}

      <Button variant="ghost" onClick={onBackAction} className="absolute top-4 left-4">
        Back
      </Button>
    </div>
  )
}

function calculateWinner(squares: (string | null)[]): string | null {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
  ]
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i]
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a]
    }
  }
  return null
}
