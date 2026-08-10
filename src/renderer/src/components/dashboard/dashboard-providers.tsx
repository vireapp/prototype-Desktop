'use client'

import { AIContextProvider } from '@/lib/ai-context'
import { ReactNode } from 'react'
import { PresenceProvider, UserStatus } from '@/components/dashboard/presence-provider'
import { User } from '@supabase/supabase-js'
import { CallListener } from '@/components/dashboard/call-listener'
import { CallProvider } from '@/lib/call-context'
import { GlobalCallOverlay } from '@/components/global-call-overlay'
import { NotificationSilenceManager } from '@/components/notifications/silence-manager'

export function DashboardProviders({
  children,
  user,
  initialStatus
}: {
  children: ReactNode
  user: User
  initialStatus?: UserStatus
}) {
  return (
    <AIContextProvider>
      <CallProvider>
        <NotificationSilenceManager />
        <PresenceProvider user={user} initialStatus={initialStatus}>
          <CallListener userId={user.id} />
          {children}
        </PresenceProvider>
        <GlobalCallOverlay />
      </CallProvider>
    </AIContextProvider>
  )
}
