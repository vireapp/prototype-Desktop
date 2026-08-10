import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart,
  Users,
  Home,
  ChevronRight,
  ChevronLeft,
  Loader2,
  X,
  Sparkles,
  Music,
  Gamepad2,
  Book,
  Film,
  Coffee,
  Dumbbell,
  Palette,
  Globe,
  Code2,
  Utensils
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Gender, MatchPref, RoomType } from './actions'
import { joinDuoQueue } from './actions'

// ─── Constants ───────────────────────────────────────────────────────────────

const INTEREST_OPTIONS = [
  { label: 'Music', icon: Music },
  { label: 'Gaming', icon: Gamepad2 },
  { label: 'Reading', icon: Book },
  { label: 'Movies', icon: Film },
  { label: 'Coffee', icon: Coffee },
  { label: 'Fitness', icon: Dumbbell },
  { label: 'Art', icon: Palette },
  { label: 'Travel', icon: Globe },
  { label: 'Tech', icon: Code2 },
  { label: 'Cooking', icon: Utensils }
]

const HOBBY_OPTIONS = [
  'Photography', 'Writing', 'Dancing', 'Hiking', 'Yoga',
  'Gardening', 'Anime', 'Podcasts', 'Journaling', 'Chess',
  'Painting', 'Cycling', 'Meditation', 'Stand-up Comedy', 'DIY'
]

const ROOM_TYPES: { type: RoomType; label: string; emoji: string; desc: string; color: string; glow: string }[] = [
  {
    type: 'romantic',
    label: 'Romantic',
    emoji: '🌹',
    desc: 'Find a special connection and build something meaningful together.',
    color: 'from-rose-500/20 to-pink-500/20 border-rose-500/30',
    glow: 'shadow-rose-500/20'
  },
  {
    type: 'friends',
    label: 'Friends',
    emoji: '👫',
    desc: 'Meet someone awesome to hang out, game, and vibe with.',
    color: 'from-blue-500/20 to-violet-500/20 border-blue-500/30',
    glow: 'shadow-blue-500/20'
  },
  {
    type: 'family',
    label: 'Family',
    emoji: '👨‍👩‍👧',
    desc: 'A warm space for trusted bonds, support, and shared memories.',
    color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30',
    glow: 'shadow-amber-500/20'
  }
]

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface WizardProps {
  onClose: () => void
  onMatching: (queueId: string, roomType: RoomType) => void
}

interface StepProps {
  data: WizardData
  setData: React.Dispatch<React.SetStateAction<WizardData>>
  onNext: () => void
  onBack: () => void
}

interface WizardData {
  gender: Gender | ''
  matchPref: MatchPref | ''
  interests: string[]
  hobbies: string[]
  likes: string
  dislikes: string
  roomType: RoomType | ''
}

// ─── Step 1: Gender + Match Preference ────────────────────────────────────────

