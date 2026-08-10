import Groq from 'groq-sdk'

interface RoomConfig {
  name: string
  description: string
  theme: {
    primary: string
    background: string
    gradient: string
  }
  banner_keyword: string
  error?: string
}

const getApiKey = (): string => (import.meta.env.VITE_GROQ_API_KEY || '').replace(/"/g, '')

export async function generateRoomConfig(prompt: string): Promise<RoomConfig> {
  const apiKey = getApiKey()
  
  if (!prompt) return { error: 'Prompt is required' }

  // Fallback if API key is missing
  if (!apiKey) {
    console.warn('Missing VITE_GROQ_API_KEY. Using mock generator.')
    return {
      name: 'AI Generated Room',
      description: `A room generated based on: ${prompt}`,
      theme: {
        primary: '#8b5cf6',
        background: 'bg-zinc-950',
        gradient: 'from-purple-500/10 to-blue-500/10'
      },
      banner_keyword: 'abstract'
    }
  }

  try {
    const groq = new Groq({ 
      apiKey,
      dangerouslyAllowBrowser: true
    })

    const systemPrompt = `
      You are an AI virtual space designer. Generate a configuration for a virtual social room.
      Output MUST be a valid JSON object with EXACTLY this structure:
      {
        "name": "Creative Room Name",
        "description": "Catchy description",
        "theme": {
          "primary": "#hexcolor",
          "background": "Tailwind bg- class",
          "gradient": "Tailwind from-... via-... to-... classes"
        },
        "banner_keyword": "keyword for image search"
      }
    `

    const response = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `User request: ${prompt}`
        }
      ],
      model: 'llama-3.1-8b-instant',
      response_format: { type: 'json_object' } // Groq respects this well
    })

    const responseText = response.choices[0]?.message?.content || ''
    
    // Safety check: Clean response (remove markdown or preamble)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response')
    }
    
    const config = JSON.parse(jsonMatch[0])

    return config
  } catch (error: unknown) {
    console.error('AI Room Gen Error Details:', error)
    // Return a slightly better error object for UI
    return {
      name: `AI Room ${Math.floor(Math.random() * 999)}`,
      description: `I encountered an issue generating your room, but I've setup this placeholder for you instead based on ${prompt}.`,
      theme: {
        primary: '#8b5cf6',
        background: 'bg-zinc-950',
        gradient: 'from-purple-500/10 to-blue-500/10'
      },
      banner_keyword: 'abstract'
    }
  }
}
