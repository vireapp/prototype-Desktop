/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

export async function updateUserSettings(
  prevState: any,
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  const supabase = createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const rawData: any = {}

  // String fields
  ;[
    'font_family',
    'theme',
    'border_radius',
    'language',
    'timezone',
    'privacy_profile_visibility',
    'ambient_background',
    'primary_accent',
    'layout_density',
    'glass_blur_intensity',
    'smart_away_trigger',
    'stream_priority',
    'default_translation',
    'colorblind_mode',
    'clock_format'
  ].forEach((field) => {
    const val = formData.get(field)
    if (val !== null) rawData[field] = val
  })

  // Number fields
  if (formData.get('font_scale')) {
    rawData['font_scale'] = parseFloat(formData.get('font_scale') as string)
  }

  // Boolean fields
  const boolFields = [
    'ui_sounds',
    'high_contrast',
    'activity_visibility',
    'reduced_motion',
    'room_default_mic',
    'room_default_camera',
    'room_autoplay',
    'room_low_bandwidth',
    'spatial_audio',
    'ai_voice_isolation',
    'auto_framing',
    'hardware_acceleration',
    'ghost_mode',
    'auto_captions',
    'ai_session_summaries',
    'screen_reader_opt',
    'data_sharing',
    'ai_features_enabled',
    'push_notifications',
    'email_notifications',
    'marketing_notifications',
    'tray_notifications'
  ]

  boolFields.forEach((field) => {
    if (formData.has(field)) {
      rawData[field] = formData.get(field) === 'true'
    }
  })

  const { error } = await supabase.from('user_settings').upsert({
    user_id: user.id,
    ...rawData,
    updated_at: new Date().toISOString()
  })

  if (error) {
    console.error('Settings update error:', error)
    return { error: 'Failed to update settings' }
  }

  return { success: 'Settings saved successfully' }
}

export const updateAppearance = updateUserSettings

const ProfileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  date_of_birth: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  banner_url: z.string().nullable().optional(),
  bio: z.string().max(160, 'Bio must be less than 160 characters').nullable().optional(),
  status_text: z.string().max(50).nullable().optional(),
  status_emoji: z.string().max(10).nullable().optional()
})

export async function updateProfile(
  prevState: any,
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  const supabase = createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const rawData = {
    full_name: formData.get('full_name'),
    date_of_birth: formData.get('date_of_birth'),
    avatar_url: formData.get('avatar_url'),
    banner_url: formData.get('banner_url'),
    bio: formData.get('bio'),
    status_text: formData.get('status_text'),
    status_emoji: formData.get('status_emoji')
  }

  const result = ProfileSchema.safeParse(rawData)

  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  // Handle Social Links specially
  let socialLinks: any = null
  const github = formData.get('social_github')
  const twitter = formData.get('social_twitter')
  const website = formData.get('social_website')

  if (github || twitter || website) {
    socialLinks = {
      github: github?.toString() || '',
      twitter: twitter?.toString() || '',
      website: website?.toString() || ''
    }
  }

  const updates: any = { ...result.data }
  if (socialLinks) {
    updates.social_links = socialLinks
  }

  const { error } = await supabase.from('profiles').update(updates).eq('id', user.id)

  if (error) {
    console.error('Profile update error:', error)
    return { error: 'Failed to update profile' }
  }

  return { success: 'Profile updated successfully' }
}

export async function getBlockedUsers(): Promise<any[]> {
  const supabase = createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) return []

  const { data, error } = await supabase
    .from('blocked_users')
    .select(
      `
      id,
      blocked_user_id,
      profiles:blocked_user_id (
        full_name,
        username,
        avatar_url
      )
    `
    )
    .eq('user_id', user.id)

  if (error) {
    console.error('Error fetching blocked users:', error)
    return []
  }

  return data.map((item: any) => ({
    id: item.blocked_user_id,
    name: item.profiles?.full_name || item.profiles?.username || 'Unknown User',
    username: item.profiles?.username,
    avatar_url: item.profiles?.avatar_url,
    blocked_record_id: item.id
  }))
}

