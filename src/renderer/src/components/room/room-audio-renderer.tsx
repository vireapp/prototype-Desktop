import React, { useEffect, useRef } from 'react'
import { PeerStream } from '../../hooks/use-webrtc'

interface RoomAudioRendererProps {
  remoteStreams: PeerStream[]
  volume: number
}

export function RoomAudioRenderer({ remoteStreams, volume }: RoomAudioRendererProps) {
  return (
    <div className="hidden">
      {remoteStreams.map((peer) => (
        <AudioStream key={peer.userId} stream={peer.stream} volume={volume} />
      ))}
    </div>
  )
}

function AudioStream({ stream, volume }: { stream: MediaStream; volume: number }) {
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.srcObject = stream
    }
  }, [stream])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  return <audio ref={audioRef} autoPlay playsInline controls={false} />
}
