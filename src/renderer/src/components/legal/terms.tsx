'use client'

import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export function TermsPage() {
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
            Terms of Operation
          </h1>
          <p className="text-muted-foreground font-medium">Last Updated: February 2026</p>
        </header>

        <div className="space-y-12 leading-relaxed">
          <section className="bg-muted/10 p-8 rounded-3xl border border-border/50">
            <h2 className="text-2xl font-bold text-foreground mb-4">1. Access Authorization</h2>
            <p>
              By initializing a session on VIRE, you acknowledge the Terms of Operation.
              Unauthorized bridging or disruption of service signals is strictly prohibited.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">2. Conduct Protocol</h2>
            <p>Users must adhere to the following safety constraints:</p>
            <ul className="list-disc pl-6 mt-4 space-y-3">
              <li>No propagation of illegal or malicious code/content.</li>
              <li>Mutual respect within the collective; no harassment or identity theft.</li>
              <li>
                No intentional interference with platform infrastructure or node connectivity.
              </li>
            </ul>
          </section>

          <section className="bg-muted/10 p-8 rounded-3xl border border-border/50">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              3. System & Intellectual Assets
            </h2>
            <p>
              The VIRE framework, logic cores, and visual interfaces are proprietary assets of VIRE
              Systems and are protected by global intellectual property tiers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">4. Disconnection Policy</h2>
            <p>
              We reserve terminal authority to suspend or terminate sessions/accounts if conduct
              protocols are breached or if system integrity is threatened.
            </p>
          </section>

          <section className="bg-red-500/5 p-6 rounded-2xl border border-red-500/10">
            <h2 className="text-lg font-bold text-red-400 mb-2">5. Disclaimer</h2>
            <p className="text-xs">
              THE SYSTEM IS PROVIDED "AS IS". WE OFFER NO GUARANTEES REGARDING SIGNAL STABILITY,
              UPTIME, OR ABSOLUTE DATA PERSISTENCE DURING THE BETA EVOLUTION.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
