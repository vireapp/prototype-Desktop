import { useEffect, useState, useRef } from 'react'

export function useAudioLevel(stream: MediaStream | null) {
  const [level, setLevel] = useState(0)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const frameRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!stream) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLevel(0)
      setIsSpeaking(false)
      return
    }

    const audioTrack = stream.getAudioTracks()[0]
    if (!audioTrack) return

    // Initialize AudioContext
    if (!audioContextRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }

    const ctx = audioContextRef.current
    if (ctx.state === 'suspended') {
      ctx.resume()
    }

    try {
      analyserRef.current = ctx.createAnalyser()
      analyserRef.current.fftSize = 512
      analyserRef.current.smoothingTimeConstant = 0.4

      sourceRef.current = ctx.createMediaStreamSource(stream)
      sourceRef.current.connect(analyserRef.current)

      const bufferLength = analyserRef.current.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      const update = () => {
        if (!analyserRef.current) return

        analyserRef.current.getByteFrequencyData(dataArray)

        // Calculate average volume
        let sum = 0
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i]
        }
        const avg = sum / bufferLength

        // Normalize slightly
        const normalized = Math.min(100, Math.max(0, avg * 2.5))

        setLevel(normalized)
        setIsSpeaking(normalized > 10) // Threshold for "speaking"

        frameRef.current = requestAnimationFrame(update)
      }

      update()
    } catch (e) {
      console.error('Audio Analysis Error:', e)
    }

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      sourceRef.current?.disconnect()
      // Don't close context typically as it might be shared, but here we can keep it open or close if needed.
      // For efficiency in multiple players, we might want to handle this carefully, but per-component is okay for now.
    }
  }, [stream])

  return { level, isSpeaking }
}