function StepGender({ data, setData, onNext }: StepProps) {
  const genders: { value: Gender; label: string; emoji: string }[] = [
    { value: 'M', label: 'Male', emoji: '♂️' },
    { value: 'F', label: 'Female', emoji: '♀️' },
    { value: 'other', label: 'Other', emoji: '⚧️' }
  ]
  const prefs: { value: MatchPref; label: string }[] = [
    { value: 'M', label: 'Male' },
    { value: 'F', label: 'Female' },
    { value: 'any', label: 'Anyone' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-foreground mb-1">I identify as</h3>
        <div className="grid grid-cols-3 gap-2.5">
          {genders.map((g) => (
            <button
              key={g.value}
              onClick={() => setData((d) => ({ ...d, gender: g.value }))}
              className={cn(
                'flex flex-col items-center justify-center gap-1.5 py-4 rounded-xl border transition-all duration-200',
                data.gender === g.value
                  ? 'bg-primary/15 border-primary/60 shadow-[0_0_16px_rgba(var(--primary-rgb),0.2)]'
                  : 'bg-muted/20 border-border/40 hover:bg-muted/40 hover:border-border/70'
              )}
            >
              <span className="text-2xl">{g.emoji}</span>
              <span className="text-xs font-semibold text-foreground">{g.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-base font-semibold text-foreground mb-1">I want to match with</h3>
        <div className="grid grid-cols-3 gap-2.5">
          {prefs.map((p) => (
            <button
              key={p.value}
              onClick={() => setData((d) => ({ ...d, matchPref: p.value }))}
              className={cn(
                'py-3 rounded-xl border text-sm font-semibold transition-all duration-200',
                data.matchPref === p.value
                  ? 'bg-primary/15 border-primary/60 text-primary shadow-[0_0_16px_rgba(var(--primary-rgb),0.2)]'
                  : 'bg-muted/20 border-border/40 text-muted-foreground hover:bg-muted/40 hover:text-foreground'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <Button
        onClick={onNext}
        disabled={!data.gender || !data.matchPref}
        className="w-full h-11 bg-primary hover:bg-primary/90 font-semibold rounded-xl gap-2"
      >
        Continue <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  )
}

// ─── Step 2: Interests + Hobbies ──────────────────────────────────────────────

function StepInterests({ data, setData, onNext, onBack }: StepProps) {
  const toggleInterest = (label: string) => {
    setData((d) => ({
      ...d,
      interests: d.interests.includes(label)
        ? d.interests.filter((i) => i !== label)
        : [...d.interests, label]
    }))
  }

  const toggleHobby = (h: string) => {
    setData((d) => ({
      ...d,
      hobbies: d.hobbies.includes(h) ? d.hobbies.filter((x) => x !== h) : [...d.hobbies, h]
    }))
  }

  return (
    <div className="space-y-5">
      {/* Interests */}
      <div>
        <h3 className="text-base font-semibold text-foreground mb-0.5">Your Interests</h3>
        <p className="text-xs text-muted-foreground mb-3">Pick at least 2 that match your vibe</p>
        <div className="grid grid-cols-5 gap-2">
          {INTEREST_OPTIONS.map(({ label, icon: Icon }) => {
            const active = data.interests.includes(label)
            return (
              <button
                key={label}
                onClick={() => toggleInterest(label)}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl border text-[11px] font-medium transition-all',
                  active
                    ? 'bg-primary/20 border-primary/50 text-primary'
                    : 'bg-muted/20 border-border/40 text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Hobbies */}
      <div>
        <h3 className="text-base font-semibold text-foreground mb-3">Hobbies</h3>
        <div className="flex flex-wrap gap-1.5">
          {HOBBY_OPTIONS.map((h) => {
            const active = data.hobbies.includes(h)
            return (
              <button
                key={h}
                onClick={() => toggleHobby(h)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium border transition-all',
                  active
                    ? 'bg-primary/20 border-primary/50 text-primary'
                    : 'bg-muted/20 border-border/40 text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                )}
              >
                {h}
              </button>
            )
          })}
        </div>
      </div>

      {/* Likes / Dislikes */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-emerald-400">I love ❤️</label>
          <textarea
            value={data.likes}
            onChange={(e) => setData((d) => ({ ...d, likes: e.target.value }))}
            placeholder="e.g. late night chats, sunsets..."
            rows={2}
            className="w-full text-xs rounded-lg border border-border/40 bg-muted/20 px-3 py-2 text-foreground placeholder:text-muted-foreground/40 resize-none focus:outline-none focus:border-primary/40"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-rose-400">I dislike 👎</label>
          <textarea
            value={data.dislikes}
            onChange={(e) => setData((d) => ({ ...d, dislikes: e.target.value }))}
            placeholder="e.g. negativity, ghosting..."
            rows={2}
            className="w-full text-xs rounded-lg border border-border/40 bg-muted/20 px-3 py-2 text-foreground placeholder:text-muted-foreground/40 resize-none focus:outline-none focus:border-primary/40"
          />
        </div>
      </div>

      <div className="flex gap-2.5">
        <Button variant="outline" onClick={onBack} className="h-11 px-5 rounded-xl border-border/50">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button
          onClick={onNext}
          disabled={data.interests.length < 2}
          className="flex-1 h-11 bg-primary hover:bg-primary/90 font-semibold rounded-xl gap-2"
        >
          Continue <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

// ─── Step 3: Room Type ────────────────────────────────────────────────────────

function StepRoomType({ data, setData, onNext, onBack }: StepProps) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-foreground mb-0.5">What kind of connection?</h3>
        <p className="text-xs text-muted-foreground mb-4">This shapes your room's unlockable features</p>
        <div className="space-y-3">
          {ROOM_TYPES.map((rt) => (
            <button
              key={rt.type}
              onClick={() => setData((d) => ({ ...d, roomType: rt.type }))}
              className={cn(
                'w-full flex items-center gap-4 p-4 rounded-xl border bg-gradient-to-r text-left transition-all duration-200',
                data.roomType === rt.type
                  ? `${rt.color} shadow-lg ${rt.glow}`
                  : 'from-muted/10 to-muted/10 border-border/40 hover:border-border/70 hover:bg-muted/20'
              )}
            >
              <span className="text-3xl">{rt.emoji}</span>
              <div>
                <p className="font-semibold text-sm text-foreground">{rt.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{rt.desc}</p>
              </div>
              {data.roomType === rt.type && (
                <div className="ml-auto w-5 h-5 rounded-full bg-primary/80 flex items-center justify-center shrink-0">
                  <span className="text-[10px] text-white font-bold">✓</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2.5">
        <Button variant="outline" onClick={onBack} className="h-11 px-5 rounded-xl border-border/50">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button
          onClick={onNext}
          disabled={!data.roomType}
          className="flex-1 h-11 bg-primary hover:bg-primary/90 font-semibold rounded-xl gap-2"
        >
          Find My Match <Sparkles className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

// ─── Main Wizard Component ─────────────────────────────────────────────────────

export function DuoWizard({ onClose, onMatching }: WizardProps) {
  const [step, setStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState<WizardData>({
    gender: '',
    matchPref: '',
    interests: [],
    hobbies: [],
    likes: '',
    dislikes: '',
    roomType: ''
  })

  const steps = ['Identity', 'Interests', 'Room Type']

  const handleSubmit = async () => {
    if (!data.gender || !data.matchPref || !data.roomType) return
    setIsSubmitting(true)
    setError('')

    const res = await joinDuoQueue({
      gender: data.gender as Gender,
      matchPref: data.matchPref as MatchPref,
      interests: data.interests,
      hobbies: data.hobbies,
      likes: data.likes,
      dislikes: data.dislikes,
      roomType: data.roomType as RoomType
    })

    if (res.error) {
      setError(res.error)
      setIsSubmitting(false)
      return
    }

    onMatching(res.queueId!, data.roomType as RoomType)
  }

  const stepProps: StepProps = {
    data,
    setData,
    onNext: step < 2 ? () => setStep((s) => s + 1) : handleSubmit,
    onBack: () => setStep((s) => s - 1)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500/30 to-pink-500/30 border border-rose-500/30 flex items-center justify-center">
            <Heart className="w-4 h-4 text-rose-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">Find a Duo</h2>
            <p className="text-[10px] text-muted-foreground">Step {step + 1} of {steps.length}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 pt-4">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={cn(
              'flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold border transition-all duration-300',
              i < step
                ? 'bg-primary border-primary text-white'
                : i === step
                  ? 'bg-primary/20 border-primary/60 text-primary'
                  : 'bg-muted/20 border-border/40 text-muted-foreground/50'
            )}>
              {i < step ? '✓' : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className={cn(
                'w-8 h-px transition-all duration-300',
                i < step ? 'bg-primary/60' : 'bg-border/40'
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Step label */}
      <p className="text-center text-xs font-medium text-muted-foreground mt-1.5">{steps[step]}</p>

      {/* Error */}
      {error && (
        <div className="mx-5 mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive font-medium">
          {error}
        </div>
      )}

      {/* Step content */}
      <div className="flex-1 overflow-y-auto p-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          >
            {step === 0 && <StepGender {...stepProps} />}
            {step === 1 && <StepInterests {...stepProps} />}
            {step === 2 && (
              <StepRoomType
                {...stepProps}
                onNext={handleSubmit}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {isSubmitting && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm font-semibold text-foreground">Joining the queue...</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sub-exports for convenience ─────────────────────────────────────────────

export { ROOM_TYPES }
export type { RoomType, WizardData }
