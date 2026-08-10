import { createClient } from '@/lib/supabase/client'

export async function searchUsers(formData: FormData): Promise<{ error?: string; users?: any[] }> {
  const query = formData.get('query') as string
  if (!query || query.length < 3) return { error: 'Search term too short' }

  const supabase = createClient()

  // Use the RPC function we defined in SQL
  const { data, error } = await supabase.rpc('search_users', {
    search_term: query
  })

  if (error) {
    console.error('Search error:', error)
    return { error: 'Failed to search users' }
  }

  return { users: data }
}

export async function sendFriendRequest(
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const receiverId = formData.get('receiverId') as string
  if (!receiverId) return { error: 'Invalid user ID' }

  const supabase = createClient()
  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  if (error || !user) return { error: 'Not authenticated' }

  const { error: insertError } = await supabase.from('friend_requests').insert({
    sender_id: user.id,
    receiver_id: receiverId,
    status: 'pending'
  })

  if (insertError) {
    if (insertError.code === '23505') {
      // Unique constraint violation
      return { error: 'Request already sent or exists' }
    }
    console.error('Send request error:', insertError)
    return { error: 'Failed to send friend request' }
  }

  return { success: true }
}

export async function acceptFriendRequest(
  requestId: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = createClient()

  const { error } = await supabase
    .from('friend_requests')
    .update({ status: 'accepted' })
    .eq('id', requestId)

  if (error) {
    console.error('Accept error:', error)
    return { error: 'Failed to accept request' }
  }

  return { success: true }
}

export async function rejectFriendRequest(
  requestId: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = createClient()

  const { error } = await supabase
    .from('friend_requests')
    .update({ status: 'rejected' }) // Or delete it: .delete().eq('id', requestId)
    .eq('id', requestId)

  if (error) {
    console.error('Reject error:', error)
    return { error: 'Failed to reject request' }
  }

  return { success: true }
}

export async function removeFriend(
  friendId: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = createClient()
  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  if (error || !user) return { error: 'Not authenticated' }

  // Remove the friendship
  // Assuming 'friends' table has 'user_id' and 'friend_id'
  const { error: removeError } = await supabase
    .from('friends')
    .delete()
    .eq('user_id', user.id)
    .eq('friend_id', friendId)

  if (removeError) {
    console.error('Remove friend error:', removeError)
    return { error: 'Failed to remove friend' }
  }

  return { success: true }
}

export async function blockUser(
  userIdToBlock: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = createClient()
  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  if (error || !user) return { error: 'Not authenticated' }

  // 1. Add to blocked_users table (assuming it exists, or create logic)
  // If no blocked_users table, we might just delete friend connection for now.
  // For this prototype, let's assume blocking just removes them and maybe logs it.
  // A real implementation needs a 'blocked_users' table.

  // For now, let's just remove friend connection and maybe separate logic if table exists.
  // We'll treat block as "Remove Friend" + "Reject any requests"

  const { error: removeError } = await supabase
    .from('friends')
    .delete()
    .eq('user_id', user.id)
    .eq('friend_id', userIdToBlock)

  if (removeError) {
    console.error('Block (Remove) error:', removeError)
    return { error: 'Failed to block user' }
  }

  // Also remove from friend_requests
  await supabase
    .from('friend_requests')
    .delete()
    .or(`sender_id.eq.${userIdToBlock},receiver_id.eq.${userIdToBlock}`)
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`) // Broad cleanup for safety

  return { success: true }
}

export async function updateFriendNickname(
  friendId: string,
  nickname: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = createClient()
  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  if (error || !user) return { error: 'Not authenticated' }

  const { error: updateError } = await supabase
    .from('friends')
    .update({ nickname: nickname })
    .eq('user_id', user.id)
    .eq('friend_id', friendId)

  if (updateError) {
    console.error('Update nickname error:', updateError)
    return { error: 'Failed to update nickname' }
  }

  return { success: true }
}

export async function togglePinFriend(
  friendId: string,
  isPinned: boolean
): Promise<{ error?: string; success?: boolean }> {
  const supabase = createClient()
  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  if (error || !user) return { error: 'Not authenticated' }

  const { error: updateError } = await supabase
    .from('friends')
    .update({ is_pinned: isPinned })
    .eq('user_id', user.id)
    .eq('friend_id', friendId)

  if (updateError) {
    console.error('Toggle pin error:', updateError)
    return { error: 'Failed to update pin status' }
  }

  return { success: true }
}

export async function toggleMuteFriend(
  friendId: string,
  isMuted: boolean
): Promise<{ error?: string; success?: boolean }> {
  const supabase = createClient()
  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  if (error || !user) return { error: 'Not authenticated' }

  const { error: updateError } = await supabase
    .from('friends')
    .update({ is_muted: isMuted })
    .eq('user_id', user.id)
    .eq('friend_id', friendId)

  if (updateError) {
    console.error('Toggle mute error:', updateError)
    return { error: 'Failed to update mute status' }
  }

  return { success: true }
}

export async function toggleHideStatus(
  friendId: string,
  hideStatus: boolean
): Promise<{ error?: string; success?: boolean }> {
  const supabase = createClient()
  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  if (error || !user) return { error: 'Not authenticated' }

  const { error: updateError } = await supabase
    .from('friends')
    .update({ hide_my_status: hideStatus })
    .eq('user_id', user.id)
    .eq('friend_id', friendId)

  if (updateError) {
    console.error('Toggle hide status error:', updateError)
    return { error: 'Failed to update status visibility' }
  }

  return { success: true }
}

export async function reportUser(
  friendId: string,
  reason: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = createClient()
  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  if (error || !user) return { error: 'Not authenticated' }

  // Assuming a 'reports' table exists
  const { error: insertError } = await supabase.from('reports').insert({
    reporter_id: user.id,
    reported_user_id: friendId,
    reason: reason,
    status: 'pending'
  })

  if (insertError) {
    console.error('Report user error:', insertError)
    return { error: 'Failed to submit report' }
  }

  return { success: true }
}

export async function initiateCall(
  friendId: string,
  type: 'video' | 'voice'
): Promise<{ error?: string; success?: boolean; callId?: string }> {
  const supabase = createClient()
  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  if (error || !user) return { error: 'Not authenticated' }

  const { data, error: callError } = await supabase
    .from('active_calls')
    .insert({
      caller_id: user.id,
      receiver_id: friendId,
      type: type,
      status: 'pending'
    })
    .select()
    .single()

  if (callError) {
    console.error('Initiate call error:', callError)
    return { error: 'Failed to initiate call' }
  }

  return { success: true, callId: data.id }
}
