'use client'

import { Button } from '@/components/ui/button'
import { Heart, ThumbsUp, PartyPopper, Smile } from 'lucide-react'

export const REACTION_ICONS = [
  { icon: Heart, color: 'text-red-500', emoji: '❤️' },
  { icon: ThumbsUp, color: 'text-blue-500', emoji: '👍' },
  { icon: PartyPopper, color: 'text-yellow-500', emoji: '🎉' },
  { icon: Smile, color: 'text-emerald-500', emoji: '😂' }
]

interface RoomReactionBarProps {
  onReaction: (emoji: string) => void
}

export function RoomReactionBar({ onReaction }: RoomReactionBarProps) {
  return (
    <div className="flex items-center gap-1">
      {REACTION_ICONS.map((r, i) => (
        <Button
          key={i}
          variant="ghost"
          size="icon"
          onClick={() => onReaction(r.emoji)}
          className="rounded-full w-9 h-9 hover:bg-white/10 hover:scale-110 transition-all active:scale-95"
        >
          <r.icon className={`w-4 h-4 ${r.color}`} />
        </Button>
      ))}
    </div>
  )
}
