import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Headphones, UserPlus, MessageSquare, Store, Radio } from 'lucide-react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'

const ACTIONS = [
  {
    to: '/dashboard/rooms',
    icon: <Headphones className="w-3.5 h-3.5" />,
    label: 'Browse Rooms',
    iconClass: 'text-rose-400',
    hoverBorder: 'hover:border-rose-500/30',
    hoverBg: 'hover:bg-rose-500/[0.05]',
    hoverText: 'hover:text-rose-300',
  },
  {
    to: '/dashboard/friends',
    icon: <UserPlus className="w-3.5 h-3.5" />,
    label: 'Add Friends',
    iconClass: 'text-violet-400',
    hoverBorder: 'hover:border-violet-500/30',
    hoverBg: 'hover:bg-violet-500/[0.05]',
    hoverText: 'hover:text-violet-300',
  },
  {
    to: '/dashboard/messages',
    icon: <MessageSquare className="w-3.5 h-3.5" />,
    label: 'Messages',
    iconClass: 'text-sky-400',
    hoverBorder: 'hover:border-sky-500/30',
    hoverBg: 'hover:bg-sky-500/[0.05]',
    hoverText: 'hover:text-sky-300',
  },
  {
    to: '/dashboard/shop',
    icon: <Store className="w-3.5 h-3.5" />,
    label: 'Shop',
    iconClass: 'text-amber-400',
    hoverBorder: 'hover:border-amber-500/30',
    hoverBg: 'hover:bg-amber-500/[0.05]',
    hoverText: 'hover:text-amber-300',
  },
]

export function QuickActions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut', delay: 0.05 }}
      className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5"
    >
      {ACTIONS.map((action, i) => (
        <motion.div
          key={action.to}
          initial={{ opacity: 0, scale: 0.93 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.06 + i * 0.05, duration: 0.25 }}
        >
          <Link
            to={action.to}
            draggable="false"
            onContextMenu={(e) => e.preventDefault()}
            className={`group flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border text-muted-foreground/70 transition-all duration-200 shrink-0 ${action.hoverBorder} ${action.hoverBg} ${action.hoverText}`}
          >
            <span className={`shrink-0 transition-colors duration-200 ${action.iconClass}`}>
              {action.icon}
            </span>
            <span className="text-[12.5px] font-medium whitespace-nowrap transition-colors duration-200">
              {action.label}
            </span>
          </Link>
        </motion.div>
      ))}

      {/* Discover pill */}
      <motion.div
        initial={{ opacity: 0, scale: 0.93 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.26, duration: 0.25 }}
      >
        <Link
          to="/discover"
          draggable="false"
          onContextMenu={(e) => e.preventDefault()}
          className="group flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border text-muted-foreground/70 hover:border-emerald-500/30 hover:bg-emerald-500/[0.05] hover:text-emerald-300 transition-all duration-200 shrink-0"
        >
          <span className="shrink-0 text-emerald-400">
            <Radio className="w-3.5 h-3.5" />
          </span>
          <span className="text-[12.5px] font-medium whitespace-nowrap">Discover</span>
        </Link>
      </motion.div>
    </motion.div>
  )
}

export function DashboardGreeting({ username }: { username: string }) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const hour = now.getHours()
  let greeting = 'Good evening'
  if (hour < 5) greeting = 'Burning the midnight oil'
  else if (hour < 12) greeting = 'Good morning'
  else if (hour < 18) greeting = 'Good afternoon'
  else greeting = 'Good evening'

  return (
    <div className="relative">


      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative flex items-end justify-between gap-4"
      >
        <div>
          <p className="text-[11px] font-medium text-muted-foreground/55 mb-1 tracking-wide">
            {greeting},
          </p>
          <h1 className="text-[26px] font-bold tracking-tight text-foreground leading-none">
            {username}
          </h1>
          <div className="flex items-center gap-2 mt-2.5">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
              <span className="text-[11px] font-medium text-muted-foreground/50">Everything's running smoothly</span>
            </div>
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className="text-[22px] font-mono font-light text-foreground/60 tabular-nums leading-none tracking-tight">
            {format(now, 'HH:mm')}
          </p>
          <p className="text-[11px] text-muted-foreground/35 mt-1.5">
            {format(now, 'EEE, MMM d')}
          </p>
        </div>
      </motion.div>
    </div>
  )
}
