import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Users, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'

interface Profile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
}

export function CommunityCard(): React.JSX.Element {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const supabase = createClient()

  useEffect(() => {
    async function loadProfiles(): Promise<void> {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      try {
        const { data } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .neq('id', user.id)
          .limit(5)

        if (data) setProfiles(data)
      } catch (error) {
        console.error('Error fetching community profiles:', error)
      }
    }
    loadProfiles()
  }, [supabase])

  return (
    <Card className="h-full border-0 ring-1 ring-border bg-card relative overflow-hidden group shadow-sm">
      {/* Organic Glass Texture */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay" />

      {/* Ambient Light Source */}
      <div className="absolute -top-[100px] -right-[100px] w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[80px] group-hover:bg-blue-500/15 transition-all duration-1000" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

      <CardHeader className="pb-6 relative z-10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-editorial font-light text-card-foreground tracking-wide">
            Community
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted"
            asChild
          >
            <Link to="/community">
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
        <div className="h-px w-full bg-gradient-to-r from-border to-transparent mt-4" />
      </CardHeader>

      <CardContent className="flex flex-col gap-3 relative z-10 px-6 pb-6">
        {profiles && profiles.length > 0 ? (
          profiles.map((profile) => (
            <div
              key={profile.id}
              className="flex items-center justify-between group/item p-3 -mx-3 rounded-2xl hover:bg-muted/50 transition-all duration-300 border border-transparent hover:border-border"
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="w-11 h-11 ring-1 ring-border shadow-lg group-hover/item:scale-105 transition-transform duration-300">
                    <AvatarImage src={profile.avatar_url || ''} />
                    <AvatarFallback className="bg-muted text-muted-foreground font-medium">
                      {profile.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {/* Subtle status dot */}
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-blue-500 rounded-full ring-2 ring-card" />
                </div>

                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-medium text-foreground/80 group-hover/item:text-foreground transition-colors">
                    {profile.username}
                  </p>
                  <p className="text-[11px] text-muted-foreground group-hover/item:text-muted-foreground/80 transition-colors">
                    Active recently
                  </p>
                </div>
              </div>

              <Button
                variant="secondary"
                size="sm"
                className="h-8 px-3 rounded-full text-xs bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground border border-transparent transition-all opacity-0 group-hover/item:opacity-100 translate-x-2 group-hover/item:translate-x-0"
              >
                Connect
              </Button>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground space-y-3">
            <Users className="w-6 h-6 opacity-30" />
            <p className="text-sm font-light">The community is quiet</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
