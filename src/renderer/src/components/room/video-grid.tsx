import React, { useEffect, useRef } from 'react'
import { PeerStream, PeerMetadata } from '../../hooks/use-webrtc'
import { cn } from '@/lib/utils'
import { User, Mic, MicOff, Video, VideoOff, Monitor } from 'lucide-react'
import { useAudioActivity } from '@/hooks/use-audio-activity'

interface VideoGridProps {
  localStream: MediaStream | null
  remoteStreams: PeerStream[]
  peersMetadata: Record<string, PeerMetadata>
  toggleMic: () => void
  toggleCam: () => void
  toggleScreen: () => Promise<boolean> | void
  onToggleDeafen?: () => void
  isDeafened?: boolean
  isMicOn: boolean
  isCamOn: boolean
  disableVideo: boolean
  volume: number
  canToggleMic: boolean
  canToggleCam: boolean
  canToggleScreen: boolean
}

export function VideoGrid({
  localStream,
  remoteStreams,
  peersMetadata,
  toggleMic,
  toggleCam,
  toggleScreen,
  isMicOn,
  isCamOn,
  disableVideo,
  canToggleMic,
  canToggleCam,
  canToggleScreen
}: VideoGridProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null)
  // Audio Activity Hook for Local User
  const isSpeaking = useAudioActivity(localStream)

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  // Calculate grid columns based on participant count
  const totalParticipants = 1 + Object.keys(peersMetadata).length
  const gridCols =
    totalParticipants === 1
      ? 'grid-cols-1'
      : totalParticipants <= 4
        ? 'grid-cols-2'
        : totalParticipants <= 9
          ? 'grid-cols-3'
          : 'grid-cols-4'

  return (
    <div
      className={cn(
        'w-full h-full p-2 md:p-4 grid gap-2 md:gap-4 content-center relative',
        gridCols
      )}
    >
      {/* Local User */}
      <div
        className={cn(
          'relative aspect-[3/4] md:aspect-video bg-black/40 backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl border border-white/10 w-full h-full group transition-all duration-300',
          isSpeaking && 'border-white/40 shadow-[0_0_40px_rgba(255,255,255,0.1)]'
        )}
      >
        {localStream && isCamOn && !disableVideo ? (
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover mirror"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center flex-col gap-2">
            <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center">
              <User className="w-10 h-10 text-zinc-500" />
            </div>
            <p className="text-zinc-400 text-sm">You</p>
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-2 z-10">
          <div className="bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-xs font-medium text-white/90">
            You
          </div>
        </div>

        {/* In-Card Controls - Mobile Only (Bottom Bar handles Desktop) */}
        <div className="md:hidden absolute bottom-3 left-0 right-0 flex justify-center items-center z-20">
          <div className="flex gap-3 p-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 shadow-xl">
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleMic()
              }}
              className={cn(
                'p-2 rounded-full transition-all active:scale-95',
                isMicOn ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
              )}
            >
              {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleCam()
              }}
              className={cn(
                'p-2 rounded-full transition-all active:scale-95',
                isCamOn ? 'bg-white/10 text-white' : 'bg-red-500 text-white'
              )}
            >
              {isCamOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleScreen()
              }}
              className="p-2 rounded-full bg-white/10 text-white transition-all active:scale-95"
            >
              <Monitor className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Remote Users */}
      {Object.entries(peersMetadata).map(([userId, meta]) => {
        const peerStream = remoteStreams.find((s) => s.userId === userId)
        return (
          <RemoteParticipant
            key={userId}
            peer={
              peerStream || {
                userId,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                stream: null as any, // Handle null stream in component
                videoEnabled: false,
                audioEnabled: false
              }
            }
            metadata={meta}
            disableVideo={disableVideo}
            isConnecting={!peerStream}
          />
        )
      })}

      {/* Bottom Controls Bar (Desktop Only) */}
      <div className="hidden md:flex absolute bottom-6 left-1/2 -translate-x-1/2 items-center gap-4 bg-black/40 backdrop-blur-3xl border border-white/10 px-6 py-3 rounded-[32px] shadow-2xl z-50 transition-all hover:bg-black/60 hover:scale-105">
        <button
          onClick={toggleMic}
          disabled={!canToggleMic}
          className={cn(
            'p-3 rounded-full transition-all duration-200',
            isMicOn
              ? 'bg-zinc-800 text-white hover:bg-zinc-700'
              : 'bg-red-500 text-white hover:bg-red-600',
            !canToggleMic && 'opacity-50 cursor-not-allowed'
          )}
          title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
        >
          {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>

        <button
          onClick={toggleCam}
          disabled={!canToggleCam}
          className={cn(
            'p-3 rounded-full transition-all duration-200',
            isCamOn
              ? 'bg-zinc-800 text-white hover:bg-zinc-700'
              : 'bg-red-500 text-white hover:bg-red-600',
            !canToggleCam && 'opacity-50 cursor-not-allowed'
          )}
          title={isCamOn ? 'Turn Camera Off' : 'Turn Camera On'}
        >
          {isCamOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>

        <button
          onClick={toggleScreen}
          disabled={!canToggleScreen}
          className={cn(
            'p-3 rounded-full transition-all duration-200 bg-zinc-800 text-white hover:bg-zinc-700',
            !canToggleScreen && 'opacity-50 cursor-not-allowed'
          )}
          title="Share Screen"
        >
          <Monitor className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

function RemoteParticipant({
  peer,
  metadata,
  disableVideo,
  isConnecting
}: {
  peer: PeerStream
  metadata?: PeerMetadata
  disableVideo: boolean
  isConnecting?: boolean
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  // Audio Activity Hook for Remote User
  const isSpeaking = useAudioActivity(peer.stream)

  useEffect(() => {
    if (videoRef.current && peer.stream) {
      videoRef.current.srcObject = peer.stream
    }
  }, [peer.stream])

  return (
    <div
      className={cn(
        'relative aspect-[3/4] md:aspect-video bg-black/40 backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl border border-white/10 w-full h-full transition-all duration-300',
        isSpeaking && 'border-white/40 shadow-[0_0_40px_rgba(255,255,255,0.1)]'
      )}
    >
      {isConnecting ? (
        <div className="w-full h-full flex items-center justify-center flex-col gap-2 animate-pulse">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-zinc-800/50 flex items-center justify-center border border-white/10">
            <User className="w-8 h-8 md:w-10 md:h-10 text-zinc-500" />
          </div>
          <p className="text-zinc-500 text-xs font-medium">Connecting...</p>
        </div>
      ) : peer.videoEnabled && !disableVideo && peer.stream ? (
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center flex-col gap-2">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-zinc-800 flex items-center justify-center">
            <User className="w-8 h-8 md:w-10 md:h-10 text-zinc-500" />
          </div>
        </div>
      )}

      {/* Top Name Tag */}
      <div className="absolute top-3 left-3 z-10">
        <div className="bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-xs font-medium text-white/90">
          {metadata?.name || `User ${peer.userId.slice(0, 4)}`}
        </div>
      </div>

      {/* Bottom Status / Controls */}
      {!isConnecting && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center z-10">
          <div
            className={cn(
              'p-2 rounded-full backdrop-blur-md shadow-lg transition-all',
              peer.audioEnabled ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'
            )}
          >
            {peer.audioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </div>
        </div>
      )}
    </div>
  )
}
