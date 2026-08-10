import { motion } from 'framer-motion'
import { RetroBackground } from '@/components/ui/retro-background'
import { Button } from '@/components/ui/button'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Play,
  Music,
  Video,
  Gamepad2,
  Mic,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Hash,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ArrowRight,
  Radio
} from 'lucide-react'

import { DiscoverSkeleton } from '@/components/dashboard/skeleton'
import { useEffect, useState } from 'react'

export function DiscoverPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return <DiscoverSkeleton />
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Fixed Background */}
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
        <RetroBackground />
      </div>

      <div className="relative z-10 container mx-auto px-6 py-12">
        <header className="mb-20 flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground pl-0"
          >
            <ArrowLeft className="mr-2 w-4 h-4" /> Back
          </Button>
          <div className="text-sm font-mono text-muted-foreground">SYSTEM // DISCOVERY</div>
        </header>

        <main className="max-w-6xl mx-auto space-y-32">
          {/* Hero: Signal Spotlight */}
          <section className="relative group cursor-pointer">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative min-h-[500px] md:min-h-0 md:aspect-[21/9] rounded-3xl overflow-hidden border border-border"
            >
              {/* Abstract Video/Image Placeholder */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-black z-0">
                <div className="absolute inset-0 opacity-30 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
              </div>

              {/* Content Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10 p-12 flex flex-col justify-end">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-bold w-fit mb-4 border border-red-500/20">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  LIVE SIGNAL
                </div>
                <h1 className="text-4xl md:text-6xl font-black font-heading text-white mb-4">
                  NEON HORIZONS
                </h1>
                <p className="text-xl text-zinc-300 max-w-2xl mb-8">
                  A curated audiovisual journey through the synthwave underground. Join 2.4k others
                  in this immersive session.
                </p>
                <div className="flex items-center gap-4">
                  <Button
                    size="lg"
                    className="rounded-full h-14 px-8 bg-white text-black hover:bg-zinc-200"
                  >
                    <Play className="w-5 h-5 mr-2 fill-current" />
                    Tune In
                  </Button>
                  <div className="flex -space-x-3">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="w-10 h-10 rounded-full border-2 border-black bg-zinc-800"
                      />
                    ))}
                    <div className="w-10 h-10 rounded-full border-2 border-black bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">
                      +2k
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </section>

          {/* Live Signals Ticker */}
          <section className="overflow-hidden border-y border-border py-6 bg-muted/20">
            <div className="flex items-center gap-12 animate-marquee whitespace-nowrap">
              {[
                '#SYNTHWAVE',
                '#CODING_SESSION',
                '#LOFI_BEATS',
                '#HORROR_MOVIES',
                '#TECH_TALK',
                '#INDIE_GAME_DEV',
                '#VAPORWAVE',
                '#CYBERPUNK'
              ].map((tag, i) => (
                <div
                  key={i}
                  className="text-2xl font-black text-transparent stroke-foreground stroke-1 opacity-70 hover:opacity-100 hover:text-foreground transition-all cursor-pointer"
                >
                  {tag}
                </div>
              ))}
              {[
                '#SYNTHWAVE',
                '#CODING_SESSION',
                '#LOFI_BEATS',
                '#HORROR_MOVIES',
                '#TECH_TALK',
                '#INDIE_GAME_DEV',
                '#VAPORWAVE',
                '#CYBERPUNK'
              ].map((tag, i) => (
                <div
                  key={`dup-${i}`}
                  className="text-2xl font-black text-transparent stroke-foreground stroke-1 opacity-70 hover:opacity-100 hover:text-foreground transition-all cursor-pointer"
                >
                  {tag}
                </div>
              ))}
            </div>
          </section>

          {/* Frequencies (Categories) */}
          <section>
            <div className="flex items-end justify-between mb-12">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-2">Frequencies</h2>
                <p className="text-muted-foreground">Tune into a specific wavelength.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: 'Audio',
                  icon: Music,
                  color: 'from-purple-500/20 to-blue-500/20',
                  border: 'hover:border-purple-500/50'
                },
                {
                  title: 'Visual',
                  icon: Video,
                  color: 'from-amber-500/20 to-orange-500/20',
                  border: 'hover:border-amber-500/50'
                },
                {
                  title: 'Gaming',
                  icon: Gamepad2,
                  color: 'from-emerald-500/20 to-cyan-500/20',
                  border: 'hover:border-emerald-500/50'
                },
                {
                  title: 'Voice',
                  icon: Mic,
                  color: 'from-rose-500/20 to-pink-500/20',
                  border: 'hover:border-rose-500/50'
                }
              ].map((cat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className={`group h-64 rounded-3xl bg-card border border-border p-8 relative overflow-hidden cursor-pointer ${cat.border} transition-colors flex flex-col justify-between`}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                  />

                  <div className="relative z-10 w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-4 group-hover:bg-foreground group-hover:text-background transition-colors">
                    <cat.icon className="w-6 h-6" />
                  </div>

                  <div className="relative z-10">
                    <h3 className="text-3xl font-bold text-foreground mb-2">{cat.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors">
                      <Radio className="w-4 h-4" /> Active Stations
                    </div>
                  </div>

                  <div className="absolute -bottom-4 -right-4 text-9xl font-black text-muted/20 rotate-[-15deg] group-hover:rotate-0 transition-transform duration-500 pointer-events-none">
                    {i + 1}
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </main>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
        .stroke-foreground {
          -webkit-text-stroke: 1px currentColor;
        }
      `
        }}
      />
    </div>
  )
}
