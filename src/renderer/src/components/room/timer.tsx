'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Play, Pause, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RoomTimerProps {
  roomId: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any
  onBack?: () => void
}

export function RoomTimer({ roomId, user, onBack }: RoomTimerProps) {
  const [timeLeft, setTimeLeft] = useState(25 * 60) // 25 minutes
  const [isRunning, setIsRunning] = useState(false)
  const [mode, setMode] = useState<'focus' | 'short' | 'long'>('focus')

  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channelRef = useRef<any>(null)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Sync
  useEffect(() => {
    const channel = supabase
      .channel(`room_timer:${roomId}`)
      .on('broadcast', { event: 'timer_update' }, ({ payload }) => {
        if (payload.userId !== user.id) {
          setTimeLeft(payload.timeLeft)
          setIsRunning(payload.isRunning)
          setMode(payload.mode)
        }
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, user.id, supabase])

  // Timer Logic
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsRunning(false)
    }

    return () => clearInterval(interval)
  }, [isRunning, timeLeft])

  const broadcastState = (newIsRunning: boolean, newTime: number, newMode: string) => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'timer_update',
      payload: {
        isRunning: newIsRunning,
        timeLeft: newTime,
        mode: newMode,
        userId: user.id
      }
    })
  }

  const toggleTimer = () => {
    const newState = !isRunning
    setIsRunning(newState)
    broadcastState(newState, timeLeft, mode)
  }

  const resetTimer = () => {
    setIsRunning(false)
    const newTime = mode === 'focus' ? 25 * 60 : mode === 'short' ? 5 * 60 : 15 * 60
    setTimeLeft(newTime)
    broadcastState(false, newTime, mode)
  }

  const changeMode = (newMode: 'focus' | 'short' | 'long') => {
    setMode(newMode)
    const newTime = newMode === 'focus' ? 25 * 60 : newMode === 'short' ? 5 * 60 : 15 * 60
    setTimeLeft(newTime)
    setIsRunning(false)
    broadcastState(false, newTime, newMode)
  }

  return (
    <div className="flex flex-col h-full w-full bg-black/40 backdrop-blur-xl p-8 relative items-center justify-center">
      {onBack && (
        <div className="absolute top-6 left-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>
      )}

      <div className="mb-12 flex gap-4">
        <Button
          variant="ghost"
          onClick={() => changeMode('focus')}
          className={cn(
            'rounded-full px-6',
            mode === 'focus' ? 'bg-white/10 text-white' : 'text-white/50'
          )}
        >
          Focus (25m)
        </Button>
        <Button
          variant="ghost"
          onClick={() => changeMode('short')}
          className={cn(
            'rounded-full px-6',
            mode === 'short' ? 'bg-white/10 text-white' : 'text-white/50'
          )}
        >
          Short Break (5m)
        </Button>
        <Button
          variant="ghost"
          onClick={() => changeMode('long')}
          className={cn(
            'rounded-full px-6',
            mode === 'long' ? 'bg-white/10 text-white' : 'text-white/50'
          )}
        >
          Long Break (15m)
        </Button>
      </div>

      <div className="text-[12rem] font-bold font-mono user-select-none tabular-nums tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 drop-shadow-2xl">
        {formatTime(timeLeft)}
      </div>

      <div className="mt-12 flex items-center gap-8">
        <Button
          size="lg"
          className="h-20 w-20 rounded-full bg-white text-black hover:bg-indigo-50 border-0 shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all hover:scale-105"
          onClick={toggleTimer}
        >
          {isRunning ? (
            <Pause className="w-8 h-8 fill-current" />
          ) : (
            <Play className="w-8 h-8 fill-current ml-1" />
          )}
        </Button>

        <Button
          size="icon"
          variant="ghost"
          className="h-14 w-14 rounded-full text-white/50 hover:text-white hover:bg-white/10"
          onClick={resetTimer}
        >
          <RotateCcw className="w-6 h-6" />
        </Button>
      </div>

      <p className="mt-8 text-white/30 font-medium tracking-wide uppercase text-sm">
        Shared Session Timer
      </p>
    </div>
  )
}
