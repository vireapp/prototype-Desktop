import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useNavigate, Outlet, useLocation } from 'react-router-dom'
import { ShellSkeleton } from '@/components/dashboard/skeleton'
import { DesktopSidebar } from '@/components/desktop-sidebar'
import { DashboardProviders } from '@/components/dashboard/dashboard-providers'
import { UserStatus } from '@/components/dashboard/presence-provider'
import { AIPanel } from '@/components/ai/ai-panel'
import { QuickSwitcher } from '@/components/dashboard/QuickSwitcher'
import { DesktopSync } from '@/components/dashboard/DesktopSync'

export function DashboardLayout(): React.JSX.Element | null {
  const supabase = createClient()
  const navigate = useNavigate()
  const location = useLocation()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchUser(): Promise<void> {
      const {
        data: { user },
        error
      } = await supabase.auth.getUser()

      if (error || !user) {
        navigate('/login', { replace: true })
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('username, status')
        .eq('id', user.id)
        .single()

      if (!profile || !profile.username) {
        navigate('/onboarding')
      }

      setUser(user)
      setProfile(profile)
      setIsLoading(false)
    }

    fetchUser()
  }, [supabase, navigate])

  useEffect(() => {
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        navigate('/login', { replace: true })
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, navigate])

  const handleLogout = async (): Promise<void> => {
    await supabase.auth.signOut()
  }


  if (isLoading) {
    return <ShellSkeleton />
  }

  if (!user || !profile) return null

  return (
    <DashboardProviders user={user} initialStatus={profile.status as UserStatus}>
      <div className="flex flex-col h-full overflow-hidden text-foreground bg-background">
        <div className="flex flex-1 overflow-hidden p-0 relative">
          {/* Desktop Sidebar */}
          <DesktopSidebar onLogout={handleLogout} username={profile.username} />

          {/* Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden relative z-10 bg-background pt-9">
            {/* Scrollable Content */}
            <main className="flex-1 flex flex-col overflow-x-hidden overflow-y-auto w-full h-full">
              <Outlet />
            </main>
          </div>

          {/* Global AI Panel (structurally integrated, pushes content) */}
          <AIPanel />
        </div>

        <QuickSwitcher />
      </div>
    </DashboardProviders>
  )
}
