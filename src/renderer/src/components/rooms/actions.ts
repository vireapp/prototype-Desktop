import { createClient } from '@/lib/supabase/client'
import { generateRoomConfig } from '@/lib/ai/room-creator'

export type RoomRole = 'owner' | 'admin' | 'moderator' | 'member'

export async function getRoomRole(roomId: string): Promise<RoomRole> {
  const supabase = createClient()
  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  if (error || !user) return 'member'

  // Check if owner via rooms table (absolute truth)
  const { data: room } = await supabase.from('rooms').select('created_by').eq('id', roomId).single()

  if (room && room.created_by === user.id) return 'owner'

  // Check members table
  const { data: member } = await supabase
    .from('room_members')
    .select('role')
    .eq('room_id', roomId)
    .eq('user_id', user.id)
    .single()

  return (member?.role as RoomRole) || 'member'
}

export async function joinRoom(roomId: string): Promise<void> {
  const supabase = createClient()
  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  if (error || !user) return

  // Check if already a member
  const { data: existing } = await supabase
    .from('room_members')
    .select('id')
    .eq('room_id', roomId)
    .eq('user_id', user.id)
    .single()

  if (existing) return

  await supabase.from('room_members').insert({
    room_id: roomId,
    user_id: user.id,
    role: 'member'
  })
}

export async function createRoom(
  formData: FormData
): Promise<{ error?: string; success?: boolean; redirect?: string }> {
  const supabase = createClient()

  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  if (error || !user) {
    return { error: 'Unauthorized' }
  }

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const isPublic = formData.get('isPublic') === 'on'

  const code = Math.random().toString(36).substring(2, 8).toUpperCase()

  const { data, error: insertError } = await supabase
    .from('rooms')
    .insert({
      created_by: user.id,
      name,
      description,
      is_public: isPublic,
      code: isPublic ? null : code
    })
    .select()
    .single()

  if (insertError) {
    console.error(insertError)
    return { error: insertError.message }
  }

  return { success: true, redirect: `/room/${encodeURIComponent(data.name)}` }
}

export async function joinRoomByCode(
  formData: FormData
): Promise<{ error?: string; success?: boolean; redirect?: string }> {
  const supabase = createClient()
  const code = formData.get('code') as string

  if (!code) return { error: 'Code is required' }

  const { data: room, error } = await supabase
    .from('rooms')
    .select('id, name')
    .eq('code', code.toUpperCase())
    .single()

  if (error || !room) {
    return { error: 'Invalid room code' }
  }

  return { success: true, redirect: `/room/${encodeURIComponent(room.name)}` }
}

export async function deleteRoom(roomId: string): Promise<{ success: boolean }> {
  const supabase = createClient()
  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  if (error || !user) throw new Error('Unauthorized')

  // Check ownership
  const { data: room, error: fetchError } = await supabase
    .from('rooms')
    .select('created_by')
    .eq('id', roomId)
    .single()

  if (fetchError || !room) {
    throw new Error('Room not found or access denied.')
  }

  if (room.created_by !== user.id) {
    throw new Error('You do not have permission to delete this room.')
  }

  const { error: deleteError } = await supabase.from('rooms').delete().eq('id', roomId)

  if (deleteError) {
    throw new Error(deleteError.message)
  }

  return { success: true }
}

export async function updateRoom(
  roomId: string,
  data: {
    name: string
    description: string
    isPublic: boolean
    regenerateCode?: boolean
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    aiSettings?: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    chatSettings?: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    permissions?: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    appearance?: any
  }
): Promise<{ success: boolean }> {
  const supabase = createClient()
  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  if (error || !user) throw new Error('Unauthorized')

  // Check permission
  const role = await getRoomRole(roomId)

  if (role !== 'owner' && role !== 'admin' && role !== 'moderator') {
    throw new Error('You do not have permission to update this room.')
  }

  const { data: room } = await supabase
    .from('rooms')
    .select('created_by, code')
    .eq('id', roomId)
    .single()

  if (!room) {
    throw new Error('Room not found')
  }

  let newCode = room.code

  if (data.regenerateCode || (!data.isPublic && !room.code)) {
    newCode = Math.random().toString(36).substring(2, 8).toUpperCase()
  } else if (data.isPublic) {
    newCode = null
  }

  const { error: updateError } = await supabase
    .from('rooms')
    .update({
      name: data.name,
      description: data.description,
      is_public: data.isPublic,
      code: newCode,
      ai_settings: data.aiSettings,
      chat_settings: data.chatSettings,
      permissions: data.permissions,
      appearance: data.appearance
    })
    .eq('id', roomId)

  if (updateError) {
    throw new Error(updateError.message)
  }

  return { success: true }
}

