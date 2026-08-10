'use client'

import { useState, useRef } from 'react'
import { motion, Variants } from 'framer-motion'
import { ShieldCheck, Loader2, ArrowRight, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { registerSession } from '@/components/dashboard/settings/actions'
import { AuthLayout } from './auth-layout'

interface TwoFactorChallengeProps {
  factorId: string
  onSuccess: () => void
  onCancel: () => void
}

// ── Split OTP Input ──
function OtpInput({
  value,
  onChange,
  onComplete,
  disabled
}: {
  value: string
  onChange: (v: string) => void
  onComplete?: () => void
  disabled?: boolean
}): React.JSX.Element {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const digits = value.padEnd(6, '').split('').slice(0, 6)

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const next = value.slice(0, Math.max(0, value.length - 1))
      onChange(next)
      refs.current[Math.max(0, i - (value.length <= i ? 1 : 0))]?.focus()
      return
    }
    if (e.key === 'Enter' && value.length === 6) onComplete?.()
  }

  const handleChange = (i: number, e: React.ChangeEvent<HTMLInputElement>): void => {
    const ch = e.target.value.replace(/\D/g, '').slice(-1)
    if (!ch) return
    const arr = digits.map((d) => d || ' ')
    arr[i] = ch
    const next = arr.join('').replace(/ /g, '').slice(0, 6)
    onChange(next)
    if (i < 5) refs.current[i + 1]?.focus()
    if (next.length === 6) onComplete?.()
  }

  const handlePaste = (e: React.ClipboardEvent): void => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted) {
      onChange(pasted)
      refs.current[Math.min(5, pasted.length - 1)]?.focus()
      if (pasted.length === 6) onComplete?.()
    }
    e.preventDefault()
  }

  return (
    <div className="flex gap-2 justify-between" onPaste={handlePaste}>
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i] === ' ' || !digits[i] ? '' : digits[i]}
          onClick={() => refs.current[i]?.select()}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKey(i, e)}
          disabled={disabled}
          className={[
            'w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-mono rounded-xl border outline-none transition-all duration-200',
            digits[i] && digits[i] !== ' '
              ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white shadow-sm'
              : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-black dark:text-white hover:border-zinc-300 dark:hover:border-zinc-700',
            'focus:border-zinc-900 dark:focus:border-zinc-100 focus:bg-white dark:focus:bg-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100',
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          ].join(' ')}
        />
      ))}
    </div>
  )
}

export function TwoFactorChallenge({
  factorId,
  onSuccess,
  onCancel
}: TwoFactorChallengeProps): React.JSX.Element {
  const [code, setCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleVerify = async (): Promise<void> => {
    if (code.length < 6) return
    setIsVerifying(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code
      })

      if (verifyError) {
        setError('Invalid code. Please check your authenticator app and try again.')
        setCode('')
        setIsVerifying(false)
        return
      }

      // Register the session after successful 2FA
      await registerSession()
      onSuccess()
    } catch (err) {
      setError('Something went wrong. Please try again.')
      setIsVerifying(false)
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

  return (
    <AuthLayout subtitle="Protecting your account.">
      <motion.div className="space-y-8 mt-6" variants={container} initial="hidden" animate="show">
        {/* Header */}
        <motion.div variants={item} className="mb-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 mb-6">
            <ShieldCheck className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">Two-Factor Verification</h1>
          <p className="text-zinc-500 text-sm">
            Open your authenticator app and enter the 6-digit code.
          </p>
        </motion.div>

        {/* Error message */}
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

        <motion.div variants={item} className="space-y-6">
          {/* OTP input */}
          <OtpInput
            value={code}
            onChange={setCode}
            onComplete={handleVerify}
            disabled={isVerifying}
          />

          {/* Verify button */}
          <Button
            onClick={handleVerify}
            disabled={isVerifying || code.length < 6}
            className="w-full h-12 rounded-lg bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-all font-medium disabled:opacity-50"
          >
            <span className="flex items-center justify-center gap-2">
              {isVerifying ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  Verify Identity
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </span>
          </Button>

          {/* Cancel */}
          <div className="text-center pt-2">
            <button
              onClick={onCancel}
              className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              Sign in with a different account
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AuthLayout>
  )
}
