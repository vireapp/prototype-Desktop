'use client'

import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export function PrivacyPage() {
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
          <h1 className="text-4xl font-bold text-foreground mb-4 font-heading tracking-tight">
            Privacy Protocol
          </h1>
          <p className="text-muted-foreground font-medium">Last Updated: February 2026</p>
        </header>

        <div className="space-y-12 leading-relaxed">
          <section className="bg-muted/10 p-8 rounded-3xl border border-border/50">
            <h2 className="text-2xl font-bold text-foreground mb-4">1. Data Ingestion</h2>
            <p>We minimize metadata footprint. Collected vectors include:</p>
            <ul className="list-disc pl-6 mt-4 space-y-3">
              <li>
                <span className="text-foreground font-medium">Session Identity</span>: Username and
                email via designated auth nodes.
              </li>
              <li>
                <span className="text-foreground font-medium">Interaction Analytics</span>: Feature
                utilization and signal engagement.
              </li>
              <li>
                <span className="text-foreground font-medium">System Telemetry</span>: IP masking,
                hardware identifiers for security shielding.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">2. Utilization Vectors</h2>
            <p>Your data synchronizes the collective reality. Specifically:</p>
            <ul className="list-disc pl-6 mt-4 space-y-3">
              <li>Synchronizing playback temporal states across distributed nodes.</li>
              <li>Maintaining low-latency voice and signal pathways.</li>
              <li>Optimizing system resources based on local hardware profiles.</li>
            </ul>
          </section>

          <section className="bg-muted/10 p-8 rounded-3xl border border-border/50">
            <h2 className="text-2xl font-bold text-foreground mb-4">3. Shielding & Sharing</h2>
            <p>
              VIRE does not commoditize personal data. Sharing is restricted to infrastructure
              gateways (cloud providers, database shards) essential for platform operation.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">4. User Agency</h2>
            <p>
              You maintain total control. Access, rectification, or termination of your digital
              presence is available through the Security terminal.
            </p>
          </section>

          <section className="text-sm border-t border-border pt-8 opacity-60">
            <p>
              For inquiries regarding privacy protocols, contact the Community Nexus or reach out to{' '}
              <span className="text-foreground font-medium">privacy@vire.app</span>.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
