import { useNavigate } from 'react-router-dom'
import { deleteRoom } from './actions'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@renderer/components/ui/dropdown-menu'
import { Button } from '@renderer/components/ui/button'
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
} from '@renderer/components/ui/alert-dialog'
import { MoreHorizontal, Trash2 } from 'lucide-react'

export function RoomActionsMenu({ roomId }: { roomId: string }) {
  const navigate = useNavigate()

  const handleDelete = async () => {
    try {
      await deleteRoom(roomId)
      toast.success('Room deleted')
      window.location.reload()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete room')
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 p-0 text-white/70 hover:text-white rounded-full hover:bg-white/10"
        >
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="bg-popover border-border backdrop-blur-xl rounded-xl"
      >
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => navigate(`/room/${roomId}`)} className="cursor-pointer">
          View Room
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-border/50" />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive cursor-pointer"
              onSelect={(e) => e.preventDefault()}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Room
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-popover border-border backdrop-blur-xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground font-bold">
                Delete Room?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground font-medium">
                Are you sure you want to delete this room? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-transparent text-foreground border-border hover:bg-muted rounded-xl font-medium">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 border-0 rounded-xl font-bold"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
