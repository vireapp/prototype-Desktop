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
    aiSettings?: any
    userRole?: string
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

COMMAND FORMAT: <<<COMMAND:{"type":"command_type",...}>>>

### USER CONTEXT
Role: ${context.userRole || 'member'}

### AI PERMISSIONS
${Object.entries(context.aiSettings || {}).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

**IMPORTANT PERMISSION RULES:**
1. If an action is requested and the corresponding permission above is "false", YOU MUST REFUSE nicely and say you don't have permission.
2. Moderation actions (kick, lock, clear chat, update info) CAN ONLY BE EXECUTED if the User Role is "admin" or "owner". If a regular "member" asks, refuse it.

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
      model: 'qwen/qwen3.6-27b',
      temperature: 0.7,
      max_tokens: 2000
    })

    if (result.error) {
      throw new Error(result.error)
    }

    const text = result.response || ''

    // Extract JSON command if present
    let command: string | undefined
    const commandMatch = text.match(/<<<COMMAND:(.+?)>>>/)
    if (commandMatch) {
      command = commandMatch[1].trim()
    }

    // Clean text for UI
    const cleanedText = text.replace(/<<<COMMAND:.+?>>>/, '').trim()

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
