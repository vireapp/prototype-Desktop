'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { AnimatePresence, motion } from 'framer-motion'
import { Heart, ThumbsUp, PartyPopper, Smile } from 'lucide-react'

interface Reaction {
  id: string
  emoji: string
  x: number
  y: number
}

interface RoomReactionsProps {
  roomId: string
  inline?: boolean
}

const REACTIONS = [
  { icon: Heart, color: 'text-red-500', emoji: '❤️' },
  { icon: ThumbsUp, color: 'text-blue-500', emoji: '👍' },
  { icon: PartyPopper, color: 'text-yellow-500', emoji: '🎉' },
  { icon: Smile, color: 'text-emerald-500', emoji: '😂' }
]

export function RoomReactions({ roomId, inline }: RoomReactionsProps) {
  const [reactions, setReactions] = useState<Reaction[]>([])
  const supabase = createClient()

  const addReaction = useCallback((emoji: string) => {
    const id = Math.random().toString(36).substring(7)
    // Randomize start position slightly around center-bottom or random
    const x = Math.random() * 80 + 10 // 10% to 90% width

    setReactions((prev) => [...prev, { id, emoji, x, y: 100 }])

    // Cleanup
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id))
    }, 2000)
  }, [])

  useEffect(() => {
    const channel = supabase.channel(`room_${roomId}_reactions`)
    channel
      .on('broadcast', { event: 'reaction' }, ({ payload }) => {
        addReaction(payload.emoji)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, supabase, addReaction])

  const sendReaction = async (emoji: string) => {
    // Show locally instantly
    addReaction(emoji)

    // Broadcast
    await supabase.channel(`room_${roomId}_reactions`).send({
      type: 'broadcast',
      event: 'reaction',
      payload: { emoji }
    })
  }

  if (inline) {
    return (
      <div className="flex items-center gap-1">
        {REACTIONS.map((r, i) => (
          <Button
            key={i}
            variant="ghost"
            size="icon"
            onClick={() => sendReaction(r.emoji)}
            className="rounded-full w-9 h-9 hover:bg-white/10 hover:scale-110 transition-all active:scale-95"
          >
            <r.icon className={`w-4 h-4 ${r.color}`} />
          </Button>
        ))}
      </div>
    )
  }

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {/* Floating Reactions Layer - Only show animations layer here, controls moved */}
      <AnimatePresence>
        {reactions.map((r) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 100, x: `${r.x}%`, scale: 0.5 }}
            animate={{ opacity: [1, 1, 0], y: -200, scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: 'easeOut' }}
            className="absolute bottom-20 text-4xl drop-shadow-lg"
            style={{ left: `${r.x}%` }}
          >
            {r.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
