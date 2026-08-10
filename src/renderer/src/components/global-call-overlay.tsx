'use client'

import { useCall } from '@/lib/call-context'
import { CallOverlay } from '@/components/dashboard/call-overlay'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function GlobalCallOverlay() {
  const { isActive, friend, type, isMinimized, startCall, endCall, setIsMinimized } = useCall()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [currentUser, setCurrentUser] = useState<any>(null)
  const supabase = createClient()

  // We need the current user for the CallOverlay logic.
  // Since this is a global component, we fetch it once or rely on a UserProvider if one existed globaly.
  // For now, let's fetch it on mount if we don't have it, or pass it down via props if we wrap it in layout properly.
  // Actually, layout.tsx has the user. We can pass it to the context or just fetch here.
  // Fetching here is safer for client component isolation.

  useEffect(() => {
    const fetchUserAndRestoreCall = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // 1. Get profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setCurrentUser(profile || user)

        // 2. Check for Active Calls (Restoration)
        if (!isActive) {
          console.log('[GlobalCallOverlay] Checking for active calls to restore...')
          const { data: activeCalls } = await supabase
            .from('active_calls')
            .select('*')
            .or(`caller_id.eq.${user.id},receiver_id.eq.${user.id}`)
            .in('status', ['active', 'pending']) // Restore both
            .order('created_at', { ascending: false })
            .limit(1)

          if (activeCalls && activeCalls.length > 0) {
            const call = activeCalls[0]
            console.log('[GlobalCallOverlay] Found active call to restore:', call)

            // STALE CHECK (Heartbeat)
            // If no last_ping, use created_at (grace period for old calls or start)
            const lastPingTime = call.last_ping
              ? new Date(call.last_ping).getTime()
              : new Date(call.created_at).getTime()
            const timeSinceLastPing = Date.now() - lastPingTime

            // Threshold: 30 seconds (Heartbeat is 5s, so 30s is generous)
            if (timeSinceLastPing > 30000) {
              console.log('[GlobalCallOverlay] Call is stale/zombie. Cleaning up.')
              await supabase.from('active_calls').delete().eq('id', call.id)
              // toast.info("Previous call session timed out"); // Optional: don't annoy user
              return
            }

            // Determine friend ID
            const friendId = call.caller_id === user.id ? call.receiver_id : call.caller_id

            // Fetch friend profile
            const { data: friendProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', friendId)
              .single()

            if (friendProfile) {
              // CHECK: Is the friend actually online?
              // If they are offline, this is likely a stale/zombie call (or they disconnected while we refreshed).
              // We should not restore and ideally clean it up.
              if (friendProfile.status !== 'online') {
                console.log(
                  '[GlobalCallOverlay] Friend is offline. Not restoring call. Cleaning up.'
                )
                // Optional: Delete the stale call record
                await supabase.from('active_calls').delete().eq('id', call.id)
                return
              }

              // Determine type (default to video if not stored, or infer)
              // active_calls has 'type' column.
              const callType = call.type || 'video'

              // Pass the existing call data (like created_at) to startCall if possible?
              // Currently startCall only takes friend/type.
              // We might need to handle the duration sync inside CallOverlay by re-fetching the active call.
              startCall(friendProfile, callType)
            }
          }
        }
      }
    }
    fetchUserAndRestoreCall()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Run once on mount

  if (!isActive || !friend || !type || !currentUser) return null

  return (
    <div className="fixed top-[65px] md:top-[85px] bottom-0 left-0 right-0 z-[100] pointer-events-none">
      <CallOverlay
        friend={friend}
        type={type}
        currentUser={currentUser}
        isMinimized={isMinimized}
        onMinimize={setIsMinimized}
        onClose={endCall}
      />
    </div>
  )
}
