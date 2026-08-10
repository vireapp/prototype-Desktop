'use client'

import { JoinRoomForm } from '../rooms/room-forms'
import { Users } from 'lucide-react'

export function JoinRoom() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] p-4 animate-in fade-in zoom-in-95 duration-500">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4 text-primary group transition-all duration-500">
            <Users className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-heading">
            Join a Space
          </h1>
          <p className="text-muted-foreground font-medium">
            Enter the code shared by your friend to jump in.
          </p>
        </div>

        <div className="bg-card/30 backdrop-blur-xl border border-border rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          <JoinRoomForm />
        </div>
      </div>
    </div>
  )
}
