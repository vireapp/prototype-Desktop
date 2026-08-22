'use client'

import { useRoom } from '@/lib/room-context'
import { RoomClientV2 } from '@/components/room/room-client-v2'
import { DuoRoomClient } from '@/components/duo/duo-room-client'
import { cn } from '@/lib/utils'
import { Maximize2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

export function GlobalRoomOverlay() {
  const { isActive, roomData, userData, isDuo, isMinimized, maximizeRoom, endRoom, roomId } = useRoom()
  const navigate = useNavigate()

  if (!isActive || !roomData || !userData) return null

  const handleMaximize = () => {
    maximizeRoom()
    navigate(`/room/${roomId}`)
  }

  const handleClose = () => {
    endRoom()
  }

  return (
    <div
      className={cn(
        "z-[45] transition-all duration-300 ease-in-out",
        isMinimized
          ? "fixed bottom-6 right-6 h-14 rounded-full shadow-2xl border border-white/10 overflow-hidden bg-black/80 backdrop-blur-xl flex items-center justify-center px-2 cursor-default"
          : "fixed inset-0" 
      )}
    >
      <div className={cn("relative pointer-events-auto flex items-center", isMinimized ? "w-auto h-auto flex-shrink-0" : "w-full h-full")}>
        {isDuo ? (
          <DuoRoomClient room={roomData} user={userData} isGhostMode={false} />
        ) : (
          <RoomClientV2 room={roomData} user={userData} channelSecret="" />
        )}
      </div>

      {isMinimized && (
        <div className="flex items-center gap-1.5 ml-2 border-l border-white/10 pl-2">
          <Button variant="ghost" size="icon" onClick={handleMaximize} className="w-9 h-9 rounded-full hover:bg-white/10 text-white">
            <Maximize2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleClose} className="w-9 h-9 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
