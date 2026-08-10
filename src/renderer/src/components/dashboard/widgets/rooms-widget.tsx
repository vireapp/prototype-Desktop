import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Users, ArrowUpRight, Headphones } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

interface Room {
  id: string
  name: string
  description: string | null
  is_public: boolean
  member_count?: number
}

interface RoomParticipant {
  room_id: string
  avatar_url: string | null
  username: string | null
}

export function ActiveRoomsWidget() {
  const supabase = createClient()
  const [rooms, setRooms] = useState<Room[]>([])
  const [participants, setParticipants] = useState<Record<string, RoomParticipant[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      // Fetch public/live rooms
      const { data: roomData } = await supabase
        .from('rooms')
        .select('id, name, description, is_public')
        .eq('is_public', true)
        .limit(5)

      if (!roomData) { setLoading(false); return }
      setRooms(roomData)

      // Fetch recent participants per room from profiles via room_members or similar
      const roomIds = roomData.map((r) => r.id)
      const { data: memberData } = await supabase
        .from('room_members')
        .select('room_id, profile:profiles(avatar_url, username)')
        .in('room_id', roomIds)
        .limit(30)

      if (memberData) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const grouped: Record<string, RoomParticipant[]> = {}
        ;(memberData as any[]).forEach((m) => {
          const p = m.profile
          if (!grouped[m.room_id]) grouped[m.room_id] = []
          if (grouped[m.room_id].length < 4) {
            grouped[m.room_id].push({ room_id: m.room_id, avatar_url: p?.avatar_url ?? null, username: p?.username ?? null })
          }
        })
        setParticipants(grouped)
      }

      setLoading(false)
    }
    load()

    // Realtime subscription for room changes
    const channel = supabase
      .channel('rooms-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => load())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  return (
    <div className="rounded-xl overflow-hidden flex flex-col h-full bg-card border border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-500/15 flex items-center justify-center">
            <Headphones className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h3 className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider leading-none">Live Rooms</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {loading ? '...' : `${rooms.length} active`}
            </p>
          </div>
        </div>
        <Link
          to="/dashboard/rooms"
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent hover:border-border transition-all"
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Rooms list */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-border border-t-primary rounded-full animate-spin" />
          </div>
        ) : rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Headphones className="w-5 h-5 text-muted-foreground/40" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">No active rooms</p>
              <Link to="/dashboard/rooms" className="text-xs text-primary hover:underline mt-0.5 block">
                Create a room →
              </Link>
            </div>
          </div>
        ) : (
          <AnimatePresence>
            {rooms.map((room, i) => {
              const roomParts = participants[room.id] || []
              return (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.25 }}
                >
                  <Link
                    to={`/dashboard/rooms`}
                    className="group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/60 transition-colors border border-transparent hover:border-border"
                  >
                    {/* Room icon */}
                    <div className="w-9 h-9 rounded-xl shrink-0 bg-gradient-to-br from-rose-500/20 to-orange-500/10 flex items-center justify-center border border-rose-500/10">
                      <Headphones className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate leading-tight">{room.name}</p>
                      {room.description && (
                        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{room.description}</p>
                      )}
                      {/* Participant avatars */}
                      {roomParts.length > 0 && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <div className="flex -space-x-1.5">
                            {roomParts.slice(0, 3).map((p, j) => (
                              <Avatar key={j} className="w-4 h-4 border border-card ring-0">
                                <AvatarImage src={p.avatar_url || ''} />
                                <AvatarFallback className="text-[7px] bg-muted">
                                  {p.username?.[0]?.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                          <span className="text-[9px] text-muted-foreground font-medium">
                            {roomParts.length} member{roomParts.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Live indicator */}
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                      <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Live</span>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-white/[0.04] px-5 py-3 shrink-0">
        <Link
          to="/dashboard/join"
          className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <Users className="w-3.5 h-3.5" />
          Join via code
        </Link>
      </div>
    </div>
  )
}
