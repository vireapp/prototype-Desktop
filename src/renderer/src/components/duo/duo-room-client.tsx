/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare, Mic, MicOff, Video, VideoOff, Gift,
  Lock, Send, Smile, Heart, Phone, PhoneOff, UserPlus,
  Settings2, LogOut, ChevronUp, Sparkles, Edit3, Check, X, Loader2, RefreshCw, PanelRight, Minimize2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import EmojiPicker, { Theme } from 'emoji-picker-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import {
  getDuoRoom, trackDuoMessage, trackDuoCall, nameDuoRoom,
  checkExtrasUnlock, getSharedInterests, leaveDuoRoom, updateDuoRoomSettings,
  type DuoRoom, type RoomType
} from './actions'
import { useWebRTC } from '@/hooks/use-webrtc'
import { generateDuoRoomName } from '@/lib/ai/duo-namer'
import { DuoRoomSkeleton } from '@/components/dashboard/skeleton'
import { useRoom } from '@/lib/room-context'

// ─── Lazy-loaded extras ────────────────────────────────────────────────────────
import { lazy, Suspense } from 'react'
const DuoRomanticExtras = lazy(() =>
  import('./extras/duo-romantic-extras').then((m) => ({ default: m.DuoRomanticExtras }))
)
const DuoFriendsExtras = lazy(() =>
  import('./extras/duo-friends-extras').then((m) => ({ default: m.DuoFriendsExtras }))
)
const DuoFamilyExtras = lazy(() =>
  import('./extras/duo-family-extras').then((m) => ({ default: m.DuoFamilyExtras }))
)

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'chat' | 'voice' | 'video' | 'extras'

interface DuoChatMessage {
  id: string
  senderId: string
  senderName: string
  senderAvatar?: string
  content: string
  timestamp: number
}

interface PartnerProfile {
  id: string
  full_name?: string
  username?: string
  avatar_url?: string
}

interface DuoRoomClientProps {
  room: Record<string, any>
  user: Record<string, any>
}

import confetti from 'canvas-confetti'

// ─── Cinematic Unlock Notification ────────────────────────────────────────────────

function CinematicUnlock({ stage, roomType, onComplete }: { stage: string; roomType: RoomType; onComplete: () => void }) {
  const onCompleteRef = useRef(onComplete)
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    // Fire confetti immediately
    const duration = 2000
    const end = Date.now() + duration
    
    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#3b82f6', '#8b5cf6', '#f43f5e']
      })
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#3b82f6', '#8b5cf6', '#f43f5e']
      })
      if (Date.now() < end) requestAnimationFrame(frame)
    }
    frame()
    
    // Auto complete after 3.5s
    const t = setTimeout(() => onCompleteRef.current(), 3500)
    return () => clearTimeout(t)
  }, [])

  const config: Record<string, { emoji: string; title: string; subtitle: string; gradient: string }> = {
    voice: { emoji: '🎙️', title: 'Voice Call Unlocked', subtitle: 'You can now hear each other!', gradient: 'from-blue-500/20 to-blue-950/40' },
    video: { emoji: '📹', title: 'Video Call Unlocked', subtitle: 'Face to face connection available.', gradient: 'from-violet-500/20 to-violet-950/40' },
    extras: {
      emoji: '🎁',
      title: `${roomType === 'romantic' ? 'Date Activities' : roomType === 'friends' ? 'Mini Games' : 'Memory Wall'} Unlocked`,
      subtitle: 'Experience new ways to connect together.',
      gradient: 'from-rose-500/20 to-rose-950/40'
    }
  }
  const c = config[stage] || config.voice

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn("fixed inset-0 z-[200] flex items-center justify-center bg-background/95 backdrop-blur-md bg-gradient-to-tr", c.gradient)}
    >
      <div className="flex flex-col items-center gap-6 text-center max-w-sm px-6">
        <motion.div 
          initial={{ scale: 0, rotate: -20 }} 
          animate={{ scale: 1, rotate: 0 }} 
          transition={{ type: 'spring', bounce: 0.6, duration: 0.8 }}
          className="w-32 h-32 rounded-full bg-background/50 border border-white/10 flex items-center justify-center shadow-2xl backdrop-blur-xl"
        >
          <span className="text-6xl">{c.emoji}</span>
        </motion.div>
        
        <div className="space-y-2">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white to-white/60"
          >
            {c.title}
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="text-sm text-muted-foreground/80 font-medium"
          >
            {c.subtitle}
          </motion.p>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Sidebar Button ─────────────────────────────────────────────────────────────

