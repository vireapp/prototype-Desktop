import React from 'react'
import { VideoGrid } from './video-grid'
import { PeerStream, PeerMetadata } from '../../hooks/use-webrtc'

interface VideoConferenceProps {
  roomId: string // Used for potential future logic or passed down
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any
  localStream: MediaStream | null
  remoteStreams: PeerStream[]
  peersMetadata: Record<string, PeerMetadata>
  toggleMic: () => void
  toggleCamera: () => void
  toggleScreenShare: () => Promise<boolean> | void
  permissions?: {
    lockMic?: boolean
    lockCam?: boolean
    lockScreen?: boolean
  }
  isOwner: boolean
  disableVideo: boolean
  volume: number
  isMicOn: boolean
  isCamOn: boolean
  isDeafened?: boolean
  onToggleDeafen?: () => void
}

export function VideoConference({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  roomId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  user,
  localStream,
  remoteStreams,
  peersMetadata,
  toggleMic,
  toggleCamera,
  toggleScreenShare,
  permissions,
  isOwner,
  disableVideo,
  volume,
  isMicOn,
  isCamOn,
  isDeafened,
  onToggleDeafen
}: VideoConferenceProps) {
  return (
    <div className="w-full h-full flex flex-col">
      <VideoGrid
        localStream={localStream}
        remoteStreams={remoteStreams}
        peersMetadata={peersMetadata}
        toggleMic={toggleMic}
        toggleCam={toggleCamera}
        toggleScreen={toggleScreenShare}
        onToggleDeafen={onToggleDeafen}
        isDeafened={isDeafened}
        isMicOn={isMicOn}
        isCamOn={isCamOn}
        disableVideo={disableVideo}
        volume={volume}
        canToggleMic={!permissions?.lockMic || isOwner}
        canToggleCam={!permissions?.lockCam || isOwner}
        canToggleScreen={!permissions?.lockScreen || isOwner}
      />
    </div>
  )
}
