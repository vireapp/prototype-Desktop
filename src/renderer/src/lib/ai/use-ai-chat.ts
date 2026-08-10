/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from 'react'
import { produce } from 'immer'
import { submitChat, getChatHistory, clearChatHistory } from '@/lib/ai/actions'
import { useAI } from '@/lib/ai-context'
import { toast } from 'sonner'

export type Message = {
  role: 'user' | 'model'
  content: { text: string }[]
}

export function useAIChat() {
  const { setStatus } = useAI()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const scrollEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const loadHistory = async (): Promise<void> => {
      try {
        const history = (await getChatHistory()) as Message[]
        if (history && history.length > 0) {
          setMessages(history)
        }
      } catch {
        console.error('Failed to load history')
      }
    }
    loadHistory()
  }, [])

  useEffect(() => {
    if (scrollEndRef.current) {
      scrollEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleSend = async (): Promise<void> => {
    if (!input.trim() || isLoading) return

    setStatus('thinking')
    const userMessage: Message = { role: 'user', content: [{ text: input }] }
    setMessages(
      produce((draft) => {
        draft.push(userMessage)
      })
    )
    setInput('')
    setIsLoading(true)

    try {
      const history = messages.slice(-10)
      const result = await submitChat(input, history)

      if (result.error) {
        setStatus('error')
        toast.error(result.error)
        return
      }

      setStatus('online')
      if (result.response) {
        const aiMessage: Message = {
          role: 'model',
          content: [{ text: result.response }]
        }
        setMessages(
          produce((draft) => {
            draft.push(aiMessage)
          })
        )
      }
    } catch {
      setStatus('error')
      toast.error('Connection error.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearHistory = async (): Promise<boolean> => {
    const res = await clearChatHistory()
    if (res.success) {
      setMessages([])
      toast.success('Memory Wiped')
      return true
    } else {
      toast.error('Deletion Failed')
      return false
    }
  }

  return {
    messages,
    input,
    setInput,
    isLoading,
    showClearConfirm,
    setShowClearConfirm,
    scrollEndRef,
    inputRef,
    handleSend,
    handleClearHistory
  }
}
