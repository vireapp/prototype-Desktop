import { useState, useEffect } from 'react'
import { AuthLayout } from './auth-layout'
import { AnimatedInput } from '@/components/ui/animated-input'
import { ArrowRight, Lock, Mail } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, Variants } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { registerSession } from '@/components/dashboard/settings/actions'
import { TwoFactorChallenge } from './TwoFactorChallenge'

export function Login(): JSX.Element {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [pending2FAFactorId, setPending2FAFactorId] = useState<string | null>(null)

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient()
      const {
        data: { user }
      } = await supabase.auth.getUser()
      if (user) {
        navigate('/dashboard')
      }
      setIsInitializing(false)
    }
    checkSession()
  }, [navigate])

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (signInError) {
        setError(signInError.message)
        setIsSubmitting(false)
      } else {
        // Check if user has an active 2FA TOTP factor
        const supabase2 = createClient()
        const { data: factors } = await supabase2.auth.mfa.listFactors()
        const totpFactor = factors?.all?.find(
          (f) => f.factor_type === 'totp' && f.status === 'verified'
        )

        if (totpFactor) {
          // Show the 2FA challenge screen before proceeding
          setPending2FAFactorId(totpFactor.id)
          setIsSubmitting(false)
        } else {
          // No 2FA — register session and proceed
          await registerSession()
          navigate('/dashboard')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred during login.')
      setIsSubmitting(false)
    }
  }

  const container: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
  }

  const item: Variants = {
    hidden: { y: 16, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 60, damping: 14 } }
  }

  // Show 2FA challenge if user has TOTP enabled
  if (pending2FAFactorId) {
    return (
      <TwoFactorChallenge
        factorId={pending2FAFactorId}
        onSuccess={() => navigate('/dashboard')}
        onCancel={async () => {
          // Must sign out the active Supabase session before dismissing the 2FA UI.
          const supabase = createClient()
          await supabase.auth.signOut()
          setPending2FAFactorId(null)
          setIsSubmitting(false)
        }}
      />
    )
  }

  if (isInitializing) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-black text-zinc-600">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <AuthLayout subtitle="Sign in to your account.">
      <motion.div className="space-y-8 mt-6" variants={container} initial="hidden" animate="show">
        {/* Header */}
        <motion.div variants={item} className="mb-2">
          <h1 className="text-3xl font-semibold tracking-tight mb-2">Sign in</h1>
          <p className="text-zinc-500 text-sm">
            Enter your email and password to access your account.
          </p>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 p-3 text-sm text-red-600 dark:text-red-400 flex items-center gap-3"
          >
            <div className="h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" />
            {error}
          </motion.div>
        )}

        {/* Form */}
        <form className="space-y-7" onSubmit={handleLogin}>
          <motion.div variants={item}>
            <AnimatedInput label="Email address" name="email" type="email" icon={Mail} required />
          </motion.div>

          <motion.div variants={item} className="space-y-3">
            <AnimatedInput
              label="Password"
              name="password"
              type="password"
              icon={Lock}
              required
              enablePasswordToggle
            />
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
          </motion.div>

          <motion.div variants={item} className="pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-lg bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-all font-medium"
            >
              <span className="flex items-center justify-center gap-2">
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </span>
            </Button>
          </motion.div>
        </form>

        {/* Divider */}
        <motion.div variants={item} className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-black px-4 text-zinc-500 font-medium">Or</span>
          </div>
        </motion.div>

        {/* Google Login Button */}
        <motion.div variants={item} className="pb-2">
          <Button
            type="button"
            onClick={async () => {
              const supabase = createClient()
              const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { skipBrowserRedirect: true, redirectTo: 'http://localhost:3000/auth/callback' }
              })
              
              if (error) {
                setError(error.message)
                return
              }
              
              if (data?.url) {
                // Open a custom window to handle OAuth, setting the partition to persist:media
                // This ensures Google session cookies sync with the Watch Media webviews!
                const authWindow = window.open(
                  data.url,
                  '_blank',
                  'width=500,height=700,webPreferences=partition=persist:media'
                )
                
                // We need to poll or listen for the auth callback since we are in Electron.
                // A robust way without IPC is to listen to the window's location if it's not cross-origin blocked,
                // but since it's OAuth, it will be cross-origin until it redirects back to localhost.
                const pollTimer = setInterval(() => {
                  try {
                    if (authWindow?.closed) {
                      clearInterval(pollTimer)
                    }
                    if (authWindow?.location.href.includes('access_token=')) {
                      const hash = authWindow.location.hash.substring(1)
                      const params = new URLSearchParams(hash)
                      const access_token = params.get('access_token')
                      const refresh_token = params.get('refresh_token')
                      
                      if (access_token && refresh_token) {
                        supabase.auth.setSession({ access_token, refresh_token }).then(() => {
                          authWindow.close()
                          navigate('/dashboard')
                        })
                      }
                      clearInterval(pollTimer)
                    }
                  } catch (e) {
                    // Ignore DOMException for cross-origin tracking
                  }
                }, 500)
              }
            }}
            className="w-full h-12 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black text-black dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all font-medium flex items-center justify-center gap-3 shadow-sm"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign in with Google
          </Button>
        </motion.div>

        {/* Register Link */}
        <motion.div variants={item} className="text-center text-sm pt-2">
          <p className="text-zinc-500">
            Don&apos;t have an account?{' '}
            <Link
              to="/register"
              className="font-medium text-zinc-900 dark:text-white hover:underline underline-offset-4"
            >
              Sign up
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </AuthLayout>
  )
}
