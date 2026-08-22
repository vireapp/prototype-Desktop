import { createClient } from '@/lib/supabase/client'
import { enqueueWrite } from '@/lib/write-queue'
import { getCached, setCached, invalidateCache } from '@/lib/query-cache'
import { useInventoryStore } from '@/stores/use-inventory'

const DAILY_LOGIN_XP = 50
const PRESENCE_TICK_XP = 10 // XP per tick (approx 5-10 mins)
const MAX_PRESENCE_XP_DAILY = 200 // Cap daily presence XP
const GAMIFICATION_CACHE_TTL_MS = 30_000 // 30 seconds

// Helper to calculate Level, NextLevelXP, and Progress based on Total XP
function calculateLevelAndProgress(totalXP: number) {
  let level = 1
  let accumulatedXP = 0

  while (true) {
    const tier = Math.floor((level - 1) / 10)
    const xpToNextLevel = 100 * (tier + 1)

    if (totalXP < accumulatedXP + xpToNextLevel) {
      return {
        level,
        currentLevelXP: totalXP - accumulatedXP,
        xpToNextLevel,
        progress: ((totalXP - accumulatedXP) / xpToNextLevel) * 100
      }
    }

    accumulatedXP += xpToNextLevel
    level++
  }
}

export async function getUserGamificationData() {
  const supabase = createClient()
  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  if (error || !user) return null

  // ── Layer 2: Read Cache ──────────────────────────────────────────────────
  const CACHE_KEY = `gamification_${user.id}`
  const cached = getCached<ReturnType<typeof _buildGamificationResult>>(CACHE_KEY)
  if (cached) return cached
  // ────────────────────────────────────────────────────────────────────────

  const [profileResult, achievementsResult, activeFriendsResult, activeRoomsResult, questsResult] =
    await Promise.all([
      supabase.from('profiles').select('xp, level, streak_count, streak_saves, coins').eq('id', user.id).single(),
      supabase
        .from('user_achievements')
        .select('*, achievement:achievements(*)')
        .eq('user_id', user.id),
      supabase
        .from('friends')
        .select('id, friend:profiles!friend_id!inner(status)', { count: 'exact', head: true })
        .or('status.eq.online,status.eq.in-room', { foreignTable: 'friend' }),
      supabase.from('rooms').select('id', { count: 'exact', head: true }),
      supabase.from('user_quests')
        .select('*, quest:daily_quests(*)')
        .eq('user_id', user.id)
        .eq('assigned_date', new Date().toISOString().split('T')[0])
    ])

  const currentXP = profileResult.data?.xp || 0
  const streakCount = profileResult.data?.streak_count || 0
  const streakSaves = profileResult.data?.streak_saves || 0
  
  const { level, xpToNextLevel, currentLevelXP, progress } =
    calculateLevelAndProgress(currentXP)

  // Compute cumulative XP target so UI can do `nextLevelXP - xp` for "XP remaining"
  let accumulatedTarget = 0
  for (let l = 1; l <= level; l++) {
    const tier = Math.floor((l - 1) / 10)
    accumulatedTarget += 100 * (tier + 1)
  }

  // Suppress unused-variable warnings from the destructuring above
  void currentLevelXP
  void xpToNextLevel

  const result = _buildGamificationResult({
    xp: currentXP,
    level,
    accumulatedTarget,
    progress,
    streakCount,
    streakSaves,
    achievements: achievementsResult.data || [],
    quests: questsResult.data || [],
    activeFriends: activeFriendsResult.count || 0,
    activeRooms: activeRoomsResult.count || 0
  })

  // ── Layer 2: Populate Cache ──────────────────────────────────────────────
  setCached(CACHE_KEY, result, GAMIFICATION_CACHE_TTL_MS)
  // ────────────────────────────────────────────────────────────────────────

  return result
}

// Extracted so its return type can be inferred for the cache generic
function _buildGamificationResult(params: {
  xp: number
  level: number
  accumulatedTarget: number
  progress: number
  streakCount: number
  streakSaves: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  achievements: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  quests: any[]
  activeFriends: number
  activeRooms: number
}) {
  return {
    xp: params.xp,
    level: params.level,
    nextLevelXP: params.accumulatedTarget,
    progress: Math.min(Math.max(params.progress, 0), 100),
    streakCount: params.streakCount,
    streakSaves: params.streakSaves,
    achievements: params.achievements,
    quests: params.quests,
    activeFriends: params.activeFriends,
    activeRooms: params.activeRooms
  }
}

