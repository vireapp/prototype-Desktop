// audio-manager.ts
// Full Web Audio API graph for noise cancellation pipeline
//
// Graph:
//   MediaStream → HighPass (BiquadFilter) → NoiseCancellerWorklet
//     → DynamicsCompressor → MediaStreamDestination
//
// The `AudioPipeline` class keeps a live reference so settings can be
// changed at runtime without tearing down the whole WebRTC stream.

export interface NoiseSettings {
  /** Master toggle for the entire pipeline */
  enabled: boolean
  /** Gate threshold in dB (-60 to -20) */
  thresholdDb: number
  /** VAD trigger threshold in dB (-50 to -15) */
  vadDb: number
  /** Gate attack time in ms */
  attackMs: number
  /** Gate release time in ms */
  releaseMs: number
  /** Hold time in ms (keeps gate open after voice ends) */
  holdMs: number
  /** High-pass 80 Hz rumble filter */
  highPassEnabled: boolean
  /** Voice Activity Detection  */
  vadEnabled: boolean
  /** Soft-knee expander for ambient noise */
  expanderEnabled: boolean
  /** Compressor threshold dB */
  compressorThresholdDb: number
  /** Compressor ratio */
  compressorRatio: number
}

export const DEFAULT_NOISE_SETTINGS: NoiseSettings = {
  enabled: true,
  thresholdDb: -45,
  vadDb: -30,
  attackMs: 5,
  releaseMs: 150,
  holdMs: 80,
  highPassEnabled: true,
  vadEnabled: true,
  expanderEnabled: true,
  compressorThresholdDb: -24,
  compressorRatio: 4
}

export type MeterData = {
  inputLevel: number   // dBFS
  outputLevel: number  // dBFS
  voiceActive: boolean
  gainReduction: number // 0–1 linear
}

type MeterCallback = (data: MeterData) => void

// ─────────────────────────────────────────────────────────────────────────────
export class AudioPipeline {
  private ctx: AudioContext | null = null
  private workletNode: AudioWorkletNode | null = null
  private compressor: DynamicsCompressorNode | null = null
  private highPassNode: BiquadFilterNode | null = null
  private destination: MediaStreamAudioDestinationNode | null = null
  private outputStream: MediaStream | null = null
  private meterCallback: MeterCallback | null = null
  private settings: NoiseSettings

  constructor(settings: NoiseSettings = DEFAULT_NOISE_SETTINGS) {
    this.settings = { ...settings }
  }

  /** Apply the full pipeline to a MediaStream. Returns the cleaned stream. */
  async init(stream: MediaStream): Promise<MediaStream> {
    // Tear down any existing pipeline first
    await this.destroy()

    try {
      this.ctx = new AudioContext({ sampleRate: 48000, latencyHint: 'interactive' })

      const workletUrl = new URL('./noise-canceller-worklet.ts', import.meta.url).href
      await this.ctx.audioWorklet.addModule(workletUrl)

      const source = this.ctx.createMediaStreamSource(stream)

      // ── 1. High-pass filter (80 Hz, hardware path) ──────────────────────
      this.highPassNode = this.ctx.createBiquadFilter()
      this.highPassNode.type = 'highpass'
      this.highPassNode.frequency.value = 80
      this.highPassNode.Q.value = 0.707

      // ── 2. Noise-gate + VAD worklet ──────────────────────────────────────
      this.workletNode = new AudioWorkletNode(this.ctx, 'noise-canceller-processor', {
        processorOptions: {
          thresholdDb:      this.settings.thresholdDb,
          vadDb:            this.settings.vadDb,
          attackMs:         this.settings.attackMs,
          releaseMs:        this.settings.releaseMs,
          holdMs:           this.settings.holdMs,
          highPassEnabled:  this.settings.highPassEnabled,
          vadEnabled:       this.settings.vadEnabled,
          expanderEnabled:  this.settings.expanderEnabled,
          enabled:          this.settings.enabled
        }
      })

      // ── 3. Dynamics compressor (optional makeup gain / protect clipping) ─
      this.compressor = this.ctx.createDynamicsCompressor()
      this.compressor.threshold.value = this.settings.compressorThresholdDb
      this.compressor.ratio.value     = this.settings.compressorRatio
      this.compressor.knee.value      = 6
      this.compressor.attack.value    = 0.003
      this.compressor.release.value   = 0.25

      // ── 4. Destination ───────────────────────────────────────────────────
      this.destination = this.ctx.createMediaStreamDestination()

      // ── Connect graph ────────────────────────────────────────────────────
      source
        .connect(this.highPassNode)
        .connect(this.workletNode)
        .connect(this.compressor)
        .connect(this.destination)

      // ── Meter messages from worklet ──────────────────────────────────────
      this.workletNode.port.onmessage = (e) => {
        if (e.data?.type === 'METER' && this.meterCallback) {
          this.meterCallback(e.data as MeterData)
        }
      }

      // ── Carry through video tracks ───────────────────────────────────────
      this.outputStream = this.destination.stream
      stream.getVideoTracks().forEach((t) => this.outputStream!.addTrack(t))

      // Apply settings that can't be constructor-set
      this._applySettings()

      return this.outputStream
    } catch (err) {
      console.error('[AudioPipeline] Init failed:', err)
      return stream // graceful fallback
    }
  }

  /** Update a subset of settings at runtime (no re-init needed). */
  updateSettings(patch: Partial<NoiseSettings>): void {
    this.settings = { ...this.settings, ...patch }
    this._applySettings()
  }

  /** Register a callback to receive real-time meter data. */
  onMeter(cb: MeterCallback | null): void {
    this.meterCallback = cb
  }

  /** Tear down the pipeline and free all resources. */
  async destroy(): Promise<void> {
    this.meterCallback = null
    if (this.workletNode) {
      this.workletNode.disconnect()
      this.workletNode = null
    }
    if (this.highPassNode) {
      this.highPassNode.disconnect()
      this.highPassNode = null
    }
    if (this.compressor) {
      this.compressor.disconnect()
      this.compressor = null
    }
    if (this.ctx) {
      await this.ctx.close()
      this.ctx = null
    }
    this.destination  = null
    this.outputStream = null
  }

  // ── Private helpers ─────────────────────────────────────────────────────
  private _applySettings(): void {
    const s = this.settings

    if (this.workletNode) {
      const send = (type: string, value: unknown) =>
        this.workletNode!.port.postMessage({ type, value })
      send('SET_ENABLED',           s.enabled)
      send('SET_THRESHOLD',         s.thresholdDb)
      send('SET_VAD_THRESHOLD',     s.vadDb)
      send('SET_ATTACK',            s.attackMs)
      send('SET_RELEASE',           s.releaseMs)
      send('SET_HOLD',              s.holdMs)
      send('SET_HP_ENABLED',        s.highPassEnabled)
      send('SET_VAD_ENABLED',       s.vadEnabled)
      send('SET_EXPANDER_ENABLED',  s.expanderEnabled)
    }

    if (this.compressor) {
      this.compressor.threshold.value = s.compressorThresholdDb
      this.compressor.ratio.value     = s.compressorRatio
    }

    if (this.highPassNode) {
      this.highPassNode.frequency.value = s.highPassEnabled ? 80 : 0
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Legacy one-shot helper (kept for backward compatibility)
// ─────────────────────────────────────────────────────────────────────────────
export async function applyNoiseCancellation(stream: MediaStream): Promise<MediaStream> {
  const pipeline = new AudioPipeline()
  return pipeline.init(stream)
}
