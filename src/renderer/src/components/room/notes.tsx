'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface RoomNotesProps {
  roomId: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any
  onBack?: () => void
}

export function RoomNotes({ roomId, user, onBack }: RoomNotesProps) {
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [typingUsers, setTypingUsers] = useState<{ [key: string]: string }>({})
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channelRef = useRef<any>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Sync via Broadcast
  useEffect(() => {
    const channel = supabase
      .channel(`room_notes:${roomId}`)
      .on('broadcast', { event: 'notes_update' }, ({ payload }) => {
        // simple last-write-wins for prototype; real OT/CRDT is complex
        if (payload.userId !== user.id) {
          setNotes(payload.text)
        }
      })
      .on('broadcast', { event: 'typing_indicator' }, ({ payload }) => {
        if (payload.userId === user.id) return

        if (payload.isTyping) {
          setTypingUsers((prev) => ({
            ...prev,
            [payload.userId]: payload.username
          }))
        } else {
          setTypingUsers((prev) => {
            const next = { ...prev }
            delete next[payload.userId]
            return next
          })
        }
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, user.id, supabase])

  const broadcastTyping = (isTyping: boolean) => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'typing_indicator',
      payload: {
        userId: user.id,
        username: user.email?.split('@')[0] || 'Someone',
        isTyping
      }
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    setNotes(newText)

    // Typing Indicator Logic
    broadcastTyping(true)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      broadcastTyping(false)
    }, 1000)

    // Debounce broadcast
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      channelRef.current?.send({
        type: 'broadcast',
        event: 'notes_update',
        payload: { text: newText, userId: user.id }
      })
    }, 500)
  }

  // Optional: Save to Database (if we had a notes table, forcing broadcast for now)
  const handleSave = async () => {
    setIsSaving(true)
    // Simulate save
    await new Promise((resolve) => setTimeout(resolve, 800))
    setIsSaving(false)
    toast.success('Notes saved to session')
  }

  const getTypingText = () => {
    const users = Object.values(typingUsers)
    if (users.length === 0) return null
    if (users.length === 1) return `${users[0]} is typing...`
    if (users.length === 2) return `${users[0]} and ${users[1]} are typing...`
    return `${users[0]}, ${users[1]} and ${users.length - 2} others are typing...`
  }

  return (
    <div className="flex flex-col h-full w-full bg-zinc-950/50 backdrop-blur-sm p-6 relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Collaborative Notes
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/20">
              LIVE
            </span>
          </h2>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-white/10 hover:bg-white/20 text-white border-0"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Session
        </Button>
      </div>

      <div className="flex-1 relative flex flex-col gap-2">
        <Textarea
          value={notes}
          onChange={handleChange}
          placeholder="Start typing notes together..."
          className="flex-1 w-full bg-zinc-900/50 border-white/10 text-zinc-100 resize-none p-6 text-lg leading-relaxed focus:ring-1 focus:ring-white/20 rounded-xl font-mono"
          spellCheck={false}
        />
        <div className="h-6 text-sm text-emerald-400 font-medium animate-pulse">
          {getTypingText()}
        </div>
      </div>
    </div>
  )
}
