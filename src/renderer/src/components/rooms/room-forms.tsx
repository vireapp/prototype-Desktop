import { useState } from 'react'
import { createRoom, joinRoomByCode, createRoomWithAI } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sparkles, Loader2, Hash, Type, AlignLeft, Globe } from 'lucide-react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { nativeNotify } from '@/lib/notifications'

export function JoinRoomForm() {
  const [error, setError] = useState('')
  const [isPending, setIsPending] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const res = await joinRoomByCode(formData)

    if (res.error) {
      setError(res.error)
      setIsPending(false)
    } else if (res.redirect) {
      nativeNotify({
        title: 'Joined Room',
        body: `Access granted to the node successfully.`
      })
      navigate(res.redirect)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pt-2">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-sm font-medium text-destructive flex items-center gap-2"
        >
          <span>⚠️</span> {error}
        </motion.div>
      )}
      <div className="space-y-3">
        <Label htmlFor="code" className="text-base text-foreground">
          Room Code
        </Label>
        <div className="relative group">
          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            id="code"
            name="code"
            placeholder="XYZ-123"
            className="pl-10 h-12 text-lg tracking-widest uppercase font-mono bg-muted/40 border-border focus-visible:border-primary/50 focus-visible:ring-primary/20 transition-all font-bold text-foreground"
            required
            autoComplete="off"
            maxLength={6}
          />
        </div>
        <p className="text-xs text-muted-foreground ml-1 font-medium">
          Enter the 6-character code provided by the host.
        </p>
      </div>
      <Button
        type="submit"
        className="w-full h-11 text-base bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] font-medium rounded-xl"
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Connecting...
          </>
        ) : (
          'Join Room'
        )}
      </Button>
    </form>
  )
}

export function CreateRoomForm() {
  const [manualError, setManualError] = useState('')
  const [isManualPending, setIsManualPending] = useState(false)
  const [aiError, setAiError] = useState('')
  const [isAiPending, setIsAiPending] = useState(false)
  const navigate = useNavigate()

  const handleManualSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsManualPending(true)
    setManualError('')

    const formData = new FormData(e.currentTarget)
    const res = await createRoom(formData)

    if (res.error) {
      setManualError(res.error)
      setIsManualPending(false)
    } else if (res.redirect) {
      nativeNotify({
        title: 'Room Created',
        body: `Successfully initialized ${formData.get('name')}.`
      })
      navigate(res.redirect)
    }
  }

  const handleAiSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsAiPending(true)
    setAiError('')

    const formData = new FormData(e.currentTarget)
    const res = await createRoomWithAI(formData)

    if (res.error) {
      setAiError(res.error)
      setIsAiPending(false)
    } else if (res.redirect) {
      nativeNotify({
        title: 'Magic Conjured',
        body: `AI has successfully prepared your custom space.`
      })
      navigate(res.redirect)
    }
  }

  return (
    <Tabs defaultValue="manual" className="w-full">
      <TabsList className="grid w-full grid-cols-2 bg-muted/40 border border-border p-1 rounded-xl">
        <TabsTrigger
          value="manual"
          className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all font-medium"
        >
          Manual Setup
        </TabsTrigger>
        <TabsTrigger
          value="ai"
          className="rounded-lg data-[state=active]:bg-purple-500/10 data-[state=active]:text-purple-400 transition-all font-medium"
        >
          <Sparkles className="w-3.5 h-3.5 mr-2" /> AI Magic
        </TabsTrigger>
      </TabsList>

      <TabsContent value="manual">
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          onSubmit={handleManualSubmit}
          className="space-y-5 pt-4"
        >
          {manualError && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-sm font-medium text-destructive">
              {manualError}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">
                Room Name
              </Label>
              <div className="relative group">
                <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="name"
                  name="name"
                  placeholder="Movie Night 🍿"
                  required
                  className="pl-9 bg-muted/40 border-border h-10 transition-all focus-visible:bg-muted/60 text-foreground rounded-lg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-foreground">
                Description (Optional)
              </Label>
              <div className="relative group">
                <AlignLeft className="absolute left-3 top-3 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <textarea
                  id="description"
                  name="description"
                  placeholder="Watching sci-fi classics..."
                  className="flex min-h-[80px] w-full rounded-lg border border-border bg-muted/40 px-3 py-2 pl-9 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all resize-none text-foreground"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-muted/60 text-emerald-500 group-hover:text-emerald-400 transition-colors">
                  <Globe className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <Label htmlFor="isPublic" className="cursor-pointer font-bold text-foreground">
                    Public Room
                  </Label>
                  <p className="text-xs text-muted-foreground font-medium">
                    Anyone can see and join this room
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                id="isPublic"
                name="isPublic"
                className="w-5 h-5 rounded border-border text-primary focus:ring-primary bg-muted/50"
                defaultChecked
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-11 bg-primary text-primary-foreground hover:opacity-90 font-bold rounded-xl shadow-lg shadow-primary/20"
            disabled={isManualPending}
          >
            {isManualPending ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              'Create Room'
            )}
          </Button>
        </motion.form>
      </TabsContent>

      <TabsContent value="ai">
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          onSubmit={handleAiSubmit}
          className="space-y-5 pt-4"
        >
          <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 text-sm text-purple-200/80">
            <p className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 mt-0.5 shrink-0 text-purple-400" />
              <span className="font-medium">
                Describe your vibe, and our AI will craft the perfect name, theme, and atmosphere
                for you.
              </span>
            </p>
          </div>

          {aiError && <div className="text-sm font-medium text-destructive">{aiError}</div>}

          <div className="space-y-2">
            <Label htmlFor="prompt" className="text-purple-100 font-bold">
              What's the vibe?
            </Label>
            <div className="relative">
              <textarea
                id="prompt"
                name="prompt"
                placeholder="e.g., A cozy rainy day cafe with jazz playing in the background..."
                required
                className="flex min-h-[100px] w-full rounded-xl border border-purple-500/20 bg-purple-500/5 px-4 py-3 text-sm shadow-inner placeholder:text-purple-300/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500 focus-visible:border-purple-500 transition-all resize-none text-foreground"
                autoFocus
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 bg-[length:200%_auto] hover:bg-[center_right] transition-all duration-500 text-white border-0 shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] font-bold text-lg rounded-xl"
            disabled={isAiPending}
          >
            {isAiPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Conjuring...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" /> Generate Magic
              </>
            )}
          </Button>
        </motion.form>
      </TabsContent>
    </Tabs>
  )
}
