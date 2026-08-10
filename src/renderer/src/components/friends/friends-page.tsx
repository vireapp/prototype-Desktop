import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Clock, LayoutGrid, List } from 'lucide-react'
import { FriendsSkeleton } from '@/components/dashboard/skeleton'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AddFriendDialog } from './add-friend-dialog'
import { FriendRequestList } from './friend-requests'
import { FriendsList } from './friends-list'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export function FriendsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [friends, setFriends] = useState<any[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'friends' | 'pending'>('friends')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const supabase = createClient()
  const navigate = useNavigate()

  useEffect(() => {
    async function loadData() {
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      if (!currentUser) {
        navigate('/login', { replace: true })
        return
      }

      setUser(currentUser)

      const [pendingRes, friendsRes] = await Promise.all([
        supabase
          .from('friend_requests')
          .select('*', { count: 'exact', head: true })
          .eq('receiver_id', currentUser.id)
          .eq('status', 'pending'),
        supabase
          .from('friends')
          .select(`*, friend:profiles!friend_id(*)`)
          .eq('user_id', currentUser.id)
      ])

      setPendingCount(pendingRes.count || 0)
      setFriends(friendsRes.data || [])
      setIsLoading(false)
    }

    loadData()
  }, [supabase, navigate])


  if (isLoading || !user) {
    return <FriendsSkeleton />
  }

  // Filter friends by search
  const filteredFriends = searchQuery.trim()
    ? friends.filter(
        (f) =>
          f.friend.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.friend.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.nickname?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : friends

  return (
    <div className="relative space-y-0 pb-6">
      {/* ─── Header Section (matches Stitch) ─── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="relative flex items-start justify-between gap-5 pb-5"
      >
        <div className="space-y-1">
          {/* Social Hub Badge */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold text-emerald-400 tracking-[0.2em] uppercase border border-emerald-500/20 bg-emerald-500/5 px-2 py-0.5 rounded">
              Social Hub
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-semibold text-foreground tracking-tight leading-none">
            Connections
          </h1>
        </div>

        {/* Right side: Bell + Add Friend */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Notification bell */}
          <button className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </button>
          <AddFriendDialog userId={user.id} />
        </div>
      </motion.div>

      {/* ─── Tabs Row + Search (matches Stitch) ─── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05, ease: [0.4, 0, 0.2, 1] }}
        className="flex items-center justify-between gap-4 mb-5"
      >
        {/* Tab Links — simple underline style like Stitch */}
        <div className="flex items-center gap-5">
          <button
            onClick={() => setActiveTab('friends')}
            className={`relative text-sm font-semibold pb-1.5 transition-all duration-200 cursor-pointer ${
              activeTab === 'friends'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground/80'
            }`}
          >
            Friends ({friends?.length || 0})
            {activeTab === 'friends' && (
              <motion.div
                layoutId="tabUnderline"
                className="absolute -bottom-0.5 left-0 right-0 h-[2px] bg-primary rounded-full"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            className={`relative text-sm font-medium pb-1.5 transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'pending'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground/80'
            }`}
          >
            Pending ({pendingCount})
            {pendingCount > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            )}
            {activeTab === 'pending' && (
              <motion.div
                layoutId="tabUnderline"
                className="absolute -bottom-0.5 left-0 right-0 h-[2px] bg-primary rounded-full"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
          </button>
        </div>

        {/* Actions (Search + View Toggle) */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative w-56 group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search
                className="h-3.5 w-3.5 text-muted-foreground/40 group-focus-within:text-primary transition-colors"
                strokeWidth={1.5}
              />
            </div>
            <Input
              placeholder="Search connections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8 bg-muted/20 border-border/50 text-xs text-foreground placeholder:text-muted-foreground/40 focus-visible:ring-primary/20 focus-visible:border-primary/30 hover:bg-muted/40 transition-all rounded-full"
            />
          </div>

          {/* View Mode Toggle (Grid/List) */}
          <div className="flex items-center bg-muted/20 border border-border/50 rounded-full p-0.5">
            <Button
              size="icon"
              variant="ghost"
              className={`h-7 w-7 rounded-full transition-all ${
                viewMode === 'grid'
                  ? 'bg-primary/15 text-primary shadow-sm hover:bg-primary/20 hover:text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-3.5 w-3.5" strokeWidth={2} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className={`h-7 w-7 rounded-full transition-all ${
                viewMode === 'list'
                  ? 'bg-primary/15 text-primary shadow-sm hover:bg-primary/20 hover:text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
              onClick={() => setViewMode('list')}
            >
              <List className="h-3.5 w-3.5" strokeWidth={2} />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* ─── Content ─── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
      >
        {activeTab === 'friends' ? (
          <FriendsList friends={filteredFriends || []} view={viewMode} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FriendRequestList userId={user.id} />
          </div>
        )}
      </motion.div>
    </div>
  )
}
