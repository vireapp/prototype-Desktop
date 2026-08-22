import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Users, ArrowUpRight, Globe } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

interface CommunityProfile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  status: string | null
  level: number | null
}

const STATUS_COLOR: Record<string, string> = {
  online: 'bg-emerald-500',
  'in-room': 'bg-violet-500',
  invisible: 'bg-zinc-400',
  offline: 'bg-zinc-300 dark:bg-zinc-600',
}

export function CommunityWidget() {
  const supabase = createClient()
  const [profiles, setProfiles] = useState<CommunityProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState<number | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get total user count
      const { count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .neq('id', user.id)

      setTotalCount(count)

      // Get all users who joined
      const { data } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, status, level')
        .neq('id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)

      setProfiles(data || [])
      setLoading(false)
    }
    load()
  }, [supabase])

  return (
    <div className="rounded-xl overflow-hidden flex flex-col h-full bg-card border border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-500/15 flex items-center justify-center">
            <Globe className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <h3 className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider leading-none">Community</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {totalCount !== null ? `${totalCount.toLocaleString()} members` : '...'}
            </p>
          </div>
        </div>
      </div>

      {/* Profiles list */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-border border-t-primary rounded-full animate-spin" />
          </div>
        ) : profiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Globe className="w-5 h-5 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Community is quiet</p>
          </div>
        ) : (
          <AnimatePresence>
            {profiles.map((profile, i) => {
              const isOnline = profile.status === 'online' || profile.status === 'in-room'
              const dotColor = STATUS_COLOR[profile.status ?? 'offline']

              return (
                <motion.div
                  key={profile.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04, duration: 0.2 }}
                  className="group flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-muted/60 transition-colors border border-transparent hover:border-border cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <Avatar className="w-8 h-8 border border-border">
                        <AvatarImage src={profile.avatar_url || ''} className="object-cover" />
                        <AvatarFallback className="text-xs bg-muted text-muted-foreground font-medium">
                          {profile.username?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card ${dotColor}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate leading-none">{profile.username}</p>
                      <p className={`text-[10px] mt-0.5 ${isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                        {isOnline ? (profile.status === 'in-room' ? 'In a room' : 'Online') : 'Offline'}
                      </p>
                    </div>
                  </div>
                  {profile.level && profile.level > 1 && (
                    <span className="text-[9px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full border border-border">
                      Lv {profile.level}
                    </span>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
