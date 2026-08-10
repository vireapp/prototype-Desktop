'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Crown,
  Sparkles,
  Flame,
  Zap,
  Sun,
  Moon,
  Settings,
  Timer,
  Target,
  Sunrise,
  Users
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { format } from 'date-fns'
import { getUserGamificationData } from '@/lib/gamification'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { usePresence } from '@/components/dashboard/presence-provider'
import { useInventoryStore } from '@/stores/use-inventory'

interface IdentityCardProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData: any
}

const renderFrame = (frameId: string | null) => {
  switch (frameId) {
    case 'frame-neon':
      return (
        <svg className="absolute inset-[-4px] lg:inset-[-6px] w-[calc(100%+8px)] lg:w-[calc(100%+12px)] h-[calc(100%+8px)] lg:h-[calc(100%+12px)] text-cyan-400 pointer-events-none z-20 drop-shadow-[0_0_6px_rgba(34,211,238,0.8)]" viewBox="0 0 100 100">
          <polygon points="50,2 95,25 95,75 50,98 5,75 5,25" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]" />
        </svg>
      )
    case 'frame-gold':
      return <div className="absolute inset-[6px] lg:inset-[8px] rounded-full ring-2 ring-amber-400 ring-offset-2 ring-offset-background shadow-[0_0_15px_rgba(251,191,36,0.4)] pointer-events-none z-20" />
    case 'frame-glitch':
      return <div className="absolute inset-[6px] lg:inset-[8px] rounded-full border-[3px] border-fuchsia-500 border-dashed animate-[spin_6s_linear_infinite] shadow-[0_0_10px_rgba(217,70,239,0.5)] pointer-events-none z-20" />
    default:
      return null
  }
}

const renderBanner = (bannerId: string | null) => {
  switch(bannerId) {
    case 'banner-aurora':
      return <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-cyan-500/10 to-transparent pointer-events-none opacity-60 animate-[pulse_4s_ease-in-out_infinite]" />
    case 'banner-neon-city':
      return <div className="absolute inset-0 bg-gradient-to-t from-fuchsia-600/10 via-purple-600/5 to-cyan-500/10 pointer-events-none" />
    case 'banner-ocean':
      return <div className="absolute inset-0 bg-gradient-to-tl from-blue-600/15 via-teal-500/5 to-transparent pointer-events-none opacity-80" />
    default:
      return null
  }
}

