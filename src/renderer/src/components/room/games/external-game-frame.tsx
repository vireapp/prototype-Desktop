/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft,
  Link as LinkIcon,
  RefreshCcw,
  Maximize2,
  Minimize2,
  Share2,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Users,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Copy,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Check,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Search,
  ExternalLink,
  Info
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ExternalGameFrameProps {
  roomId: string
  user: any
  gameUrl: string
  gameName: string
  gameId?: string
  onBackAction: () => void
}

export function ExternalGameFrame({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  roomId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  user,
  gameUrl,
  gameName,
  gameId,
  onBackAction
}: ExternalGameFrameProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const supabase = createClient()
  const [showTip, setShowTip] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // --- Virtual Viewport Logic (Paper.io 2 Fix) ---
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    if (gameId !== 'paper-io-2') {
      setScale(1)
      return
    }

    const updateScale = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect()
        const scaleX = width / 1280
        const scaleY = height / 720
        setScale(Math.min(scaleX, scaleY))
      }
    }

    const observer = new ResizeObserver(updateScale)
    if (containerRef.current) observer.observe(containerRef.current)

    updateScale()
    return () => observer.disconnect()
  }, [gameId])
  // -----------------------------------------------

  // Auto-hide tip after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTip(false)
    }, 10000)
    return () => clearTimeout(timer)
  }, [])

  const [currentUrl, setCurrentUrl] = useState(gameUrl)
  const [syncUrlInput, setSyncUrlInput] = useState('')

  // Sync currentUrl with prop changes
  useEffect(() => {
    setCurrentUrl(gameUrl)
  }, [gameUrl])

  // Handle manual sync (local for now, should ideally update DB)
  const handleSync = async () => {
    if (!syncUrlInput) return

    try {
      // Basic URL validation
      new URL(syncUrlInput)
      setCurrentUrl(syncUrlInput)
      setSyncUrlInput('')
      toast.success('Game URL updated locally')

      // Implement Supabase sync
      await supabase.from('rooms').update({ current_game_url: syncUrlInput }).eq('id', roomId)
    } catch {
      toast.error('Please enter a valid URL')
    }
  }

  const reloadGame = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src
      toast.success('Game reloaded')
    }
  }

  // ... (Sync Logic useEffect) ...

  // --- Full Screen Logic ---
  const rootRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const toggleFullScreen = async () => {
    if (!document.fullscreenElement) {
      try {
        if (rootRef.current) {
          await rootRef.current.requestFullscreen()
        }
      } catch (err) {
        console.error('Error enabling full screen:', err)
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen()
      }
    }
  }

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullScreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange)
  }, [])
  // -------------------------

  return (
    <div ref={rootRef} className="flex flex-col h-full w-full bg-background relative">
      {/* Control Bar (Glassmorphism) */}
      <div className="h-16 absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 pointer-events-none">
        {/* Background blur layer */}
        <div className="absolute inset-x-4 top-4 bottom-0 bg-background/60 backdrop-blur-xl border border-border rounded-2xl pointer-events-auto flex items-center justify-between px-4 shadow-2xl">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBackAction}
              className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-full h-9 w-9"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="h-4 w-px bg-border" />
            <h3 className="font-bold text-foreground text-sm tracking-wide hidden md:block">
              {gameName}
            </h3>
          </div>

          {/* Sync Controls */}
          <div className="flex-1 max-w-lg mx-auto flex items-center gap-3 px-8">
            <div className="relative flex-1 group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <LinkIcon className="w-3.5 h-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              </div>
              <Input
                value={syncUrlInput}
                onChange={(e) => setSyncUrlInput(e.target.value)}
                placeholder="Paste invite link..."
                className="pl-9 bg-muted/50 border-border focus:border-primary/50 focus:ring-primary/20 text-xs text-foreground placeholder:text-muted-foreground rounded-full h-8 transition-all hover:bg-muted"
              />
            </div>
            <Button
              size="sm"
              onClick={handleSync}
              disabled={!syncUrlInput}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-4 h-8 text-xs font-medium shadow-lg shadow-primary/20"
            >
              <Share2 className="w-3.5 h-3.5 mr-2" /> Sync
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowTip(!showTip)}
              className={cn(
                'text-muted-foreground hover:text-foreground hover:bg-accent rounded-full h-8 w-8',
                showTip && 'text-primary bg-primary/10'
              )}
              title="Show Help Tip"
            >
              <Info className="w-4 h-4" />
            </Button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <div className="h-4 w-px bg-border mr-2" />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullScreen}
              className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-full h-9 w-9"
              title={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={reloadGame}
              className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-full h-9 w-9"
              title="Reset to New Lobby"
            >
              <RefreshCcw className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.open(currentUrl, '_blank')}
              className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-full h-9 w-9"
              title="Open in New Tab"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Game Iframe */}
      {/* Game Iframe */}
      <div
        ref={containerRef}
        className="flex-1 relative bg-background w-full overflow-hidden flex items-center justify-center pt-20 pb-4 px-4"
      >
        {gameId === 'paper-io-2' ? (
          <div
            style={{
              width: 1280,
              height: 720,
              transform: `scale(${scale})`,
              transformOrigin: 'center'
            }}
            className="relative shadow-2xl flex-shrink-0 bg-background mx-auto"
          >
            <iframe
              ref={iframeRef}
              src={currentUrl}
              className="w-full h-full border-0 select-none bg-white"
              allow="autoplay; fullscreen; microphone; camera; gyroscope; accelerometer; payment"
              sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts allow-pointer-lock"
              style={{ display: 'block' }}
            />
          </div>
        ) : (
          <div className="w-full h-full relative">
            <iframe
              ref={iframeRef}
              src={currentUrl}
              className="absolute inset-0 w-full h-full border-0 select-none bg-white"
              allow="autoplay; fullscreen; microphone; camera; gyroscope; accelerometer; payment"
              sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts allow-pointer-lock"
              style={{ display: 'block' }}
            />
          </div>
        )}

        {/* Overlay Tip */}
        {showTip && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-popover/80 backdrop-blur-md border border-border px-6 py-3 rounded-full text-sm text-foreground pointer-events-none animate-in fade-in slide-in-from-bottom-4 duration-500 z-50 text-center w-full max-w-md mx-4 shadow-lg">
            <span className="text-primary font-bold mr-2 block sm:inline">Tip:</span>
            Create a private party in the game, copy the link, and paste it above to play together!
          </div>
        )}
      </div>
    </div>
  )
}
