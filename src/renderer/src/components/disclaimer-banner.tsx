'use client'

import { Info } from 'lucide-react'

export function DisclaimerBanner(): React.JSX.Element {
  return (
    <div className="bg-primary/5 border-b border-primary/10 px-4 py-1.5 text-center text-[11px] font-medium">
      <div className="container mx-auto flex items-center justify-center gap-2">
        <Info className="h-3 w-3 shrink-0 text-primary" strokeWidth={2} />
        <p className="text-muted-foreground tracking-wide">
          <span className="font-semibold text-foreground/60 mr-1">Preview Build</span>
          You may encounter issues as we refine things.
        </p>
      </div>
    </div>
  )
}