const renderProgressGradient = (progressId: string | null) => {
  switch(progressId) {
    case 'progress-flame':
      return (
        <linearGradient id="xpGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="50%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#b91c1c" />
        </linearGradient>
      )
    case 'progress-rainbow':
      return (
        <linearGradient id="xpGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ec4899" />
          <stop offset="33%" stopColor="#8b5cf6" />
          <stop offset="66%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      )
    case 'progress-electric':
      return (
        <linearGradient id="xpGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="50%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#e0f2fe" />
        </linearGradient>
      )
    default:
      return (
        <linearGradient id="xpGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(225, 85%, 62%)" />
          <stop offset="100%" stopColor="hsl(265, 45%, 58%)" />
        </linearGradient>
      )
  }
}

export function IdentityCard({ user, initialData }: IdentityCardProps): React.JSX.Element | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(initialData)
  const [greeting, setGreeting] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())
  const { userStatus, setUserStatus } = usePresence()
  const { equippedItems } = useInventoryStore()
  const activeFrame = equippedItems.frames
  const activeBanner = equippedItems.banners
  const activeProgress = equippedItems.progress

  useEffect(() => {
    const hour = new Date().getHours()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (hour < 5) setGreeting('Good Night')
    else if (hour < 12) setGreeting('Good Morning')
    else if (hour < 18) setGreeting('Good Afternoon')
    else setGreeting('Good Evening')

    const dataInterval = setInterval(async () => {
      const freshData = await getUserGamificationData()
      if (freshData) setData(freshData)
    }, 60000)

    const clockInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => {
      clearInterval(dataInterval)
      clearInterval(clockInterval)
    }
  }, [])

  if (!user || !data) return null

  return (
    <div className="relative overflow-hidden rounded-2xl p-6 lg:p-8 bg-card border border-border shadow-sm">
      {/* Dynamic Banner */}
      {renderBanner(activeBanner)}
      
      {/* Subtle ambient glow */}
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start gap-6 lg:gap-8">
        {/* Left: Avatar & Identity */}
        <div className="flex items-center gap-5">
          {/* Avatar with XP Ring */}
          <div className="relative group shrink-0">
            <div className="relative w-20 h-20 lg:w-24 lg:h-24 flex items-center justify-center">
              <svg
                className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
                viewBox="0 0 100 100"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  className="text-border"
                />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="46"
                  stroke="url(#xpGradient)"
                  strokeWidth="3"
                  fill="none"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: data.progress / 100 }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  strokeLinecap="round"
                  style={{
                    filter: (activeProgress === 'progress-electric' || activeProgress === 'progress-flame') ? 'url(#glow)' : 'none'
                  }}
                />
                <defs>
                  {renderProgressGradient(activeProgress)}
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2" result="glow"/>
                    <feMerge>
                      <feMergeNode in="glow"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
              </svg>

              <Avatar className="w-16 h-16 lg:w-20 lg:h-20 border-2 border-border">
                <AvatarImage src={user.profile?.avatar_url} className="object-cover" />
                <AvatarFallback className="text-xl bg-primary/10 text-primary font-semibold">
                  {user.profile?.username?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>

              {/* Render the equipped frame */}
              {renderFrame(activeFrame)}
            </div>

            {/* Level Badge */}
            <div className="absolute -bottom-1 -right-1 z-20">
              <div className="bg-gradient-to-r from-primary to-accent p-px rounded-full">
                <div className="bg-background text-foreground text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Crown className="w-3 h-3 text-primary" strokeWidth={2} />
                  <span>{data.level}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Name & Greeting */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium tracking-wider uppercase">
              <Sparkles className="w-3 h-3 text-amber-500" strokeWidth={2} />
              <span>{greeting}</span>
            </div>

            <h1 className="text-2xl lg:text-3xl font-semibold text-foreground tracking-tight leading-none">
              {user.profile?.full_name?.split(' ')[0] || user.profile?.username || 'Traveler'}
            </h1>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs bg-muted/50 px-2 py-1 rounded-md border border-border">
                <Zap className="w-3 h-3 text-amber-500" strokeWidth={2} />
                <span className="font-medium text-muted-foreground">{data.xp} XP</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="tabular-nums font-mono">{format(currentTime, 'HH:mm')}</span>
                <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/40" />
                <span>{format(currentTime, 'EEE, MMM d')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Stats & Controls */}
        <div className="flex-1 w-full md:max-w-sm ml-auto space-y-3">
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2">
            <StatItem
              icon={<Users className="w-3.5 h-3.5 text-primary" strokeWidth={1.5} />}
              value={data.activeFriends}
              label="Friends"
              delay={0.1}
            />
            <StatItem
              icon={<Zap className="w-3.5 h-3.5 text-orange-500" strokeWidth={1.5} />}
              value={data.activeRooms}
              label="Rooms"
              delay={0.15}
            />
            <StatItem
              value="3"
              label="Streak"
              icon={<Flame className="w-3.5 h-3.5 text-orange-500" strokeWidth={1.5} />}
              delay={0.2}
            />
          </div>

          {/* Control Row */}
          <div className="flex items-center gap-2">
            {/* Theme Switcher */}
            <div className="flex items-center gap-0.5 p-1 rounded-lg bg-muted/50 border border-border">
              <ThemeButton theme="light" icon={<Sun className="w-3 h-3" />} />
              <ThemeButton theme="dark" icon={<Moon className="w-3 h-3" />} />
              <ThemeButton theme="system" icon={<Settings className="w-3 h-3" />} />
            </div>

            {/* Status */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50 border border-border flex-1 overflow-x-auto scrollbar-hide">
              <StatusPill
                status="online"
                label="On"
                active={userStatus === 'online'}
                onClick={() => setUserStatus('online')}
              />
              <StatusPill
                status="in-room"
                label="Room"
                active={userStatus === 'in-room'}
                onClick={() => setUserStatus('in-room')}
              />
              <StatusPill
                status="invisible"
                label="Away"
                active={userStatus === 'invisible'}
                onClick={() => setUserStatus('invisible')}
              />
              <StatusPill
                status="offline"
                label="Off"
                active={userStatus === 'offline'}
                onClick={() => setUserStatus('offline')}
              />
            </div>

            {/* Edit Profile */}
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground hover:bg-muted border border-border rounded-lg"
            >
              <Link to="/dashboard/settings">Edit</Link>
            </Button>
          </div>

          {/* Achievements */}
          {data.achievements && data.achievements.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pt-1">
              {data.achievements.map((ua: { id: string; achievement: unknown }) => (
                <AchievementBadge key={ua.id} achievement={ua.achievement} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatItem({
  value,
  label,
  icon,
  delay
}: {
  value: string | number
  label: string
  icon?: React.ReactNode
  delay: number
}): React.JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-muted/30 border border-border transition-all hover:bg-muted/50"
    >
      <div className="flex items-center gap-1 mb-0.5">
        {icon}
        <span className="text-lg font-semibold text-foreground">{value}</span>
      </div>
      <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">
        {label}
      </span>
    </motion.div>
  )
}

function ThemeButton({ theme, icon }: { theme: string; icon: React.ReactNode }): React.JSX.Element {
  const { setTheme, theme: currentTheme } = useTheme()
  return (
    <button
      onClick={() => setTheme(theme)}
      className={`p-1.5 rounded-md transition-all ${
        currentTheme === theme
          ? 'bg-primary/15 text-primary shadow-sm'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      }`}
      title={`Set theme to ${theme}`}
    >
      {icon}
    </button>
  )
}

function StatusPill({
  status,
  label,
  active,
  onClick
}: {
  status: string
  label: string
  active?: boolean
  onClick?: () => void
}): React.JSX.Element {
  const dotColor =
    status === 'online'
      ? 'bg-emerald-500'
      : status === 'offline'
        ? 'bg-red-400'
        : status === 'in-room'
          ? 'bg-violet-500'
          : 'bg-zinc-400'

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all text-[10px] font-medium whitespace-nowrap cursor-pointer ${
        active
          ? 'bg-secondary text-foreground border border-border shadow-sm'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent'
      }`}
    >
      <div
        className={`w-1.5 h-1.5 rounded-full ${dotColor} ${active ? 'animate-pulse' : 'opacity-50'}`}
      />
      <span>{label}</span>
    </button>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const IconMap: any = {
  Sunrise: Sunrise,
  Users: Users,
  Moon: Moon,
  Target: Target,
  Timer: Timer,
  Flame: Flame,
  Zap: Zap,
  Crown: Crown
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AchievementBadge({ achievement }: { achievement: any }): React.JSX.Element {
  const Icon = IconMap[achievement.icon] || Sparkles

  return (
    <div className="group/badge relative flex flex-col items-center gap-1 min-w-[44px]">
      <div className="h-8 w-8 rounded-full bg-muted/30 border border-border flex items-center justify-center group-hover/badge:scale-110 transition-transform duration-200 group-hover/badge:border-primary/20 group-hover/badge:bg-primary/5">
        <Icon
          className="w-4 h-4 text-muted-foreground group-hover/badge:text-primary transition-colors duration-200"
          strokeWidth={1.5}
        />
      </div>
      <span className="text-[8px] font-medium text-muted-foreground text-center line-clamp-1 max-w-full opacity-0 group-hover/badge:opacity-100 transition-opacity absolute -bottom-4 bg-popover px-1.5 py-0.5 rounded border border-border whitespace-nowrap z-50 pointer-events-none">
        {achievement.name}
      </span>
    </div>
  )
}
