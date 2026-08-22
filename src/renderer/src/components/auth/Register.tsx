import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AuthLayout } from '@/components/auth/auth-layout'
import { AnimatedInput } from '@/components/ui/animated-input'
import { DatePickerField } from '@/components/ui/date-picker-field'
import { PasswordStrength, validatePassword } from '@/components/ui/password-strength'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import { ArrowRight, ArrowLeft, Lock, Mail, UserPlus, Zap, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { Link, useNavigate } from 'react-router-dom'
import { createClient } from '@/lib/supabase/client'
import { SignupProgress } from './signup-progress'

type Step = 1 | 2

export function Register(): React.JSX.Element {
  const [step, setStep] = useState<Step>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showProgress, setShowProgress] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const navigate = useNavigate()

  // Persist form data across steps
  const [formState, setFormState] = useState({
    email: '',
    password: '',
    fullName: '',
    username: '',
    dob: ''
  })

  const handleNext = (): void => {
    // Validate step 1 fields
    if (!formState.email || !formState.password) {
      toast.error('Please fill in all fields')
      return
    }
    // Strict password validation
    const { isValid } = validatePassword(formState.password)
    if (!isValid) {
      toast.error('Please meet all password requirements')
      return
    }
    setStep(2)
  }

  const handleBack = (): void => {
    setStep(1)
  }

  const handleSubmit = async (): Promise<void> => {
    // Validate step 2 fields
    if (!formState.fullName || !formState.username || !formState.dob) {
      toast.error('Please fill in all fields')
      return
    }
    if (formState.username.length < 3) {
      toast.error('Username must be at least 3 characters')
      return
    }
    if (!agreed) {
      toast.error('Please agree to the Terms of Service and Privacy Policy')
      return
    }

    setIsSubmitting(true)

    const supabase = createClient()

    try {
      // 1. Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formState.email,
        password: formState.password,
        options: {
          data: {
            full_name: formState.fullName,
            username: formState.username
          }
        }
      })

      if (authError) {
        toast.error(authError.message)
        setIsSubmitting(false)
        return
      }

      if (authData.user) {
        // 2. Create the profile immediately
        const avatarUrl = `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(formState.username)}`

        const { error: profileError } = await supabase.from('profiles').insert({
          id: authData.user.id,
          username: formState.username,
          full_name: formState.fullName,
          date_of_birth: formState.dob,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })

        if (profileError) {
          console.error('Profile creation failed (falling back to onboarding):', profileError)
          // We don't stop the user here, we let them proceed to onboarding later if needed
        }

        setShowProgress(true)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Registration failed')
      setIsSubmitting(false)
    }
  }

  const handleProgressComplete = (): void => {
    setShowProgress(false)
    navigate('/onboarding')
  }

  const updateField = (field: string, value: string): void => {
    setFormState((prev) => ({ ...prev, [field]: value }))
  }

  // Slide animation direction
  const slideVariants: Variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 60 : -60,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -60 : 60,
      opacity: 0
    })
  }

  const fadeIn: Variants = {
    hidden: { opacity: 0, y: 12 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 60, damping: 14 }
    }
  }

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.06, delayChildren: 0.05 }
    }
  }

  if (showProgress) {
    return <SignupProgress onComplete={handleProgressComplete} />
  }

  return (
    <AuthLayout subtitle="Start your journey.">
      <motion.div variants={container} initial="hidden" animate="show" className="mt-6">
        {/* Header — stays the same across steps */}
        <motion.div variants={fadeIn} className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight mb-2">Create an account</h1>
          <p className="text-zinc-500 text-sm">It only takes a minute to get started.</p>
        </motion.div>

        {/* Step Indicator */}
        <motion.div variants={fadeIn} className="mb-8">
          <div className="flex items-center gap-3">
            <StepDot active={step === 1} completed={step > 1} number={1} />
            <div
              className={`h-px flex-1 transition-all duration-500 ${step > 1 ? 'bg-black dark:bg-white' : 'bg-zinc-200 dark:bg-zinc-800'}`}
            />
            <StepDot active={step === 2} completed={false} number={2} />
          </div>
          <div className="flex justify-between mt-2 px-1">
            <span
              className={`text-xs font-medium transition-colors ${step === 1 ? 'text-black dark:text-white' : 'text-zinc-500'}`}
            >
              Credentials
            </span>
            <span
              className={`text-xs font-medium transition-colors ${step === 2 ? 'text-black dark:text-white' : 'text-zinc-500'}`}
            >
              Profile
            </span>
          </div>
        </motion.div>

        {/* Step Content */}
        <motion.div variants={fadeIn}>
          <AnimatePresence mode="wait" custom={step === 1 ? -1 : 1}>
            {step === 1 && (
              <motion.div
                key="step-1"
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                className="space-y-6"
              >
                <AnimatedInput
                  label="Email address"
                  name="email"
                  type="email"
                  icon={Mail}
                  required
                  value={formState.email}
                  onChange={(e) => updateField('email', e.target.value)}
                />

                <div>
                  <AnimatedInput
                    label="Password"
                    name="password"
                    type="password"
                    icon={Lock}
                    required
                    enablePasswordToggle
                    value={formState.password}
                    onChange={(e) => updateField('password', e.target.value)}
                  />
                  <PasswordStrength password={formState.password} className="mt-3" />
                </div>

                <div className="pt-2">
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="w-full h-12 rounded-lg bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-all font-medium"
                  >
                    <span className="flex items-center justify-center gap-2">
                      Continue
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step-2"
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                className="space-y-6"
              >
                <AnimatedInput
                  label="Full Name"
                  name="fullName"
                  type="text"
                  icon={UserPlus}
                  required
                  value={formState.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                />

                <AnimatedInput
                  label="Username"
                  name="username"
                  type="text"
                  icon={Zap}
                  required
                  minLength={3}
                  value={formState.username}
                  onChange={(e) => updateField('username', e.target.value)}
                />

                <DatePickerField
                  label="Date of birth"
                  name="dob"
                  icon={Calendar}
                  required
                  value={formState.dob}
                  onChange={(val) => updateField('dob', val)}
                />

                <div className="flex items-start space-x-3 pt-2">
                  <div className="flex items-center h-5">
                    <input
                      id="terms"
                      name="terms"
                      type="checkbox"
                      className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-black dark:text-white bg-zinc-50 dark:bg-zinc-900 focus:ring-black dark:focus:ring-white transition-all cursor-pointer accent-black dark:accent-white"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                    />
                  </div>
                  <div className="text-sm">
                    <label
                      htmlFor="terms"
                      className="font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer"
                    >
                      Terms and Privacy
                    </label>
                    <p className="text-zinc-500 text-xs mt-1">
                      By signing up, you agree to our{' '}
                      <Link
                        to="/terms"
                        className="underline hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                      >
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link
                        to="/privacy"
                        className="underline hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                      >
                        Privacy Policy
                      </Link>
                      .
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    onClick={handleBack}
                    variant="outline"
                    className="h-12 w-24 rounded-lg border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 h-12 rounded-lg bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-all font-medium disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Creating...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        Create account
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Divider */}
        <motion.div variants={fadeIn} className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-black px-4 text-zinc-500 font-medium">Or</span>
          </div>
        </motion.div>

        {/* Google Signup Button */}
        <motion.div variants={fadeIn} className="mb-6">
          <Button
            type="button"
            onClick={async () => {
              const supabase = createClient()
              const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { skipBrowserRedirect: true, redirectTo: 'http://localhost:3000/auth/callback' }
              })
              
              if (error) {
                toast.error(error.message)
                return
              }
              
              if (data?.url) {
                const authWindow = window.open(
                  data.url,
                  '_blank',
                  'width=500,height=700,webPreferences=partition=persist:media'
                )
                
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
                          navigate('/onboarding')
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
            Sign up with Google
          </Button>
        </motion.div>

        {/* Login Link */}
        <motion.div variants={fadeIn} className="text-center text-sm pt-2">
          <p className="text-zinc-500">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-zinc-900 dark:text-white hover:underline underline-offset-4"
            >
              Sign in
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </AuthLayout>
  )
}

/* ============================
   Step Dot Indicator
   ============================ */
function StepDot({
  active,
  completed,
  number
}: {
  active: boolean
  completed: boolean
  number: number
}): React.JSX.Element {
  return (
    <div
      className={`relative flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all duration-300 ${
        active
          ? 'bg-black text-white dark:bg-white dark:text-black border border-transparent shadow-sm'
          : completed
            ? 'bg-black text-white dark:bg-white dark:text-black border border-transparent'
            : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-900 dark:text-zinc-600 border border-zinc-200 dark:border-zinc-800'
      }`}
    >
      {completed ? (
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        number
      )}
    </div>
  )
}
