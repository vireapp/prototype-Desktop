/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare, Mic, MicOff, Video, VideoOff, Gift,
  Lock, Send, Smile, Heart, Phone, PhoneOff,
  Settings2, LogOut, ChevronUp, Sparkles, Edit3, Check, X, Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import {
  getDuoRoom, trackDuoMessage, trackDuoCall, nameDuoRoom,
  hasCompletedIcebreaker, checkExtrasUnlock, getSharedInterests,
  type DuoRoom, type RoomType
} from './actions'
import { DuoIcebreaker } from './duo-icebreaker'
import { useWebRTC } from '@/hooks/use-webrtc'
import { generateDuoRoomName } from '@/lib/ai/duo-namer'

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

// ─── Unlock Toast Notification ────────────────────────────────────────────────

function UnlockToast({ stage, roomType }: { stage: string; roomType: RoomType }) {
  const config: Record<string, { emoji: string; title: string; sub: string }> = {
    voice: { emoji: '🎙️', title: 'Voice Unlocked!', sub: 'You can now call each other' },
    video: { emoji: '📹', title: 'Video Unlocked!', sub: 'Switch on your camera anytime' },
    extras: {
      emoji: '🎁',
      title: `${roomType === 'romantic' ? 'Date Activities' : roomType === 'friends' ? 'Mini Games' : 'Memory Wall'} Unlocked!`,
      sub: 'New features are now available'
    }
  }
  const c = config[stage] || config.voice
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed top-14 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-5 py-3 rounded-2xl bg-background/95 backdrop-blur-xl border border-primary/30 shadow-2xl shadow-primary/10"
    >
      <span className="text-2xl">{c.emoji}</span>
      <div>
        <p className="font-bold text-sm text-foreground">{c.title}</p>
        <p className="text-xs text-muted-foreground">{c.sub}</p>
      </div>
      <div className="ml-2 w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
        <Check className="w-3 h-3 text-emerald-400" />
      </div>
    </motion.div>
  )
}

// ─── Tab Button ───────────────────────────────────────────────────────────────

function TabBtn({
  tab, active, locked, onClick, icon: Icon, label, progress
}: {
  tab: Tab; active: boolean; locked: boolean; onClick: () => void
  icon: React.ElementType; label: string; progress?: { current: number; max: number }
}) {
  const lockedColors: Record<Tab, string> = {
    chat: 'text-emerald-400',
    voice: 'text-blue-400',
    video: 'text-violet-400',
    extras: 'text-rose-400'
  }

  return (
    <button
      onClick={() => { if (!locked) onClick() }}
      className={cn(
        'flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border transition-all duration-200 relative',
        active && !locked
          ? `bg-${lockedColors[tab].replace('text-', '').replace('-400', '')}-500/10 border-${lockedColors[tab].replace('text-', '').replace('-400', '')}-500/40`
          : locked
            ? 'bg-muted/10 border-border/20 opacity-60 cursor-not-allowed'
            : 'bg-muted/20 border-border/30 hover:bg-muted/30 hover:border-border/50'
      )}
    >
      <div className="relative">
        {locked ? <Lock className="w-4 h-4 text-muted-foreground/40" /> : (
          <Icon className={cn('w-4 h-4', active ? lockedColors[tab] : 'text-muted-foreground/60')} />
        )}
      </div>
      <span className={cn(
        'text-[10px] font-semibold',
        active && !locked ? lockedColors[tab] : locked ? 'text-muted-foreground/40' : 'text-muted-foreground/60'
      )}>
        {label}
      </span>

      {/* Progress bar for locked stages */}
      {locked && progress && (
        <div className="w-full px-1">
          <div className="w-full h-0.5 bg-muted/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary/40 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((progress.current / progress.max) * 100, 100)}%` }}
            />
          </div>
          <span className="text-[8px] text-muted-foreground/40 font-medium">
            {progress.current}/{progress.max}
          </span>
        </div>
      )}

      {active && !locked && (
        <motion.div
          layoutId="duo-tab-active"
          className="absolute inset-0 rounded-xl ring-1 ring-inset ring-primary/20 pointer-events-none"
        />
      )}
    </button>
  )
}

// ─── Duo Chat ─────────────────────────────────────────────────────────────────

