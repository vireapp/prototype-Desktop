import { useEffect, useRef } from 'react'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'
import { toast } from 'sonner'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ReactionItem } from '@/components/room/reaction-overlay'

interface UseRoomSubscriptionsProps {
  roomId: string
  userId: string
  supabase: SupabaseClient
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onRoomUpdate: (payload: any) => void
    onReaction: (emoji: string) => void
    onVirtualTVChange: (payload: { url: string; name: string }) => void
    onScreenShareChange: (payload: { presenterId: string | null; isSharing: boolean }) => void
  }
}

export function useRoomSubscriptions({
  roomId,
  userId,
  supabase,
  callbacks
}: UseRoomSubscriptionsProps) {
  // Keep a ref to the latest callbacks to avoid re-subscribing when they change
  const callbacksRef = useRef(callbacks)
  // Channel refs for broadcasting (reuse subscribed channels)
  const reactionChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const tvChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const screenChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    callbacksRef.current = callbacks
  }, [callbacks])

  useEffect(() => {
    // 1. Room DB Updates
    const roomChannel = supabase
      .channel(`room-updates:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${roomId}`
        },
        (payload) => {
          console.log('Room Updated:', payload.new)
          callbacksRef.current.onRoomUpdate(payload.new)
        }
      )
      .subscribe()

    // 2. Reactions
    const reactionChannel = supabase.channel(`room_${roomId}_reactions`)
    reactionChannelRef.current = reactionChannel
    reactionChannel
      .on('broadcast', { event: 'reaction' }, ({ payload }) => {
        callbacksRef.current.onReaction(payload.emoji)
      })
      .subscribe()

    // 3. Virtual TV
    const tvChannel = supabase.channel(`room_${roomId}_virtual_tv`)
    tvChannelRef.current = tvChannel
    tvChannel
      .on('broadcast', { event: 'change_channel' }, ({ payload }) => {
        callbacksRef.current.onVirtualTVChange(payload)
        toast.info(`Channel changed to ${payload.name}`)
      })
      .subscribe()

    // 4. Screen Share
    const screenChannel = supabase.channel(`room_${roomId}_screen_share`)
    screenChannelRef.current = screenChannel
    screenChannel
      .on('broadcast', { event: 'screen_share_state' }, ({ payload }) => {
        callbacksRef.current.onScreenShareChange(payload)
        if (payload.isSharing && payload.presenterId !== userId) {
          toast.info('Someone started sharing their screen.')
        } else if (!payload.isSharing && payload.presenterId !== userId) {
          toast.info('Screen sharing stopped')
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(roomChannel)
      supabase.removeChannel(reactionChannel)
      supabase.removeChannel(tvChannel)
      supabase.removeChannel(screenChannel)
    }
  }, [roomId, supabase, userId]) // Callbacks are now stable via ref

  // Broadcasters — reuse already-subscribed channels via refs
  const broadcastReaction = async (emoji: string) => {
    await reactionChannelRef.current?.send({
      type: 'broadcast',
      event: 'reaction',
      payload: { emoji }
    })
  }

  const broadcastVirtualTV = async (url: string, name: string) => {
    await tvChannelRef.current?.send({
      type: 'broadcast',
      event: 'change_channel',
      payload: { url, name }
    })
  }

  const broadcastScreenShare = async (isSharing: boolean) => {
    await screenChannelRef.current?.send({
      type: 'broadcast',
      event: 'screen_share_state',
      payload: { presenterId: isSharing ? userId : null, isSharing }
    })
  }

  return {
    broadcastReaction,
    broadcastVirtualTV,
    broadcastScreenShare
  }
}
