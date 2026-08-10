'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Maximize2, Users, Mic, MicOff } from 'lucide-react'
import { PeerStream, PeerMetadata } from '../../hooks/use-webrtc'
import { useAudioLevel } from '../../hooks/use-audio-level'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface ParticipantsStripProps {
  localStream: MediaStream | null
  remoteStreams: PeerStream[]
  peersMetadata: Record<string, PeerMetadata>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any
  onExpand: () => void
  isMicOn: boolean
}

// Sub-component to handle audio level hook correctly for each peer
function ParticipantAvatar({
  stream,
  name,
  avatarUrl,
  isLocal = false,
  isMicOn = true,
  onClick,
  index = 0
}: {
  stream: MediaStream | null
  name: string
  avatarUrl?: string
  isLocal?: boolean
  isMicOn?: boolean
  onClick: () => void
  index?: number
}) {
  const { isSpeaking } = useAudioLevel(stream)

  const getInitials = (n?: string) => {
    if (!n) return 'U'
    return n
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          className="relative group cursor-pointer"
          onClick={onClick}
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 30,
            delay: index * 0.05
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Speaking Ring Animation */}
          <AnimatePresence>
            {isSpeaking && (
              <>
                {/* Outer pulse ring */}
                <motion.div
                  className="absolute -inset-2 rounded-full"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: [0.5, 0],
                    scale: [1, 1.4]
                  }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: 'easeOut'
                  }}
                  style={{
                    background:
                      'radial-gradient(circle, rgba(34, 197, 94, 0.4) 0%, transparent 70%)'
                  }}
                />
                {/* Inner glow */}
                <motion.div
                  className="absolute -inset-1 rounded-full bg-white/20 blur-md"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  exit={{ opacity: 0 }}
                />
              </>
            )}
          </AnimatePresence>

          {/* Breathing animation for avatar */}
          <motion.div
            animate={{
              scale: isLocal ? [1, 1.02, 1] : 1
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            <Avatar
              className={cn(
                'w-11 h-11 border-2 transition-all relative z-10',
                isLocal
                  ? 'border-indigo-500/50 ring-2 ring-indigo-500/20'
                  : 'border-border group-hover:border-primary/30',
                isSpeaking && !isLocal && 'border-green-500/50 ring-2 ring-green-500/30'
              )}
            >
              <AvatarImage src={avatarUrl} />
              <AvatarFallback
                className={cn(
                  'font-medium text-xs',
                  isLocal
                    ? 'bg-white/10 border border-white/20 text-white'
                    : 'bg-white/5 text-white/50 border border-white/10'
                )}
              >
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
          </motion.div>

          {/* Mic Status Indicator */}
          <motion.div
            className={cn(
              'absolute -bottom-0.5 -right-0.5 p-1 rounded-full border-2 border-black z-20',
              !isMicOn ? 'bg-red-500' : isSpeaking ? 'bg-green-500' : 'bg-zinc-700'
            )}
            animate={{
              scale: isSpeaking ? [1, 1.2, 1] : 1
            }}
            transition={{
              duration: 0.3,
              repeat: isSpeaking ? Infinity : 0
            }}
          >
            {!isMicOn ? (
              <MicOff className="w-2.5 h-2.5 text-white" />
            ) : (
              <Mic className="w-2.5 h-2.5 text-white" />
            )}
          </motion.div>

          {/* Local indicator */}
          {isLocal && (
            <motion.div
              className="absolute -top-0.5 -left-0.5 px-1 py-0.5 bg-white rounded text-[8px] font-bold text-black z-20 shadow-lg"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, delay: 0.2 }}
            >
              YOU
            </motion.div>
          )}
        </motion.div>
      </TooltipTrigger>
      <TooltipContent
        side="left"
        className="bg-popover text-popover-foreground border-border flex items-center gap-2 rounded-lg shadow-xl"
      >
        <span className="font-medium">{isLocal ? 'You' : name}</span>
        {isSpeaking && <span className="text-xs text-green-400">(Speaking)</span>}
        {!isMicOn && <span className="text-xs text-red-400">(Muted)</span>}
      </TooltipContent>
    </Tooltip>
  )
}

export function ParticipantsStrip({
  localStream,
  remoteStreams,
  peersMetadata,
  user,
  onExpand,
  isMicOn
}: ParticipantsStripProps) {
  const totalParticipants = 1 + Object.keys(peersMetadata).length

  return (
    <motion.div
      className="w-20 flex flex-col items-center py-4 gap-4 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[28px] max-h-[85vh] transition-all overflow-hidden shadow-2xl"
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      {/* Header */}
      <motion.div
        className="flex flex-col items-center gap-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="p-2.5 rounded-full bg-white/5 shadow-inner text-white/60">
          <Users className="w-4 h-4" />
        </div>
        <span className="text-[10px] font-medium text-white/60">{totalParticipants}</span>
      </motion.div>

      {/* Divider */}
      <div className="w-8 h-px bg-white/10" />

      {/* Participants */}
      <div className="flex-1 w-full flex flex-col items-center gap-3 overflow-y-auto scrollbar-hide px-3 min-h-0 py-1">
        <TooltipProvider delayDuration={0}>
          <AnimatePresence mode="popLayout">
            {/* Local User */}
            <ParticipantAvatar
              key="local"
              stream={localStream}
              name={user.user_metadata?.full_name || 'Me'}
              avatarUrl={user.user_metadata?.avatar_url}
              isLocal={true}
              isMicOn={isMicOn}
              onClick={onExpand}
              index={0}
            />

            {/* Separator if there are remote users */}
            {Object.keys(peersMetadata).length > 0 && (
              <motion.div
                key="separator"
                className="w-8 h-px bg-border shrink-0"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.3 }}
              />
            )}

            {/* Remote Users */}
            {Object.entries(peersMetadata).map(([userId, meta], i) => {
              const peerStream = remoteStreams.find((p) => p.userId === userId)
              const isPeerMicOn = peerStream?.stream?.getAudioTracks()[0]?.enabled ?? false

              // If no stream is found, they are "Connecting..." or failed.
              // We still show them.

              return (
                <ParticipantAvatar
                  key={userId}
                  stream={peerStream?.stream || null}
                  name={meta.name || 'Guest'}
                  avatarUrl={meta.avatarUrl}
                  isMicOn={isPeerMicOn}
                  onClick={onExpand}
                  index={i + 1}
                />
              )
            })}
          </AnimatePresence>
        </TooltipProvider>
      </div>

      {/* Expand Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={onExpand}
          className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all backdrop-blur-md"
          title="Expand View"
        >
          <Maximize2 className="w-4 h-4" />
        </Button>
      </motion.div>
    </motion.div>
  )
}
