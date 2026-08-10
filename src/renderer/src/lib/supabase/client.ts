import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseInstance: SupabaseClient | null = null

export function createClient() {
  if (supabaseInstance) return supabaseInstance

  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (import.meta.env.DEV) {
    console.log('Supabase URL:', url)
    console.log('Supabase Key exists:', !!key)
  }

  if (!url || !key) {
    throw new Error(
      'Supabase environment variables are missing! Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in the .env file.'
    )
  }

  supabaseInstance = createSupabaseClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  })
  return supabaseInstance
}