export async function unblockUser(
  blockedRecordId: string
): Promise<{ error?: string; success?: string }> {
  const supabase = createClient()
  const { error } = await supabase.from('blocked_users').delete().eq('id', blockedRecordId)

  if (error) {
    return { error: 'Failed to unblock user' }
  }

  return { success: 'User unblocked' }
}

// ── Session Management ──────────────────────────────────────────────────────

/** Register a new session row when user logs in */
export async function registerSession(): Promise<void> {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return

  const ua = navigator.userAgent
  const isElectron = /electron/i.test(ua)

  // Try to get the real PC hostname from Electron (only available in desktop app)
  let hostname = ''
  if (isElectron && window.api?.getHostname) {
    try { hostname = await window.api.getHostname() } catch { /* ignore */ }
  }

  // OS / platform label
  let osLabel = 'Desktop'
  if (/iphone|ipad|ipod/i.test(ua))      osLabel = 'iOS Device'
  else if (/android/i.test(ua))          osLabel = 'Android'
  else if (/windows/i.test(ua))          osLabel = hostname || 'Windows PC'
  else if (/mac/i.test(ua))              osLabel = hostname || 'Mac'
  else if (/linux/i.test(ua))            osLabel = hostname || 'Linux PC'
  else if (hostname)                     osLabel = hostname

  // Browser / client label — detect Electron BEFORE Chrome (Electron UA contains both)
  const browserLabel = isElectron
    ? 'VIRE Desktop'
    : /edg/i.test(ua)
    ? 'Edge'
    : /chrome/i.test(ua)
    ? 'Chrome'
    : /firefox/i.test(ua)
    ? 'Firefox'
    : /safari/i.test(ua)
    ? 'Safari'
    : 'Browser'

  const deviceType = /mobile|android|iphone|ipad/i.test(ua) ? 'mobile' : 'desktop'

  // Stable per-device UUID stored in localStorage — survives token refreshes.
  const storageKey = `session_device_id_${user.id}`
  let deviceId = localStorage.getItem(storageKey)
  if (!deviceId) {
    deviceId = crypto.randomUUID()
    localStorage.setItem(storageKey, deviceId)
  }

  // ── Blocked device check ─────────────────────────────────────────
  const { data: existingRow } = await supabase
    .from('user_sessions')
    .select('is_blocked')
    .eq('session_token', deviceId)
    .single()

  if (existingRow?.is_blocked) {
    console.warn('This device is blocked. Signing out.')
    await supabase.auth.signOut()
    return
  }

  // Encode as "browser|os" so listSessions can split them for icons
  const deviceName = `${browserLabel}|${osLabel}`

  const { error: upsertError } = await supabase.from('user_sessions').upsert(
    {
      user_id: user.id,
      session_token: deviceId,
      device_name: deviceName,
      device_type: deviceType,
      last_active_at: new Date().toISOString(),
      is_current: true,
      is_blocked: false
    },
    { onConflict: 'session_token' }
  )

  if (upsertError) {
    console.warn('Session upsert failed, using delete+insert:', upsertError.message)
    await supabase.from('user_sessions').delete().eq('session_token', deviceId)
    await supabase.from('user_sessions').insert({
      user_id: user.id,
      session_token: deviceId,
      device_name: deviceName,
      device_type: deviceType,
      last_active_at: new Date().toISOString(),
      is_current: true,
      is_blocked: false
    })
  }

  // Mark all other sessions for this user as not current
  await supabase
    .from('user_sessions')
    .update({ is_current: false })
    .eq('user_id', user.id)
    .neq('session_token', deviceId)
}

