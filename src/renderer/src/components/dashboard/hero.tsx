import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Headphones, ArrowRight, Radio } from 'lucide-react'
import { motion } from 'framer-motion'

export function DashboardHero(): React.JSX.Element {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="relative overflow-hidden rounded-2xl p-8 lg:p-10 bg-card border border-border shadow-sm bg-noise"
    >
      {/* Ambient gradient blobs */}
      <div className="absolute top-[-40%] left-[-15%] w-[60%] h-[140%] bg-primary/8 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-30%] right-[-10%] w-[45%] h-[100%] bg-accent/6 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
        {/* Text Content */}
        <div className="flex flex-col gap-5 max-w-lg">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full bg-muted/50 border border-border">
            <Radio className="w-3 h-3 text-primary" strokeWidth={2} />
            <span className="text-[10px] font-medium tracking-[0.12em] uppercase text-muted-foreground">
              Live Audio Rooms
            </span>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="text-3xl lg:text-4xl font-semibold text-foreground tracking-tight leading-[1.15]">
              Ready to <span className="text-gradient-brand">connect?</span>
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
              Jump into a room, share your screen, or just hang out with friends. Your space, your
              rules.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <Button
              size="sm"
              className="group relative bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-5 h-9 rounded-lg shadow-[0_0_20px_rgba(var(--primary-rgb),0.2)] hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)] transition-all duration-300"
              asChild
            >
              <Link to="/dashboard/rooms">
                <Headphones className="w-3.5 h-3.5 mr-2" strokeWidth={2} />
                Browse Rooms
                <ArrowRight
                  className="w-3 h-3 ml-1.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200"
                  strokeWidth={2}
                />
              </Link>
            </Button>

            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground hover:text-foreground h-9 px-4 rounded-lg hover:bg-muted border border-transparent hover:border-border transition-all"
              asChild
            >
              <Link to="/dashboard/join">Join via Code</Link>
            </Button>
          </div>
        </div>

        {/* Right: Subtle visual element */}
        <div className="hidden lg:flex items-center justify-center">
          <div className="relative">
            <div className="w-32 h-32 rounded-full border border-border/40 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full border border-border/60 flex items-center justify-center animate-[spin_20s_linear_infinite]">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border border-border/80" />
              </div>
            </div>
            {/* Orbiting dots */}
            <div className="absolute inset-0 animate-[spin_12s_linear_infinite]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" />
            </div>
            <div className="absolute inset-0 animate-[spin_18s_linear_infinite_reverse]">
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_6px_rgba(var(--primary-rgb),0.3)]" />
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  )
}
