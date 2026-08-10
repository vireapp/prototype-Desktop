import { createClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

export type RoomType = 'romantic' | 'friends' | 'family'
export type MatchPref = 'M' | 'F' | 'any'
export type Gender = 'M' | 'F' | 'other'

export interface DuoQueueEntry {
  id: string
  user_id: string
  gender: Gender
  match_pref: MatchPref
  interests: string[]
  hobbies: string[]
  likes: string
  dislikes: string
  room_type: RoomType
  status: 'waiting' | 'matched' | 'expired'
  matched_with?: string
  match_score?: number
}

export interface DuoRoom {
  id: string
  room_id: string
  user1_id: string
  user2_id: string
  room_type: RoomType
  match_score: number
  chat_unlocked: boolean
  voice_unlocked: boolean
  video_unlocked: boolean
  extras_unlocked: boolean
  chat_message_count: number
  call_count: number
  voice_unlock_at: number
  video_unlock_at: number
  extras_unlock_at: number
  room_named: boolean
}

export interface DuoProfile {
  id: string
  username?: string
  full_name?: string
  avatar_url?: string
  gender?: string
}

// ─── Queue Actions ────────────────────────────────────────────────────────────

/**
 * Add the current user to the duo matchmaking queue.
 */
export async function joinDuoQueue(data: {
  gender: Gender
  matchPref: MatchPref
  interests: string[]
  hobbies: string[]
  likes: string
  dislikes: string
  roomType: RoomType
}): Promise<{ error?: string; queueId?: string }> {
  const supabase = createClient()
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()

  if (authError || !user) return { error: 'Not authenticated' }

  // Remove any existing waiting entry for this user
  await supabase.from('duo_queue').delete().eq('user_id', user.id).eq('status', 'waiting')

  const { data: entry, error } = await supabase
    .from('duo_queue')
    .insert({
      user_id: user.id,
      gender: data.gender,
      match_pref: data.matchPref,
      interests: data.interests,
      hobbies: data.hobbies,
      likes: data.likes,
      dislikes: data.dislikes,
      room_type: data.roomType,
      status: 'waiting'
    })
    .select()
    .single()

  if (error) return { error: error.message }
  return { queueId: entry.id }
}

/**
 * Poll the queue to check if we've been matched.
 * Also tries to find and match a compatible waiting user.
 */
export async function pollForMatch(queueId: string): Promise<{
  matched?: boolean
  matchedWith?: DuoProfile
  matchScore?: number
  duoRoomId?: string
  roomId?: string
  queueEntry?: DuoQueueEntry
}> {
  const supabase = createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return {}

  // Check our own entry first
  const { data: myEntry } = await supabase
    .from('duo_queue')
    .select('*')
    .eq('id', queueId)
    .single()

  if (!myEntry) return {}

  // Check if someone else already created a duo_room for us recently!
  // (Because of RLS, they couldn't update our queue entry to 'matched')
  const { data: recentRoom } = await supabase
    .from('duo_rooms')
    .select('id, room_id, user1_id, user2_id, match_score, created_at')
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (recentRoom && new Date(recentRoom.created_at) > new Date(myEntry.created_at)) {
    const partnerId = recentRoom.user1_id === user.id ? recentRoom.user2_id : recentRoom.user1_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, gender')
      .eq('id', partnerId)
      .single()

    // Clean up our own queue entry since the other user couldn't
    await supabase
      .from('duo_queue')
      .update({ status: 'matched', matched_with: partnerId, match_score: recentRoom.match_score })
      .eq('id', myEntry.id)

    return {
      matched: true,
      matchedWith: profile || undefined,
      matchScore: recentRoom.match_score || 0,
      duoRoomId: recentRoom.id,
      roomId: recentRoom.room_id,
      queueEntry: myEntry
    }
  }

  // Already matched by someone else (the clean path)
  if (myEntry.status === 'matched' && myEntry.matched_with) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, gender')
      .eq('id', myEntry.matched_with)
      .single()

    const { data: duoRoom } = await supabase
      .from('duo_rooms')
      .select('id, room_id')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    return {
      matched: true,
      matchedWith: profile || undefined,
      matchScore: myEntry.match_score || 0,
      duoRoomId: duoRoom?.id,
      roomId: duoRoom?.room_id,
      queueEntry: myEntry
    }
  }

  // Try to find a compatible match
  let query = supabase
    .from('duo_queue')
    .select('*')
    .eq('status', 'waiting')
    .eq('room_type', myEntry.room_type)
    .neq('user_id', user.id)

  // Gender preference filtering
  if (myEntry.match_pref !== 'any') {
    query = query.eq('gender', myEntry.match_pref)
  }
  if (myEntry.gender !== 'other') {
    query = query.or(`match_pref.eq.${myEntry.gender},match_pref.eq.any`)
  }

  const { data: candidates } = await query.limit(20)

  if (!candidates || candidates.length === 0) {
    return { matched: false, queueEntry: myEntry }
  }

  // Score and pick the best match
  const scored = candidates
    .map((c) => ({ entry: c, score: computeMatchScore(myEntry, c) }))
    .sort((a, b) => b.score - a.score)

  const best = scored[0]
  const score = best.score

  // TIE-BREAKER: To prevent a race condition where BOTH users create a room simultaneously,
  // we enforce that ONLY the user with the smaller user_id performs the match creation.
  if (user.id > best.entry.user_id) {
    // We wait for the other user to create it. We'll catch it on the next poll via recentRoom.
    return { matched: false, queueEntry: myEntry }
  }

  // I have the smaller ID, I create the match
  const matchResult = await createMatch(myEntry, best.entry, score)
  if (matchResult.error) return { matched: false, queueEntry: myEntry }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url, gender')
    .eq('id', best.entry.user_id)
    .single()

  return {
    matched: true,
    matchedWith: profile || undefined,
    matchScore: score,
    duoRoomId: matchResult.duoRoomId,
    roomId: matchResult.roomId,
    queueEntry: myEntry
  }
}