function SidebarBtn({
  tab, active, locked, onClick, icon: Icon, label, progress
}: {
  tab: Tab; active: boolean; locked: boolean; onClick: () => void
  icon: React.ElementType; label: string; progress?: { current: number; max: number }
}) {
  const lockedColors: Record<Tab, string> = {
    chat: 'text-emerald-500',
    voice: 'text-blue-500',
    video: 'text-violet-500',
    extras: 'text-rose-500'
  }

  return (
    <motion.button
      whileHover={locked ? {} : { scale: 1.01 }}
      whileTap={locked ? {} : { scale: 0.98 }}
      onClick={() => { if (!locked) onClick() }}
      className={cn(
        'w-full flex flex-col items-start gap-2 p-3 rounded-xl transition-all duration-200 relative text-left',
        active && !locked
          ? `bg-${lockedColors[tab].replace('text-', '').replace('-500', '')}-500/10`
          : locked
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-muted/50'
      )}
    >
      <div className="flex items-center gap-3 w-full">
        <div className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center',
          active && !locked ? `bg-${lockedColors[tab].replace('text-', '').replace('-500', '')}-500/20` : 'bg-muted/50'
        )}>
          {locked ? <Lock className="w-4 h-4 text-muted-foreground/50" /> : (
            <Icon className={cn('w-4 h-4', active ? lockedColors[tab] : 'text-muted-foreground/70')} />
          )}
        </div>
        <div className="flex flex-col flex-1">
          <span className={cn(
            'text-sm font-semibold',
            active && !locked ? lockedColors[tab] : locked ? 'text-muted-foreground/60' : 'text-foreground/80'
          )}>
            {label}
          </span>
          {locked && progress && (
            <span className="text-[10px] text-muted-foreground/60">
              {progress.max - progress.current} more needed
            </span>
          )}
        </div>
      </div>

      {/* Progress bar for locked stages */}
      {locked && progress && (
        <div className="w-full mt-1">
          <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary/30 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((progress.current / progress.max) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}
    </motion.button>
  )
}

// ─── Duo Chat ─────────────────────────────────────────────────────────────────

