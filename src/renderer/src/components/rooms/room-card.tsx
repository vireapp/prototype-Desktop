import { useState } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { deleteRoom } from './actions'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { Globe, Lock, Copy, Trash2, Users, Zap, Gamepad2, BookOpen, Music, Code2 } from 'lucide-react'

// Map room types/names to icons
function getRoomIcon(room: any) {
  const name = (room.name || '').toLowerCase()
  if (name.includes('game') || name.includes('gaming')) return Gamepad2
  if (name.includes('music') || name.includes('lofi') || name.includes('lo-fi')) return Music
  if (name.includes('read') || name.includes('book')) return BookOpen
  if (name.includes('code') || name.includes('dev') || name.includes('tech')) return Code2
  return Zap
}

// Gradient presets for rooms without banners
const GRADIENTS = [
  'from-indigo-600 via-purple-600 to-pink-500',
  'from-emerald-500 via-teal-500 to-cyan-500',
  'from-orange-500 via-amber-500 to-yellow-400',
  'from-rose-500 via-pink-500 to-fuchsia-500',
  'from-blue-500 via-indigo-500 to-violet-500',
  'from-teal-400 via-emerald-500 to-green-500',
]

function hashRoom(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffffffff
  return Math.abs(h) % GRADIENTS.length
}

interface RoomCardProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  room: any
  currentUserId?: string
  variant?: 'my-room' | 'public'
}

export function RoomCard({ room, currentUserId, variant = 'my-room' }: RoomCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const isOwner = currentUserId === room.created_by
  const RoomIcon = getRoomIcon(room)
  const gradientIdx = hashRoom(room.id || room.name || '')
  const gradient = GRADIENTS[gradientIdx]

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteRoom(room.id)
      toast.success('Room deleted successfully')
      window.location.reload()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete room')
    } finally {
      setIsDeleting(false)
    }
  }

  const copyCode = (e: React.MouseEvent) => {
    e.preventDefault()
    if (room.code) {
      navigator.clipboard.writeText(room.code)
      toast.success('Room code copied!')
    }
  }

  // ── "My Room" card — Stitch image-card style ──
  if (variant === 'my-room') {
    return (
      <div className="group relative flex flex-col rounded-2xl overflow-hidden border border-border/60 bg-card hover:border-primary/20 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-0.5">
        {/* Banner Image / Gradient top section */}
        <div className="relative h-36 overflow-hidden">
          {room.banner_url ? (
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
              style={{ backgroundImage: `url(${room.banner_url})` }}
            />
          ) : (
            <div className={cn('absolute inset-0 bg-gradient-to-br', gradient)} />
          )}
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/20" />

          {/* Status badges top-right */}
          <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
            {room.is_active && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold text-emerald-100 bg-emerald-500/80 backdrop-blur-sm uppercase tracking-wider">
                Active
              </span>
            )}
            <span
              className={cn(
                'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm',
                room.is_public
                  ? 'bg-blue-500/80 text-blue-100'
                  : 'bg-amber-500/80 text-amber-100'
              )}
            >
              {room.is_public ? 'Public' : 'Private'}
            </span>
          </div>

          {/* Room code badge top-left */}
          {!room.is_public && room.code && (
            <button
              onClick={copyCode}
              className="absolute top-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded bg-black/40 backdrop-blur-sm text-white/80 text-[10px] hover:bg-black/60 transition-colors"
            >
              <Copy className="w-2.5 h-2.5" /> {room.code}
            </button>
          )}
        </div>

        {/* Content below image */}
        <div className="flex flex-col gap-3 p-4 pt-8 relative">
          {/* Room icon — overlaps the image/content boundary */}
          <div
            className={cn(
              'absolute -top-6 left-4 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-card bg-gradient-to-br',
              gradient
            )}
          >
            <RoomIcon className="w-5 h-5 text-white" strokeWidth={2} />
          </div>

          {/* Room name + type */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-bold text-[15px] text-foreground truncate leading-tight">{room.name}</h3>
              {room.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                  {room.description}
                </p>
              )}
            </div>
          </div>

          {/* Footer: members + actions */}
          <div className="flex items-center justify-between mt-auto">
            {/* Member count */}
            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-5 h-5 rounded-full bg-muted border-2 border-card flex items-center justify-center"
                  >
                    <Users className="w-2.5 h-2.5 text-muted-foreground" />
                  </div>
                ))}
              </div>
              <span className="text-[11px] text-muted-foreground font-medium">
                {room.member_count ?? room.participant_count ?? 0}+
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {isOwner && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-lg text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-all"
                      disabled={isDeleting}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-popover border-border backdrop-blur-xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-foreground font-bold">Delete Room?</AlertDialogTitle>
                      <AlertDialogDescription className="text-muted-foreground">
                        This will permanently delete "{room.name}" and all its data. This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-transparent border-border hover:bg-muted">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 border-0"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <Button
                size="sm"
                className="h-7 px-4 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-lg transition-all shadow-sm shadow-primary/20"
                asChild
              >
                <Link to={`/room/${encodeURIComponent(room.id)}`}>Enter</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Public Room card — Stitch flat/colored card style ──
  return (
    <div className={cn(
      'group relative flex flex-col gap-3 rounded-2xl p-5 border border-border/60 transition-all duration-300 hover:border-primary/20 hover:-translate-y-0.5',
      'bg-gradient-to-br',
      gradient,
      'bg-opacity-10'
    )}
      style={{
        background: `linear-gradient(135deg, var(--card) 0%, var(--card) 60%, color-mix(in srgb, var(--primary) 8%, transparent) 100%)`
      }}
    >
      {/* Visibility badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {room.is_public ? (
            <Globe className="w-3.5 h-3.5 text-muted-foreground/60" />
          ) : (
            <Lock className="w-3.5 h-3.5 text-muted-foreground/60" />
          )}
          <span className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wider">
            {room.is_public ? 'Public' : 'Private'}
          </span>
        </div>
        {!room.is_public && room.code && (
          <button
            onClick={copyCode}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/50 text-muted-foreground text-[10px] hover:bg-muted transition-colors"
          >
            <Copy className="w-2.5 h-2.5" /> {room.code}
          </button>
        )}
      </div>

      {/* Name + Description */}
      <div>
        <h3 className="font-bold text-base text-foreground leading-tight">{room.name}</h3>
        {room.description && (
          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-3 leading-relaxed">
            {room.description}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-1">
        <div className="flex items-center gap-1.5 text-muted-foreground/60">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-medium">
            {room.member_count ?? room.participant_count ?? 0} online
          </span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-4 text-xs font-semibold text-primary hover:bg-primary/10 rounded-lg transition-all border border-primary/20"
          asChild
        >
          <Link to={`/room/${encodeURIComponent(room.id)}`}>Join Community</Link>
        </Button>
      </div>
    </div>
  )
}