/**
 * Compute a compatibility score between two queue entries (0–100).
 */
function computeMatchScore(a: DuoQueueEntry, b: DuoQueueEntry): number {
  let score = 0

  // Shared interests
  const sharedInterests = a.interests.filter((i) => b.interests.includes(i))
  score += Math.min(sharedInterests.length * 8, 40)

  // Shared hobbies
  const sharedHobbies = a.hobbies.filter((h) => b.hobbies.includes(h))
  score += Math.min(sharedHobbies.length * 6, 30)

  // Keyword overlap in likes/dislikes
  const aWords = new Set([
    ...a.likes.toLowerCase().split(/\W+/),
    ...a.dislikes.toLowerCase().split(/\W+/)
  ])
  const bWords = [
    ...b.likes.toLowerCase().split(/\W+/),
    ...b.dislikes.toLowerCase().split(/\W+/)
  ]
  const wordOverlap = bWords.filter((w) => w.length > 3 && aWords.has(w)).length
  score += Math.min(wordOverlap * 5, 20)

  // Base compatibility bonus
  score += 10

  return Math.min(score, 100)
}

/**
 * Internal: creates the match, marks both queue entries, creates duo_rooms row.
 */
async function createMatch(
  myEntry: DuoQueueEntry,
  theirEntry: DuoQueueEntry,
  score: number
): Promise<{ error?: string; duoRoomId?: string; roomId?: string }> {
  const supabase = createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Create a placeholder room (DUO-XXXXXX)
  const code = Math.random().toString(36).substring(2, 8).toUpperCase()
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .insert({
      created_by: user.id,
      name: `DUO-${code}`,
      description: 'Private Duo Room',
      is_public: false,
      code
    })
    .select()
    .single()

  if (roomError || !room) return { error: roomError?.message || 'Failed to create room' }

  // Create duo_rooms record
  const { data: duoRoom, error: duoError } = await supabase
    .from('duo_rooms')
    .insert({
      room_id: room.id,
      user1_id: user.id,
      user2_id: theirEntry.user_id,
      room_type: myEntry.room_type,
      match_score: score
    })
    .select()
    .single()

  if (duoError) return { error: duoError.message }

  // Add both users as room members
  await supabase.from('room_members').insert([
    { room_id: room.id, user_id: user.id, role: 'member' },
    { room_id: room.id, user_id: theirEntry.user_id, role: 'member' }
  ])

  // Mark both queue entries as matched
  await supabase
    .from('duo_queue')
    .update({ status: 'matched', matched_with: theirEntry.user_id, match_score: score })
    .eq('id', myEntry.id)

  await supabase
    .from('duo_queue')
    .update({ status: 'matched', matched_with: user.id, match_score: score })
    .eq('id', theirEntry.id)

  return { duoRoomId: duoRoom.id, roomId: room.id }
}

/**
 * Set the final name for a duo room.
 */
export async function nameDuoRoom(
  roomId: string,
  name: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = createClient()
  const { error } = await supabase.from('rooms').update({ name }).eq('id', roomId)
  if (error) return { error: error.message }

  await supabase.from('duo_rooms').update({ room_named: true }).eq('room_id', roomId)

  return { success: true }
}

/**
 * Get duo room data for a given room_id.
 */
export async function getDuoRoom(roomId: string): Promise<DuoRoom | null> {
  const supabase = createClient()
  const { data } = await supabase.from('duo_rooms').select('*').eq('room_id', roomId).single()
  return data || null
}

/**
 * Increment the message counter for a duo room and auto-unlock voice if threshold met.
 */
