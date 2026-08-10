import { Play, MessageCircle, Phone } from 'lucide-react'

export function JumpBackIn() {
  return (
    <div className="flex flex-col h-[280px] bg-card border border-border rounded-3xl p-6 backdrop-blur-md relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -mt-20 -mr-20 pointer-events-none" />

      <div className="flex items-center justify-between mb-6 relative z-10">
        <h2 className="text-xl font-bold text-foreground">Jump Back In</h2>
        <span className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">View History</span>
      </div>

      <div className="grid grid-cols-3 gap-4 h-full relative z-10">
        {/* Item 1 */}
        <div className="group flex flex-col justify-between bg-muted/50 hover:bg-muted border border-border hover:border-border rounded-2xl p-4 transition-all duration-300 cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Gaming Lounge</p>
              <p className="text-xs text-muted-foreground">Vowel Community</p>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <div className="flex -space-x-2">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=J" className="w-6 h-6 rounded-full bg-muted border-2 border-card" alt="" />
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=A" className="w-6 h-6 rounded-full bg-muted border-2 border-card" alt="" />
              <div className="w-6 h-6 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[8px] font-bold text-foreground">+3</div>
            </div>
            <span className="w-full text-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 py-1.5 rounded-lg group-hover:bg-indigo-500 group-hover:text-white transition-colors">Join Voice</span>
          </div>
        </div>

        {/* Item 2 */}
        <div className="group flex flex-col justify-between bg-muted/50 hover:bg-muted border border-border hover:border-border rounded-2xl p-4 transition-all duration-300 cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-600 dark:text-pink-400">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Alex Hunt</p>
              <p className="text-xs text-muted-foreground">Direct Message</p>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <p className="text-xs text-muted-foreground line-clamp-2">Hey, are we still playing later tonight?</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.8)]" />
              <span className="text-[10px] text-pink-600 dark:text-pink-400 font-bold uppercase tracking-wider">Unread</span>
            </div>
          </div>
        </div>

        {/* Item 3 */}
        <div className="group flex flex-col justify-between bg-muted/50 hover:bg-muted border border-border hover:border-border rounded-2xl p-4 transition-all duration-300 cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <Play className="w-5 h-5 ml-0.5" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Study Beats</p>
              <p className="text-xs text-muted-foreground">YouTube Activity</p>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <p className="text-xs font-medium text-foreground truncate">Lofi hip hop radio - beats to relax/study to</p>
            <div className="flex flex-col gap-1.5 w-full">
              <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                <div className="w-2/3 h-full bg-violet-500" />
              </div>
              <div className="flex justify-between items-center text-[9px] text-muted-foreground font-medium font-mono">
                <span>1:23:45</span>
                <span>Live</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
