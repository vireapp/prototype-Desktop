import { Search, Command } from 'lucide-react'

export function UniversalActionBar() {
  return (
    <div className="relative group w-full">
      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative flex items-center bg-muted/50 border border-border rounded-2xl p-4 backdrop-blur-md shadow-sm transition-all duration-300 hover:bg-muted cursor-text">
        <Search className="w-5 h-5 text-muted-foreground mr-4" />
        <input
          type="text"
          placeholder="Jump to a room, search friends, or ask AI..."
          className="bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground flex-1 text-base font-medium"
        />
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted border border-border shadow-inner">
          <Command className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[11px] font-bold text-muted-foreground">K</span>
        </div>
      </div>
    </div>
  )
}
