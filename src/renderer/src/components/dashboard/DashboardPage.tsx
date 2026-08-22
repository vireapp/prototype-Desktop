import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ActivityTracker } from '@/components/activity-tracker'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { DashboardSkeleton } from '@/components/dashboard/skeleton'

// Widgets
import { ProfileCommandWidget } from '@/components/dashboard/widgets/profile-command-widget'
import { FriendsWidget } from '@/components/dashboard/widgets/friends-widget'
import { ActiveRoomsWidget } from '@/components/dashboard/widgets/rooms-widget'
import { CommunityWidget } from '@/components/dashboard/widgets/community-widget'
import { AICompanionWidget } from '@/components/dashboard/widgets/ai-widget'
import { QuickActions, DashboardGreeting } from '@/components/dashboard/widgets/quick-actions'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }
})

export function DashboardPage(): React.JSX.Element | null {
  const supabase = createClient()
  const navigate = useNavigate()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [userWithProfile, setUserWithProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData(): Promise<void> {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        navigate('/login', { replace: true })
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      const { data: settings } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setUserWithProfile({ ...user, profile, settings })
      setIsLoading(false)
    }
    fetchData()
  }, [supabase, navigate])


  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (!userWithProfile) return null

  const username = userWithProfile.profile?.full_name?.split(' ')[0]
    || userWithProfile.profile?.username
    || 'there'

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden">
    <div className="max-w-6xl mx-auto px-6 py-6 space-y-6 pb-10">
      {/* Background activity tracker (invisible, handles XP) */}
      <ActivityTracker />

      {/* Greeting */}
      <DashboardGreeting username={username} clockFormat={userWithProfile.settings?.clock_format || '24h'} />

      {/* Quick action buttons */}
      <QuickActions />

      {/* Main bento grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
        {/* Col 1: Profile command + AI */}
        <div className="flex flex-col gap-4">
          <motion.div {...fadeUp(0.1)}>
            <ProfileCommandWidget user={userWithProfile} />
          </motion.div>
          <motion.div {...fadeUp(0.15)}>
            <AICompanionWidget />
          </motion.div>
        </div>

        {/* Col 2: Friends */}
        <div className="flex flex-col gap-4">
          <motion.div {...fadeUp(0.2)} className="min-h-[360px]">
            <FriendsWidget />
          </motion.div>
        </div>

        {/* Col 3: Live Rooms + Community */}
        <div className="flex flex-col gap-4 md:col-span-2 xl:col-span-1">
          <motion.div {...fadeUp(0.3)} className="min-h-[300px]">
            <ActiveRoomsWidget />
          </motion.div>
          <motion.div {...fadeUp(0.35)} className="min-h-[300px]">
            <CommunityWidget />
          </motion.div>
        </div>
      </div>
    </div>
    </div>
  )
}