function DuoChat({
  roomId, duoRoomId, user, partner, voiceUnlocked, msgCount, msgNeeded, onNewMessage
}: {
  roomId: string; duoRoomId: string; user: any; partner: PartnerProfile | null
  voiceUnlocked: boolean; msgCount: number; msgNeeded: number; onNewMessage: () => void
}) {
  const [messages, setMessages] = useState<DuoChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const [isPartnerTyping, setIsPartnerTyping] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const channel = supabase
      .channel(`duo_chat_${roomId}`)
      .on('broadcast', { event: 'duo_message' }, ({ payload }) => {
        setMessages((prev) => [...prev, payload])
        setIsPartnerTyping(false)
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        onNewMessage()
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.userId !== user.id) {
          setIsPartnerTyping(true)
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
          typingTimeoutRef.current = setTimeout(() => setIsPartnerTyping(false), 3000)
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [roomId, supabase])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isSending) return
    setIsSending(true)

    const msgContent = typeof text === 'string' ? text : input.trim()
    if (!msgContent) {
      setIsSending(false)
      return
    }

    const msg: DuoChatMessage = {
      id: Math.random().toString(36).substring(7),
      senderId: user.id,
      senderName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'You',
      senderAvatar: user.user_metadata?.avatar_url,
      content: msgContent,
      timestamp: Date.now()
    }

    setMessages((prev) => [...prev, msg])
    if (typeof text !== 'string') setInput('')

    await supabase.channel(`duo_chat_${roomId}`).send({
      type: 'broadcast', event: 'duo_message', payload: msg
    })

    onNewMessage()

    // Track for unlock — fire and forget
    trackDuoMessage(roomId).catch(console.error)
    setIsSending(false)
  }

  const remaining = Math.max(0, msgNeeded - msgCount)

  return (
    <div className="flex flex-col h-full relative z-10">
      {/* Subtle Ambient Background */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02] mix-blend-overlay z-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />

      {/* Progress hint */}
      {!voiceUnlocked && (
        <div className="px-4 py-2 bg-background/80 backdrop-blur-md border-b border-border/30 shrink-0 z-10 relative">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-primary/80 font-semibold flex items-center gap-1.5 tracking-wide uppercase">
              <Mic className="w-3 h-3" /> Voice in {remaining} msg{remaining !== 1 ? 's' : ''}
            </span>
            <span className="text-[10px] text-muted-foreground/60 font-mono">{msgCount}/{msgNeeded}</span>
          </div>
          <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((msgCount / msgNeeded) * 100, 100)}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 space-y-4 relative z-10">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary/60" />
            </div>
            <p className="text-xs text-muted-foreground/60 text-center">
              Say hello! Every message brings you closer to unlocking voice. 🎙️
            </p>
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isOwn = msg.senderId === user.id
            return (
              <motion.div
                layout
                key={msg.id}
                initial={{ opacity: 0, y: 16, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className={cn('flex gap-2.5', isOwn ? 'flex-row-reverse' : 'flex-row')}
              >
                {!isOwn && (
                  <Avatar className="w-7 h-7 shrink-0 border border-border/40">
                    <AvatarImage src={partner?.avatar_url} />
                    <AvatarFallback className="text-[10px] bg-muted">
                      {partner?.full_name?.[0] || '?'}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className={cn('max-w-[75%]', isOwn ? 'items-end' : 'items-start', 'flex flex-col gap-0.5')}>
                  {msg.content.startsWith('GIFT:') ? (
                    <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-tr from-rose-500/20 to-orange-500/20 border border-rose-500/30">
                      <Gift className="w-8 h-8 text-rose-400 mb-2 animate-bounce" />
                      <span className="text-xs font-bold text-rose-300">Sent a Gift!</span>
                      <span className="text-[10px] text-muted-foreground mt-1">{msg.content.replace('GIFT:', '')}</span>
                    </div>
                  ) : (
                    <div className={cn(
                      'px-4 py-2.5 rounded-[1.25rem] text-[13px] leading-relaxed shadow-sm',
                      isOwn
                        ? 'bg-primary text-primary-foreground rounded-br-sm shadow-primary/20'
                        : 'bg-muted/80 backdrop-blur-sm border border-border/40 text-foreground rounded-bl-sm'
                    )}>
                      {msg.content}
                    </div>
                  )}
                  <span className={cn('text-[9px] text-muted-foreground/50 px-1', isOwn ? 'text-right' : 'text-left')}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
        
        {/* Typing Indicator */}
        <AnimatePresence>
          {isPartnerTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className="flex items-center gap-2.5"
            >
              <Avatar className="w-7 h-7 shrink-0 border border-border/40">
                <AvatarImage src={partner?.avatar_url} />
                <AvatarFallback className="text-[10px] bg-muted">{partner?.full_name?.[0] || '?'}</AvatarFallback>
              </Avatar>
              <div className="bg-muted/80 backdrop-blur-sm border border-border/40 rounded-[1.25rem] rounded-bl-sm px-4 py-3 flex gap-1">
                <motion.div className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
                <motion.div className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} />
                <motion.div className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={scrollRef} />
      </div>

      {/* Floating Input Area */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background/80 via-background/40 to-transparent z-20 pointer-events-none">
        <div className="flex items-center gap-2 bg-muted/40 backdrop-blur-2xl border border-border/50 shadow-xl rounded-full px-4 py-2 pointer-events-auto max-w-2xl mx-auto">
          <Popover>
            <PopoverTrigger asChild>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="text-muted-foreground/60 hover:text-foreground transition-colors shrink-0">
                <Smile className="w-5 h-5" />
              </motion.button>
            </PopoverTrigger>
            <PopoverContent side="top" align="start" className="p-0 border-none bg-transparent shadow-none w-auto mb-4">
              <EmojiPicker
                theme={Theme.DARK}
                onEmojiClick={(e) => setInput(prev => prev + e.emoji)}
                width={300}
                height={400}
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="text-rose-400/70 hover:text-rose-400 transition-colors shrink-0 ml-1">
                <Gift className="w-5 h-5" />
              </motion.button>
            </PopoverTrigger>
            <PopoverContent side="top" align="start" className="p-3 w-48 mb-4 border border-border shadow-xl rounded-2xl bg-background/95 backdrop-blur-xl">
              <h4 className="text-xs font-bold mb-3 tracking-tight">Send a Gift</h4>
              <div className="grid grid-cols-2 gap-2">
                {['🌹 Rose', '☕ Coffee', '🍫 Chocolate', '🧸 Bear'].map(g => (
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    key={g} 
                    onClick={() => handleSend(`GIFT:${g}`)}
                    className="p-2 text-xs bg-muted/40 hover:bg-rose-500/20 hover:text-rose-400 rounded-xl transition-colors text-center font-medium"
                  >
                    {g}
                  </motion.button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Input
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              supabase.channel(`duo_chat_${roomId}`).send({
                type: 'broadcast', event: 'typing', payload: { userId: user.id }
              })
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-transparent border-0 focus-visible:ring-0 text-foreground placeholder:text-muted-foreground/50 text-[13px] px-2 h-9"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleSend()}
            disabled={!input.trim() || isSending}
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 ml-1',
              input.trim() ? 'bg-primary text-primary-foreground shadow-md' : 'bg-muted text-muted-foreground/40'
            )}
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
          </motion.button>
        </div>
      </div>
    </div>
  )
}

// ─── Voice Call Panel ─────────────────────────────────────────────────────────

function VoicePanel({
  roomId, user, partner, videoUnlocked, callCount, callsNeeded, onCallStarted,
  remoteStreams, toggleMic, incomingCall, onAcceptCall
}: {
  roomId: string; user: any; partner: PartnerProfile | null
  videoUnlocked: boolean; callCount: number; callsNeeded: number; onCallStarted: () => void
  remoteStreams: any[]; toggleMic: () => void; incomingCall: boolean; onAcceptCall: () => void
}) {
  const [inCall, setInCall] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const supabase = createClient()
  const remoteAudioRef = useRef<HTMLAudioElement>(null)

  const partnerStream = remoteStreams.find(s => s.userId !== user.id)

  useEffect(() => {
    if (remoteAudioRef.current && partnerStream?.stream) {
      remoteAudioRef.current.srcObject = partnerStream.stream
    }
  }, [partnerStream?.stream])

  // If partner accepted our call (stream appeared), mark as in-call
  useEffect(() => {
    if (partnerStream?.audioEnabled && !inCall) {
      setInCall(true)
    }
  }, [partnerStream?.audioEnabled])

  const startCall = async () => {
    setInCall(true)
    onCallStarted()
    trackDuoCall(roomId).catch(console.error)
    // Broadcast call invite so partner sees incoming call notification
    supabase.channel(`duo_call_${roomId}`).send({
      type: 'broadcast',
      event: 'duo_call_invite',
      payload: { callerId: user.id, callerName: user.user_metadata?.full_name || 'Your Duo' }
    })
  }

  const acceptCall = () => {
    setInCall(true)
    onAcceptCall()
    trackDuoCall(roomId).catch(console.error)
  }

  const endCall = () => setInCall(false)
  const remaining = Math.max(0, callsNeeded - callCount)

  return (
    <div className="flex flex-col h-full relative overflow-hidden bg-background">
      {/* Blurred ambient background */}
      {partner?.avatar_url && (
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30 blur-3xl z-0 pointer-events-none scale-110"
          style={{ backgroundImage: `url(${partner.avatar_url})` }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-background/20 z-0 pointer-events-none" />

      <div className="flex-1 flex flex-col items-center justify-center gap-8 relative z-10">
        {/* Partner avatar */}
        <motion.div
          animate={inCall ? { scale: [1, 1.02, 1] } : {}}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="relative w-32 h-32 rounded-full shadow-2xl"
        >
          <div className="w-full h-full rounded-full overflow-hidden border border-border/40 shadow-inner bg-background/50 backdrop-blur-sm">
            {partner?.avatar_url ? (
              <img src={partner.avatar_url} className="w-full h-full object-cover" alt="partner" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted/30">
                <span className="text-4xl font-bold text-muted-foreground/40">
                  {partner?.full_name?.[0] || '?'}
                </span>
              </div>
            )}
          </div>
          {inCall && (
            <div className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-emerald-500 border-[3px] border-background flex items-center justify-center shadow-lg">
              <motion.div className="w-2 h-2 rounded-full bg-white opacity-80" animate={{ scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }} transition={{ duration: 1.5, repeat: Infinity }} />
            </div>
          )}
        </motion.div>

      {/* Hidden audio element for partner's voice */}
      <audio ref={remoteAudioRef} autoPlay />

      <div className="text-center">
        <h3 className="font-bold text-foreground">{partner?.full_name || 'Your Duo'}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {inCall
            ? (partnerStream?.audioEnabled ? '🔵 Connected' : 'Waiting for partner...')
            : incomingCall
              ? '📞 Incoming call...'
              : 'Ready to call'}
        </p>
      </div>

      {/* Incoming call banner */}
      <AnimatePresence>
        {incomingCall && !inCall && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center"
            >
              <Phone className="w-6 h-6 text-emerald-400" />
            </motion.div>
            <p className="text-sm font-semibold text-emerald-300">{partner?.full_name || 'Your Duo'} is calling!</p>
            <button
              onClick={acceptCall}
              className="px-6 py-2 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-400 transition-colors"
            >
              Answer
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      {/* Controls & Progress */}
      <div className="flex flex-col items-center gap-6 pb-12 pt-6 relative z-10 shrink-0 bg-gradient-to-t from-background via-background/80 to-transparent w-full">
        {!videoUnlocked && (
          <div className="w-full max-w-xs space-y-1.5">
            <div className="flex justify-between text-[10px] text-muted-foreground/60">
              <span className="flex items-center gap-1">
                <Video className="w-3 h-3" /> Video unlocks in {remaining} call{remaining !== 1 ? 's' : ''}
              </span>
              <span>{callCount}/{callsNeeded}</span>
            </div>
            <div className="w-full h-1.5 bg-muted/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-violet-500/60 rounded-full"
                animate={{ width: `${Math.min((callCount / callsNeeded) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

      {/* Call controls */}
      {!incomingCall && (
        <div className="flex items-center gap-4">
          {inCall && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => { toggleMic(); setIsMuted((m) => !m) }}
              className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all',
                isMuted
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                  : 'bg-muted/30 border-border/40 text-muted-foreground'
              )}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={inCall ? endCall : startCall}
            className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all',
              inCall
                ? 'bg-rose-500 hover:bg-rose-400 shadow-rose-500/30'
                : 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/30'
            )}
          >
            {inCall ? <PhoneOff className="w-6 h-6 text-white" /> : <Phone className="w-6 h-6 text-white" />}
          </motion.button>
        </div>
      )}
      </div>
    </div>
  )
}

// ─── Video Panel ──────────────────────────────────────────────────────────────

function VideoPanel({ partner, localStream, remoteStreams, toggleCamera, toggleMic, user }: {
  partner: PartnerProfile | null; user: any
  localStream: MediaStream | null; remoteStreams: any[]
  toggleCamera: () => void; toggleMic: () => void
}) {
  const [isCamOn, setIsCamOn] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)

  const partnerStream = remoteStreams.find(s => s.userId !== user.id)

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  useEffect(() => {
    if (remoteVideoRef.current && partnerStream?.stream) {
      remoteVideoRef.current.srcObject = partnerStream.stream
    }
  }, [partnerStream?.stream])

  return (
    <div className="relative flex flex-col h-full bg-black overflow-hidden">
      {/* ── Background: Their Video (Fills screen) ── */}
      <div className="absolute inset-0 z-0">
        {partnerStream?.videoEnabled ? (
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-background/90 backdrop-blur-xl gap-4">
            <Avatar className="w-24 h-24 border border-border/20 shadow-2xl">
              <AvatarImage src={partner?.avatar_url} />
              <AvatarFallback className="text-3xl bg-muted/50">{partner?.full_name?.[0] || '?'}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-muted-foreground">
              {partnerStream?.audioEnabled ? 'Voice only' : partner?.full_name || 'Partner'}
            </span>
          </div>
        )}
        <audio ref={remoteVideoRef} autoPlay className="hidden" />
      </div>

      {/* Top Gradient Overlay for readability */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 to-transparent z-10 pointer-events-none" />

      {/* ── Floating PIP: My Video ── */}
      <div className="absolute top-6 right-6 w-32 h-44 rounded-2xl overflow-hidden bg-muted/40 backdrop-blur-md border border-white/20 shadow-2xl z-20">
        {isCamOn && localStream ? (
          <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full bg-black/40">
            <VideoOff className="w-6 h-6 text-white/50" />
          </div>
        )}
      </div>

      {/* ── Floating Controls Pill ── */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center justify-center gap-3 px-6 py-3 rounded-full bg-background/60 backdrop-blur-2xl border border-white/10 shadow-2xl z-30">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { toggleMic(); setIsMuted((m) => !m) }}
          className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center transition-all',
            isMuted ? 'bg-rose-500/90 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
          )}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { toggleCamera(); setIsCamOn((c) => !c) }}
          className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center transition-all',
            !isCamOn ? 'bg-rose-500/90 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
          )}
        >
          {isCamOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </motion.button>
      </div>
    </div>
  )
}

// ─── Extras Panel ─────────────────────────────────────────────────────────────

function ExtrasPanel({ duoRoomId, roomType, partner }: { duoRoomId: string; roomType: RoomType; partner: PartnerProfile | null }) {
  const [friendReqSent, setFriendReqSent] = useState(false)
  
  return (
    <div className="flex flex-col h-full overflow-y-auto bg-background relative">
      {/* Partner Profile Header */}
      {partner && (
        <div className="flex flex-col relative pb-8 border-b border-border/20">
          {/* Cover Banner */}
          <div className="h-32 w-full bg-muted/30 relative overflow-hidden">
            {partner.avatar_url ? (
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-40 blur-xl scale-110" 
                style={{ backgroundImage: `url(${partner.avatar_url})` }} 
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
          </div>

          <div className="px-6 flex flex-col -mt-10 relative z-10">
            <Avatar className="w-20 h-20 border-4 border-background shadow-xl mb-3">
              <AvatarImage src={partner.avatar_url} />
              <AvatarFallback className="text-2xl bg-muted">{partner.full_name?.[0]}</AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-bold text-foreground tracking-tight">{partner.full_name || partner.username}</h2>
            <p className="text-[13px] text-muted-foreground mb-4">You've unlocked everything!</p>
            
            <Button 
              disabled={friendReqSent}
              onClick={() => {
                toast.success(`Friend request sent to ${partner.full_name}`)
                setFriendReqSent(true)
              }}
              className={cn("w-full sm:w-auto self-start gap-2 rounded-xl transition-all h-9 text-[13px]", friendReqSent ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20" : "bg-primary text-primary-foreground")}
            >
              {friendReqSent ? <Check className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              {friendReqSent ? 'Request Sent' : 'Send Friend Request'}
            </Button>
          </div>
        </div>
      )}
      
      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      }>
        <div className="flex-1">
          {roomType === 'romantic' && <DuoRomanticExtras duoRoomId={duoRoomId} />}
          {roomType === 'friends' && <DuoFriendsExtras duoRoomId={duoRoomId} />}
          {roomType === 'family' && <DuoFamilyExtras duoRoomId={duoRoomId} />}
        </div>
      </Suspense>
    </div>
  )
}

// ─── Main Duo Room Client ─────────────────────────────────────────────────────

export function DuoRoomClient({ room, user }: DuoRoomClientProps) {
  const navigate = useNavigate()
  const supabase = createClient()

  const [isLeaving, setIsLeaving] = useState(false)
  const [duoRoom, setDuoRoom] = useState<DuoRoom | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [partner, setPartner] = useState<PartnerProfile | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('chat')
  const [unlockToast, setUnlockToast] = useState<string | null>(null)
  const [isRenaming, setIsRenaming] = useState(false)
  const [currentRoomName, setCurrentRoomName] = useState(room.name as string)
  const [newName, setNewName] = useState(room.name as string)
  const [isSavingName, setIsSavingName] = useState(false)
  const [incomingCall, setIncomingCall] = useState(false)
  
  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [voiceUnlockAt, setVoiceUnlockAt] = useState(50)
  const [videoUnlockAt, setVideoUnlockAt] = useState(3)
  const [extrasUnlockAt, setExtrasUnlockAt] = useState(1)
  const [themeUrl, setThemeUrl] = useState('')
  const [vibePreset, setVibePreset] = useState('none')
  const [isSavingSettings, setIsSavingSettings] = useState(false)

  const prevDuoRef = useRef<DuoRoom | null>(null)
  const aiNamingRef = useRef(false)

  // ── Single shared WebRTC instance for the whole DuoRoom ──
  const { localStream, remoteStreams, toggleMic, toggleCamera, cameraActive, micActive } = useWebRTC(room.id as string, user, {})
  
  const { minimizeRoom, isMinimized, endRoom } = useRoom()

  // Load duo room data
  const loadDuoRoom = useCallback(async () => {
    const data = await getDuoRoom(room.id as string)
    if (!data) return

    // Detect new unlocks
    if (prevDuoRef.current) {
      if (!prevDuoRef.current.voice_unlocked && data.voice_unlocked) {
        setUnlockToast('voice')
      }
      if (!prevDuoRef.current.video_unlocked && data.video_unlocked) {
        setUnlockToast('video')
        checkExtrasUnlock(room.id as string)
      }
      if (!prevDuoRef.current.extras_unlocked && data.extras_unlocked) {
        setUnlockToast('extras')
      }
    }

    if (data && (!prevDuoRef.current || isSettingsOpen === false)) {
      setVoiceUnlockAt(data.voice_unlock_at || 50)
      setVideoUnlockAt(data.video_unlock_at || 3)
      setExtrasUnlockAt(data.extras_unlock_at || 1)
      setThemeUrl(data.theme_url || '')
      setVibePreset(data.vibe_preset || 'none')
    }

    // Also fetch latest room name
    const { data: roomData } = await supabase.from('rooms').select('name').eq('id', room.id).single()
    if (roomData && roomData.name !== currentRoomName) {
      setCurrentRoomName(roomData.name)
    }

    prevDuoRef.current = data
    setDuoRoom(data)
  }, [room.id, currentRoomName, supabase])

  useEffect(() => {
    loadDuoRoom()
    const interval = setInterval(loadDuoRoom, 8000)
    return () => clearInterval(interval)
  }, [loadDuoRoom])

  // Load partner profile
  useEffect(() => {
    if (!duoRoom) return
    const partnerId = duoRoom.user1_id === user.id ? duoRoom.user2_id : duoRoom.user1_id
    supabase.from('profiles').select('id, full_name, username, avatar_url').eq('id', partnerId)
      .single().then(({ data }) => { if (data) setPartner(data) })
  }, [duoRoom, user.id, supabase])



  // ── AI Background Naming ──
  // Runs once when we enter a room with a DUO-XXXXXX placeholder name.
  useEffect(() => {
    if (!duoRoom || !room?.id) return
    if (!currentRoomName.startsWith('DUO-')) return
    if (aiNamingRef.current) return // already running

    aiNamingRef.current = true
    async function doAiName() {
      try {
        const { interests, hobbies } = await getSharedInterests(duoRoom!.id)
        const name = await generateDuoRoomName({
          interests, hobbies,
          roomType: duoRoom!.room_type,
          matchScore: duoRoom!.match_score
        })
        await nameDuoRoom(room.id as string, name)
        setCurrentRoomName(name)
        toast.success(`✨ Your room is now called "${name}"`)
      } catch (e) {
        console.error('AI Naming failed', e)
        aiNamingRef.current = false // allow retry on error
      }
    }
    doAiName()
  }, [duoRoom?.id])

  // ── Call Signaling via Supabase Broadcast ──
  useEffect(() => {
    if (!room?.id) return
    const ch = supabase
      .channel(`duo_call_${room.id}`)
      .on('broadcast', { event: 'duo_call_invite' }, ({ payload }) => {
        if (payload.callerId !== user.id) {
          setIncomingCall(true)
          setActiveTab('voice') // auto-switch to voice tab
          toast.info(`📞 ${payload.callerName || 'Your Duo'} is calling!`)
          // Auto-clear after 30s if not answered
          setTimeout(() => setIncomingCall(false), 30000)
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [room?.id, user?.id])

  const handleSaveName = async () => {
    if (!newName.trim()) return
    setIsSavingName(true)
    const res = await nameDuoRoom(room.id as string, newName.trim())
    if (res.error) toast.error(res.error)
    else {
      toast.success('Room name updated ✨')
      setCurrentRoomName(newName.trim())
    }
    setIsRenaming(false)
    setIsSavingName(false)
  }

  const handleSearchNewPerson = async () => {
    setIsLeaving(true)
    await leaveDuoRoom(room.id as string)
    toast.info('Left room. Finding someone new...')
    navigate('/duo')
  }

  const handleNewMessage = useCallback(() => {
    setDuoRoom((prev) => {
      if (!prev) return prev
      const newCount = prev.chat_message_count + 1
      return {
        ...prev,
        chat_message_count: newCount,
        voice_unlocked: prev.voice_unlocked || newCount >= prev.voice_unlock_at
      }
    })
  }, [])

  const handleSaveSettings = async () => {
    setIsSavingSettings(true)
    const res = await updateDuoRoomSettings(room.id as string, {
      voice_unlock_at: voiceUnlockAt,
      video_unlock_at: videoUnlockAt,
      extras_unlock_at: extrasUnlockAt,
      theme_url: themeUrl.trim() || null,
      vibe_preset: vibePreset
    })
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Room settings updated')
      setIsSettingsOpen(false)
      loadDuoRoom()
    }
    setIsSavingSettings(false)
  }

  if (!duoRoom || isLeaving) {
    return <DuoRoomSkeleton />
  }

  const typeConfig = {
    romantic: { gradient: 'from-rose-950/40 via-background to-background', accent: 'rose', emoji: '🌹' },
    friends: { gradient: 'from-blue-950/40 via-background to-background', accent: 'blue', emoji: '👫' },
    family: { gradient: 'from-amber-950/40 via-background to-background', accent: 'amber', emoji: '👨‍👩‍👧' }
  }
  const tCfg = typeConfig[duoRoom.room_type]
  
  // Vibe background mapping
  const vibeBg = {
    'none': '',
    'lofi-cafe': 'url(https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=2000&auto=format&fit=crop)',
    'neon-city': 'url(https://images.unsplash.com/photo-1519608487953-e999c86e7455?q=80&w=2000&auto=format&fit=crop)',
    'nature-zen': 'url(https://images.unsplash.com/photo-1505322022379-7c3353ee6291?q=80&w=2000&auto=format&fit=crop)'
  }[vibePreset || 'none'] || ''

  return (
    <div 
      className={cn(
        isMinimized ? 'flex flex-row items-center justify-center p-0 bg-transparent w-full h-full z-50' : cn('absolute inset-0 pt-[36px] flex flex-col overflow-hidden', (!duoRoom.theme_url && vibePreset === 'none') && 'bg-gradient-to-b', (!duoRoom.theme_url && vibePreset === 'none') && tCfg?.gradient)
      )}
      style={!isMinimized && vibeBg ? { backgroundImage: vibeBg, backgroundSize: 'cover', backgroundPosition: 'center' } : (!isMinimized && duoRoom.theme_url ? { backgroundImage: `url(${duoRoom.theme_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {})}
    >
      {!isMinimized && (duoRoom.theme_url || vibePreset !== 'none') && <div className="absolute inset-0 bg-background/60 backdrop-blur-3xl pointer-events-none z-0" />}
      
      {/* Ambient Audio */}
      {vibePreset === 'lofi-cafe' && <audio src="https://assets.mixkit.co/active_storage/sfx/167/167-preview.mp3" autoPlay loop className="hidden" />}
      {vibePreset === 'neon-city' && <audio src="https://assets.mixkit.co/active_storage/sfx/192/192-preview.mp3" autoPlay loop className="hidden" />}
      {vibePreset === 'nature-zen' && <audio src="https://assets.mixkit.co/active_storage/sfx/131/131-preview.mp3" autoPlay loop className="hidden" />}

      {/* Cinematic Unlock */}
      <AnimatePresence>
        {unlockToast && (
          <CinematicUnlock 
            key={unlockToast} 
            stage={unlockToast} 
            roomType={duoRoom.room_type} 
            onComplete={() => setUnlockToast(null)} 
          />
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div className={cn(
        "flex items-center justify-between px-6 py-4 border-b border-border/20 bg-background/40 backdrop-blur-2xl shrink-0 z-20 relative transition-transform duration-300",
        isMinimized && "hidden"
      )} style={{ display: isMinimized ? 'none' : undefined }}>
        {/* Room name */}
        <div className="flex items-center gap-3">
          <span className="text-xl">{tCfg?.emoji || '🏠'}</span>
          {isRenaming ? (
            <div className="flex items-center gap-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="h-8 text-sm bg-muted/50 border-border w-40 rounded-md text-foreground focus-visible:ring-1 focus-visible:ring-primary"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setIsRenaming(false) }}
              />
              <button onClick={handleSaveName} disabled={isSavingName} className="w-7 h-7 rounded flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                {isSavingName ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => setIsRenaming(false)} className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsRenaming(true)}
              className="group flex items-center gap-2"
            >
              <span className="font-semibold text-base tracking-tight text-foreground">{currentRoomName}</span>
              <Edit3 className="w-3.5 h-3.5 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
        </div>

        {/* Partner info */}
        <div className="flex items-center gap-3">
          {partner && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/30 border border-border/30">
              <Avatar className="w-5 h-5">
                <AvatarImage src={partner.avatar_url} />
                <AvatarFallback className="text-[9px] bg-background">{partner.full_name?.[0]}</AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium text-foreground">{partner.full_name || partner.username}</span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </div>
          )}

          {/* Match score badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-primary/5 border border-primary/10 relative z-10">
            <Heart className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-semibold text-primary">{duoRoom.match_score}%</span>
          </div>

          <div className="flex items-center gap-1 ml-2 border-l border-border/40 pl-3 relative z-10">
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <motion.button
                  whileHover={{ rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  title="Room Settings"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Settings2 className="w-4 h-4" />
                </motion.button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-background border-border">
                <DialogHeader>
                  <DialogTitle>Room Settings</DialogTitle>
                  <DialogDescription>Customize unlock milestones and room appearance.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Voice Unlock At (Messages)</Label>
                    <Input 
                      type="number" 
                      value={voiceUnlockAt} 
                      onChange={e => setVoiceUnlockAt(Number(e.target.value))}
                      min={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Video Unlock At (Calls)</Label>
                    <Input 
                      type="number" 
                      value={videoUnlockAt} 
                      onChange={e => setVideoUnlockAt(Number(e.target.value))}
                      min={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Extras Unlock At (Video Calls)</Label>
                    <Input 
                      type="number" 
                      value={extrasUnlockAt} 
                      onChange={e => setExtrasUnlockAt(Number(e.target.value))}
                      min={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Room Vibe</Label>
                    <Select value={vibePreset} onValueChange={setVibePreset}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select vibe..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Default</SelectItem>
                        <SelectItem value="lofi-cafe">☕ Lofi Cafe</SelectItem>
                        <SelectItem value="neon-city">🌃 Neon City</SelectItem>
                        <SelectItem value="nature-zen">🍃 Nature Zen</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {vibePreset === 'none' && (
                    <div className="space-y-2">
                      <Label>Custom Theme URL</Label>
                      <Input 
                        placeholder="https://..."
                        value={themeUrl} 
                        onChange={e => setThemeUrl(e.target.value)}
                      />
                      <p className="text-[10px] text-muted-foreground">Provide an image URL to set as background.</p>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>Cancel</Button>
                  <Button onClick={handleSaveSettings} disabled={isSavingSettings}>
                    {isSavingSettings ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <motion.button
              whileHover={{ rotate: 180 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleSearchNewPerson}
              title="Search New Person"
              className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => { minimizeRoom(); navigate('/dashboard/rooms'); }}
              title="Minimize to PiP"
              className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Minimize2 className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => { endRoom(); navigate('/dashboard/rooms'); }}
              title="Leave to Dashboard"
              className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              title="Toggle Sidebar"
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                isSidebarOpen ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <PanelRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* ── Main Layout (Content + Sidebar) ── */}
      <div className={cn("flex-1 flex overflow-hidden", isMinimized && "hidden")} style={{ display: isMinimized ? 'none' : undefined }}>
        {/* Main Content Area */}
        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="h-full"
            >
            {activeTab === 'chat' && (
              <DuoChat
                roomId={room.id as string}
                duoRoomId={duoRoom.id}
                user={user}
                partner={partner}
                voiceUnlocked={duoRoom.voice_unlocked}
                msgCount={duoRoom.chat_message_count}
                msgNeeded={duoRoom.voice_unlock_at}
                onNewMessage={handleNewMessage}
              />
            )}
            {activeTab === 'voice' && duoRoom.voice_unlocked && (
              <VoicePanel
                roomId={room.id as string}
                user={user}
                partner={partner}
                videoUnlocked={duoRoom.video_unlocked}
                callCount={duoRoom.call_count}
                callsNeeded={duoRoom.video_unlock_at}
                onCallStarted={loadDuoRoom}
                remoteStreams={remoteStreams}
                toggleMic={toggleMic}
                incomingCall={incomingCall}
                onAcceptCall={() => { setIncomingCall(false); loadDuoRoom() }}
              />
            )}
            {activeTab === 'video' && duoRoom.video_unlocked && (
              <VideoPanel
                user={user}
                partner={partner}
                localStream={localStream}
                remoteStreams={remoteStreams}
                toggleCamera={toggleCamera}
                toggleMic={toggleMic}
              />
            )}
            {activeTab === 'extras' && duoRoom.extras_unlocked && (
              <ExtrasPanel duoRoomId={duoRoom.id} roomType={duoRoom.room_type} partner={partner} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

        {/* Collapsible Sidebar */}
        <AnimatePresence initial={false}>
          {isSidebarOpen && !isMinimized && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="border-l border-border/40 bg-background/95 backdrop-blur-xl shrink-0 overflow-hidden flex flex-col"
            >
              <div className="w-[280px] p-4 flex flex-col h-full overflow-y-auto">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-1">
                  Room Features
                </h3>
                
                <div className="flex flex-col gap-2">
                  <SidebarBtn tab="chat" active={activeTab === 'chat'} locked={false}
                    onClick={() => setActiveTab('chat')} icon={MessageSquare} label="Chat" />

                  <SidebarBtn tab="voice" active={activeTab === 'voice'} locked={!duoRoom.voice_unlocked}
                    onClick={() => setActiveTab('voice')} icon={duoRoom.voice_unlocked ? Mic : Lock} label="Voice Call"
                    progress={!duoRoom.voice_unlocked ? { current: duoRoom.chat_message_count, max: duoRoom.voice_unlock_at } : undefined}
                  />

                  <SidebarBtn tab="video" active={activeTab === 'video'} locked={!duoRoom.video_unlocked}
                    onClick={() => setActiveTab('video')} icon={duoRoom.video_unlocked ? Video : Lock} label="Video Call"
                    progress={!duoRoom.video_unlocked ? { current: duoRoom.call_count, max: duoRoom.video_unlock_at } : undefined}
                  />

                  <SidebarBtn tab="extras" active={activeTab === 'extras'} locked={!duoRoom.extras_unlocked}
                    onClick={() => setActiveTab('extras')} icon={duoRoom.extras_unlocked ? Gift : Lock}
                    label={duoRoom.room_type === 'romantic' ? 'Dates' : duoRoom.room_type === 'friends' ? 'Games' : 'Memories'}
                  />
                </div>

                <div className="mt-auto pt-6 px-1">
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/30 border border-border/40">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <p className="text-[10px] text-muted-foreground font-medium leading-tight">
                      {!duoRoom.voice_unlocked
                        ? `${duoRoom.voice_unlock_at - duoRoom.chat_message_count} messages to unlock voice`
                        : !duoRoom.video_unlocked
                          ? `${duoRoom.video_unlock_at - duoRoom.call_count} calls to unlock video`
                          : !duoRoom.extras_unlocked
                            ? 'Keep video calling to unlock extras'
                            : 'All features unlocked! 🎉'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* PiP Mode Overlay Controls */}
      {isMinimized && (
        <div className="flex-1 flex items-center justify-center gap-1.5 z-[60] bg-transparent opacity-100 w-full">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleMic()}
            className={cn("w-9 h-9 rounded-full", micActive ? "text-white hover:bg-white/10" : "text-red-400 bg-red-500/20 hover:bg-red-500/30")}
          >
            {micActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleCamera()}
            className={cn("w-9 h-9 rounded-full", cameraActive ? "text-white hover:bg-white/10" : "text-red-400 bg-red-500/20 hover:bg-red-500/30")}
          >
            {cameraActive ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
          </Button>
        </div>
      )}
    </div>
  )
}
