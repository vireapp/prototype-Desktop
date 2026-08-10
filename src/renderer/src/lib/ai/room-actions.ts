/* eslint-disable @typescript-eslint/no-explicit-any */
import Groq from 'groq-sdk'

const getApiKey = (): string => (import.meta.env.VITE_GROQ_API_KEY || '').replace(/"/g, '')

export async function chatWithRoomAI(
  message: string,
  context: {
    roomName: string
    roomDescription: string
    currentActivity?: string
    history: any[]
  }
): Promise<{ response: string; command?: string }> {
  try {
    const systemPrompt = `You are VIRE, a social AI companion for a virtual room.
Room Name: "${context.roomName}"
Room Description: "${context.roomDescription}"
${context.currentActivity ? `Current Activity: "${context.currentActivity}"` : ''}
${(context as any).mediaContext ? `User is currently watching/listening to: "${(context as any).mediaContext}"` : ''}

GOAL: Be helpful, social, and concise. Act like a friend hanging out in the room.

CRITICAL: When the user wants to watch something, play a game, or change the activity, you MUST append a command tag at the very end of your response.

COMMAND FORMAT: [COMMAND:activity_name|parameter]
Valid Activities: 
- "youtube" (e.g. [COMMAND:youtube|lofi beats])
- "rock-paper-scissors" (e.g [COMMAND:rock-paper-scissors])
- "tic-tac-toe" (e.g [COMMAND:tic-tac-toe])
- "default" (e.g [COMMAND:default])

Keep it conversational. If the user mentions a specific song or artist, include it in the youtube command.
`

    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      ...(context.history || []).map((msg) => ({
        role: msg.role === 'model' || msg.role === 'assistant' ? 'assistant' : 'user',
        content: typeof msg.content === 'string' ? msg.content : msg.content[0]?.text || ''
      })),
      { role: 'user', content: message }
    ]

    // --- SECURE IPC CALL ---
    const result = await (window as any).api.aiChat(messages, {
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 500
    })

    if (result.error) {
      throw new Error(result.error)
    }

    const text = result.response || ''

    // Extract command if present
    let command: string | undefined
    const commandMatch = text.match(/\[COMMAND:(.+?)\]/)
    if (commandMatch) {
      command = commandMatch[1].trim()
    }

    // Clean text for UI
    const cleanedText = text.replace(/\[COMMAND:.+?\]/, '').trim()

    return {
      response: cleanedText,
      command
    }
  } catch (error: any) {
    console.error('Room AI Error Details:', error)
    const detailedMessage = error?.message || error?.toString() || 'Unknown'
    return {
      response: `VIRE Error: ${detailedMessage}`
    }
  }
}