/** Fetch real sessions from the user_sessions table */
export async function listSessions(): Promise<any[]> {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return []

  const { data, error: fetchError } = await supabase
    .from('user_sessions')
    .select('id, device_name, device_type, ip_address, last_active_at, is_current, is_blocked')
    .eq('user_id', user.id)
    .order('last_active_at', { ascending: false })

  if (fetchError) {
    console.error('listSessions error:', fetchError)
    return []
  }

  return (data || []).map((s: any) => {
    // device_name is stored as "Browser|OS" (new format) or legacy "Browser on OS"
    const raw: string = s.device_name || 'Browser|Unknown Device'
    let browserName: string
    let deviceLabel: string
    if (raw.includes('|')) {
      [browserName, deviceLabel] = raw.split('|')
    } else {
      // legacy format: "Chrome on Windows PC"
      const onIdx = raw.indexOf(' on ')
      if (onIdx !== -1) {
        browserName = raw.slice(0, onIdx)
        deviceLabel = raw.slice(onIdx + 4)
      } else {
        browserName = 'Browser'
        deviceLabel = raw
      }
    }
    return {
      id: s.id,
      browser: browserName,
      device: deviceLabel,
      displayName: `${browserName} on ${deviceLabel}`,
      deviceType: s.device_type || 'desktop',
      ip: s.ip_address || null,
      lastActive: new Date(s.last_active_at).toLocaleString(),
      current: s.is_current,
      blocked: s.is_blocked ?? false
    }
  })
}

/** Sign out a specific session by deleting its row */
export async function logOutSession(
  sessionId: string
): Promise<{ error?: string; success?: string }> {
  const supabase = createClient()

  // Check if this is the current session
  const { data: row } = await supabase
    .from('user_sessions')
    .select('is_current')
    .eq('id', sessionId)
    .single()

  // Delete the session record first
  const { error } = await supabase
    .from('user_sessions')
    .delete()
    .eq('id', sessionId)

  if (error) return { error: 'Failed to remove session' }

  // If it was the current session, also sign out of Supabase auth
  if (row?.is_current) {
    await supabase.auth.signOut()
  }

  return { success: 'Session terminated' }
}

/** Block a device: marks is_blocked = true and signs that session out */
export async function blockDevice(
  sessionId: string
): Promise<{ error?: string; success?: string }> {
  const supabase = createClient()

  const { data: row } = await supabase
    .from('user_sessions')
    .select('is_current, session_token')
    .eq('id', sessionId)
    .single()

  if (!row) return { error: 'Session not found' }
  if (row.is_current) return { error: "You can't block your own current device" }

  const { error } = await supabase
    .from('user_sessions')
    .update({ is_blocked: true, is_current: false })
    .eq('id', sessionId)

  if (error) return { error: 'Failed to block device' }

  return { success: 'Device blocked' }
}

/** Unblock a previously blocked device */
export async function unblockDevice(
  sessionId: string
): Promise<{ error?: string; success?: string }> {
  const supabase = createClient()

  const { error } = await supabase
    .from('user_sessions')
    .update({ is_blocked: false })
    .eq('id', sessionId)

  if (error) return { error: 'Failed to unblock device' }

  return { success: 'Device unblocked' }
}

export async function enroll2FA(): Promise<{ error?: string; success?: boolean; data?: any }> {
  const supabase = createClient()

  const { data: factors, error: listError } = await supabase.auth.mfa.listFactors()

  if (!listError && factors && factors.all) {
    const existingFactors = factors.all.filter(
      (f) => f.friendly_name === 'Zenith App' || f.friendly_name === 'VIRE inc.'
    )
    for (const factor of existingFactors) {
      await supabase.auth.mfa.unenroll({ factorId: factor.id })
    }
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    issuer: 'VIRE inc.',
    friendlyName: 'VIRE inc.'
  })

  if (error) {
    console.error('Enroll 2FA Error:', error)
    return { error: error.message }
  }

  return { success: true, data }
}

export async function verify2FA(
  factorId: string,
  code: string
): Promise<{ error?: string; success?: string }> {
  const supabase = createClient()
  const { error } = await supabase.auth.mfa.challengeAndVerify({
    factorId,
    code
  })

  if (error) {
    return { error: error.message }
  }

  return { success: '2FA Verified and Enabled' }
}

export async function unenroll2FA(factorId: string): Promise<{ error?: string; success?: string }> {
  const supabase = createClient()
  const { error } = await supabase.auth.mfa.unenroll({
    factorId
  })

  if (error) {
    return { error: error.message }
  }

  return { success: '2FA Disabled' }
}
