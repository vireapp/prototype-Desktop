import { Trophy, Flame, ChevronRight, Zap } from 'lucide-react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function PlayerHub({ user, initialData }: { user: any; initialData: any }) {
  const level = initialData?.level || 1
  const xp = initialData?.xp || 0
  const xpForNextLevel = level * 1000
  const progress = Math.min(100, (xp / xpForNextLevel) * 100)

  return (
    <div className="flex flex-col h-[280px] bg-card border border-border rounded-3xl p-6 backdrop-blur-md relative overflow-hidden group">
      <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-amber-500/10 rounded-full blur-[60px] pointer-events-none" />

      <div className="flex items-center gap-4 mb-6 relative z-10">
        <div className="relative cursor-pointer hover:opacity-80 transition-opacity">
          <img src={user?.profile?.avatar_url || "https://github.com/shadcn.png"} alt="Avatar" className="w-16 h-16 rounded-2xl object-cover border-2 border-border" />
          <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-card rounded-lg border border-border flex items-center justify-center text-xs font-bold text-amber-600 dark:text-amber-400 shadow-xl">
            {level}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-foreground leading-tight truncate">{user?.profile?.username || 'Player'}</h2>
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-400/10 px-2 py-1 rounded-md uppercase tracking-wider">
              <Trophy className="w-3 h-3" />
              Legend
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-400/10 px-2 py-1 rounded-md uppercase tracking-wider">
              <Flame className="w-3 h-3" />
              12 Streak
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto space-y-4 relative z-10 w-full flex-1 flex flex-col justify-end">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
            <span>XP to Lv {level + 1}</span>
            <span>{xp} / {xpForNextLevel}</span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden border border-border">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)] transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <button className="w-full mt-2 flex items-center justify-between p-3 rounded-2xl bg-muted/50 hover:bg-muted border border-border hover:border-border transition-all cursor-pointer group/btn">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-600 dark:text-yellow-500 shadow-inner group-hover/btn:bg-yellow-500/20 transition-colors">
              <Zap className="w-5 h-5 fill-yellow-500/20" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-foreground">Daily Quest</p>
              <p className="text-[11px] font-medium text-muted-foreground group-hover/btn:text-foreground transition-colors mt-0.5">Join 1 Room for 50 GP</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover/btn:text-foreground group-hover/btn:translate-x-1 transition-all" />
        </button>
      </div>
    </div>
  )
}
