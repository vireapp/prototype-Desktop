import { useState, useCallback } from 'react'
import { completeProfile } from './actions'
import { AvatarUpload } from '@/components/avatar-upload'
import { Button } from '@/components/ui/button'
import { AnimatedInput } from '@/components/ui/animated-input'
import { DatePickerField } from '@/components/ui/date-picker-field'
import { WarpTransition } from '@/components/auth/warp-transition'
import { motion, Variants } from 'framer-motion'
import { Wand2, UserPlus, Zap, ArrowRight, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

export default function OnboardingForm() {
  const navigate = useNavigate()
  const [avatar, setAvatar] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showWarp, setShowWarp] = useState(false)
  const [error, setError] = useState('')
  const [dob, setDob] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    const formData = new FormData(e.currentTarget)

    if (avatar) {
      formData.set('avatarUrl', avatar)
    }

    const result = await completeProfile(formData)

    if (result?.error) {
      setError(result.error)
      toast.error(result.error)
      setIsSubmitting(false)
    } else {
      // Success → show warp animation
      setShowWarp(true)
    }
  }

  const handleGenerateAiAvatar = () => {
    const seed = Math.random().toString(36).substring(7)
    const newAvatarUrl = `https://api.dicebear.com/9.x/notionists/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`
    setAvatar(newAvatarUrl)
    toast.success('New identity generated')
  }

  const handleWarpComplete = useCallback(() => {
    navigate('/dashboard')
  }, [navigate])

  // Animation variants
  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.05 }
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

  if (showWarp) {
    return <WarpTransition onComplete={handleWarpComplete} mode="full" />
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2 font-heading">
          Establish Presence
        </h1>
        <p className="text-zinc-500 text-sm">Configure your digital avatar and identity details</p>
      </motion.div>

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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Section */}
        <motion.div variants={item} className="flex flex-col items-center gap-4">
          <div className="relative group">
            <div className="w-28 h-28 rounded-full overflow-hidden ring-2 ring-white/[0.06] bg-white/[0.03]">
              <AvatarUpload value={avatar} onUploadComplete={setAvatar} />
            </div>

            {/* Generator Button */}
            <Button
              type="button"
              size="icon"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleGenerateAiAvatar()
              }}
              className="absolute bottom-0 right-0 rounded-full w-9 h-9 bg-violet-600 hover:bg-violet-500 text-white border-2 border-[#050507] shadow-lg transition-transform hover:scale-110 active:scale-95 z-50"
              title="Generate AI Avatar"
            >
              <Wand2 className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-zinc-600 uppercase tracking-[0.15em]">Upload or Generate</p>
          <input type="hidden" name="avatarUrl" value={avatar} />
        </motion.div>

        {/* Form Fields */}
        <motion.div variants={item} className="space-y-4">
          <AnimatedInput
            label="Public Handle (Username)"
            name="username"
            icon={Zap}
            required
            minLength={3}
            placeholder="unique_handle"
            className="bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/20 focus:border-violet-500/50 focus:bg-white/[0.06] transition-all duration-300 h-14"
          />

          <AnimatedInput
            label="Full Identification"
            name="fullName"
            icon={UserPlus}
            required
            placeholder="John Doe"
            className="bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/20 focus:border-violet-500/50 focus:bg-white/[0.06] transition-all duration-300 h-14"
          />

          <DatePickerField
            label="Date of Origin"
            name="dob"
            icon={Calendar}
            required
            value={dob}
            onChange={setDob}
          />
        </motion.div>

        {/* Submit */}
        <motion.div variants={item} className="pt-2">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="group relative w-full h-13 overflow-hidden bg-white text-black font-bold rounded-xl border-0 shadow-[0_0_30px_-8px_rgba(255,255,255,0.2)] transition-all active:scale-[0.98] hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-violet-500/15 to-transparent -translate-x-full group-hover:animate-shimmer" />
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2 relative z-10">
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Initializing...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2 relative z-10">
                Complete Initialization
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
            )}
          </Button>
        </motion.div>
      </form>
    </motion.div>
  )
}
