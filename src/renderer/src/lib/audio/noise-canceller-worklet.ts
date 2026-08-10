// noise-canceller-worklet.ts
// AudioWorkletProcessor — Advanced JS/DSP Noise Cancellation Engine
//
// Architecture:
//   1. High-pass filter  — strips <80 Hz rumble (HVAC, desk vibration)
//   2. Envelope follower — fast attack / slow release (per-channel)
//   3. Spectral noise gate — non-linear smooth gain curve
//   4. Voice-Activity Detector (VAD) — inhibits gating on speech
//   5. Dynamic soft-knee expander — handles mid-level noise (fans, AC)
//   6. MessagePort API — all params hot-swappable at runtime

/* ── Ambient type declarations for AudioWorklet scope ── */
declare class AudioWorkletProcessor {
  readonly port: MessagePort
  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>
  ): boolean
  constructor(options?: AudioWorkletNodeOptions)
}
declare function registerProcessor(
  name: string,
  processorCtor: new (options?: AudioWorkletNodeOptions) => AudioWorkletProcessor
): void
declare const sampleRate: number
declare const currentTime: number

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function timeConst(ms: number): number {
  return Math.exp(-1 / (sampleRate * (ms / 1000)))
}

function dbToLinear(db: number): number {
  return Math.pow(10, db / 20)
}

// ─────────────────────────────────────────────────────────────────────────────
// Single-pole IIR high-pass filter state
// ─────────────────────────────────────────────────────────────────────────────
class HighPassFilter {
  private x1 = 0
  private y1 = 0
  private alpha: number

  constructor(cutoffHz: number) {
    const rc = 1 / (2 * Math.PI * cutoffHz)
    const dt = 1 / sampleRate
    this.alpha = rc / (rc + dt)
  }

