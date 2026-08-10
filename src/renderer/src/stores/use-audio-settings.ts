// stores/use-audio-settings.ts
// Persisted Zustand store for all noise-cancellation & audio processing settings.
// Settings are synced to localStorage so they survive page/app reloads.

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { NoiseSettings } from '@/lib/audio/audio-manager'
import { DEFAULT_NOISE_SETTINGS } from '@/lib/audio/audio-manager'

export type NcPreset = 'off' | 'subtle' | 'balanced' | 'aggressive' | 'custom'

export interface AudioSettingsState {
  // ── Noise Cancellation ──────────────────────────────────────────────────
  noiseSettings: NoiseSettings
  preset: NcPreset

  // ── Auto Gain Control ───────────────────────────────────────────────────
  agcEnabled: boolean

  // ── Echo Cancellation ───────────────────────────────────────────────────
  echoCancellationEnabled: boolean

  // ── Input device ────────────────────────────────────────────────────────
  inputDeviceId: string | null

  // ── Output device ───────────────────────────────────────────────────────
  outputDeviceId: string | null

  // ── Microphone volume (0–200) ───────────────────────────────────────────
  micBoost: number

  // ── Actions ─────────────────────────────────────────────────────────────
  setNoiseSettings: (patch: Partial<NoiseSettings>) => void
  applyPreset: (preset: NcPreset) => void
  setAgcEnabled: (v: boolean) => void
  setEchoCancellationEnabled: (v: boolean) => void
  setInputDeviceId: (id: string | null) => void
  setOutputDeviceId: (id: string | null) => void
  setMicBoost: (v: number) => void
  resetAll: () => void
}

// ─────────────────────────────────────────────────────────────────────────────
// Preset definitions
// ─────────────────────────────────────────────────────────────────────────────
export const NC_PRESETS: Record<Exclude<NcPreset, 'custom'>, Partial<NoiseSettings>> = {
  off: {
    enabled: false,
    thresholdDb: -45,
    vadDb: -30,
    attackMs: 5,
    releaseMs: 150,
    holdMs: 80,
    highPassEnabled: false,
    vadEnabled: false,
    expanderEnabled: false,
    compressorThresholdDb: -24,
    compressorRatio: 1
  },
  subtle: {
    enabled: true,
    thresholdDb: -55,
    vadDb: -35,
    attackMs: 8,
    releaseMs: 200,
    holdMs: 100,
    highPassEnabled: true,
    vadEnabled: true,
    expanderEnabled: false,
    compressorThresholdDb: -20,
    compressorRatio: 2
  },
  balanced: {
    ...DEFAULT_NOISE_SETTINGS,
    enabled: true
  },
  aggressive: {
    enabled: true,
    thresholdDb: -35,
    vadDb: -22,
    attackMs: 3,
    releaseMs: 100,
    holdMs: 60,
    highPassEnabled: true,
    vadEnabled: true,
    expanderEnabled: true,
    compressorThresholdDb: -28,
    compressorRatio: 6
  }
}

// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_STATE: Omit<AudioSettingsState, 
  'setNoiseSettings' | 'applyPreset' | 'setAgcEnabled' | 'setEchoCancellationEnabled' |
  'setInputDeviceId' | 'setOutputDeviceId' | 'setMicBoost' | 'resetAll'
> = {
  noiseSettings: { ...DEFAULT_NOISE_SETTINGS },
  preset: 'balanced',
  agcEnabled: true,
  echoCancellationEnabled: true,
  inputDeviceId: null,
  outputDeviceId: null,
  micBoost: 100
}

// ─────────────────────────────────────────────────────────────────────────────
export const useAudioSettings = create<AudioSettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_STATE,

      setNoiseSettings: (patch) =>
        set((s) => ({
          noiseSettings: { ...s.noiseSettings, ...patch },
          preset: 'custom'
        })),

      applyPreset: (preset) =>
        set(() => {
          if (preset === 'custom') return { preset }
          const presetSettings = NC_PRESETS[preset]
          return {
            preset,
            noiseSettings: { ...DEFAULT_NOISE_SETTINGS, ...presetSettings }
          }
        }),

      setAgcEnabled: (v) => set({ agcEnabled: v }),
      setEchoCancellationEnabled: (v) => set({ echoCancellationEnabled: v }),
      setInputDeviceId: (id) => set({ inputDeviceId: id }),
      setOutputDeviceId: (id) => set({ outputDeviceId: id }),
      setMicBoost: (v) => set({ micBoost: v }),

      resetAll: () =>
        set({
          ...DEFAULT_STATE,
          noiseSettings: { ...DEFAULT_NOISE_SETTINGS }
        })
    }),
    { name: 'audio-settings-v1' }
  )
)
