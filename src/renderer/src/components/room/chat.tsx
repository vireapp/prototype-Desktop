'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Smile, Loader2, Coins, Gem } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useInventoryStore } from '@/stores/use-inventory'

interface Message {
  id: string
  senderId: string
  senderName: string
  senderAvatar?: string
  content: string
  timestamp: number
  isSystem?: boolean
  isCoinDrop?: boolean
  coinAmount?: number
  claimedBy?: string
  claimedByName?: string
}

interface RoomChatProps {
  roomId: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user?: any
  welcomeMessage?: string
  slowModeSeconds?: number
  emojiOnly?: boolean
  blockLinks?: boolean
  isActive?: boolean
  onMessageSent?: (msg: string) => void
}

export function RoomChat({
  roomId,
  user,
  welcomeMessage,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  slowModeSeconds = 0,
  emojiOnly = false,
  blockLinks = false,
  isActive = true,
  onMessageSent
}: RoomChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const [currentUser, setCurrentUser] = useState(user)
  const { addCoins } = useInventoryStore()

  // If user is not passed, try to get it (fallback)
  useEffect(() => {
    if (!currentUser) {
      supabase.auth.getUser().then(({ data }) => {
        if (data.user) {
          setCurrentUser(data.user)
        }
      })
    } else if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentUser(user)
    }
  }, [user, supabase])

  useEffect(() => {
    if (welcomeMessage) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessages((prev) => {
        if (prev.some((m) => m.id === 'welcome')) return prev
        return [
          {
            id: 'welcome',
            senderId: 'system',
            senderName: 'System',
            content: welcomeMessage,
            timestamp: Date.now(),
            isSystem: true
          },
          ...prev
        ]
      })
    }
  }, [welcomeMessage])

  useEffect(() => {
    const channel = supabase
      .channel(`room_${roomId}_chat`)
      .on('broadcast', { event: 'chat_message' }, ({ payload }) => {
        setMessages((prev) => [...prev, payload])
      })
      .on('broadcast', { event: 'claim_coin' }, ({ payload }) => {
        setMessages((prev) => prev.map(m => m.id === payload.messageId ? { ...m, claimedBy: payload.userId, claimedByName: payload.userName } : m))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, supabase])

  // Listen for local messages from QuickChatBar
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleLocalMsg = (e: any) => {
      setMessages((prev) => [...prev, e.detail])
    }
    window.addEventListener('local-chat-message', handleLocalMsg)
    return () => window.removeEventListener('local-chat-message', handleLocalMsg)
  }, [])

  const handleClaimDrop = async (msgId: string, amount: number) => {
    // Optimistic claim
    setMessages((prev) => prev.map(m => m.id === msgId ? { ...m, claimedBy: currentUser?.id || 'guest', claimedByName: currentUser?.user_metadata?.full_name || 'You' } : m))
    addCoins(amount)
    toast.success(`You claimed ${amount} coins!`)

    await supabase.channel(`room_${roomId}_chat`).send({
      type: 'broadcast',
      event: 'claim_coin',
      payload: { messageId: msgId, userId: currentUser?.id, userName: currentUser?.user_metadata?.full_name || 'Someone' }
    })
  }

  useEffect(() => {
    if (isActive !== false && scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isActive])

  const handleSend = async () => {
    if (!input.trim() || isSending) return
    if (!currentUser) {
      toast.error('You must be logged in to chat')
      return
    }

    // Basic Link Blocking
    if (blockLinks && (input.includes('http://') || input.includes('https://'))) {
      toast.error('Links are not allowed in this room.')
      return
    }

    setIsSending(true)

    const isDropCommand = input.trim() === '/drop'

    const msg: Message = isDropCommand ? {
      id: Math.random().toString(36).substring(7),
      senderId: 'system',
      senderName: 'System',
      content: 'A wild Coin Drop appeared!',
      timestamp: Date.now(),
      isCoinDrop: true,
      isSystem: true,
      coinAmount: Math.floor(Math.random() * 50) + 50 // 50-100 coins
    } : {
      id: Math.random().toString(36).substring(7),
      senderId: currentUser.id,
      senderName:
        currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Guest',
      senderAvatar: currentUser.user_metadata?.avatar_url,
      content: input.trim(),
      timestamp: Date.now()
    }

    // Optimistic update
    setMessages((prev) => [...prev, msg])
    setInput('')

    // Broadcast
    await supabase.channel(`room_${roomId}_chat`).send({
      type: 'broadcast',
      event: 'chat_message',
      payload: msg
    })

    if (onMessageSent) {
      onMessageSent(msg.content)
    }

    // 5% chance for a random coin drop when sending a normal message
    if (!isDropCommand && Math.random() < 0.05) {
      setTimeout(async () => {
        const dropMsg: Message = {
            id: Math.random().toString(36).substring(7),
            senderId: 'system',
            senderName: 'System',
            content: 'A wild Coin Drop appeared!',
            timestamp: Date.now(),
            isCoinDrop: true,
            isSystem: true,
            coinAmount: Math.floor(Math.random() * 30) + 20 // 20 to 50 coins
        }
        setMessages((prev) => [...prev, dropMsg])
        await supabase.channel(`room_${roomId}_chat`).send({
          type: 'broadcast',
          event: 'chat_message',
          payload: dropMsg
        })
      }, 1000)
    }

    setIsSending(false)
  }

  const messageVariants = {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, scale: 0.95 }
  }

  return (
    <div className="flex flex-col h-full bg-transparent relative overflow-hidden">
      {/* Chat Messages Area */}
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => {
              const isOwn = msg.senderId === currentUser?.id
              const showAvatar =
                !msg.isSystem && (!isOwn || i === 0 || messages[i - 1]?.senderId !== msg.senderId)

              return (
                <motion.div
                  key={msg.id || i}
                  variants={messageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 30,
                    delay: i === messages.length - 1 ? 0 : 0
                  }}
                  className={cn(
                    'flex gap-2',
                    isOwn ? 'flex-row-reverse' : 'flex-row',
                    msg.isSystem && 'justify-center'
                  )}
                >
                  {/* Avatar */}
                  {!msg.isSystem && (
                    <div className={cn('w-8 shrink-0', !showAvatar && 'invisible')}>
                      {showAvatar && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        >
                          <Avatar className="w-8 h-8 border border-border ring-2 ring-background">
                            <AvatarImage src={msg.senderAvatar} />
                            <AvatarFallback className="bg-muted text-xs font-medium text-muted-foreground">
                              {msg.senderName?.[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </motion.div>
                      )}
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={cn('max-w-[80%] break-words', msg.isSystem && 'w-full max-w-none')}
                  >
                    {/* Sender name for others' messages */}
                    {!msg.isSystem && !isOwn && showAvatar && (
                      <div className="text-[10px] text-muted-foreground mb-1 ml-1 font-medium">
                        {msg.senderName}
                      </div>
                    )}

                    <div
                      className={cn(
                        'px-4 py-2.5 text-sm relative overflow-hidden backdrop-blur-md',
                        msg.isSystem && !msg.isCoinDrop
                          ? 'bg-black/20 border border-white/5 text-white/50 text-xs text-center my-2 rounded-xl py-2'
                          : msg.isCoinDrop
                            ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-100 rounded-2xl p-4 my-2 text-center shadow-lg min-w-[200px]'
                            : isOwn
                              ? 'bg-white/10 border border-white/10 text-white rounded-2xl rounded-br-sm shadow-sm'
                              : 'bg-black/40 border border-white/5 text-white/90 rounded-2xl rounded-bl-sm shadow-sm'
                      )}
                    >
                      {/* Shimmer effect for own messages */}
                      {isOwn && !msg.isSystem && !msg.isCoinDrop && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_3s_ease-in-out_infinite]" />
                      )}
                      
                      {msg.isCoinDrop ? (
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Coins className={cn("w-10 h-10", msg.claimedBy ? "text-amber-500/50" : "text-amber-400 animate-bounce")} strokeWidth={1.5} />
                          <div className="font-bold text-sm text-foreground">{msg.content}</div>
                          {msg.claimedBy ? (
                            <div className="text-xs text-muted-foreground bg-background/50 px-3 py-1.5 rounded-full border border-border">
                              Claimed by <span className="font-semibold text-foreground">{msg.claimedBy === currentUser?.id ? 'You' : msg.claimedByName}</span>
                            </div>
                          ) : (
                            <Button 
                                onClick={() => handleClaimDrop(msg.id, msg.coinAmount || 50)}
                                className="mt-1 bg-amber-500 hover:bg-amber-600 text-amber-950 text-xs font-bold h-7 px-4 shadow-[0_0_10px_rgba(245,158,11,0.4)] transition-all hover:scale-105 rounded-full"
                            >
                                Claim {msg.coinAmount} <Gem className="w-3 h-3 ml-1" />
                            </Button>
                          )}
                        </div>
                      ) : (
                        <span className="relative z-10">{msg.content}</span>
                      )}
                    </div>

                    {/* Timestamp */}
                    {!msg.isSystem && (
                      <div
                        className={cn(
                          'text-[9px] text-muted-foreground mt-1',
                          isOwn ? 'text-right mr-1' : 'ml-1'
                        )}
                      >
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
          <div ref={scrollRef} />
        </div>
      </ScrollArea>


    </div>
  )
}
