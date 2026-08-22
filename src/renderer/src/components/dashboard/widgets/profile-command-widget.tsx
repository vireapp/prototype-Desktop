import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Crown, Flame, Zap, Sun, Moon, Settings, Users, ChevronDown, Edit3, Sunrise, Target, Timer, Sparkles } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { format } from 'date-fns'
import { useTheme } from 'next-themes'
import { Link } from 'react-router-dom'
import { usePresence } from '@/components/dashboard/presence-provider'
import { useInventoryStore } from '@/stores/use-inventory'
import { getUserGamificationData } from '@/lib/gamification'
import { Button } from '@/components/ui/button'

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

  const tierColors: Record<string, string> = {
    bronze: 'border-orange-800/50 text-orange-700 bg-orange-700/10',
    silver: 'border-slate-400/50 text-slate-400 bg-slate-400/10',
    gold: 'border-amber-400/50 text-amber-400 bg-amber-400/10',
    platinum: 'border-cyan-400/50 text-cyan-400 bg-cyan-400/10',
  }
  const colorClass = tierColors[achievement.tier || 'bronze'] || 'border-border text-muted-foreground bg-muted/30'

  return (
    <div className="group/badge relative flex flex-col items-center gap-1 min-w-[40px]">
      <div className={`h-7 w-7 rounded-full ${colorClass} border flex items-center justify-center group-hover/badge:scale-110 transition-transform duration-200 group-hover/badge:border-primary/50 group-hover/badge:bg-primary/10`}>
        <Icon
          className="w-3.5 h-3.5 transition-colors duration-200"
          strokeWidth={1.5}
        />
      </div>
      <span className="text-[7px] font-medium text-muted-foreground text-center line-clamp-1 max-w-full opacity-0 group-hover/badge:opacity-100 transition-opacity absolute -bottom-4 bg-popover px-1.5 py-0.5 rounded border border-border whitespace-nowrap z-50 pointer-events-none">
        {achievement.name}
      </span>
    </div>
  )
}

const renderFrame = (frameId: string | null) => {
  switch (frameId) {
    case 'frame-neon':
      return (
        <svg className="absolute inset-[-3px] w-[calc(100%+6px)] h-[calc(100%+6px)] text-cyan-400 pointer-events-none z-20 drop-shadow-[0_0_4px_rgba(34,211,238,0.8)]" viewBox="0 0 100 100">
          <polygon points="50,2 95,25 95,75 50,98 5,75 5,25" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]" />
        </svg>
      )
    case 'frame-gold':
      return <div className="absolute inset-[4px] rounded-full ring-2 ring-amber-400 ring-offset-2 ring-offset-background shadow-[0_0_10px_rgba(251,191,36,0.4)] pointer-events-none z-20" />
    case 'frame-glitch':
      return <div className="absolute inset-[4px] rounded-full border-[2px] border-fuchsia-500 border-dashed animate-[spin_6s_linear_infinite] shadow-[0_0_8px_rgba(217,70,239,0.5)] pointer-events-none z-20" />
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
  switch (progressId) {
    case 'progress-flame':
      return (
        <linearGradient id="pqGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
      )
    case 'progress-rainbow':
      return (
        <linearGradient id="pqGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ec4899" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      )
    default:
      return (
        <linearGradient id="pqGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(225,85%,62%)" />
          <stop offset="100%" stopColor="hsl(265,45%,58%)" />
        </linearGradient>
      )
  }
}

