'use client'

import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { ArrowLeft, GitCommit } from 'lucide-react'

export function ChangelogPage() {
  return (
    <div className="min-h-screen bg-background text-muted-foreground font-sans selection:bg-primary/20">
      <div className="container mx-auto px-6 py-12 max-w-4xl pb-24">
        <header className="mb-20">
          <Button
            variant="ghost"
            asChild
            className="text-muted-foreground hover:text-foreground pl-0 mb-8"
          >
            <Link to="/">
              <ArrowLeft className="mr-2 w-4 h-4" /> Back
            </Link>
          </Button>
          <h1 className="text-4xl font-bold text-foreground mb-4">Changelog</h1>
          <p className="text-muted-foreground font-medium">Track the evolution of the system.</p>
        </header>

        <div className="space-y-12">
          {[
            {
              version: 'v1.4.0 (Electron)',
              date: 'Feb 28, 2026',
              title: 'Desktop Evolution',
              changes: [
                'Migrated core experience to Electron Desktop App.',
                'Added Native System Tray and Background Operation.',
                'Integrated Deep Linking (vire://) for seamless protocol handling.',
                'Enabled Global Shortcut (Alt+V) for instant system access.',
                'Implemented Acrylic/Vibrancy effects for modern OS integration.',
                'Added custom native-style Title Bar and Window Controls.'
              ]
            },
            {
              version: 'v1.2.0',
              date: 'Dec 19, 2025',
              title: 'Global Frequency Update',
              changes: [
                'Introduced Bento Grid layout for homepage.',
                'Added Real-time Community Stats.',
                'Launched "Features" and "Community" pages.',
                'Removed legacy iconography for cleaner aesthetic.'
              ]
            },
            {
              version: 'v1.1.5',
              date: 'Dec 10, 2025',
              title: 'Performance Patch',
              changes: [
                'Optimized sync engine for high-latency networks.',
                'Reduced bundle size by 15%.',
                'Fixed mobile navigation glitch.'
              ]
            },
            {
              version: 'v1.0.0',
              date: 'Nov 01, 2025',
              title: 'Initial Launch',
              changes: [
                'Public beta release.',
                'Core room functionality: Sync, Chat, Voice.',
                'User profiles and dashboard.'
              ]
            }
          ].map((release, i) => (
            <div key={i} className="relative pl-8 border-l border-border pb-8 last:pb-0">
              <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-border border border-muted" />
              <div className="flex items-center gap-3 mb-2">
                <span className="text-foreground font-mono font-bold text-lg bg-muted/40 px-2 py-0.5 rounded border border-border">
                  {release.version}
                </span>
                <span className="text-muted-foreground text-sm font-medium">{release.date}</span>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-4">{release.title}</h3>
              <ul className="space-y-3">
                {release.changes.map((change, j) => (
                  <li key={j} className="flex items-start gap-3 group">
                    <GitCommit className="w-4 h-4 mt-1 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
                    <span className="leading-relaxed">{change}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