export async function trackDuoMessage(roomId: string): Promise<void> {
  const supabase = createClient()
  const { data: duo } = await supabase
    .from('duo_rooms')
    .select('id, chat_message_count, voice_unlock_at, voice_unlocked')
    .eq('room_id', roomId)
    .single()

  if (!duo) return

  const newCount = (duo.chat_message_count || 0) + 1
  const updates: Record<string, unknown> = { chat_message_count: newCount }

  if (!duo.voice_unlocked && newCount >= duo.voice_unlock_at) {
    updates.voice_unlocked = true
  }

  await supabase.from('duo_rooms').update(updates).eq('id', duo.id)
}

/**
 * Increment the call counter for a duo room and auto-unlock video if threshold met.
 */
export async function trackDuoCall(roomId: string): Promise<void> {
  const supabase = createClient()
  const { data: duo } = await supabase
    .from('duo_rooms')
    .select('id, call_count, video_unlock_at, video_unlocked')
    .eq('room_id', roomId)
    .single()

  if (!duo) return

  const newCount = (duo.call_count || 0) + 1
  const updates: Record<string, unknown> = { call_count: newCount }

  if (!duo.video_unlocked && newCount >= duo.video_unlock_at) {
    updates.video_unlocked = true
  }

  await supabase.from('duo_rooms').update(updates).eq('id', duo.id)
}

/**
 * Cancel the current user's queue entry.
 */
export async function leaveDuoQueue(queueId: string): Promise<void> {
  const supabase = createClient()
  await supabase.from('duo_queue').delete().eq('id', queueId)
}

// ─── Icebreaker Actions ───────────────────────────────────────────────────────

export interface IcebreakerAnswers {
  [question: string]: string
}

/**
 * Save icebreaker answers for the current user in a duo room.
 */
export async function saveIcebreakerAnswers(
  duoRoomId: string,
  answers: IcebreakerAnswers
): Promise<{ error?: string; success?: boolean }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('duo_icebreaker_answers')
    .upsert({
      duo_room_id: duoRoomId,
      user_id: user.id,
      answers,
      completed_at: new Date().toISOString()
    }, { onConflict: 'duo_room_id,user_id' })

  if (error) return { error: error.message }
  return { success: true }
}

/**
 * Get icebreaker answers for both users in a duo room.
 */
export async function getIcebreakerAnswers(duoRoomId: string): Promise<{
  mine?: IcebreakerAnswers
  theirs?: IcebreakerAnswers
  bothDone?: boolean
}> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return {}

  const { data } = await supabase
    .from('duo_icebreaker_answers')
    .select('user_id, answers')
    .eq('duo_room_id', duoRoomId)

  if (!data) return {}

  const mine = data.find((r) => r.user_id === user.id)?.answers as IcebreakerAnswers | undefined
  const theirs = data.find((r) => r.user_id !== user.id)?.answers as IcebreakerAnswers | undefined

  return { mine, theirs, bothDone: !!mine && !!theirs }
}

/**
 * Check if the current user has completed icebreaker.
 */
export async function hasCompletedIcebreaker(duoRoomId: string): Promise<boolean> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data } = await supabase
    .from('duo_icebreaker_answers')
    .select('id')
    .eq('duo_room_id', duoRoomId)
    .eq('user_id', user.id)
    .single()

  return !!data
}

/**
 * Get shared interests between two queue entries for AI naming.
 */
export async function getSharedInterests(duoRoomId: string): Promise<{
  interests: string[]
  hobbies: string[]
}> {
  const supabase = createClient()

  const { data: duo } = await supabase
    .from('duo_rooms')
    .select('user1_id, user2_id, room_type')
    .eq('id', duoRoomId)
    .single()

  if (!duo) return { interests: [], hobbies: [] }

  const { data: entries } = await supabase
    .from('duo_queue')
    .select('interests, hobbies')
    .in('user_id', [duo.user1_id, duo.user2_id])
    .eq('status', 'matched')

  if (!entries || entries.length < 2) return { interests: [], hobbies: [] }

  const [a, b] = entries
  const sharedInterests = (a.interests || []).filter((i: string) => (b.interests || []).includes(i))
  const sharedHobbies = (a.hobbies || []).filter((h: string) => (b.hobbies || []).includes(h))

  return { interests: sharedInterests, hobbies: sharedHobbies }
}

/**
 * Update extras_unlocked when video threshold is met.
 */
export async function checkExtrasUnlock(roomId: string): Promise<boolean> {
  const supabase = createClient()
  const { data: duo } = await supabase
    .from('duo_rooms')
    .select('id, video_unlocked, extras_unlocked')
    .eq('room_id', roomId)
    .single()

  if (!duo || duo.extras_unlocked) return duo?.extras_unlocked ?? false

  if (duo.video_unlocked && !duo.extras_unlocked) {
    await supabase.from('duo_rooms').update({ extras_unlocked: true }).eq('id', duo.id)
    return true
  }

  return false
}

