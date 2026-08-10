'use client'

import { Button } from '@/components/ui/button'
import { ExternalLink, MonitorUp, ArrowLeft } from 'lucide-react'

interface ExternalServiceViewProps {
  serviceName: string
  serviceUrl: string
  onBack: () => void
  onLaunch: () => void
}

export function ExternalServiceView({
  serviceName,
  serviceUrl,
  onBack,
  onLaunch
}: ExternalServiceViewProps) {
  const handleLaunch = () => {
    // 1. Open the target site
    window.open(serviceUrl, '_blank')

    // 2. Prompt for screen share (small delay to let the tab open)
    setTimeout(() => {
      onLaunch()
    }, 1000)
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in zoom-in-95 duration-300">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="absolute top-4 left-4 text-muted-foreground hover:text-white"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>

      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 animate-pulse">
        <MonitorUp className="w-10 h-10 text-primary" />
      </div>

      <h2 className="text-2xl font-bold text-white mb-2">Watch {serviceName} Together</h2>
      <p className="text-muted-foreground max-w-md mb-8">
        {/* eslint-disable-next-line react/no-unescaped-entities */}
        To bypass DRM protection, we'll open {serviceName} in a new tab, and
        {/* eslint-disable-next-line react/no-unescaped-entities */}
        you'll share that tab with audio.
      </p>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        <Button
          size="lg"
          className="w-full gap-2 bg-white text-black hover:bg-white/90"
          onClick={handleLaunch}
        >
          <ExternalLink className="w-4 h-4" />
          Open & Start Sharing
        </Button>

        <div className="text-xs text-muted-foreground/60 bg-white/5 p-4 rounded-lg text-left space-y-2">
          <p className="font-semibold text-white/80">Instructions:</p>
          <ol className="list-decimal pl-4 space-y-1">
            <li>A new tab will open with {serviceName}</li>
            <li>Return to this tab (if needed)</li>
            <li>
              Select the <strong>Chrome Tab</strong> option in the popup
            </li>
            <li>
              Select the <strong>{serviceName}</strong> tab
            </li>
            <li>
              {/* eslint-disable-next-line react/no-unescaped-entities */}
              <strong>IMPORTANT</strong>: Check "Also share tab audio"
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}
