'use client'

import { motion } from 'framer-motion'
import { RetroBackground } from '@/components/ui/retro-background'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { ArrowLeft, Rocket, Users, Target, Clock } from 'lucide-react'

export function AboutPage() {
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
            asChild
            className="text-muted-foreground hover:text-foreground pl-0"
          >
            <Link to="/">
              <ArrowLeft className="mr-2 w-4 h-4" /> Back
            </Link>
          </Button>
          <div className="text-sm font-mono text-muted-foreground tracking-widest">
            SYSTEM // MISSION
          </div>
        </header>

        <main className="max-w-4xl mx-auto space-y-32 pb-20">
          {/* Mission Statement */}
          <section className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl font-bold font-heading text-foreground tracking-tighter mb-8"
            >
              Redefining Digital Proximity.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-muted-foreground leading-relaxed mx-auto max-w-2xl"
            >
              We believe the internet lost its soul when it became "content-first". VIRE is building
              a "connection-first" layer for the web, where shared experiences matter more than
              metrics.
            </motion.p>
          </section>

          {/* Values Grid */}
          <section className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: 'Connection First',
                desc: 'Algorithms should serve relationships, not advertisers.'
              },
              {
                icon: Target,
                title: 'Zero Latency',
                desc: 'Real-time means real-time. No delays, no buffering.'
              },
              {
                icon: Rocket,
                title: 'User Agency',
                desc: 'You control your data, your room, and your rules.'
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="p-8 rounded-3xl bg-card/50 backdrop-blur-sm border border-border hover:border-primary/30 transition-all duration-500 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-500">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </section>

          {/* Timeline */}
          <section>
            <h2 className="text-3xl font-bold text-foreground mb-12 flex items-center gap-3">
              <Clock className="w-6 h-6 text-muted-foreground" /> Origin Story
            </h2>
            <div className="space-y-8 pl-4 border-l border-border">
              {[
                {
                  year: '2025',
                  title: 'The Prototype',
                  desc: 'Two friends hacked together a sync engine over a weekend.'
                },
                {
                  year: '2025',
                  title: 'Alpha V1',
                  desc: 'Closed testing with 50 users. Rewrote the core text stack.'
                },
                {
                  year: '2026',
                  title: 'Public Beta',
                  desc: "Opening the doors to the world. And we're just getting started."
                }
              ].map((item, i) => (
                <div key={i} className="relative pl-8 group">
                  <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-border border border-muted group-hover:bg-primary group-hover:scale-125 transition-all duration-300" />
                  <div className="text-2xl font-bold text-foreground mb-1 tracking-tight">
                    {item.year}
                  </div>
                  <div className="text-lg font-medium text-foreground/80 mb-2">{item.title}</div>
                  <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* The Team */}
          <section>
            <h2 className="text-3xl font-bold text-foreground mb-12">The Team</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { name: 'Deepak ', role: 'Founder' },
                { name: 'Ayush ', role: 'Co-Founder' },
                { name: 'You?', role: 'Join Us' }
              ].map((member, i) => (
                <div
                  key={i}
                  className="text-center p-8 bg-card/30 backdrop-blur-sm rounded-3xl border border-border hover:border-primary/20 transition-all duration-500"
                >
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-muted/50 mb-4 flex items-center justify-center border border-border overflow-hidden">
                    {i === 3 ? (
                      <span className="text-2xl font-bold">?</span>
                    ) : (
                      <span className="font-bold text-2xl text-primary">{member.name[0]}</span>
                    )}
                  </div>
                  <div className="font-bold text-foreground text-lg">{member.name}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mt-2 font-medium">
                    {member.role}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