function DuoChat({
  roomId, duoRoomId, user, partner, voiceUnlocked, msgCount, msgNeeded
}: {
  roomId: string; duoRoomId: string; user: any; partner: PartnerProfile | null
  voiceUnlocked: boolean; msgCount: number; msgNeeded: number
}) {
  const [messages, setMessages] = useState<DuoChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`duo_chat_${roomId}`)
      .on('broadcast', { event: 'duo_message' }, ({ payload }) => {
        setMessages((prev) => [...prev, payload])
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

    const msg: DuoChatMessage = {
      id: Math.random().toString(36).substring(7),
      senderId: user.id,
      senderName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'You',
      senderAvatar: user.user_metadata?.avatar_url,
      content: input.trim(),
      timestamp: Date.now()
    }

    setMessages((prev) => [...prev, msg])
    setInput('')

    await supabase.channel(`duo_chat_${roomId}`).send({
      type: 'broadcast', event: 'duo_message', payload: msg
    })

    // Track for unlock — fire and forget
    trackDuoMessage(roomId).catch(console.error)
    setIsSending(false)
  }

  const remaining = Math.max(0, msgNeeded - msgCount)

  return (
    <div className="flex flex-col h-full">
      {/* Progress hint */}
      {!voiceUnlocked && (
        <div className="px-4 py-2 bg-blue-500/5 border-b border-blue-500/10 shrink-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-blue-400/80 font-medium flex items-center gap-1">
              <Mic className="w-3 h-3" /> Voice unlocks in {remaining} message{remaining !== 1 ? 's' : ''}
            </span>
            <span className="text-[10px] text-muted-foreground/50">{msgCount}/{msgNeeded}</span>
          </div>
          <div className="w-full h-1 bg-muted/30 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-blue-500/60 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((msgCount / msgNeeded) * 100, 100)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
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
                key={msg.id}
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                className={cn('flex gap-2', isOwn ? 'flex-row-reverse' : 'flex-row')}
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
                  <div className={cn(
                    'px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed',
                    isOwn
                      ? 'bg-primary/20 border border-primary/30 text-foreground rounded-br-sm'
                      : 'bg-muted/30 border border-border/30 text-foreground rounded-bl-sm'
                  )}>
                    {msg.content}
                  </div>
                  <span className="text-[9px] text-muted-foreground/40 px-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="px-3 pb-3 shrink-0">
        <div className="flex items-center gap-2 bg-muted/20 border border-border/40 rounded-2xl px-3 py-1.5">
          <button className="text-muted-foreground/50 hover:text-muted-foreground transition-colors">
            <Smile className="w-4 h-4" />
          </button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type something..."
            className="flex-1 bg-transparent border-0 focus-visible:ring-0 text-foreground placeholder:text-muted-foreground/40 text-sm px-0 h-8"
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            disabled={!input.trim() || isSending}
            className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center transition-all',
              input.trim() ? 'bg-primary text-white shadow-sm' : 'bg-muted/40 text-muted-foreground/30'
            )}
          >
            {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
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
    <div className="flex flex-col h-full items-center justify-center gap-6 px-6">
      {/* Partner avatar ring */}
      <motion.div
        animate={inCall ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
        className={cn(
          'relative w-28 h-28 rounded-full',
          inCall && 'ring-4 ring-blue-500/40 ring-offset-4 ring-offset-background'
        )}
      >
        <div className="w-full h-full rounded-full overflow-hidden border-2 border-border/50">
          {partner?.avatar_url ? (
            <img src={partner.avatar_url} className="w-full h-full object-cover" alt="partner" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-violet-500/20 flex items-center justify-center">
              <span className="text-3xl font-bold text-blue-300/60">
                {partner?.full_name?.[0] || '?'}
              </span>
            </div>
          )}
        </div>
        {inCall && (
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center">
            <motion.div className="w-2 h-2 rounded-full bg-white" animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 1, repeat: Infinity }} />
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

      {/* Progress to video unlock */}
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
    <div className="flex flex-col h-full gap-3 p-4">
      {/* Video grid */}
      <div className="flex-1 grid grid-rows-2 gap-3">
        {/* Their video */}
        <div className="relative rounded-2xl overflow-hidden bg-muted/20 border border-border/30 flex items-center justify-center">
          {partnerStream?.videoEnabled ? (
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Avatar className="w-14 h-14 border-2 border-border/40">
                <AvatarImage src={partner?.avatar_url} />
                <AvatarFallback className="text-xl">{partner?.full_name?.[0] || '?'}</AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">
                {partnerStream?.audioEnabled ? 'Voice only' : partner?.full_name || 'Partner'}
              </span>
            </div>
          )}
          {/* Always mount audio just in case they only have mic enabled */}
          <audio ref={remoteVideoRef} autoPlay className="hidden" />
          <div className="absolute bottom-2 left-3 text-[10px] text-white/60 font-medium">{partner?.full_name}</div>
        </div>

        {/* My video */}
        <div className="relative rounded-2xl overflow-hidden bg-muted/20 border border-border/30">
          {isCamOn && localStream ? (
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full">
              <VideoOff className="w-8 h-8 text-muted-foreground/40" />
            </div>
          )}
          <div className="absolute bottom-2 left-3 text-[10px] text-white/60 font-medium">You</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 shrink-0">
        <button
          onClick={() => { toggleMic(); setIsMuted((m) => !m) }}
          className={cn(
            'w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all',
            isMuted ? 'bg-rose-500/20 border-rose-500/50 text-rose-400' : 'bg-muted/30 border-border/40 text-muted-foreground'
          )}
        >
          {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
        <button
          onClick={() => { toggleCamera(); setIsCamOn((c) => !c) }}
          className={cn(
            'w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all',
            !isCamOn ? 'bg-rose-500/20 border-rose-500/50 text-rose-400' : 'bg-muted/30 border-border/40 text-muted-foreground'
          )}
        >
          {isCamOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

// ─── Extras Panel ─────────────────────────────────────────────────────────────

function ExtrasPanel({ duoRoomId, roomType }: { duoRoomId: string; roomType: RoomType }) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    }>
      {roomType === 'romantic' && <DuoRomanticExtras duoRoomId={duoRoomId} />}
      {roomType === 'friends' && <DuoFriendsExtras duoRoomId={duoRoomId} />}
      {roomType === 'family' && <DuoFamilyExtras duoRoomId={duoRoomId} />}
    </Suspense>
  )
}

// ─── Main Duo Room Client ─────────────────────────────────────────────────────

export function DuoRoomClient({ room, user }: DuoRoomClientProps) {
  const navigate = useNavigate()
  const supabase = createClient()

  const [duoRoom, setDuoRoom] = useState<DuoRoom | null>(null)
  const [partner, setPartner] = useState<PartnerProfile | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('chat')
  const [showIcebreaker, setShowIcebreaker] = useState(false)
  const [icebreakerDone, setIcebreakerDone] = useState(false)
  const [unlockToast, setUnlockToast] = useState<string | null>(null)
  const [isRenaming, setIsRenaming] = useState(false)
  const [currentRoomName, setCurrentRoomName] = useState(room.name as string)
  const [newName, setNewName] = useState(room.name as string)
  const [isSavingName, setIsSavingName] = useState(false)
  const [incomingCall, setIncomingCall] = useState(false)
  const prevDuoRef = useRef<DuoRoom | null>(null)
  const aiNamingRef = useRef(false)

  // ── Single shared WebRTC instance for the whole DuoRoom ──
  const { localStream, remoteStreams, toggleMic, toggleCamera } = useWebRTC(room.id as string, user, {})

  // Load duo room data
  const loadDuoRoom = useCallback(async () => {
    const data = await getDuoRoom(room.id as string)
    if (!data) return

    // Detect new unlocks
    if (prevDuoRef.current) {
      if (!prevDuoRef.current.voice_unlocked && data.voice_unlocked) {
        setUnlockToast('voice')
        setTimeout(() => setUnlockToast(null), 4000)
      }
      if (!prevDuoRef.current.video_unlocked && data.video_unlocked) {
        setUnlockToast('video')
        setTimeout(() => setUnlockToast(null), 4000)
        checkExtrasUnlock(room.id as string)
      }
      if (!prevDuoRef.current.extras_unlocked && data.extras_unlocked) {
        setUnlockToast('extras')
        setTimeout(() => setUnlockToast(null), 4000)
      }
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

  // Check icebreaker status
  useEffect(() => {
    if (!duoRoom) return
    hasCompletedIcebreaker(duoRoom.id).then((done) => {
      setIcebreakerDone(done)
      if (!done) setShowIcebreaker(true)
    })
  }, [duoRoom])

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

  if (!duoRoom) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  const typeConfig = {
    romantic: { gradient: 'from-rose-950/40 via-background to-background', accent: 'rose', emoji: '🌹' },
    friends: { gradient: 'from-blue-950/40 via-background to-background', accent: 'blue', emoji: '👫' },
    family: { gradient: 'from-amber-950/40 via-background to-background', accent: 'amber', emoji: '👨‍👩‍👧' }
  }
  const tCfg = typeConfig[duoRoom.room_type]

  // ── Icebreaker Gate ──
  if (showIcebreaker && !icebreakerDone) {
    return (
      <div className="absolute inset-0 top-8 bg-background">
        <DuoIcebreaker
          duoRoom={duoRoom}
          partnerProfile={partner}
          onComplete={() => {
            setIcebreakerDone(true)
            setShowIcebreaker(false)
          }}
        />
      </div>
    )
  }

  return (
    <div className={cn('absolute inset-0 top-8 flex flex-col bg-gradient-to-b', tCfg.gradient)}>
      {/* Unlock Toast */}
      <AnimatePresence>
        {unlockToast && (
          <UnlockToast key={unlockToast} stage={unlockToast} roomType={duoRoom.room_type} />
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-background/60 backdrop-blur-xl shrink-0">
        {/* Room name */}
        <div className="flex items-center gap-2.5">
          <span className="text-lg">{tCfg.emoji}</span>
          {isRenaming ? (
            <div className="flex items-center gap-1.5">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="h-7 text-sm bg-muted/30 border-border/40 w-36 rounded-lg text-foreground"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setIsRenaming(false) }}
              />
              <button onClick={handleSaveName} disabled={isSavingName} className="w-6 h-6 rounded flex items-center justify-center bg-primary/20 text-primary hover:bg-primary/30 transition-colors">
                {isSavingName ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              </button>
              <button onClick={() => setIsRenaming(false)} className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsRenaming(true)}
              className="group flex items-center gap-1.5"
            >
              <span className="font-bold text-sm text-foreground">{currentRoomName}</span>
              <Edit3 className="w-3 h-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
        </div>

        {/* Partner info */}
        <div className="flex items-center gap-2">
          {partner && (
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-muted/20 border border-border/30">
              <Avatar className="w-5 h-5 border border-border/40">
                <AvatarImage src={partner.avatar_url} />
                <AvatarFallback className="text-[8px]">{partner.full_name?.[0]}</AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium text-foreground/80">{partner.full_name || partner.username}</span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.7)]" />
            </div>
          )}

          {/* Match score badge */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 border border-primary/20">
            <Heart className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-bold text-primary">{duoRoom.match_score}%</span>
          </div>

          <button
            onClick={() => navigate('/dashboard/rooms')}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/50 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
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
              <ExtrasPanel duoRoomId={duoRoom.id} roomType={duoRoom.room_type} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Bottom Tab Bar ── */}
      <div className="px-3 pb-3 pt-2 border-t border-border/30 bg-background/60 backdrop-blur-xl shrink-0">
        <div className="flex gap-2">
          <TabBtn tab="chat" active={activeTab === 'chat'} locked={false}
            onClick={() => setActiveTab('chat')} icon={MessageSquare} label="Chat" />

          <TabBtn tab="voice" active={activeTab === 'voice'} locked={!duoRoom.voice_unlocked}
            onClick={() => setActiveTab('voice')} icon={duoRoom.voice_unlocked ? Mic : Lock} label="Voice"
            progress={!duoRoom.voice_unlocked ? { current: duoRoom.chat_message_count, max: duoRoom.voice_unlock_at } : undefined}
          />

          <TabBtn tab="video" active={activeTab === 'video'} locked={!duoRoom.video_unlocked}
            onClick={() => setActiveTab('video')} icon={duoRoom.video_unlocked ? Video : Lock} label="Video"
            progress={!duoRoom.video_unlocked ? { current: duoRoom.call_count, max: duoRoom.video_unlock_at } : undefined}
          />

          <TabBtn tab="extras" active={activeTab === 'extras'} locked={!duoRoom.extras_unlocked}
            onClick={() => setActiveTab('extras')} icon={duoRoom.extras_unlocked ? Gift : Lock}
            label={duoRoom.room_type === 'romantic' ? 'Dates' : duoRoom.room_type === 'friends' ? 'Games' : 'Memories'}
          />
        </div>

        {/* Sparkles hint */}
        <div className="flex items-center justify-center gap-1.5 mt-2">
          <Sparkles className="w-2.5 h-2.5 text-muted-foreground/30" />
          <span className="text-[9px] text-muted-foreground/40 font-medium">
            {!duoRoom.voice_unlocked
              ? `${duoRoom.voice_unlock_at - duoRoom.chat_message_count} messages to unlock voice`
              : !duoRoom.video_unlocked
                ? `${duoRoom.video_unlock_at - duoRoom.call_count} calls to unlock video`
                : !duoRoom.extras_unlocked
                  ? 'Keep video calling to unlock extras'
                  : 'All features unlocked! 🎉'}
          </span>
        </div>
      </div>
    </div>
  )
}
