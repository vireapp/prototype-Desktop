import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { DuoWizard } from './duo-wizard'
import { DuoMatchingScreen } from './duo-match-screen'
import type { RoomType } from './actions'

// ─── Screen States ─────────────────────────────────────────────────────────────

type Screen = 'wizard' | 'matching'

// ─── Duo Entry Button (shown on Rooms page) ───────────────────────────────────

export function DuoButton() {
  const [open, setOpen] = useState(false)
  const [screen, setScreen] = useState<Screen>('wizard')
  const [queueId, setQueueId] = useState('')
  const [roomType, setRoomType] = useState<RoomType>('friends')

  const handleClose = () => {
    setOpen(false)
    // Reset after close animation
    setTimeout(() => {
      setScreen('wizard')
      setQueueId('')
    }, 300)
  }

  const handleMatching = (id: string, type: RoomType) => {
    setQueueId(id)
    setRoomType(type)
    setScreen('matching')
  }

  return (
    <>
      {/* Trigger Button */}
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
        className={cn(
          'relative flex items-center gap-2 h-9 px-4 rounded-xl font-semibold text-sm',
          'bg-gradient-to-r from-rose-500 to-pink-600 text-white',
          'shadow-lg shadow-rose-500/30 hover:shadow-rose-500/50 transition-shadow',
          'border border-rose-400/30'
        )}
      >
        {/* Pulse glow ring */}
        <span className="absolute inset-0 rounded-xl animate-ping opacity-20 bg-rose-500 pointer-events-none" />

        <Heart className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />
        Find a Duo
      </motion.button>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
        <DialogContent
          className="p-0 border-border/50 bg-background/95 backdrop-blur-2xl overflow-hidden max-h-[85vh]"
          style={{ width: '460px', maxWidth: '95vw' }}
        >
          <AnimatePresence mode="wait">
            {screen === 'wizard' ? (
              <motion.div
                key="wizard"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col max-h-[85vh]"
              >
                <DuoWizard
                  onClose={handleClose}
                  onMatching={handleMatching}
                />
              </motion.div>
            ) : (
              <motion.div
                key="matching"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col"
                style={{ minHeight: '480px' }}
              >
                <DuoMatchingScreen
                  queueId={queueId}
                  roomType={roomType}
                  onClose={handleClose}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  )
}
