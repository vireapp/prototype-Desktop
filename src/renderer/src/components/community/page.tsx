import { motion } from 'framer-motion'
import { RetroBackground } from '@/components/ui/retro-background'
import { Button } from '@/components/ui/button'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  MessageSquare,
  Heart,
  Shield,
  Hash,
  Calendar,
  ArrowRight,
  Users,
  Globe,
  Activity
} from 'lucide-react'

// Instagram icon (removed from lucide-react v1.0)
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useEffect, useState } from 'react'
import { getCommunityStats } from './actions'

import { CommunitySkeleton } from '@/components/dashboard/skeleton'

export function CommunityPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    users: 0,
    rooms: 0,
    messages: 0,
    countries: 0
  })

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await getCommunityStats()
        setStats(data)
      } finally {
        setIsLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (isLoading) {
    return <CommunitySkeleton />
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Subtle background */}
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
          <div className="text-sm font-mono text-muted-foreground">SYSTEM // COMMUNITY</div>
        </header>

        <main className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-24"
          >
            <div className="inline-block px-4 py-2 rounded-full border border-border bg-muted/20 backdrop-blur-md mb-6">
              <span className="text-foreground font-mono text-sm">GLOBAL FREQUENCY</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold font-heading text-foreground tracking-tighter mb-6">
              Join the Collective.
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {/* eslint-disable-next-line react/no-unescaped-entities */}
              VIRE is more than code. It's a living network of creators, streamers, and friends.
              Connect with us on these platforms.
            </p>
          </motion.div>

          {/* Live Stats Ticker */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-24 bg-card/40 border border-border rounded-2xl p-6 backdrop-blur-sm"
          >
            {[
              {
                label: 'Active Rooms',
                value: stats.rooms.toLocaleString(),
                icon: Activity
              },
              {
                label: 'Total Messages',
                value: stats.messages.toLocaleString(),
                icon: MessageSquare
              },
              {
                label: 'Total Users',
                value: stats.users.toLocaleString(),
                icon: Users
              },
              { label: 'Countries', value: stats.countries, icon: Globe }
            ].map((stat, i) => (
              <div key={i} className="text-center border-r border-border last:border-0">
                <stat.icon className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                <div className="text-2xl font-bold text-foreground transition-all">
                  {stat.value}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>

          {/* Platform Links */}
          <div className="grid md:grid-cols-2 gap-6 mb-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="group bg-card border border-border p-8 rounded-3xl hover:border-[#E1306C]/50 transition-colors relative overflow-hidden cursor-pointer"
            >
              <div className="absolute top-0 right-0 p-20 bg-[#E1306C]/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-[#E1306C]/10 transition-all" />
              <div className="relative z-10 flex flex-col h-full">
                <div className="w-12 h-12 bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] rounded-xl flex items-center justify-center text-white mb-6 transform group-hover:scale-110 transition-transform">
                  <InstagramIcon className="w-6 h-6 stroke-white" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Instagram</h3>
                <p className="text-muted-foreground mb-8">
                  Follow for behind-the-scenes, creator spotlights, and visual updates.
                </p>
                <div className="mt-auto flex items-center text-[#E1306C] font-semibold group-hover:translate-x-2 transition-transform">
                  Follow @VIRE_App <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="group bg-card border border-border p-8 rounded-3xl hover:border-foreground/50 transition-colors relative overflow-hidden cursor-pointer"
            >
              <div className="absolute top-0 right-0 p-20 bg-foreground/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-foreground/10 transition-all" />
              <div className="relative z-10 flex flex-col h-full">
                <div className="w-12 h-12 bg-foreground rounded-xl flex items-center justify-center text-background mb-6 transform group-hover:scale-110 transition-transform">
                  <Hash className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Twitter / X</h3>
                <p className="text-muted-foreground mb-8">
                  Real-time status updates, feature teasers, and community showcases.
                </p>
                <div className="mt-auto flex items-center text-foreground font-semibold group-hover:translate-x-2 transition-transform">
                  Follow @VIRE_App <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Featured Creators Section */}
          <div className="mb-24">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-foreground">Featured Creators</h3>
              <Button variant="link" className="text-muted-foreground">
                View All
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[
                {
                  name: 'Sarah Jenkins',
                  role: 'Movie Critic',
                  handle: '@sarahwatch',
                  color: 'bg-purple-500'
                },
                {
                  name: 'TechFlow',
                  role: 'Gadget Reviews',
                  handle: '@techflow_live',
                  color: 'bg-blue-500'
                },
                {
                  name: 'Anime Central',
                  role: 'Community Host',
                  handle: '@anime_cntrl',
                  color: 'bg-pink-500'
                }
              ].map((creator, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-6 rounded-2xl bg-card border border-border hover:bg-muted/10 transition-colors flex items-center gap-4"
                >
                  <Avatar>
                    <AvatarImage
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${creator.handle}`}
                    />
                    <AvatarFallback className={creator.color}>{creator.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-bold text-foreground">{creator.name}</div>
                    <div className="text-xs text-muted-foreground">{creator.role}</div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-auto border-border rounded-full h-8 px-3 text-xs"
                  >
                    Follow
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Guidelines & Events */}
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 bg-gradient-to-br from-card to-transparent border border-border rounded-3xl p-8">
              <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-400" /> Upcoming Events
              </h3>
              <div className="space-y-4">
                {[
                  {
                    date: 'DEC 24',
                    title: 'Holiday Movie Marathon',
                    status: 'Scheduled'
                  },
                  {
                    date: 'DEC 31',
                    title: 'Global Countdown Party',
                    status: 'Planning'
                  },
                  {
                    date: 'JAN 05',
                    title: 'Developer AMA',
                    status: 'Confirmed'
                  }
                ].map((event, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/20 border border-border hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-mono font-bold text-muted-foreground px-2 py-1 rounded border border-border">
                        {event.date}
                      </span>
                      <span className="text-foreground font-medium">{event.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{event.status}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-card to-transparent border border-border rounded-3xl p-8">
              <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-400" /> Community Values
              </h3>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <Heart className="w-5 h-5 text-rose-500 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Respect all users. Zero tolerance for hate speech.
                  </p>
                </li>
                <li className="flex gap-3">
                  <Shield className="w-5 h-5 text-blue-500 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    {/* eslint-disable-next-line react/no-unescaped-entities */}
                    Keep private rooms private. Don't share links without consent.
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
