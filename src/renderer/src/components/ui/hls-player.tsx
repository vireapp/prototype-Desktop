'use client'

import React, { useEffect, useRef, useState, useImperativeHandle } from 'react'
import Hls from 'hls.js'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { AlertCircle, Play, Loader2 } from 'lucide-react'

interface HlsPlayerProps {
  src: string
  autoPlay?: boolean
  muted?: boolean
  controls?: boolean
  onPlay?: () => void
  onError?: (error: string) => void
  className?: string
}

export const HlsPlayer = React.forwardRef<HTMLVideoElement, HlsPlayerProps>(
  ({ src, autoPlay = true, muted = false, controls = true, onPlay, onError, className }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null)
    const hlsRef = useRef<Hls | null>(null)
    const [error, setError] = useState<string | null>(null)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [isPlaying, setIsPlaying] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [useProxy, setUseProxy] = useState(false)

    useImperativeHandle(ref, () => videoRef.current as HTMLVideoElement)

    useEffect(() => {
      setIsLoading(true)
      setError(null)

      const video = videoRef.current
      if (!video) return

      // Cleanup previous instance
      if (hlsRef.current) {
        hlsRef.current.destroy()
      }

      let retryCount = 0

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handleHlsError = (event: any, data: any) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              const response = data.response || {}
              console.error('HLS Network Error Details:', {
                type: data.type,
                details: data.details,
                status: response.code,
                statusText: response.text,
                url: response.url
              })

              if (!useProxy) {
                console.warn(
                  'Direct load failed (Network Error), switching to Proxy immediately...'
                )
                setUseProxy(true)
                // We don't increment retryCount here because we are changing strategy
              } else if (retryCount < 2) {
                // If we are ALREADY using proxy and it fails, then retry
                retryCount++
                console.log(`Proxy recovery attempt ${retryCount}/2...`)
                hlsRef.current?.startLoad()
              } else {
                setError(`Stream Offline/Unavailable (${response.code || 'Network Error'}).`)
                if (onError) onError(`Stream Offline: ${data.details} (${response.code})`)
                hlsRef.current?.destroy()
              }
              break
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('HLS Media Error', data)
              hlsRef.current?.recoverMediaError()
              break
            default:
              console.error('HLS Fatal Error', data)
              setError('Stream failed to load (Fatal Error)')
              if (onError) onError('Fatal HLS Error')
              if (hlsRef.current) hlsRef.current.destroy()
              break
          }
        }
      }

      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        })

        hlsRef.current = hls

        // Smart Proxy Logic
        const finalSrc = useProxy ? `/api/proxy?url=${encodeURIComponent(src)}` : src
        console.log(`Loading Stream (Proxy: ${useProxy}):`, finalSrc)

        hls.loadSource(finalSrc)
        hls.attachMedia(video)

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsLoading(false)
          if (autoPlay) {
            video.play().catch((e) => {
              console.warn('Autoplay blocked', e)
              setIsPlaying(false)
            })
          }
        })

        hls.on(Hls.Events.ERROR, handleHlsError)
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari / Native HLS
        video.src = src
        video.addEventListener('loadedmetadata', () => {
          setIsLoading(false)
          if (autoPlay) video.play()
        })
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        video.addEventListener('error', (e) => {
          setError('Native HLS Error')
          if (onError) onError('Native HLS Error')
        })
      } else {
        setError('HLS not supported in this browser')
        setIsLoading(false)
      }

      return () => {
        if (hlsRef.current) {
          hlsRef.current.destroy()
        }
      }
    }, [src, autoPlay, onError, useProxy])

    return (
      <div className={`relative w-full h-full bg-black group ${className}`}>
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          muted={muted}
          controls={controls}
          playsInline
          onPlay={() => {
            setIsPlaying(true)
            if (onPlay) onPlay()
          }}
          onPause={() => setIsPlaying(false)}
        />

        {/* Overlay for Loading/Error */}
        {(isLoading || error) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            {error ? (
              <div className="text-center text-red-400 p-4">
                <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            ) : (
              <div className="text-center text-white/50">
                <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
                <p className="text-xs uppercase tracking-widest">Loading Stream</p>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }
)

HlsPlayer.displayName = 'HlsPlayer'
