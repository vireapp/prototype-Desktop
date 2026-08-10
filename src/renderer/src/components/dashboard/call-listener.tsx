'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { Phone, Video, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCall } from '@/lib/call-context'

export function CallListener({ userId }: { userId: string }): null {
  const supabase = createClient()
  const navigate = useNavigate()
  const { startCall } = useCall()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const retryPlayRef = useRef<(() => void) | null>(null)

  const stopRingtone = (): void => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }
    if (retryPlayRef.current) {
      document.removeEventListener('click', retryPlayRef.current)
      document.removeEventListener('keydown', retryPlayRef.current)
      document.removeEventListener('touchstart', retryPlayRef.current)
      retryPlayRef.current = null
    }
  }

  const startRinging = (): NodeJS.Timeout => {
    // Melodic Ringtone
    const ringtoneUrl = 'https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3'

    const audio = new Audio(ringtoneUrl)
    audio.loop = true
    audio.volume = 0.5 // Reasonable volume

    const tryPlay = async (): Promise<void> => {
      try {
        await audio.play()
        // If successful, remove any pending retry listeners
        if (retryPlayRef.current) {
          document.removeEventListener('click', retryPlayRef.current)
          document.removeEventListener('keydown', retryPlayRef.current)
          document.removeEventListener('touchstart', retryPlayRef.current)
          retryPlayRef.current = null
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        console.warn('Autoplay blocked, waiting for interaction...')
        // Add one-time listeners for interaction
        if (!retryPlayRef.current) {
          retryPlayRef.current = () => {
            tryPlay()
          }
          document.addEventListener('click', retryPlayRef.current, { once: true })
          document.addEventListener('keydown', retryPlayRef.current, { once: true })
          document.addEventListener('touchstart', retryPlayRef.current, { once: true })
        }
      }
    }

    tryPlay()
    audioRef.current = audio

    // Return dummy interval to satisfy existing logic flow
    return setInterval(() => {}, 100000)
  }

  useEffect(() => {
    if (!userId) return

    let ringInterval: NodeJS.Timeout | null = null

    const channel = supabase
      .channel('call_signaling')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'active_calls',
          filter: `receiver_id=eq.${userId}`
        },
        async (payload) => {
          const call = payload.new
          if (call.status === 'pending') {
            const { data: caller } = await supabase
              .from('profiles')
              .select('id, username, avatar_url, full_name')
              .eq('id', call.caller_id)
              .single()

            if (!caller) return

            const callerName = caller.username || 'Unknown User'

            // START RINGING
            if (!ringInterval) ringInterval = startRinging()

            toast.custom(
              (t) => (
                <div className="w-[90vw] max-w-[350px] p-4 rounded-2xl bg-zinc-900 border border-white/10 shadow-2xl flex flex-col gap-3 animate-in slide-in-from-top-5 duration-300">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-500 animate-pulse">
                      {call.type === 'video' ? <Video size={20} /> : <Phone size={20} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">Incoming {call.type} call</h3>
                      <p className="text-zinc-400 text-sm">from @{callerName}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full mt-2">
                    <Button
                      variant="outline"
                      className="flex-1 bg-white/5 border-white/10 hover:bg-white/10"
                      onClick={() => {
                        toast.dismiss(t)
                        stopRingtone()
                        if (ringInterval) clearInterval(ringInterval)
                        // Update status to rejected
                        supabase.from('active_calls').update({ status: 'rejected' }).eq('id', call.id).then()
                      }}
                    >
                      <X size={16} className="mr-2 text-rose-400" /> Decline
                    </Button>
                    <Button
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                      onClick={() => {
                        toast.dismiss(t)
                        stopRingtone()
                        if (ringInterval) clearInterval(ringInterval)
                        // Start Call Locally WITHOUT Redirect
                        startCall(caller, call.type)
                      }}
                    >
                      <Check size={16} className="mr-2" /> Accept
                    </Button>
                  </div>
                </div>
              ),
              { duration: 20000, position: 'top-center' }
            )
          }
        }
      )
      .subscribe()

    return () => {
      stopRingtone()
      if (ringInterval) clearInterval(ringInterval)
      supabase.removeChannel(channel)
    }
  }, [userId, supabase, navigate, startCall])

  return null
}
