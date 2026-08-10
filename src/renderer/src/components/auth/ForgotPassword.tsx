import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AuthLayout } from '@/components/auth/auth-layout'
import { AnimatedInput } from '@/components/ui/animated-input'
import { ArrowLeft, ArrowRight, Mail, KeyRound, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion, Variants } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export function ForgotPassword(): React.JSX.Element {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const supabase = createClient()

    // Determine the redirect URL
    // In Electron, we might want the user to stay on the web for reset,
    // or we can use a custom protocol if configured.
    // For now, let's use the site URL.
    const siteUrl = import.meta.env.VITE_SITE_URL || 'https://www.xvire.in'

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/callback?next=/reset-password`
    })

    if (resetError) {
      setError(resetError.message)
      toast.error(resetError.message)
      setIsSubmitting(false)
    } else {
      setSent(true)
      setIsSubmitting(false)
      toast.success('Recovery link sent!')
    }
  }

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 }
    }
  }

  const item: Variants = {
    hidden: { y: 16, opacity: 0 },
    show: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 60, damping: 14 }
    }
  }

  return (
    <AuthLayout subtitle="Reset your password to get back in.">
      <motion.div className="space-y-6 mt-6" variants={container} initial="hidden" animate="show">
        {/* Header */}
        <motion.div variants={item} className="mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 mb-6">
            <KeyRound className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">Reset password</h1>
          <p className="text-zinc-500 text-sm">
            {sent
              ? 'Check your inbox for the reset link.'
              : "Enter your email and we'll send you a recovery link."}
          </p>
        </motion.div>

        {sent ? (
          /* ===== Success State ===== */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 60 }}
            className="space-y-6"
          >
            <div className="rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-medium text-lg mb-2">Recovery Link Sent</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">
                We sent a password reset link to{' '}
                <span className="font-medium text-zinc-900 dark:text-zinc-100">{email}</span>. Check
                your inbox and click the link to reset your password.
              </p>
            </div>

            <div className="text-center">
              <p className="text-zinc-500 text-xs leading-relaxed mb-6">
                Didn't receive it? Check your spam folder or wait a few minutes.
              </p>
            </div>

            <Link to="/login" className="block">
              <Button
                variant="outline"
                className="w-full h-12 rounded-lg border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all font-medium text-zinc-700 dark:text-zinc-300"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </Link>
          </motion.div>
        ) : (
          /* ===== Form State ===== */
          <>
            {/* Error */}
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

            <form onSubmit={handleSubmit} className="space-y-6">
              <motion.div variants={item}>
                <AnimatedInput
                  label="Email address"
                  name="email"
                  type="email"
                  icon={Mail}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
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
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Recovery Link
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </span>
                </Button>
              </motion.div>
            </form>

            {/* Back to Login */}
            <motion.div variants={item} className="text-center text-sm pt-4">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Login
              </Link>
            </motion.div>
          </>
        )}
      </motion.div>
    </AuthLayout>
  )
}
