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

        {/* Register Link */}
        <motion.div variants={item} className="text-center text-sm">
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
