import { createClient } from '@/lib/supabase/client'
import { enqueueWrite } from '@/lib/write-queue'

export async function updateUserStatus(status: 'online' | 'offline' | 'invisible' | 'in-room') {
  const supabase = createClient()
  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Unauthorized')
  }

  // ── Layer 1: Optimistic fast path ────────────────────────────────────────
  // Try the direct write first for minimal latency (status changes should be fast).
  const { error: updateError } = await supabase.from('profiles').update({ status }).eq('id', user.id)

  if (updateError) {
    // Direct write failed (DB unreachable, network drop, etc.)
    // Enqueue so it is retried automatically when connectivity restores.
    console.warn('[UserActions] updateUserStatus failed, enqueuing for retry:', updateError.message)
    enqueueWrite({
      table: 'profiles',
      op: 'update',
      payload: { status },
      filter: { column: 'id', value: user.id }
    })
    // Don't throw — the queue will handle it. UI can stay optimistic.
    return { success: true, queued: true }
  }
  // ─────────────────────────────────────────────────────────────────────────

  return { success: true, queued: false }
}
