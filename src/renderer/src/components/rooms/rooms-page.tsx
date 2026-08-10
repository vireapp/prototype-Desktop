import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Plus, ExternalLink, Compass, Users, LayoutGrid } from 'lucide-react'
import { RoomsSkeleton } from '@/components/dashboard/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { JoinRoomForm, CreateRoomForm } from './room-forms'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
  DialogHeader
} from '@/components/ui/dialog'
import { RoomCard } from './room-card'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { DuoButton } from '@/components/duo/duo-button'

type FilterTab = 'ALL' | 'TRENDING' | 'NEW'

export function RoomsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [publicRooms, setPublicRooms] = useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [myRooms, setMyRooms] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTab, setFilterTab] = useState<FilterTab>('ALL')

  const supabase = createClient()
  const navigate = useNavigate()

  useEffect(() => {
    async function loadData() {
      const {
        data: { user: currentUser }
      } = await supabase.auth.getUser()

      if (!currentUser) {
        navigate('/login', { replace: true })
        return
      }

      setUser(currentUser)

      const [publicRes, myRes] = await Promise.all([
        supabase
          .from('rooms')
          .select('*')
          .eq('is_public', true)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('rooms')
          .select('*')
          .eq('created_by', currentUser.id)
          .order('created_at', { ascending: false })
      ])

      setPublicRooms(publicRes.data || [])
      setMyRooms(myRes.data || [])
      setIsLoading(false)
    }

    loadData()
  }, [supabase, navigate])


  if (isLoading || !user) {
    return <RoomsSkeleton />
  }

  // Filter public rooms
  let filteredPublicRooms = publicRooms?.filter(
    (room) =>
      room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (filterTab === 'NEW') {
    filteredPublicRooms = [...filteredPublicRooms].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  } else if (filterTab === 'TRENDING') {
    filteredPublicRooms = [...filteredPublicRooms].sort(
      (a, b) => (b.member_count ?? 0) - (a.member_count ?? 0)
    )
  }

  return (
    <div className="space-y-8 pb-8">
      {/* ─── Page Header ─── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Rooms</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Join the community or create your own space
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Duo Matchmaking Button */}
          <DuoButton />

          {/* Divider */}
          <div className="w-px h-6 bg-border/50" />

          {/* Join via Code */}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="gap-2 border-border/60 hover:bg-muted/50 text-foreground font-medium rounded-xl h-9 text-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Join via Code
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-popover border-border backdrop-blur-xl">
              <DialogHeader>
                <DialogTitle className="text-foreground">Join Private Room</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Enter the code shared by your friend.
                </DialogDescription>
              </DialogHeader>
              <JoinRoomForm />
            </DialogContent>
          </Dialog>

          {/* Create Room */}
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl h-9 text-sm shadow-lg shadow-primary/20 transition-all">
                <Plus className="w-4 h-4" />
                Create Room
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-popover border-border backdrop-blur-xl">
              <DialogHeader>
                <DialogTitle className="text-foreground">Create New Room</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Customize your space or let AI do the magic.
                </DialogDescription>
              </DialogHeader>
              <CreateRoomForm />
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* ─── Your Rooms Section ─── */}
      {myRooms && myRooms.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08, ease: [0.4, 0, 0.2, 1] }}
          className="space-y-4"
        >
          {/* Section Header */}
          <div className="flex items-center gap-2.5">
            <LayoutGrid className="w-4 h-4 text-primary" strokeWidth={2} />
            <h2 className="text-sm font-semibold text-foreground">Your Rooms</h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold text-emerald-100 bg-emerald-500/20 border border-emerald-500/30 uppercase tracking-wide">
              Active
            </span>
          </div>

          {/* Cards — 3-column grid like Stitch */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myRooms.map((room) => (
              <RoomCard key={room.id} room={room} currentUserId={user.id} variant="my-room" />
            ))}
          </div>
        </motion.div>
      )}

      {/* ─── Discover Public Rooms Section ─── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.14, ease: [0.4, 0, 0.2, 1] }}
        className="space-y-4"
      >
        {/* Section Header with filter tabs */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Compass className="w-4 h-4 text-primary" strokeWidth={2} />
            <h2 className="text-sm font-semibold text-foreground">Discover Public Rooms</h2>
          </div>

          {/* Filter Tabs — ALL / TRENDING / NEW */}
          <div className="flex items-center gap-1 bg-muted/30 border border-border/50 rounded-lg p-0.5">
            {(['ALL', 'TRENDING', 'NEW'] as FilterTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterTab(tab)}
                className={cn(
                  'px-3 py-1 rounded-md text-[11px] font-semibold tracking-wide uppercase transition-all',
                  filterTab === tab
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Search bar — inline with section (shown above grid) */}
        <div className="relative w-full max-w-xs group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40 group-focus-within:text-primary transition-colors pointer-events-none" />
          <Input
            type="search"
            placeholder="Search rooms, people or topics..."
            className="pl-9 h-8 bg-muted/20 border-border/50 text-foreground text-xs placeholder:text-muted-foreground/40 focus-visible:ring-primary/20 focus-visible:border-primary/30 hover:bg-muted/40 transition-all rounded-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Room cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPublicRooms?.map((room) => (
            <RoomCard key={room.id} room={room} currentUserId={user.id} variant="public" />
          ))}

          {/* Empty state tile — Stitch shows a grayed card */}
          {(!filteredPublicRooms || filteredPublicRooms.length === 0) && (
            <div className="col-span-full lg:col-span-1 flex flex-col items-center justify-center py-16 px-6 text-center rounded-2xl border border-dashed border-border/50 bg-muted/10">
              <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center mb-3">
                <Users className="w-5 h-5 text-muted-foreground/40" strokeWidth={1.5} />
              </div>
              <p className="text-sm font-medium text-muted-foreground/60">No public rooms found</p>
              <p className="text-xs text-muted-foreground/40 mt-1">
                Try adjusting your filters or search terms.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
