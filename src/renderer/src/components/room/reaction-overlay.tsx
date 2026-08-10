'use client'

import { AnimatePresence, motion } from 'framer-motion'

export interface ReactionItem {
  id: string
  emoji: string
  x: number
  y: number
}

interface RoomReactionOverlayProps {
  reactions: ReactionItem[]
}

export function RoomReactionOverlay({ reactions }: RoomReactionOverlayProps) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
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
