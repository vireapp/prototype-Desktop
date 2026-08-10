import { Sparkles, ArrowRight, MessageSquareText } from 'lucide-react'

export function AICompanionHub() {
  return (
    <div className="flex flex-col h-[320px] bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-border hover:border-indigo-500/30 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden transition-all duration-500 group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] -mt-20 -mr-20 pointer-events-none group-hover:bg-indigo-500/30 transition-colors duration-700" />

      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground tracking-tight">VIRE AI</h2>
          </div>
        </div>
        <button className="text-muted-foreground hover:text-foreground transition-colors p-1">
          <MessageSquareText className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-end relative z-10">
        <div className="bg-muted/60 border border-border rounded-2xl p-5 shadow-inner mb-4 flex-1">
          <p className="text-[15px] text-foreground leading-relaxed font-medium">
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">Good evening!</span> Looks like you missed 3 messages in the Design channel. <br /><br />
            Also, <span className="text-emerald-600 dark:text-emerald-400 cursor-pointer hover:underline">Sarah</span> just started playing Valorant. Should I let her know you'll join?
          </p>
        </div>

        <div className="flex items-center gap-2 group/input">
          <input
            type="text"
            placeholder="Type a request or reply..."
            className="flex-1 bg-muted/50 hover:bg-muted focus:bg-muted border border-border focus:border-indigo-500/50 outline-none text-foreground text-sm py-3 px-4 rounded-2xl transition-all placeholder:text-muted-foreground font-medium"
          />
          <button className="w-11 h-11 rounded-2xl bg-indigo-500 hover:bg-indigo-600 flex items-center justify-center text-white transition-all cursor-pointer shrink-0 shadow-[0_0_10px_rgba(99,102,241,0.3)] hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] active:scale-95">
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
