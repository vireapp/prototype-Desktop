import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { NavigateFunction } from 'react-router-dom'

export async function processAiCommands(
  response: string,
  navigate: NavigateFunction
): Promise<void> {
  const commandRegex = /<<<COMMAND:(.*?)>>>/gs
  const matches = [...response.matchAll(commandRegex)]

  for (const match of matches) {
    try {
      const commandStr = match[1]
      const command = JSON.parse(commandStr)

      await executeCommand(command, navigate)
    } catch (err) {
      console.error('Failed to parse or execute AI command', err)
    }
  }
}

async function executeCommand(command: any, navigate: NavigateFunction) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  switch (command.type) {
    case 'create_room': {
      const roomName = command.roomName || 'New Room'
      const description = command.description || ''
      const isPublic = command.isPublic !== false // default true

      const code = isPublic ? null : Math.random().toString(36).substring(2, 8).toUpperCase()
      const bannerUrl = `https://loremflickr.com/1280/720/${encodeURIComponent(roomName)}`

      const { data, error } = await supabase
        .from('rooms')
        .insert({
          created_by: user.id,
          name: roomName,
          description: description,
          is_public: isPublic,
          code
        })
        .select()
        .single()

      if (error) {
        toast.error(`Failed to create room: ${error.message}`)
        console.error('Room creation error:', error)
      } else if (data) {
        toast.success(`Room "${data.name}" created!`)
        // The URL scheme requires the room name to be encoded
        navigate(`/room/${encodeURIComponent(data.name)}`)
      }
      break
    }
    
    case 'navigate_app': {
      if (command.path) {
        navigate(command.path)
      }
      break
    }

    default:
      console.log('Unhandled AI Command:', command)
      break
  }
}
