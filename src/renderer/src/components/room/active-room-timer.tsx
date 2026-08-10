'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'

interface ActiveRoomTimerProps {
  createdAt: string
}

export function ActiveRoomTimer({ createdAt }: ActiveRoomTimerProps) {
  const [duration, setDuration] = useState('')

  useEffect(() => {
    const start = new Date(createdAt).getTime()

    const updateTimer = () => {
      const now = new Date().getTime()
      const diff = now - start

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      const fmt = (n: number) => n.toString().padStart(2, '0')
      setDuration(`${fmt(hours)}:${fmt(minutes)}:${fmt(seconds)}`)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [createdAt])

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/5 text-xs font-mono text-white/70">
      <Clock className="w-3 h-3 text-emerald-400" />
      <span>{duration}</span>
    </div>
  )
}
