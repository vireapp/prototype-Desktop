import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { SettingsProvider } from '@/components/providers/settings-provider'
import { I18nProvider } from '@/lib/i18n/i18n-provider'
import { Login } from '@/components/auth/Login'
import { Register } from '@/components/auth/Register'
import { ForgotPassword } from '@/components/auth/ForgotPassword'
import { ResetPassword } from '@/components/auth/ResetPassword'
import { DashboardPage } from '@/components/dashboard/DashboardPage'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { FriendsPage } from '@/components/friends/friends-page'
import { MessagesPage } from '@/components/messages/messages-page'
import { RoomsPage } from '@/components/rooms/rooms-page'
import { SingleRoomPage } from '@/components/room/room-page'
import { CommunityPage } from '@/components/community/page'
import { DiscoverPage } from '@/components/discover/page'
import { OnboardingPage } from '@/components/onboarding/page'
import { AboutPage } from '@/components/about/page'
import { ChangelogPage } from '@/components/changelog/page'
import { PrivacyPage } from '@/components/legal/privacy'
import { TermsPage } from '@/components/legal/terms'
import { SettingsPage } from '@/components/dashboard/settings/settings-page'
import { AIFullPage } from '@/components/ai/ai-full-page'
import { JoinRoom } from '@/components/dashboard/join-room'
import { ShopPage } from '@/components/shop/shop-page'
import { TrayMenu } from '@/components/tray/tray-menu'
import { createClient } from '@/lib/supabase/client'
import { registerSession } from '@/components/dashboard/settings/actions'
import { Loader2 } from 'lucide-react'
import { ShellSkeleton } from '@/components/dashboard/skeleton'
import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { UpdateNotifier } from '@/components/update-notifier'
import { UpdatePanel } from '@/components/update-panel'
import { TitleBar } from '@/components/TitleBar'
import { RoomProvider } from '@/lib/room-context'
import { GlobalRoomOverlay } from '@/components/global-room-overlay'

function DeepLinkHandler(): null {
  const navigate = useNavigate()

  useEffect(() => {
    if (window.api && window.api.onNavigate) {
      const cleanup = window.api.onNavigate((route: string) => {
        navigate(route)
      })
      return cleanup
    }
  }, [navigate])

  return null
}

function AuthRedirect(): React.JSX.Element {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async (): Promise<void> => {
      const {
        data: { user }
      } = await supabase.auth.getUser()
      if (user) {
        setIsAuthenticated(true)
        // Register/refresh session for users who are already logged in on boot
        registerSession().catch(console.error)
      }
      setIsLoading(false)
    }
    checkAuth()
  }, [supabase])


  if (isLoading) {
    return <ShellSkeleton />
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
}

/**
 * Wraps non-dashboard pages with TitleBar for consistent frameless experience
 */
function PageShell({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  )
}

function AppContent(): React.JSX.Element {
  const location = useLocation()
  const isTray = location.pathname === '/tray'

  useEffect(() => {
    if (window.api && window.api.on) {
      const cleanup = window.api.on('check-updates', () => {
        // @ts-ignore
        window.api.checkForUpdates?.()
      })
      return cleanup
    }
  }, [])

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {!isTray && <TitleBar />}
      <DeepLinkHandler />
      <RoomProvider>
        <Routes>
          <Route path="/" element={<AuthRedirect />} />
            <Route
              path="/login"
              element={
                <PageShell>
                  <Login />
                </PageShell>
              }
            />
            <Route
              path="/register"
              element={
                <PageShell>
                  <Register />
                </PageShell>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <PageShell>
                  <ForgotPassword />
                </PageShell>
              }
            />
            <Route
              path="/reset-password"
              element={
                <PageShell>
                  <ResetPassword />
                </PageShell>
              }
            />
            {/* Dashboard has its own TitleBar inside DashboardLayout */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="friends" element={<FriendsPage />} />
              <Route path="messages" element={<MessagesPage />} />
              <Route path="rooms" element={<RoomsPage />} />
              <Route path="join" element={<JoinRoom />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="shop" element={<ShopPage />} />
              <Route path="ai" element={<AIFullPage />} />
            </Route>
            <Route
              path="/room/:id"
              element={
                <PageShell>
                  <SingleRoomPage />
                </PageShell>
              }
            />
            <Route
              path="/community"
              element={
                <PageShell>
                  <CommunityPage />
                </PageShell>
              }
            />
            <Route
              path="/discover"
              element={
                <PageShell>
                  <DiscoverPage />
                </PageShell>
              }
            />
            <Route
              path="/onboarding"
              element={
                <PageShell>
                  <OnboardingPage />
                </PageShell>
              }
            />
            <Route
              path="/about"
              element={
                <PageShell>
                  <AboutPage />
                </PageShell>
              }
            />
            <Route
              path="/changelog"
              element={
                <PageShell>
                  <ChangelogPage />
                </PageShell>
              }
            />
            <Route
              path="/privacy"
              element={
                <PageShell>
                  <PrivacyPage />
                </PageShell>
              }
            />
            <Route
              path="/terms"
              element={
                <PageShell>
                  <TermsPage />
                </PageShell>
              }
            />
            <Route path="/tray" element={<TrayMenu />} />
          </Routes>
        <GlobalRoomOverlay />
      </RoomProvider>
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'hsl(230, 22%, 8%)',
            border: '1px solid rgba(255,255,255,0.06)',
            color: 'hsl(220, 15%, 90%)',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '13px'
          }
        }}
      />
      {!isTray && <UpdateNotifier />}
      {!isTray && <UpdatePanel />}
    </div>
  )
}

function App(): React.JSX.Element {
  useEffect(() => {
    // Force dark mode
    document.documentElement.classList.add('dark')

    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  return (
    <HashRouter>
      <SettingsProvider>
        <I18nProvider>
          <AppContent />
        </I18nProvider>
      </SettingsProvider>
    </HashRouter>
  )
}

export default App
