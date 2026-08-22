import Groq from 'groq-sdk'

const getApiKey = (): string => (import.meta.env.VITE_GROQ_API_KEY || '').replace(/"/g, '')

export async function getAiGameMove(
  gameType: 'rock-paper-scissors' | 'tic-tac-toe',
  gameState: Record<string, unknown>
): Promise<{ move: string | number; comment?: string }> {
  try {
    let prompt = ''
    if (gameType === 'rock-paper-scissors') {
      prompt = `You are playing Rock Paper Scissors. 
Current Game State: ${JSON.stringify(gameState)}
Respond ONLY with a valid JSON object in this format: { "move": "rock" | "paper" | "scissors", "comment": "a brief witty taunt or comment" }`
    } else if (gameType === 'tic-tac-toe') {
      prompt = `You are playing Tic Tac Toe as player ${gameState.aiPlayer}.
Current Board (0-8): ${JSON.stringify(gameState.board)}
Respond ONLY with a valid JSON object in this format: { "move": integer (0-8), "comment": "a brief witty taunt or comment" }
Make sure the move is to an empty index (null in the board array).`
    }

    // --- SECURE IPC CALL ---
    const result = await (window as any).api.aiChat(
      [
        {
          role: 'system',
          content: 'You are a witty gaming AI that responds exclusively in JSON format.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      {
        model: 'qwen/qwen3.6-27b',
        response_format: { type: 'json_object' }
      }
    )

    if (result.error) {
      throw new Error(result.error)
    }

    const responseText = result.response || ''
    const moveData = JSON.parse(responseText)
    
    return moveData
  } catch (error) {
    console.error('AI Game Move Error:', error)
    // Fallback logic
    if (gameType === 'rock-paper-scissors') {
      const moves: ('rock' | 'paper' | 'scissors')[] = ['rock', 'paper', 'scissors']
      return {
        move: moves[Math.floor(Math.random() * moves.length)],
        comment: 'My circuits are fuzzy, but I will still beat you!'
      }
    } else {
      const board = gameState.board as (string | null)[]
      const emptyIndices = board
        .map((val: string | null, idx: number) => (val === null ? idx : null))
        .filter((val: number | null): val is number => val !== null)
      return {
        move: emptyIndices[Math.floor(Math.random() * emptyIndices.length)],
        comment: 'Is this the best you can do?'
      }
    }
  }
}
