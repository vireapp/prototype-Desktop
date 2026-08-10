import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createClient } from '@/lib/supabase/client'
import { listSessions } from '@/components/dashboard/settings/actions'
import { SettingsClient } from './settings-client'
import { SettingsSkeleton } from '@/components/dashboard/skeleton'

export function SettingsPage(): JSX.Element {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{
    profile: any
    settings: any
    user: any
    blockedUsers: any[]
    sessions: any[]
    factorId?: string
  } | null>(null)
  const navigate = useNavigate()
  const supabase = createClient()

  useEffect(() => {
    async function fetchSettingsData(): Promise<void> {
      try {
        const {
          data: { user },
          error: authError
        } = await supabase.auth.getUser()

        if (authError || !user) {
          navigate('/login')
          return
        }

        // Fetch Profile
        const { data: profile } = await supabase
          .from('profiles')
          .select(
            'full_name, date_of_birth, dob, username, avatar_url, banner_url, bio, status_text, status_emoji, social_links'
          )
          .eq('id', user.id)
          .single()

        const profileData = profile
        if (profileData && !profileData.date_of_birth && profileData.dob) {
          profileData.date_of_birth = profileData.dob
        }

        if (!profileData) {
          navigate('/onboarding')
          return
        }

        // Fetch User Settings
        const { data: settings } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single()

        // Fetch Blocked Users
        const { data: blockedRaw } = await supabase
          .from('blocked_users')
          .select(
            `
            id,
            blocked_user_id,
            profiles:blocked_user_id (
              full_name,
              username,
              avatar_url
            )
          `
          )
          .eq('user_id', user.id)

        const blockedUsers =
          blockedRaw?.map((item: any) => ({
            id: item.blocked_user_id,
            name: item.profiles?.full_name || item.profiles?.username || 'Unknown',
            username: item.profiles?.username,
            avatar_url: item.profiles?.avatar_url,
            blocked_record_id: item.id
          })) || []

        // Real sessions from user_sessions table
        const sessions = await listSessions()

        // MFA Status
        let factorId: string | undefined = undefined
        try {
          const { data: factors } = await supabase.auth.mfa.listFactors()
          if (factors && factors.all) {
            const totp = factors.all.find(
              (f) => f.factor_type === 'totp' && f.status === 'verified'
            )
            if (totp) factorId = totp.id
          }
        } catch (e) {
          console.error('Failed to fetch MFA status', e)
        }

        setData({
          profile: profileData,
          settings,
          user,
          blockedUsers,
          sessions,
          factorId
        })
      } catch (error) {
        console.error('Error fetching settings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSettingsData()
  }, [navigate, supabase])


  if (loading || !data) {
    return <SettingsSkeleton />
  }

  return (
    <SettingsClient
      profile={data.profile}
      settings={data.settings}
      email={data.user.email}
      blockedUsers={data.blockedUsers}
      initialSessions={data.sessions}
      initialFactorId={data.factorId}
    />
  )
}
