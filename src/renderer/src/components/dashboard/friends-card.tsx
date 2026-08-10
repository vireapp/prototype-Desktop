import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { MessageSquare, ArrowUpRight, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import React from 'react' // Added React import for React.JSX.Element

interface FriendProfile {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
}

interface FriendsCardProps {
  friends?: FriendProfile[] // Optional prop, as the component still fetches its own friends
}

export function FriendsCard({ friends }: FriendsCardProps): React.JSX.Element {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [friendProfiles, setFriendProfiles] = useState<FriendProfile[]>([]) // Changed type to FriendProfile[]
  const supabase = createClient()

  useEffect(() => {
    async function fetchFriends(): Promise<void> {
      // If friends prop is provided, use it directly
      if (friends) {
        setFriendProfiles(friends)
        return
      }

      const { data: { user: authedUser } } = await supabase.auth.getUser()

      if (!authedUser) return

      try {
        const { data: friends } = await supabase.from('friends_view').select('friend_id')

        if (friends && friends.length > 0) {
          const friendIds = friends.map((f) => f.friend_id)
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .in('id', friendIds)

          if (profiles) setFriendProfiles(profiles)
        }
      } catch (error) {
        console.error('Error fetching friends:', error)
      }
    }
    fetchFriends()
  }, [supabase])

  return (
    <Card className="h-full border-0 ring-1 ring-border bg-card relative overflow-hidden group shadow-sm">
      {/* Organic Glass Texture */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay" />

      {/* Ambient Light Source - Purple Tint for Friends */}
      <div className="absolute -top-[100px] -right-[100px] w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[80px] group-hover:bg-purple-500/15 transition-all duration-1000" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

      <CardHeader className="pb-6 relative z-10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-editorial font-light text-card-foreground tracking-wide">
            Your World
          </CardTitle>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted"
              asChild
            >
              <Link to="/dashboard/friends">
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </Button>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted border border-border backdrop-blur-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-medium text-muted-foreground tracking-wider">
                {friendProfiles.length} ONLINE
              </span>
            </div>
          </div>
        </div>
        <div className="h-px w-full bg-gradient-to-r from-border to-transparent mt-4" />
      </CardHeader>

      <CardContent className="flex flex-col gap-3 relative z-10 px-6 pb-6">
        {friendProfiles.length > 0 ? (
          friendProfiles.map((friend) => (
            <div
              key={friend.id}
              className="flex items-center justify-between group/item p-3 -mx-3 rounded-2xl hover:bg-muted/50 transition-all duration-300 border border-transparent hover:border-border"
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="w-11 h-11 ring-1 ring-border shadow-lg group-hover/item:scale-105 transition-transform duration-300">
                    <AvatarImage src={friend.avatar_url || ''} />
                    <AvatarFallback className="bg-muted text-muted-foreground font-medium">
                      {friend.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  {/* Pulse Online Indicator */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-card rounded-full flex items-center justify-center ring-2 ring-card">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground/80 group-hover/item:text-foreground transition-colors">
                    {friend.username}
                  </p>
                  <p className="text-[11px] text-emerald-500/80 dark:text-emerald-400/80 font-medium tracking-wide">
                    In a Room
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted opacity-0 group-hover/item:opacity-100 transition-all translate-x-2 group-hover/item:translate-x-0"
              >
                <MessageSquare className="w-4 h-4" />
              </Button>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground space-y-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Users className="w-5 h-5 opacity-40" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-light">No friends online</p>
              <Button
                variant="link"
                asChild
                className="text-muted-foreground text-xs h-auto p-0 hover:text-foreground transition-colors"
              >
                <Link to="/community">Find people</Link>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
