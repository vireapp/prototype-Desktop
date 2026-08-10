import { useState, useEffect, useRef } from 'react'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useAudioActivity(stream: MediaStream | null, threshold: number = -50) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const rafIdRef = useRef<number | null>(null)

  useEffect(() => {
    if (!stream) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsSpeaking(false)
      return
    }

    // Check if stream actually has audio tracks
    const audioTracks = stream.getAudioTracks()
    if (audioTracks.length === 0) {
      setIsSpeaking(false)
      return
    }

    // Initialize AudioContext
    try {
      if (!audioContextRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }

      const ctx = audioContextRef.current

      // Resume context if suspended (browser autoplay policy)
      if (ctx.state === 'suspended') {
        ctx.resume()
      }

      // Create Analyser
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.5 // Smooth out rapid changes
      analyserRef.current = analyser

      // Create Source
      const source = ctx.createMediaStreamSource(stream)
      source.connect(analyser)
      sourceRef.current = source

      // Analysis Loop
      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      const checkAudio = () => {
        analyser.getByteFrequencyData(dataArray)

        // Calculate average volume
        let sum = 0
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i]
        }
        const average = sum / dataArray.length

        // Normalize 0-255 to dB roughly or just use raw scale
        // Silence is usually 0. Let's use a simple threshold on the raw 0-255 scale
        // -50dB equivalent in 0-255 scaling is roughly 10-20 depending on noise floor

        // Using a more generous threshold for "Visible Glow"
        // Let's say any average energy above 10 (out of 255) is "speaking"
        // This is heuristic.
        const audioLevel = average
        const isActive = audioLevel > 10

        setIsSpeaking(isActive)

        rafIdRef.current = requestAnimationFrame(checkAudio)
      }

      checkAudio()
    } catch (err) {
      console.error('Error initializing Audio Activity analysis:', err)
    }

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect()
      }
      // Note: We generally don't close the global AudioContext as it might be shared or re-used,
      // but if we created it just for this component, we could.
      // For now, let's just disconnect the nodes.
    }
  }, [stream])

  return isSpeaking
}
