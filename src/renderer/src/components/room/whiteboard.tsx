'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { toast } from 'sonner'

interface Point {
  x: number
  y: number
}

interface RoomWhiteboardProps {
  roomId: string
  user: { id: string; name?: string; [key: string]: unknown }
  onBack: () => void
}

export function RoomWhiteboard({ roomId, user, onBack }: RoomWhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [color, setColor] = useState('#ffffff')
  const [isDrawing, setIsDrawing] = useState(false)
  const [prevPoint, setPrevPoint] = useState<Point | null>(null)
  const supabase = createClient()
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const drawOnCanvas = (prev: Point, curr: Point, strokeColor: string, width: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.beginPath()
    ctx.moveTo(prev.x, prev.y)
    ctx.lineTo(curr.x, curr.y)
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = width
    ctx.stroke()
    ctx.closePath()
  }

  const getPos = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    let clientX, clientY

    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = (e as React.MouseEvent).clientX
      clientY = (e as React.MouseEvent).clientY
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    }
  }

  // Setup Canvas and Realtime
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Handle Resize
    const resize = () => {
      canvas.width = container.clientWidth
      canvas.height = container.clientHeight
      // Restore context settings after resize reset
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }
    resize()
    window.addEventListener('resize', resize)

    // Setup Channel
    const channel = supabase.channel(`room_${roomId}_whiteboard`)
    channel
      .on('broadcast', { event: 'draw' }, ({ payload }) => {
        drawOnCanvas(payload.prev, payload.curr, payload.color, payload.width)
      })
      .on('broadcast', { event: 'clear' }, () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // toast.success('Connected to Whiteboard')
        }
      })

    channelRef.current = channel

    return () => {
      window.removeEventListener('resize', resize)
      supabase.removeChannel(channel)
    }
  }, [roomId, supabase])

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault() // Prevent scrolling on touch
    setIsDrawing(true)
    const pos = getPos(e)
    setPrevPoint(pos)
  }

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !prevPoint) return
    e.preventDefault()

    const currPoint = getPos(e)

    // Draw locally
    drawOnCanvas(prevPoint, currPoint, color, 2)

    // Broadcast to others
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'draw',
        payload: {
          prev: prevPoint,
          curr: currPoint,
          color: color,
          width: 2
        }
      })
    }

    setPrevPoint(currPoint)
  }

  const handleEnd = () => {
    setIsDrawing(false)
    setPrevPoint(null)
  }

  const clearBoard = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'clear',
        payload: {}
      })
    }
  }

  return (
    <div
      className="w-full h-full flex flex-col bg-zinc-900 overflow-hidden relative"
      ref={containerRef}
    >
      {/* Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 rounded-full bg-zinc-800 border border-white/10 shadow-xl z-10">
        <Button
          variant={color === '#ffffff' ? 'secondary' : 'ghost'}
          size="icon"
          onClick={() => setColor('#ffffff')}
          className="w-8 h-8 rounded-full"
        >
          <div className="w-4 h-4 rounded-full bg-white border border-zinc-600" />
        </Button>
        <Button
          variant={color === '#ef4444' ? 'secondary' : 'ghost'}
          size="icon"
          onClick={() => setColor('#ef4444')}
          className="w-8 h-8 rounded-full"
        >
          <div className="w-4 h-4 rounded-full bg-red-500" />
        </Button>
        <Button
          variant={color === '#3b82f6' ? 'secondary' : 'ghost'}
          size="icon"
          onClick={() => setColor('#3b82f6')}
          className="w-8 h-8 rounded-full"
        >
          <div className="w-4 h-4 rounded-full bg-blue-500" />
        </Button>
        <Button
          variant={color === '#22c55e' ? 'secondary' : 'ghost'}
          size="icon"
          onClick={() => setColor('#22c55e')}
          className="w-8 h-8 rounded-full"
        >
          <div className="w-4 h-4 rounded-full bg-green-500" />
        </Button>

        <div className="w-[1px] h-6 bg-white/10 mx-1" />

        <Button
          variant="ghost"
          size="icon"
          onClick={clearBoard}
          title="Clear Board"
          className="w-8 h-8 rounded-full text-red-400 hover:bg-red-500/10"
        >
          <Trash2 className="w-4 h-4" />
        </Button>

        <Button variant="ghost" size="sm" onClick={onBack} className="ml-2 rounded-full text-xs">
          Close
        </Button>
      </div>

      <canvas
        ref={canvasRef}
        className="touch-none cursor-crosshair active:cursor-crosshair w-full h-full block"
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
      />

      <div className="absolute bottom-4 left-4 text-xs text-white/30 pointer-events-none select-none">
        Collaborative Whiteboard • Sync is live
      </div>
    </div>
  )
}
