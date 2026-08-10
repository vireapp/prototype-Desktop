import { createClient } from '@/lib/supabase/client'

export async function completeProfile(
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const supabase = createClient()

  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const username = formData.get('username') as string
  const fullName = formData.get('fullName') as string
  const dob = formData.get('dob') as string
  const avatarUrl = formData.get('avatarUrl') as string

  // Simple validation
  if (!username || username.length < 3) {
    return { error: 'Username must be at least 3 characters' }
  }

  const { error } = await supabase.from('profiles').upsert({
    id: user.id,
    username,
    full_name: fullName,
    date_of_birth: dob,
    avatar_url: avatarUrl,
    updated_at: new Date().toISOString()
  })

  if (error) {
    console.error(error)
    return { error: error.message }
  }

  return { success: true }
}
