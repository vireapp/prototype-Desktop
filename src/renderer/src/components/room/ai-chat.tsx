'use client'

import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Loader2, Sparkles, Bot, Mic, MicOff } from 'lucide-react'
import { getChatHistory } from '@/lib/ai/actions'
import { chatWithRoomAI } from '@/lib/ai/room-actions'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'

interface RoomAIChatProps {
  roomId: string
  roomName: string
  roomDescription?: string
  currentActivity: string
  onCommand?: (command: {
    type: 'play_video' | 'launch_game' | 'launch_service'
    query?: string
    game?: string
    service?: string
  }) => void
  aiSettings?: any
  userRole?: string
  isActive?: boolean
}

interface Message {
  role: 'user' | 'model'
  content: string
  options?: {
    label: string
    command: {
      type: 'play_video' | 'launch_game' | 'launch_service'
      query?: string
      game?: string
      service?: string
    }
  }[]
}

export function RoomAIChat({
  roomId,
  roomName,
  roomDescription,
  currentActivity,
  onCommand,
  aiSettings,
  userRole,
  isActive = true
}: RoomAIChatProps): React.JSX.Element {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [isListening, setIsListening] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  
  // Speech Recognition setup
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onresult = (event: any) => {
        let currentTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript
        }
        setInput(currentTranscript)
      }

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error)
        setIsListening(false)
        if (event.error === 'not-allowed') {
          toast.error('Microphone access denied')
        }
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
    }
  }, [SpeechRecognition])

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    } else {
      if (!recognitionRef.current) {
        toast.error('Speech recognition not supported in this browser.')
        return
      }
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch (e) {
        console.error(e)
      }
    }
  }

  useEffect(() => {
    const loadHistory = async (): Promise<void> => {
      try {
        const history = await getChatHistory()
        // Transform history structure if needed. getChatHistory returns { role, content: [{ text }] }
        // Wait, actions.ts line 67: role: msg.role, content: [{ text: msg.content }]
        // So we need to map it back to simple string for this UI
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formatted = history.map((msg: any) => ({
          role: msg.role,
          content: msg.content?.[0]?.text || '',
          options: [] // Initialize empty options for history
        }))
        setMessages(formatted)
      } catch (error) {
        console.error('Failed to load history:', error)
      } finally {
        setInitialLoading(false)
      }
    }
    loadHistory()
  }, [])

  useEffect(() => {
    if (isActive !== false && scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isActive])

  // Listen for local AI messages from QuickChatBar and room-client-v2.tsx
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleAiMsg = (e: any) => {
      setMessages((prev) => [...prev, e.detail])
      if (e.detail.role === 'model') setLoading(false)
      else if (e.detail.role === 'user') setLoading(true)
    }
    window.addEventListener('ai-chat-message', handleAiMsg)
    return () => window.removeEventListener('ai-chat-message', handleAiMsg)
  }, [])

  const handleSend = async (): Promise<void> => {
    if (!input.trim() || loading) return

    const userMsg = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)

    try {
      // Prepare history for AI (excluding the new message)
      const history = messages.map((m) => ({
        role: m.role,
        content: [{ text: m.content }]
      }))

      const result = await chatWithRoomAI(userMsg, {
        roomName,
        roomDescription: roomDescription || '',
        currentActivity: currentActivity,
        history: history,
        aiSettings,
        userRole
      })

      if (result.response) {
        let responseText = result.response
        const options: Message['options'] = []

        // Parse Commands (Old System)
        const commandRegex = /<<<COMMAND:(.*?)>>>/
        const commandMatch = responseText.match(commandRegex)

        if (commandMatch && commandMatch[1]) {
          try {
            const command = JSON.parse(commandMatch[1])
            if (onCommand) {
              onCommand(command)
              toast.success('VIRE executed a command.')
            }
            responseText = responseText.replace(commandRegex, '').trim()
          } catch (e) {
            console.error('Failed to parse AI command', e)
          }
        }

        // Fallback: Parse Simple Commands [COMMAND:activity_name|param]
        const simpleCommandRegex = /\[COMMAND:(.+?)\]/
        const simpleMatch = responseText.match(simpleCommandRegex)
        if (simpleMatch && simpleMatch[1]) {
          const parts = simpleMatch[1].split('|')
          const activity = parts[0].trim()
          const param = parts[1]?.trim()
          let command: any = null
          
          if (activity === 'youtube') {
            command = { type: 'play_video', query: param || 'music' }
          } else if (activity === 'rock-paper-scissors' || activity === 'tic-tac-toe') {
            command = { type: 'launch_game', game: activity }
          } else if (activity === 'default') {
            command = { type: 'launch_service', service: 'default' }
          }

          if (command && onCommand) {
            onCommand(command)
            toast.success(`VIRE is launching ${activity}...`)
          }
          responseText = responseText.replace(simpleCommandRegex, '').trim()
        }

        // Parse Options (Global regex to find all matches)
        const optionRegex = /<<<OPTION:(.*?)>>>/g
        let match
        while ((match = optionRegex.exec(responseText)) !== null) {
          try {
            const optionData = JSON.parse(match[1])
            if (optionData.label && optionData.command) {
              options.push(optionData)
            }
          } catch (e) {
            console.error('Failed to parse option', e)
          }
        }
        // Remove options tags from text
        responseText = responseText.replace(optionRegex, '').trim()

        setMessages((prev) => [...prev, { role: 'model', content: responseText, options }])
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error('Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-black/40 backdrop-blur-md relative overflow-hidden border-l border-white/10 shadow-2xl">
      {/* Ambient Background Effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-transparent pointer-events-none" />

      <div className="flex-1 overflow-hidden p-4">
        <ScrollArea className="h-full pr-4">
          <div className="flex flex-col gap-4">
            {initialLoading ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading memories...
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-8 text-muted-foreground opacity-50 space-y-2">
                <Bot className="w-10 h-10 mb-2" />
                <p className="text-sm">I am VIRE.</p>
                <p className="text-xs">Ask me anything about the room or just chat!</p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex w-full',
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm flex flex-col gap-2',
                      msg.role === 'user'
                        ? 'bg-white text-black'
                        : 'bg-white/10 backdrop-blur-md border border-white/20 text-white/90'
                    )}
                  >
                    <div className="prose prose-invert prose-sm max-w-none break-words leading-relaxed">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>

                    {/* Render Options Buttons */}
                    {msg.options && msg.options.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {msg.options.map((opt, idx) => (
                          <Button
                            key={idx}
                            variant="secondary"
                            size="sm"
                            className="bg-white/10 hover:bg-white/20 text-white/80 border border-white/20 text-xs h-7 backdrop-blur-md"
                            onClick={() => onCommand?.(opt.command)}
                          >
                            <Sparkles className="w-3 h-3 mr-1" />
                            {opt.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/10 border border-white/20 rounded-2xl px-4 py-2 flex items-center gap-1 backdrop-blur-md">
                  <div
                    className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  />
                  <div
                    className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  />
                  <div
                    className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>
      </div>


    </div>
  )
}