  process(x: number): number {
    const y = this.alpha * (this.y1 + x - this.x1)
    this.x1 = x
    this.y1 = y
    return y
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Processor
// ─────────────────────────────────────────────────────────────────────────────
class NoiseCancellerProcessor extends AudioWorkletProcessor {
  // ── Gate parameters ──────────────────────────────────────────────────────
  private threshold: number     // linear amplitude gate threshold
  private vadThreshold: number  // VAD trigger amplitude (above = "speech")
  private attackCoef: number    // envelope attack coefficient
  private releaseCoef: number   // envelope release coefficient
  private holdSamples: number   // hold counter (samples) after gate opens

  // ── Feature flags ────────────────────────────────────────────────────────
  private vadEnabled: boolean
  private highPassEnabled: boolean
  private expanderEnabled: boolean
  private enabled: boolean

  // ── DSP state ────────────────────────────────────────────────────────────
  private envelope: number[]      // per-channel envelope
  private holdCounters: number[]  // per-channel hold counters
  private hpFilters: HighPassFilter[]
  private smoothGain: number      // smoothed output gain (de-click)
  private smoothGainCoef: number

  // ── Metering ─────────────────────────────────────────────────────────────
  private meterCounter = 0
  private readonly METER_INTERVAL = 128 // frames between meter sends
  private peakInput = 0
  private peakOutput = 0
  private isVoiceActive = false

  constructor(options?: AudioWorkletNodeOptions) {
    super()
    const o = options?.processorOptions ?? {}

    const thresholdDb: number  = o.thresholdDb  ?? -45
    const vadDb: number        = o.vadDb         ?? -30
    const attackMs: number     = o.attackMs      ?? 5
    const releaseMs: number    = o.releaseMs     ?? 150
    const holdMs: number       = o.holdMs        ?? 80

    this.threshold       = dbToLinear(thresholdDb)
    this.vadThreshold    = dbToLinear(vadDb)
    this.attackCoef      = timeConst(attackMs)
    this.releaseCoef     = timeConst(releaseMs)
    this.holdSamples     = Math.floor(sampleRate * holdMs / 1000)

    this.vadEnabled      = o.vadEnabled      ?? true
    this.highPassEnabled = o.highPassEnabled ?? true
    this.expanderEnabled = o.expanderEnabled ?? true
    this.enabled         = o.enabled         ?? true

    // Pre-create per-channel state (support up to 2 ch at init; expand in process())
    this.envelope     = [0, 0]
    this.holdCounters = [0, 0]
    this.hpFilters    = [new HighPassFilter(80), new HighPassFilter(80)]

    this.smoothGain      = 1.0
    this.smoothGainCoef  = timeConst(5) // 5ms de-click smoother

    // ── Hot-param control via MessagePort ───────────────────────────────────
    this.port.onmessage = (event) => {
      const { type, value } = event.data ?? {}
      switch (type) {
        case 'SET_THRESHOLD':
          this.threshold = dbToLinear(value)
          break
        case 'SET_VAD_THRESHOLD':
          this.vadThreshold = dbToLinear(value)
          break
        case 'SET_ATTACK':
          this.attackCoef = timeConst(value)
          break
        case 'SET_RELEASE':
          this.releaseCoef = timeConst(value)
          break
        case 'SET_HOLD':
          this.holdSamples = Math.floor(sampleRate * value / 1000)
          break
        case 'SET_VAD_ENABLED':
          this.vadEnabled = value
          break
        case 'SET_HP_ENABLED':
          this.highPassEnabled = value
          break
        case 'SET_EXPANDER_ENABLED':
          this.expanderEnabled = value
          break
        case 'SET_ENABLED':
          this.enabled = value
          break
      }
    }
  }

  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    _parameters: Record<string, Float32Array>
  ): boolean {
    const input  = inputs[0]
    const output = outputs[0]

    if (!input || input.length === 0 || !input[0]) {
      return true
    }

    const channelCount = input.length
    const frameCount   = input[0].length

    // Expand per-channel state arrays if needed
    while (this.envelope.length < channelCount)     this.envelope.push(0)
    while (this.holdCounters.length < channelCount) this.holdCounters.push(0)
    while (this.hpFilters.length < channelCount)    this.hpFilters.push(new HighPassFilter(80))

    // ── Passthrough mode (NC disabled) ───────────────────────────────────
    if (!this.enabled) {
      for (let ch = 0; ch < channelCount; ch++) {
        if (output[ch] && input[ch]) {
          output[ch].set(input[ch])
        }
      }
      return true
    }

    // ── Process each sample ───────────────────────────────────────────────
    // Use channel-0 for the envelope/VAD detector; apply gain to all channels
    const inputL = input[0]

    let frameVoiceActive = false
    let frameMaxInput    = 0
    let frameMaxOutput   = 0

    for (let i = 0; i < frameCount; i++) {
      // 1. High-pass: strip sub-80 Hz rumble
      let sample = this.highPassEnabled ? this.hpFilters[0].process(inputL[i]) : inputL[i]
      const absSample = Math.abs(sample)

      // 2. Envelope follower
      if (absSample > this.envelope[0]) {
        this.envelope[0] = this.attackCoef  * (this.envelope[0] - absSample) + absSample
      } else {
        this.envelope[0] = this.releaseCoef * (this.envelope[0] - absSample) + absSample
      }

      const env = this.envelope[0]
      frameMaxInput = Math.max(frameMaxInput, absSample)

      // 3. Voice Activity Detection
      const voiceDetected = this.vadEnabled && (env >= this.vadThreshold)
      if (voiceDetected) {
        this.holdCounters[0] = this.holdSamples
        frameVoiceActive = true
      } else if (this.holdCounters[0] > 0) {
        this.holdCounters[0]--
        frameVoiceActive = true // still in hold window
      }

      // 4. Compute target gate gain
      let targetGain = 1.0

      if (!frameVoiceActive) {
        if (env < this.threshold) {
          // Non-linear smooth gate curve (quadratic)
          const ratio = env / (this.threshold + 1e-30)
          targetGain = ratio * ratio
        } else if (this.expanderEnabled && env < this.threshold * 4) {
          // Soft-knee expander for moderate ambient noise
          const t = (env - this.threshold) / (this.threshold * 3)
          targetGain = t * t * (3 - 2 * t) // smoothstep
        }
      }

      // 5. Smooth the gain to avoid clicks
      this.smoothGain = this.smoothGainCoef * (this.smoothGain - targetGain) + targetGain

      // 6. Apply gain to all channels
      for (let ch = 0; ch < channelCount; ch++) {
        if (!output[ch] || !input[ch]) continue

        const s = ch === 0
          ? (this.highPassEnabled ? sample : input[ch][i])
          : (this.highPassEnabled ? this.hpFilters[ch].process(input[ch][i]) : input[ch][i])

        const out = s * this.smoothGain
        output[ch][i] = out
        frameMaxOutput = Math.max(frameMaxOutput, Math.abs(out))
      }
    }

    // ── Metering: send level data to main thread periodically ────────────
    this.peakInput  = Math.max(this.peakInput,  frameMaxInput)
    this.peakOutput = Math.max(this.peakOutput, frameMaxOutput)
    if (frameVoiceActive) this.isVoiceActive = true

    this.meterCounter++
    if (this.meterCounter >= this.METER_INTERVAL) {
      this.port.postMessage({
        type: 'METER',
        inputLevel:    20 * Math.log10(this.peakInput  + 1e-30),
        outputLevel:   20 * Math.log10(this.peakOutput + 1e-30),
        voiceActive:   this.isVoiceActive,
        gainReduction: this.smoothGain
      })
      this.meterCounter  = 0
      this.peakInput     = 0
      this.peakOutput    = 0
      this.isVoiceActive = false
    }

    return true
  }
}

registerProcessor('noise-canceller-processor', NoiseCancellerProcessor)
