/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/client'
import { VIRE_SYSTEM_PROMPT } from './system-prompt'

export async function submitChat(
  message: string,
  history: any[],
  activeUserIds: string[] = []
): Promise<{ error?: string; response?: string }> {
  try {
    const supabase = createClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Unauthorized' }
    }

    // Get user profile for personalization
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()
    const userName = profile?.full_name || 'Friend'

    // Persist User Message
    await supabase.from('ai_chat_history').insert({
      user_id: user.id,
      role: 'user',
      content: message
    })

    // Lazy cleanup of messages older than 7 days
    const retentionLimit = new Date()
    retentionLimit.setDate(retentionLimit.getDate() - 7)
    await supabase
      .from('ai_chat_history')
      .delete()
      .eq('user_id', user.id)
      .lt('created_at', retentionLimit.toISOString())

    // Fetch actual platform metrics from the database
    const { count: activeRooms } = await supabase
      .from('rooms')
      .select('*', { count: 'exact', head: true })

    // Use the real-time presence data passed from the client
    const globalActiveCount = activeUserIds.length > 0 ? activeUserIds.length : 1
    
    // Fetch the actual names of the people who are online, BUT restricted to FRIENDS
    let onlineNamesList = 'None'
    if (activeUserIds.length > 0) {
      // Get the user's friends first
      const { data: friendsData } = await supabase
        .from('friends')
        .select('friend_id, profiles!friend_id(full_name)')
        .eq('user_id', user.id)

      // Filter to only include friends whose IDs are in the activeUserIds set
      const onlineFriends = friendsData
        ?.filter((f: any) => activeUserIds.includes(f.friend_id))
        ?.map((f: any) => f.profiles?.full_name)
        ?.filter(Boolean) || []

      if (onlineFriends.length > 0) {
        onlineNamesList = onlineFriends.join(', ')
      }
    }

    const statusBlock = `
    [SYSTEM STATUS REPORT]
    * **Platform Status**: Database and Systems Operational
    * **Global Active Rooms**: ${activeRooms || 0}
    * **Global Online Users**: ${globalActiveCount}
    * **Your Online Friends**: ${onlineNamesList}
    * **Timestamp**: ${new Date().toLocaleString()}
    `

    const messages: any[] = [
      { 
        role: 'system', 
        content: VIRE_SYSTEM_PROMPT.replace('${userName}', userName) + statusBlock 
      },
      ...history.map((msg) => ({
        role: msg.role === 'model' || msg.role === 'assistant' ? 'assistant' : 'user',
        content: typeof msg.content === 'string' ? msg.content : (msg.content[0]?.text || '')
      })),
      { role: 'user', content: message }
    ]

    // --- SECURE IPC CALL ---
    // Instead of initializing Groq in the renderer with a hardcoded key,
    // we now delegate the call to the main process.
    const result = await (window as any).api.aiChat(messages, {
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 500
    })

    if (result.error) {
      return { error: result.error }
    }

    const response = result.response || ''

    // Persist AI Response
    if (response) {
      await supabase.from('ai_chat_history').insert({
        user_id: user.id,
        role: 'model',
        content: response
      })
    }

    return { response }
  } catch (error: any) {
    console.error('SubmitChat Action Error:', error)
    // Return the actual error message from Groq for easier debugging
    const errorMessage = error?.message || error?.toString() || 'Unknown error'
    return {
      error: `VIRE Error: ${errorMessage}`
    }
  }
}

export async function getChatHistory(): Promise<any[]> {
  const supabase = createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) return []

  const { data } = await supabase
    .from('ai_chat_history')
    .select('role, content')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(50)

  return (
    data?.map((msg) => ({
      role: msg.role,
      content: [{ text: msg.content }]
    })) || []
  )
}

export async function clearChatHistory(): Promise<{ error?: string; success?: boolean }> {
  const supabase = createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  try {
    const { error } = await supabase.from('ai_chat_history').delete().eq('user_id', user.id)

    if (error) {
      console.error('Supabase Delete Error:', error)
      return { error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Clear History Error:', error)
    return { error: 'Failed to clear history' }
  }
}
