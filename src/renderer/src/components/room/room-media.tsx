/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface RoomMediaProps {
  roomId: string
  user: any
  onBack?: () => void
  initialUrl?: string
}

export function RoomMedia({ roomId, user, onBack, initialUrl }: RoomMediaProps) {
  const [url, setUrl] = useState<string>(
    initialUrl || 'https://www.youtube.com/watch?v=LXb3EKWsInQ'
  )
  const supabase = createClient()
  const channelRef = useRef<any>(null)

  // Extract Video ID helper
  const getVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return match && match[2].length === 11 ? match[2] : null
  }

  const broadcast = useCallback(
    async (type: string, payload: any) => {
      if (!channelRef.current) return
      await channelRef.current.send({
        type: 'broadcast',
        event: 'media-state',
        payload: { type, sender: user.id, ...payload }
      })
    },
    [user.id]
  )

  // Sync URL from parent
  useEffect(() => {
    if (initialUrl && initialUrl !== url) {
      setUrl(initialUrl)
      broadcast('url', { url: initialUrl })
    }
  }, [initialUrl, broadcast])

  // Supabase peer synchronization
  useEffect(() => {
    const channel = supabase
      .channel(`room-media:${roomId}`)
      .on('broadcast', { event: 'media-state' }, ({ payload }) => {
        if (payload.type === 'url') {
          setUrl(payload.url)
        }
      })
      .subscribe()

    channelRef.current = channel
    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, supabase])

  const videoId = getVideoId(url)

  return (
    <div className="flex flex-col h-full bg-black relative">
      <div className="flex-1 relative bg-black flex justify-center items-center overflow-hidden">
        {videoId ? (
          <iframe
            key={videoId}
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&modestbranding=1&rel=0`}
            className="w-full h-full absolute top-0 left-0 border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="text-white flex justify-center items-center h-full">Invalid Video URL</div>
        )}

        {/* Navigation Controls */}
        <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-start pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-2">
            {onBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="text-white hover:bg-black/50 bg-black/20 rounded-full backdrop-blur-sm shadow-md"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
