/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Construction } from 'lucide-react'

export function MemoryMatch({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  roomId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  user,
  onBackAction
}: {
  roomId: string
  user: any
  onBackAction: () => void
}) {
  return (
    <div className="flex flex-col h-full w-full items-center justify-center bg-zinc-950 p-8 relative">
      <Button
        variant="ghost"
        onClick={onBackAction}
        className="absolute top-4 left-4 text-white/50 hover:text-white"
      >
        <ArrowLeft className="w-5 h-5 mr-2" /> Back
      </Button>

      <div className="text-center space-y-4">
        <Construction className="w-16 h-16 text-yellow-500 mx-auto animate-bounce" />
        <h2 className="text-2xl font-bold text-white">Memory Match</h2>
        <p className="text-zinc-400">Coming Soon!</p>
      </div>
    </div>
  )
}
