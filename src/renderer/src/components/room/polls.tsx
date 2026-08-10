'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { BarChart2, Plus, X, Check } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

interface PollOption {
  id: string
  text: string
  votes: string[] // userIds
}

interface Poll {
  id: string
  question: string
  options: PollOption[]
  createdBy: string
  isActive: boolean
}

interface RoomPollsProps {
  roomId: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any
  isOpen: boolean
  onClose: () => void
}

export function RoomPolls({ roomId, user, isOpen, onClose }: RoomPollsProps) {
  // const [isOpen, setIsOpen] = useState(false); // Controlled by parent now
  const [activePoll, setActivePoll] = useState<Poll | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [creationMode, setCreationMode] = useState(false)

  // Form State
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState<string[]>(['', ''])

  const supabase = createClient()

  useEffect(() => {
    const channel = supabase.channel(`room_${roomId}_polls`)

    channel
      .on('broadcast', { event: 'new_poll' }, ({ payload }) => {
        setActivePoll(payload.poll)
        // setIsOpen(true); // Don't auto-open for now, let notification handle it or parent
        toast.info('New poll started!')
      })
      .on('broadcast', { event: 'vote' }, ({ payload }) => {
        setActivePoll((current) => {
          if (!current || current.id !== payload.pollId) return current

          const newOptions = current.options.map((opt) => {
            // Remove user from all options first (single vote)
            const cleanVotes = opt.votes.filter((uid) => uid !== payload.userId)
            // Add to target option
            if (opt.id === payload.optionId) {
              return { ...opt, votes: [...cleanVotes, payload.userId] }
            }
            return { ...opt, votes: cleanVotes }
          })

          return { ...current, options: newOptions }
        })
      })
      .on('broadcast', { event: 'close_poll' }, () => {
        setActivePoll(null)
        // setIsOpen(false); // Parent handles closing if needed
        toast.info('Poll ended')
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, supabase])

  const handleCreatePoll = async () => {
    if (!question.trim() || options.some((o) => !o.trim())) {
      toast.error('Please fill in all fields')
      return
    }

    const newPoll: Poll = {
      id: Math.random().toString(36).substring(7),
      question,
      options: options.map((text) => ({
        id: Math.random().toString(36).substring(7),
        text,
        votes: []
      })),
      createdBy: user.id,
      isActive: true
    }

    setActivePoll(newPoll)
    setCreationMode(false)
    // setIsOpen(true); // Already open if creating

    await supabase.channel(`room_${roomId}_polls`).send({
      type: 'broadcast',
      event: 'new_poll',
      payload: { poll: newPoll }
    })
  }

  const handleVote = async (optionId: string) => {
    if (!activePoll) return

    // Optimistic update
    setActivePoll((current) => {
      if (!current) return null
      const newOptions = current.options.map((opt) => {
        const cleanVotes = opt.votes.filter((uid) => uid !== user.id)
        if (opt.id === optionId) {
          return { ...opt, votes: [...cleanVotes, user.id] }
        }
        return { ...opt, votes: cleanVotes }
      })
      return { ...current, options: newOptions }
    })

    await supabase.channel(`room_${roomId}_polls`).send({
      type: 'broadcast',
      event: 'vote',
      payload: {
        pollId: activePoll.id,
        optionId,
        userId: user.id
      }
    })
  }

  const handleClosePoll = async () => {
    setActivePoll(null)
    onClose()
    await supabase.channel(`room_${roomId}_polls`).send({
      type: 'broadcast',
      event: 'close_poll',
      payload: {}
    })
  }

  const totalVotes = activePoll?.options.reduce((acc, opt) => acc + opt.votes.length, 0) || 0

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 0 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 0 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-zinc-950/90 border border-white/10 rounded-2xl shadow-2xl p-6 z-[101] overflow-hidden"
          >
            {!activePoll ? (
              // Creation View
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-lg">Create a Poll</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-white/10"
                    onClick={onClose}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <Input
                  placeholder="Ask a question..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />

                <div className="flex flex-col gap-2">
                  {options.map((opt, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Input
                        placeholder={`Option ${idx + 1}`}
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...options]
                          newOpts[idx] = e.target.value
                          setOptions(newOpts)
                        }}
                        className="bg-white/5 border-white/10 text-white h-9"
                      />
                      {idx > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setOptions(options.filter((_, i) => i !== idx))}
                          className="h-9 w-9 text-red-400 hover:bg-red-500/10"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {options.length < 5 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setOptions([...options, ''])}
                      className="justify-start text-xs text-muted-foreground hover:text-white"
                    >
                      <Plus className="w-3 h-3 mr-1" /> Add Option
                    </Button>
                  )}
                </div>

                <Button
                  onClick={handleCreatePoll}
                  className="w-full bg-indigo-500 hover:bg-indigo-600"
                >
                  Start Poll
                </Button>
              </div>
            ) : (
              // Active Poll View
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-lg leading-tight">
                    {activePoll.question}
                  </h3>
                  {activePoll.createdBy === user.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClosePoll}
                      className="text-red-400 hover:bg-red-500/10 h-6 px-2 text-xs"
                    >
                      End
                    </Button>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {activePoll.options.map((opt) => {
                    const percent =
                      totalVotes === 0 ? 0 : Math.round((opt.votes.length / totalVotes) * 100)
                    const hasVoted = opt.votes.includes(user.id)

                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleVote(opt.id)}
                        className={`relative w-full text-left p-3 rounded-lg overflow-hidden transition-all border ${
                          hasVoted
                            ? 'border-indigo-500 bg-indigo-500/10'
                            : 'border-white/5 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        {/* Progress Bar */}
                        <div
                          className={`absolute inset-0 bg-indigo-500/20 transition-all duration-500 ${hasVoted ? 'bg-indigo-500/30' : ''}`}
                          style={{ width: `${percent}%` }}
                        />

                        <div className="relative z-10 flex items-center justify-between">
                          <span className="font-medium text-sm flex items-center gap-2">
                            {opt.text}
                            {hasVoted && <Check className="w-3 h-3 text-indigo-400" />}
                          </span>
                          <span className="text-xs font-mono opacity-60">
                            {percent}% ({opt.votes.length})
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>

                <div className="text-xs text-center text-white/30">
                  {totalVotes} total votes • Live
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
