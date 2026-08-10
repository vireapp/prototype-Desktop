import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageSquare, Shield, Zap, RefreshCw, Search, UserPlus } from 'lucide-react'
import { MessagesSkeleton } from '@/components/dashboard/skeleton'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChatInterface } from './chat-interface'
import { MessagesSidebar } from './messages-sidebar'
import { CallInitializer } from '@/components/dashboard/call-initializer'
import { useLocation, useNavigate } from 'react-router-dom'

export function MessagesPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [friends, setFriends] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()
  const location = useLocation()
  const navigate = useNavigate()

  // Parse query params
  const searchParams = new URLSearchParams(location.search)
  const selectedUsername = searchParams.get('username')
  const callType = searchParams.get('call') as 'video' | 'voice' | null

  useEffect(() => {
    async function loadData() {
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      if (!currentUser) {
        navigate('/login', { replace: true })
        return
      }

      setUser(currentUser)

      const [profileRes, friendsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', currentUser.id).single(),
        supabase
          .from('friends')
          .select(`*, friend:profiles!friend_id(*)`)
          .eq('user_id', currentUser.id)
      ])

      setCurrentUserProfile(profileRes.data)
      setFriends(friendsRes.data || [])
      setIsLoading(false)
    }

    loadData()
  }, [supabase, navigate])


  if (isLoading || !user) {
    return <MessagesSkeleton />
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const selectedFriend = friends.find((f: any) => f.friend.username === selectedUsername)?.friend

  if (selectedFriend && callType) {
    return (
      <>
        <CallInitializer friend={selectedFriend} type={callType} />
        <div className="h-full flex flex-col animate-in fade-in duration-1000">
          <Card className="w-full h-full flex flex-col md:flex-row border-0 bg-card/50 backdrop-blur-3xl overflow-hidden rounded-none shadow-none">
            <MessagesSidebar
              initialFriends={friends || []}
              selectedUsername={selectedUsername ?? undefined}
            />
            <div className="flex-1 flex flex-col min-w-0 bg-transparent relative">
              <div className="flex-1 flex flex-col h-full relative">
                <ChatInterface
                  currentUser={currentUserProfile || user}
                  otherUser={selectedFriend}
                />
              </div>
            </div>
          </Card>
        </div>
      </>
    )
  }

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-1000">
      <Card className="w-full h-full flex flex-col md:flex-row border-0 bg-card/50 backdrop-blur-3xl overflow-hidden rounded-none shadow-none">
        <MessagesSidebar initialFriends={friends || []} selectedUsername={selectedUsername ?? undefined} />

        <div
          className={`flex-1 flex flex-col min-w-0 bg-transparent ${!selectedFriend ? 'hidden md:flex' : 'flex relative'}`}
        >
          {selectedFriend ? (
            <div className="flex-1 flex flex-col h-full relative">
              <ChatInterface currentUser={currentUserProfile || user} otherUser={selectedFriend} />
            </div>
          ) : (
            /* ─── Empty State — Matching Stitch Design ─── */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] via-transparent to-primary/[0.03] pointer-events-none" />

              {/* Icon */}
              <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 relative z-10">
                <MessageSquare className="w-9 h-9 text-primary/70" strokeWidth={1.5} />
              </div>

              {/* Title — "Select a channel" with accent color on "channel" */}
              <div className="relative z-10 mb-6">
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  Select a <span className="text-primary">channel</span>
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  Choose a conversation from the sidebar to start messaging. Your chats are encrypted and synced across all your devices.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 relative z-10 mb-10">
                <Button
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-5 h-9 text-sm font-medium gap-2"
                  onClick={() => navigate('/dashboard/rooms')}
                >
                  <Search className="w-3.5 h-3.5" />
                  Discover Channels
                </Button>
                <Button
                  variant="outline"
                  className="border-border hover:bg-muted text-foreground rounded-xl px-5 h-9 text-sm font-medium gap-2"
                  onClick={() => navigate('/dashboard/friends')}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Invite Friends
                </Button>
              </div>

              {/* Feature Pills */}
              <div className="flex items-center gap-2 flex-wrap justify-center relative z-10 mb-6">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/8 text-[11px] font-medium text-muted-foreground">
                  <Shield className="w-3 h-3 text-primary/70" strokeWidth={2} />
                  End-to-End Encrypted
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/8 text-[11px] font-medium text-muted-foreground">
                  <RefreshCw className="w-3 h-3 text-primary/70" strokeWidth={2} />
                  Real-time Sync
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/8 text-[11px] font-medium text-muted-foreground">
                  <Zap className="w-3 h-3 text-primary/70" strokeWidth={2} />
                  Ultra Fast
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground/40 uppercase tracking-[0.15em] font-medium relative z-10">
                <Shield className="w-3 h-3" />
                Secured by VIRE Encryption Engine
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