export async function createRoomWithAI(
  formData: FormData
): Promise<{ error?: string; success?: boolean; redirect?: string }> {
  const supabase = createClient()
  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  if (error || !user) return { error: 'Unauthorized' }

  const prompt = formData.get('prompt') as string

  // 1. Generate Config
  const aiData = await generateRoomConfig(prompt)

  if (!aiData || 'error' in aiData) {
    return { error: aiData?.error || 'Failed to generate room configuration' }
  }

  // 2. Create Room
  const bannerUrl = `https://loremflickr.com/1280/720/${encodeURIComponent(aiData.banner_keyword || 'abstract')}`

  const { data, error: insertError } = await supabase
    .from('rooms')
    .insert({
      created_by: user.id,
      name: aiData.name,
      description: aiData.description,
      is_public: true,
      code: null,
      theme: aiData.theme,
      banner_url: bannerUrl
    })
    .select()
    .single()

  if (insertError) {
    console.error('Create Room Error:', insertError)
    return { error: 'Failed to create room' }
  }

  return { success: true, redirect: `/room/${encodeURIComponent(data.name)}` }
}

export async function getRoomMembers(roomId: string): Promise<any[]> {
  const supabase = createClient()

  const { data: room } = await supabase.from('rooms').select('created_by').eq('id', roomId).single()

  if (!room) throw new Error('Room not found')

  const { data: members, error } = await supabase
    .from('room_members')
    .select('*')
    .eq('room_id', roomId)

  if (error) throw new Error(error.message)

  let normalizedMembers: any[] = members || []

  const ownerInList = normalizedMembers.find((m) => m.user_id === room.created_by)
  if (ownerInList) {
    ownerInList.role = 'owner'
  } else {
    normalizedMembers.push({
      room_id: roomId,
      user_id: room.created_by,
      role: 'owner',
      joined_at: new Date().toISOString(),
      id: 'owner-placeholder'
    })
  }

  const userIds = normalizedMembers.map((m) => m.user_id)
  const { data: profiles } = await supabase.from('profiles').select('*').in('id', userIds)

  const combined = normalizedMembers.map((member) => {
    const profile = profiles?.find((p) => p.id === member.user_id)
    return {
      ...member,
      profile: profile || {
        id: member.user_id,
        full_name: 'Unknown User',
        email: 'unknown',
        avatar_url: null
      }
    }
  })

  return combined
}

export async function updateMemberRole(
  roomId: string,
  targetUserId: string,
  newRole: RoomRole
): Promise<{ success: boolean }> {
  const supabase = createClient()
  const currentUserRole = await getRoomRole(roomId)

  if (currentUserRole === 'owner') {
  } else if (currentUserRole === 'admin') {
    if (newRole === 'owner' || newRole === 'admin') {
      throw new Error('Admins cannot assign Owner or Admin roles.')
    }
  } else {
    throw new Error('Unauthorized to update roles.')
  }

  const { error } = await supabase
    .from('room_members')
    .update({ role: newRole })
    .eq('room_id', roomId)
    .eq('user_id', targetUserId)

  if (error) throw new Error(error.message)
  return { success: true }
}

export async function kickMember(
  roomId: string,
  targetUserId: string
): Promise<{ success: boolean }> {
  const supabase = createClient()
  const currentUserRole = await getRoomRole(roomId)

  if (
    currentUserRole !== 'owner' &&
    currentUserRole !== 'admin' &&
    currentUserRole !== 'moderator'
  ) {
    throw new Error('Unauthorized to kick members.')
  }

  const { data: targetMember } = await supabase
    .from('room_members')
    .select('role')
    .eq('room_id', roomId)
    .eq('user_id', targetUserId)
    .single()

  if (targetMember) {
    if (targetMember.role === 'owner') throw new Error('Cannot kick the Owner.')
    if (currentUserRole === 'admin' && targetMember.role === 'admin')
      throw new Error('Admins cannot kick other Admins.')
    if (
      currentUserRole === 'moderator' &&
      (targetMember.role === 'admin' || targetMember.role === 'moderator')
    ) {
      throw new Error('Moderators cannot kick Admins or other Moderators.')
    }
  }

  const { error } = await supabase
    .from('room_members')
    .delete()
    .eq('room_id', roomId)
    .eq('user_id', targetUserId)

  if (error) throw new Error(error.message)
  return { success: true }
}

export async function getRoomBans(roomId: string): Promise<any[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('room_bans')
    .select('*, profile:profiles!room_bans_user_id_fkey(id, full_name, username, avatar_url)')
    .eq('room_id', roomId)
    
  if (error) {
    // Fallback if foreign key isn't explicitly named like that
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('room_bans')
      .select('*, profile:user_id(id, full_name, username, avatar_url)')
      .eq('room_id', roomId)
      
    if (fallbackError) {
      console.warn("Could not fetch room bans", fallbackError)
      return []
    }
    return fallbackData || []
  }
  
  return data || []
}

export async function unbanRoomUser(roomId: string, userId: string): Promise<{ success: boolean }> {
  const supabase = createClient()
  const currentUserRole = await getRoomRole(roomId)
  
  if (currentUserRole !== 'owner' && currentUserRole !== 'admin' && currentUserRole !== 'moderator') {
    throw new Error('Unauthorized to unban members.')
  }
  
  const { error } = await supabase
    .from('room_bans')
    .delete()
    .eq('room_id', roomId)
    .eq('user_id', userId)
    
  if (error) throw new Error(error.message)
  return { success: true }
}
