import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL || ''
const key = process.env.VITE_SUPABASE_ANON_KEY || ''

const supabase = createClient(url, key)

async function check() {
  const { data, error } = await supabase.from('notifications').select('*').limit(1)
  if (error) {
    console.log('Error querying notifications:', error)
  } else {
    console.log('Notifications table exists!')
    console.log(data)
  }
}

check()
