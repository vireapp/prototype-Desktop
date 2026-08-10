'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AuthLayout } from '@/components/auth/auth-layout'
import { AnimatedInput } from '@/components/ui/animated-input'
import { ArrowRight, Lock, ShieldCheck, CheckCircle2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, Variants } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export function ResetPassword(): React.JSX.Element {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formState, setFormState] = useState({
    password: '',
    confirmPassword: ''
  })
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()

    if (formState.password !== formState.confirmPassword) {
      setError('Passwords do not match')
      toast.error('Passwords do not match')
      return
    }

    if (formState.password.length < 8) {
      setError('Password must be at least 8 characters')
      toast.error('Password must be at least 8 characters')
      return
    }

    setIsSubmitting(true)
    setError(null)

    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({
      password: formState.password
    })

    if (updateError) {
      setError(updateError.message)
      toast.error(updateError.message)
      setIsSubmitting(false)
    } else {
      setSuccess(true)
      setIsSubmitting(false)
      toast.success('Password updated successfully!')
    }
  }

  const updateField = (field: string, value: string): void => {
    setFormState((prev) => ({ ...prev, [field]: value }))
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
    <AuthLayout subtitle="Set your new access key.">
      <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
        {/* Header */}
        <motion.div variants={item} className="mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 mb-5">
            <ShieldCheck className="w-7 h-7 text-violet-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-heading tracking-tight text-white mb-2">
            New Access Key
          </h1>
          <p className="text-zinc-500 text-sm">
            {success
              ? 'Your password has been updated successfully'
              : 'Choose a strong password for your account'}
          </p>
        </motion.div>

        {success ? (
          /* ===== Success State ===== */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 60 }}
            className="space-y-6"
          >
            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 mb-4">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-white font-medium text-lg mb-2">Password Updated</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Your access key has been changed successfully. You can now log in with your new
                password.
              </p>
            </div>

            <Link to="/login" className="block">
              <Button className="group relative w-full h-13 overflow-hidden rounded-xl bg-white text-black font-bold text-base border-0 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_30px_-8px_rgba(255,255,255,0.2)]">
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-violet-500/15 to-transparent -translate-x-full group-hover:animate-shimmer" />
                <span className="flex items-center justify-center gap-2 relative z-10">
                  Go to Login
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
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
                className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-200 flex items-center gap-3 backdrop-blur-md"
              >
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_#ef4444] flex-shrink-0" />
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <motion.div variants={item}>
                <AnimatedInput
                  label="New Access Key"
                  name="password"
                  type="password"
                  icon={Lock}
                  required
                  enablePasswordToggle
                  value={formState.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  className="bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/20 focus:border-violet-500/50 focus:bg-white/[0.06] transition-all duration-300 h-14"
                />
              </motion.div>

              <motion.div variants={item}>
                <AnimatedInput
                  label="Confirm Access Key"
                  name="confirmPassword"
                  type="password"
                  icon={ShieldCheck}
                  required
                  enablePasswordToggle
                  value={formState.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  className="bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/20 focus:border-violet-500/50 focus:bg-white/[0.06] transition-all duration-300 h-14"
                />
              </motion.div>

              <motion.div variants={item}>
                <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3">
                  <p className="text-zinc-500 text-xs leading-relaxed">
                    <span className="text-zinc-400 font-medium">Tip:</span> Use at least 6
                    characters with a mix of letters, numbers, and symbols.
                  </p>
                </div>
              </motion.div>

              <motion.div variants={item} className="pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="group relative w-full h-13 overflow-hidden rounded-xl bg-white text-black font-bold text-base border-0 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_30px_-8px_rgba(255,255,255,0.2)] disabled:opacity-50 disabled:hover:scale-100"
                >
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-violet-500/15 to-transparent -translate-x-full group-hover:animate-shimmer" />
                  <span className="flex items-center justify-center gap-2 relative z-10">
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        Update Access Key
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </span>
                </Button>
              </motion.div>
            </form>
          </>
        )}
      </motion.div>
    </AuthLayout>
  )
}