export async function logActivity() {
  const supabase = createClient()
  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  if (error || !user) return

  const today = new Date().toISOString().split('T')[0]
  const userId = user.id

  // 1. Check for Daily Login Bonus via RPC (handles streaks & saves)
  const { data: existingLogin } = await supabase
    .from('activity_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('activity_type', 'daily_login')
    .gte('created_at', `${today}T00:00:00Z`)

  if (!existingLogin || existingLogin.length === 0) {
    const { data: loginResult, error: rpcError } = await supabase.rpc('process_daily_login')
    
    if (!rpcError && loginResult?.success) {
      // Sync awarded coins to Zustand store
      if (loginResult.coins_awarded) {
        useInventoryStore.getState().addCoins(loginResult.coins_awarded)
      }
      
      enqueueWrite({
        table: 'activity_logs',
        op: 'insert',
        payload: { user_id: userId, activity_type: 'daily_login' }
      })
      // Bust the gamification cache so next read reflects new XP
      invalidateCache(`gamification_${userId}`)
    }
  }

  // 2. Log Presence Tick (approx every 5-10 mins)
  const { count } = await supabase
    .from('activity_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('activity_type', 'presence_tick')
    .gte('created_at', `${today}T00:00:00Z`)

  const currentDailyPresenceXP = (count || 0) * PRESENCE_TICK_XP

  if (currentDailyPresenceXP < MAX_PRESENCE_XP_DAILY) {
    const { data: lastTick } = await supabase
      .from('activity_logs')
      .select('created_at')
      .eq('user_id', userId)
      .eq('activity_type', 'presence_tick')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const lastTickTime = lastTick ? new Date(lastTick.created_at).getTime() : 0
    const now = Date.now()

    // Enforce 5 minute debounce
    if (now - lastTickTime > 5 * 60 * 1000) {
      // ── Layer 1: Enqueue XP award + presence tick log ─────────────────
      await _awardXP(userId, PRESENCE_TICK_XP)
      enqueueWrite({
        table: 'activity_logs',
        op: 'insert',
        payload: { user_id: userId, activity_type: 'presence_tick' }
      })
      invalidateCache(`gamification_${userId}`)
      // ──────────────────────────────────────────────────────────────────
    }
  }

  // 3. Check for specific achievements (e.g., Early Bird)
  const { data: userAchievements } = await supabase
    .from('user_achievements')
    .select('achievement_id, achievement:achievements(name)')
    .eq('user_id', userId)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hasEarlyBird = userAchievements?.some((ua: any) => ua.achievement?.name === 'Early Bird')

  if (!hasEarlyBird) {
    await _awardAchievement(userId, 'Early Bird')
  }
}

// Internal helper to award an achievement
async function _awardAchievement(userId: string, achievementName: string) {
  const supabase = createClient()

  const { data: achievement } = await supabase
    .from('achievements')
    .select('id, xp_reward, coin_reward')
    .eq('name', achievementName)
    .single()

  if (!achievement) return

  // Upsert via queue (safe to retry — conflict handled by DB)
  enqueueWrite({
    table: 'user_achievements',
    op: 'upsert',
    payload: {
      user_id: userId,
      achievement_id: achievement.id
    }
  })

  // Award XP atomically
  await _awardXP(userId, achievement.xp_reward)
  if (achievement.coin_reward) {
    useInventoryStore.getState().addCoins(achievement.coin_reward)
  }
  invalidateCache(`gamification_${userId}`)
}

/**
 * Awards XP atomically via a Postgres RPC.
 */
async function _awardXP(userId: string, amount: number) {
  const supabase = createClient()

  const { error } = await supabase.rpc('award_xp', {
    p_amount: amount
  })

  if (error) {
    console.warn('[Gamification] award_xp RPC failed, falling back to queued write:', error)
    enqueueWrite({
      table: 'profiles',
      op: 'update',
      payload: { last_xp_award: new Date().toISOString() },
      filter: { column: 'id', value: userId }
    })
  }
}

// ── NEW FEATURES (Quests, Mystery Boxes, Kudos) ──────────────────────────

export async function completeQuest(questId: string, userId: string) {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  // Check if quest is already completed
  const { data: uq } = await supabase
    .from('user_quests')
    .select('completed, quest:daily_quests(xp_reward, coin_reward)')
    .eq('user_id', userId)
    .eq('quest_id', questId)
    .eq('assigned_date', today)
    .single()

  if (!uq || uq.completed) return

  // Mark as completed
  await supabase
    .from('user_quests')
    .update({ completed: true, progress: 1 })
    .eq('user_id', userId)
    .eq('quest_id', questId)
    .eq('assigned_date', today)

  if (uq.quest) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const quest = uq.quest as any
    await _awardXP(userId, quest.xp_reward)
    useInventoryStore.getState().addCoins(quest.coin_reward)
  }
  
  invalidateCache(`gamification_${userId}`)
  
  // Check if all 5 are completed to award Mystery Box
  const { count } = await supabase
    .from('user_quests')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('assigned_date', today)
    .eq('completed', true)
    
  if (count === 5) {
     awardMysteryBox(userId)
  }
}

export async function awardMysteryBox(userId: string) {
  // Grant a random reward
  const random = Math.random()
  if (random < 0.6) {
    // 60% chance: Coins
    useInventoryStore.getState().addCoins(250)
  } else if (random < 0.95) {
    // 35% chance: Big XP
    await _awardXP(userId, 1000)
  } else {
    // 5% chance: Ultra rare shop item or huge coin drop
    useInventoryStore.getState().addCoins(1000)
  }
  invalidateCache(`gamification_${userId}`)
}

export async function sendKudos(toUserId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  
  // Grant XP to receiver
  await _awardXP(toUserId, 25)
  // Grant small XP to sender for being nice
  await _awardXP(user.id, 10)
  
  invalidateCache(`gamification_${user.id}`)
  invalidateCache(`gamification_${toUserId}`)
}
