import Groq from 'groq-sdk'

const getApiKey = (): string => (import.meta.env.VITE_GROQ_API_KEY || '').replace(/"/g, '')

/**
 * Uses AI to generate a poetic, unique room name based on shared interests & hobbies
 * between two matched users.
 */
export async function generateDuoRoomName(data: {
  interests: string[]
  hobbies: string[]
  roomType: 'romantic' | 'friends' | 'family'
  matchScore: number
}): Promise<string> {
  const apiKey = getApiKey()

  // Fallback names if no API key
  if (!apiKey) {
    const fallbacks: Record<string, string[]> = {
      romantic: ['Moonlit Rendezvous', 'Starfall Garden', 'Velvet Dusk', 'Whisper & Bloom'],
      friends: ['Neon Hangout', 'The Good Vibes Spot', 'Epic Duo HQ', 'Midnight Arcade'],
      family: ['The Warm Corner', 'Home Base', 'Golden Memories', 'Our Little World']
    }
    const list = fallbacks[data.roomType]
    return list[Math.floor(Math.random() * list.length)]
  }

  try {
    const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true })

    const prompt = `
Two people just matched on a social platform.
- Room type: ${data.roomType}
- Shared interests: ${data.interests.join(', ') || 'various things'}
- Shared hobbies: ${data.hobbies.join(', ') || 'various hobbies'}
- Match score: ${data.matchScore}%

Generate ONE creative, short, poetic room name (2-4 words max) that captures the vibe of their connection.
For romantic rooms: warm, magical, intimate.
For friends rooms: fun, energetic, cool.
For family rooms: warm, safe, homey.

Return ONLY the room name, nothing else. No quotes, no explanation.
`

    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'qwen/qwen3.6-27b',
      max_tokens: 20,
      temperature: 0.9
    })

    let name = response.choices[0]?.message?.content || ''
    name = name.replace(/<think>[\s\S]*?(?:<\/think>|$)/g, '').trim()
    // Clean up any quotes or extra chars
    return name.replace(/["']/g, '').trim() || 'Duo Sanctuary'
  } catch {
    return 'Duo Sanctuary'
  }
}
