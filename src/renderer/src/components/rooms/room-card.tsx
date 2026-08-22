import { useState } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { deleteRoom } from './actions'
import { toast } from 'sonner'
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
import { Globe, Lock, Copy, Trash2, ArrowRight } from 'lucide-react'

interface RoomCardProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  room: any
  currentUserId?: string
  variant?: 'my-room' | 'public'
}

export function RoomCard({ room, currentUserId, variant = 'my-room' }: RoomCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const isOwner = currentUserId === room.created_by

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
      toast.success('Room code copied')
    }
  }

  return (
    <div className={cn(
      "group flex flex-col p-6 bg-transparent border border-border/60 hover:border-foreground/40 transition-colors duration-200",
      "rounded-none", // Strict sharp edges
      variant === 'my-room' ? "min-h-[190px]" : "min-h-[170px]"
    )}>
      {/* Header */}
      <div className="flex justify-between items-start gap-4 mb-4">
        <div className="flex flex-col gap-1.5 min-w-0">
          <h3 className="text-[22px] font-medium tracking-tight text-foreground leading-none truncate">
            {room.name}
          </h3>
          <div className="flex items-center gap-3 text-[13px] text-muted-foreground mt-1">
            {room.is_public ? (
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" /> Public Room
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Private Room
              </span>
            )}
            
            {room.is_active && variant === 'my-room' && (
              <>
                <span className="text-border/60">•</span>
                <span className="text-foreground font-medium">Active</span>
              </>
            )}
          </div>
        </div>

        {/* Top Right Actions (Revealed on hover for clean default state) */}
        <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0">
          {!room.is_public && room.code && variant === 'my-room' && (
            <button
              onClick={copyCode}
              className="flex items-center gap-1.5 text-[12px] font-mono text-muted-foreground hover:text-foreground transition-colors"
              title="Copy Code"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{room.code}</span>
            </button>
          )}
          
          {isOwner && variant === 'my-room' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  disabled={isDeleting}
                  title="Delete Room"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-background border-border rounded-none">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl font-medium tracking-tight">Delete Room</AlertDialogTitle>
                  <AlertDialogDescription className="text-base text-muted-foreground">
                    This will permanently delete "{room.name}" and all its data. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-6">
                  <AlertDialogCancel className="h-10 rounded-none text-sm border-border hover:bg-muted">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="h-10 rounded-none text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Room
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Structural Divider */}
      <div className="w-full h-px bg-border/40 my-3 transition-colors group-hover:bg-border/80" />

      {/* Description */}
      <p className="text-[14px] text-muted-foreground leading-relaxed line-clamp-2 mt-2 mb-6 flex-1">
        {room.description || 'No description provided.'}
      </p>

      {/* Footer */}
      <div className="flex items-end justify-between mt-auto pt-2">
        <div className="text-[13px] font-medium text-muted-foreground">
          <span className="text-foreground text-[18px] font-medium mr-1.5">
            {room.member_count ?? room.participant_count ?? 0}
          </span>
          {variant === 'public' ? 'Online' : 'Members'}
        </div>

        <Link
          to={`/room/${encodeURIComponent(room.id)}`}
          state={{ isDuo: room.description === 'Private Duo Room' }}
          className="group/btn inline-flex items-center justify-center h-10 px-6 text-[14px] font-medium text-foreground bg-transparent border border-foreground/20 hover:border-foreground hover:bg-foreground hover:text-background transition-all duration-200 rounded-none"
        >
          {variant === 'my-room' ? 'Enter Room' : 'Join Room'}
          <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-200 group-hover/btn:translate-x-1" />
        </Link>
      </div>
    </div>
  )
}