const STATUS_CONFIG = {
  online: { color: 'bg-emerald-500', label: 'Online', shadow: 'shadow-emerald-500/30' },
  'in-room': { color: 'bg-violet-500', label: 'In Room', shadow: 'shadow-violet-500/30' },
  invisible: { color: 'bg-zinc-400', label: 'Away', shadow: '' },
  offline: { color: 'bg-red-400', label: 'Offline', shadow: '' },
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ProfileCommandWidget({ user }: { user: any }) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [greeting, setGreeting] = useState('')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [gameData, setGameData] = useState<any>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const { theme, setTheme } = useTheme()
  const { userStatus, setUserStatus } = usePresence()
  const { coins, equippedItems } = useInventoryStore()
  const activeProgress = equippedItems.progress
  const activeFrame = equippedItems.frames
  const activeBanner = equippedItems.banners

  useEffect(() => {
    const h = new Date().getHours()
    if (h < 5) setGreeting('Good Night')
    else if (h < 12) setGreeting('Good Morning')
    else if (h < 18) setGreeting('Good Afternoon')
    else setGreeting('Good Evening')

    const clock = setInterval(() => setCurrentTime(new Date()), 1000)
    const refresh = setInterval(async () => {
      const d = await getUserGamificationData()
      if (d) setGameData(d)
    }, 60_000)

    getUserGamificationData().then((d) => { if (d) setGameData(d) })

    return () => { clearInterval(clock); clearInterval(refresh) }
  }, [])

  if (!user) return null

  const profile = user.profile || {}
  const level = gameData?.level ?? profile.level ?? 1
  const xp = gameData?.xp ?? 0
  const progress = gameData?.progress ?? 0
  const nextLevelXP = gameData?.nextLevelXP ?? 100
  const xpRemaining = Math.max(0, nextLevelXP - xp)
  const statusCfg = STATUS_CONFIG[userStatus] || STATUS_CONFIG.online
  const themes: { id: string; icon: React.ReactNode; label: string }[] = [
    { id: 'light', icon: <Sun className="w-3.5 h-3.5" />, label: 'Light' },
    { id: 'dark', icon: <Moon className="w-3.5 h-3.5" />, label: 'Dark' },
    { id: 'system', icon: <Settings className="w-3.5 h-3.5" />, label: 'Auto' },
  ]

  return (
    <div className="rounded-xl overflow-hidden relative bg-card border border-border">
      {/* Dynamic Banner */}
      {renderBanner(activeBanner)}
      
      {/* Top identity row */}
      <div className="relative p-5 pb-4">
        {/* Clean background */}

        <div className="relative flex items-start gap-4 z-10">
          {/* Avatar + XP ring */}
          <div className="relative shrink-0">
            <div className="relative w-16 h-16">
              <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="4" fill="none" className="text-border" />
                <defs>{renderProgressGradient(activeProgress)}</defs>
                <motion.circle
                  cx="50" cy="50" r="46"
                  stroke="url(#pqGrad)" strokeWidth="4" fill="none"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: progress / 100 }}
                  transition={{ duration: 1.4, ease: 'easeOut' }}
                />
              </svg>
              <Avatar className="absolute inset-[6px] w-auto h-auto border border-border flex items-center justify-center overflow-hidden">
                <AvatarImage src={profile.avatar_url} className="w-full h-full object-cover" />
                <AvatarFallback className="text-sm font-semibold bg-muted text-muted-foreground">
                  {profile.username?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              {/* Render the equipped frame */}
              {renderFrame(activeFrame)}
            </div>
            {/* Level badge */}
            <div className="absolute -bottom-1 -right-1 z-10 bg-gradient-to-br from-primary to-accent text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-lg">
              <Crown className="w-2.5 h-2.5" />
              {level}
            </div>
          </div>

          {/* Identity */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground/55 tracking-wide mb-1">{greeting}</p>
            <h2 className="text-[17px] font-bold text-foreground tracking-tight truncate leading-none">
              {profile.full_name?.split(' ')[0] || profile.username || 'Player'}
            </h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {/* Live status pill */}
              <button
                onClick={() => {
                  const order: (keyof typeof STATUS_CONFIG)[] = ['online', 'in-room', 'invisible', 'offline']
                  const idx = order.indexOf(userStatus as keyof typeof STATUS_CONFIG)
                  setUserStatus(order[(idx + 1) % order.length])
                }}
                className={`flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-colors cursor-pointer`}
                style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}
                title="Click to change status"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.color} shadow-sm ${statusCfg.shadow}`} />
                {statusCfg.label}
              </button>
              {/* Coin balance */}
              <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-400 rounded-full px-2.5 py-1" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.15)' }}>
                <Zap className="w-2.5 h-2.5" />
                {coins.toLocaleString()} GP
              </span>
              {/* Clock */}
              <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
                {user.settings?.clock_format === '12h' ? format(currentTime, 'hh:mm a') : format(currentTime, 'HH:mm')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-8 px-2 text-[10px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent hover:border-border rounded-lg transition-all"
            >
              <Link to="/dashboard/settings" className="flex items-center gap-1.5">
                <Edit3 className="w-3 h-3" />
                <span>Edit</span>
              </Link>
            </Button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent hover:border-border transition-all ${isExpanded ? 'bg-muted text-foreground border-border' : ''}`}
            >
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </div>


      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {/* XP Bar */}
            <div className="px-5 pb-4">
              <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground mb-1.5">
                <span className="flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5 text-amber-500" />
                  {xp.toLocaleString()} XP
                </span>
                <span>{xpRemaining.toLocaleString()} XP to Lv {level + 1}</span>
              </div>
              <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                />
              </div>
            </div>

            <div className="h-px bg-border mx-5" />

            {/* Stats row */}
            <div className="grid grid-cols-3 divide-x divide-border px-0">
              <StatCell
                icon={<Users className="w-3.5 h-3.5 text-primary" />}
                value={gameData?.activeFriends ?? '—'}
                label="Online"
              />
              <StatCell
                icon={<Zap className="w-3.5 h-3.5 text-orange-500" />}
                value={gameData?.activeRooms ?? '—'}
                label="Rooms"
              />
              <StatCell icon={<Flame className="w-3.5 h-3.5 text-rose-500" />} value={gameData?.streakCount ?? 0} label="Streak" />
            </div>

            <div className="h-px bg-border" />

            {/* Quests row */}
            {gameData?.quests && gameData.quests.length > 0 && (
              <div className="px-5 py-3">
                <span className="text-[10px] font-medium text-muted-foreground/55 tracking-wide uppercase mb-2 block">
                  Daily Quests
                </span>
                <div className="space-y-1.5">
                  {gameData.quests.map((q: any) => (
                    <div key={q.id} className="flex items-center justify-between bg-muted/30 p-2 rounded-md border border-border/50">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-foreground">{q.quest?.name}</span>
                        <span className="text-[9px] text-muted-foreground">{q.quest?.description}</span>
                      </div>
                      <div className="text-[10px] font-bold">
                        {q.completed ? '✅' : '0 / 1'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="h-px bg-border" />

            {/* Theme switcher row */}
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-[10px] font-medium text-muted-foreground/55 tracking-wide uppercase">
                Appearance
              </span>
              <div className="flex items-center gap-0.5 p-1 rounded-lg bg-muted/50 border border-border">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    title={t.label}
                    className={`p-1.5 rounded-md transition-all ${
                      theme === t.id
                        ? 'bg-background text-foreground shadow-sm border border-border'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {t.icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Achievements row */}
            {gameData?.achievements && gameData.achievements.length > 0 && (
              <div className="px-5 pb-4">
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                  {gameData.achievements.map((ua: { id: string; achievement: unknown }) => (
                    <AchievementBadge key={ua.id} achievement={ua.achievement} />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function StatCell({
  icon,
  value,
  label
}: {
  icon: React.ReactNode
  value: number | string
  label: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-3 gap-0.5 hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-1">
        {icon}
        <span className="text-base font-semibold text-foreground tabular-nums">{value}</span>
      </div>
      <span className="text-[9px] uppercase tracking-widest font-medium text-muted-foreground">
        {label}
      </span>
    </div>
  )
}
