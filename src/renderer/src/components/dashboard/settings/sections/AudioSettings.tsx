import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useEffect, useRef, useState, useCallback } from 'react'
import {
  Mic, MicOff, Volume2, VolumeX, Headphones, Wand2,
  Zap, Radio, Activity, Settings2, RotateCcw, ChevronDown,
  ChevronUp, Shield, AudioWaveform, CircleDot
} from 'lucide-react'
import { useAudioSettings, NC_PRESETS, NcPreset } from '@/stores/use-audio-settings'
import { cn } from '@/lib/utils'
import type { MeterData } from '@/lib/audio/audio-manager'

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Animated Level Meter
// ─────────────────────────────────────────────────────────────────────────────
function LevelMeter({ value, peak, color }: { value: number; peak?: number; color: string }) {
  // value: 0-100 normalised
  const bars = 24
  const activeBars = Math.round((value / 100) * bars)
  const peakBar = peak !== undefined ? Math.round((peak / 100) * bars) : -1

  return (
    <div className="flex gap-[2px] items-end h-6">
      {Array.from({ length: bars }).map((_, i) => {
        const isActive  = i < activeBars
        const isPeakBar = i === peakBar
        return (
          <div
            key={i}
            className={cn(
              'flex-1 rounded-[1px] transition-all duration-75',
              isPeakBar
                ? 'bg-red-400'
                : isActive
                ? color
                : 'bg-white/10'
            )}
            style={{ height: `${30 + (i / bars) * 70}%` }}
          />
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Live Visualizer (using AnalyserNode on mic)
// ─────────────────────────────────────────────────────────────────────────────
function LiveMicVisualizer({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef   = useRef<number>()
  const analyserRef = useRef<AnalyserNode | null>(null)
  const ctxAudioRef = useRef<AudioContext | null>(null)
  const streamRef   = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (!active) {
      cancelAnimationFrame(animRef.current!)
      analyserRef.current = null
      ctxAudioRef.current?.close()
      ctxAudioRef.current = null
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
      return
    }

    let mounted = true
    ;(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        if (!mounted) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream

        const ac = new AudioContext()
        ctxAudioRef.current = ac
        const analyser = ac.createAnalyser()
        analyser.fftSize = 256
        analyser.smoothingTimeConstant = 0.7
        analyserRef.current = analyser

        ac.createMediaStreamSource(stream).connect(analyser)

        const buf = new Uint8Array(analyser.frequencyBinCount)
        const canvas = canvasRef.current
        if (!canvas) return

        const draw = () => {
          if (!mounted) return
          animRef.current = requestAnimationFrame(draw)
          analyser.getByteFrequencyData(buf)

          const ctx2d = canvas.getContext('2d')
          if (!ctx2d) return

          const { width: w, height: h } = canvas
          ctx2d.clearRect(0, 0, w, h)

          const barW = (w / buf.length) * 2.5
          let x = 0
          for (let i = 0; i < buf.length; i++) {
            const barH = (buf[i] / 255) * h
            const hue  = 180 + (buf[i] / 255) * 80
            ctx2d.fillStyle = `hsla(${hue}, 70%, 60%, 0.85)`
            ctx2d.fillRect(x, h - barH, barW - 1, barH)
            x += barW + 1
          }
        }
        draw()
      } catch {
        // mic permission denied — fail silently
      }
    })()

    return () => {
      mounted = false
      cancelAnimationFrame(animRef.current!)
      analyserRef.current = null
      ctxAudioRef.current?.close()
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [active])

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={40}
      className="w-full h-10 rounded-lg bg-black/30"
    />
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Preset Pill
// ─────────────────────────────────────────────────────────────────────────────
const PRESET_META: Record<Exclude<NcPreset, 'custom'>, { label: string; icon: typeof Zap; color: string }> = {
  off:        { label: 'Off',        icon: MicOff,         color: 'border-zinc-600 text-zinc-400 hover:border-zinc-400'        },
  subtle:     { label: 'Subtle',     icon: Radio,          color: 'border-sky-500/60 text-sky-400 hover:border-sky-400'        },
  balanced:   { label: 'Balanced',   icon: Wand2,          color: 'border-violet-500/60 text-violet-400 hover:border-violet-400' },
  aggressive: { label: 'Max',        icon: Zap,            color: 'border-amber-500/60 text-amber-400 hover:border-amber-400'  }
}

function PresetPill({
  preset,
  active,
  onClick
}: {
  preset: Exclude<NcPreset, 'custom'>
  active: boolean
  onClick: () => void
}) {
  const meta = PRESET_META[preset]
  const Icon = meta.icon
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all duration-200',
        active
          ? 'bg-primary/20 border-primary text-primary shadow-[0_0_12px_hsl(var(--primary)/0.3)]'
          : meta.color
      )}
    >
      <Icon className="h-3 w-3" />
      {meta.label}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Setting Row
// ─────────────────────────────────────────────────────────────────────────────
function SettingRow({
  icon: Icon,
  iconColor,
  label,
  description,
  children,
  badge
}: {
  icon: typeof Mic
  iconColor: string
  label: string
  description: string
  children: React.ReactNode
  badge?: string
}) {
  return (
    <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-card/60 border border-border/60 hover:border-border transition-colors">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className={cn('p-2 rounded-lg bg-card border border-border/50 mt-0.5', iconColor)}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="space-y-0.5 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-semibold text-foreground cursor-default">{label}</Label>
            {badge && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
                {badge}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>
      <div className="shrink-0 mt-1">{children}</div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Slider Row
// ─────────────────────────────────────────────────────────────────────────────
function SliderRow({
  label,
  value,
  onChange,
  min,
  max,
  step,
  unit,
  formatValue
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step: number
  unit?: string
  formatValue?: (v: number) => string
}) {
  const display = formatValue ? formatValue(value) : `${value}${unit ?? ''}`
  return (
    <div className="space-y-2 px-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-md">
          {display}
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export function AudioSettings() {
  const {
    noiseSettings,
    preset,
    agcEnabled,
    echoCancellationEnabled,
    micBoost,
    setNoiseSettings,
    applyPreset,
    setAgcEnabled,
    setEchoCancellationEnabled,
    setMicBoost,
    resetAll
  } = useAudioSettings()

  const [showAdvanced, setShowAdvanced]     = useState(false)
  const [showVisualizer, setShowVisualizer] = useState(false)
  const [meterData, setMeterData]           = useState<MeterData | null>(null)
  const [peakInput, setPeakInput]           = useState(0)

  // ── Simulated meter decay when no real pipeline meter ──────────────────
  useEffect(() => {
    if (!meterData) return
    const t = setTimeout(() => setMeterData(null), 1000)
    return () => clearTimeout(t)
  }, [meterData])

  // ── Peak hold decay ─────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setPeakInput((p) => Math.max(0, p - 2)), 200)
    return () => clearInterval(t)
  }, [])

  const normaliseDb = useCallback((db: number) => {
    // Map -80..0 dBFS → 0..100%
    return Math.max(0, Math.min(100, ((db + 80) / 80) * 100))
  }, [])

  const inputPct  = meterData ? normaliseDb(meterData.inputLevel)  : 0
  const outputPct = meterData ? normaliseDb(meterData.outputLevel) : 0

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* ── Header ── */}
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground tracking-tight flex items-center gap-3">
            Audio &amp; Voice
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5">
              Desktop Pro
            </Badge>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Web Audio noise cancellation — adaptive gate, VAD, compressor, and equalisation.
          </p>
        </div>
      </div>

      {/* ── Noise Cancellation Card ── */}
      <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-md overflow-hidden shadow-xl ring-1 ring-white/5">
        {/* Card header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border/60 bg-muted/10">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-primary/15 border border-primary/20 shadow-inner">
              <AudioWaveform className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight">Vire Intelligence NC</span>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[9px] px-2 py-0.5 font-bold tracking-widest border transition-all duration-300',
                    noiseSettings.enabled
                      ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                      : 'border-zinc-700 text-zinc-500 bg-zinc-800/50'
                  )}
                >
                  {noiseSettings.enabled ? 'ACTIVE' : 'INACTIVE'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground/80 mt-0.5 font-medium">
                High-fidelity noise suppression & speech isolation
              </p>
            </div>
          </div>
          <Switch
            checked={noiseSettings.enabled}
            onCheckedChange={(v) => {
              setNoiseSettings({ enabled: v })
              if (v && preset === 'off') applyPreset('balanced')
            }}
          />
        </div>

        {/* Presets row */}
        <div className="px-5 py-3 border-b border-border/40 bg-muted/20">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground mr-1 shrink-0">Preset:</span>
            {(Object.keys(PRESET_META) as Exclude<NcPreset, 'custom'>[]).map((p) => (
              <PresetPill
                key={p}
                preset={p}
                active={preset === p}
                onClick={() => applyPreset(p)}
              />
            ))}
            {preset === 'custom' && (
              <Badge variant="outline" className="text-[10px] px-2 py-1 border-dashed">
                Custom
              </Badge>
            )}
          </div>
        </div>

        {/* Live Visualizer toggle */}
        <div className="px-5 pt-4 pb-3">
          <button
            onClick={() => setShowVisualizer((v) => !v)}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <CircleDot className={cn('h-3 w-3', showVisualizer ? 'text-emerald-400 animate-pulse' : '')} />
            {showVisualizer ? 'Hide live microphone monitor' : 'Show live microphone monitor'}
          </button>

          {showVisualizer && (
            <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <LiveMicVisualizer active={showVisualizer} />
              {/* Meter bars */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase">Input</span>
                  <LevelMeter
                    value={inputPct}
                    peak={peakInput}
                    color="bg-sky-400"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase">Filtered</span>
                  <LevelMeter
                    value={outputPct}
                    color="bg-emerald-400"
                  />
                </div>
              </div>
              {meterData && (
                <div className="flex items-center gap-3 text-[10px] font-mono">
                  <span className={cn(
                    'flex items-center gap-1',
                    meterData.voiceActive ? 'text-emerald-400' : 'text-zinc-500'
                  )}>
                    <span className={cn('w-1.5 h-1.5 rounded-full', meterData.voiceActive ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600')} />
                    {meterData.voiceActive ? 'Voice detected' : 'Silence'}
                  </span>
                  <span className="text-zinc-500">
                    GR: {Math.round((1 - meterData.gainReduction) * 100)}% reduction
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Gate threshold slider (always visible when NC is on) */}
        {noiseSettings.enabled && (
          <div className="px-5 pb-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="rounded-xl bg-muted/30 border border-border/50 p-4 space-y-4">
              <SliderRow
                label="Gate Threshold"
                value={noiseSettings.thresholdDb}
                onChange={(v) => setNoiseSettings({ thresholdDb: v })}
                min={-70}
                max={-20}
                step={1}
                formatValue={(v) => `${v} dB`}
              />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Signals below this level are attenuated. Lower values = gentler filtering.
                Raise it to silence louder ambient noise (fans, AC).
              </p>
            </div>

            {/* Advanced section */}
            <button
              onClick={() => setShowAdvanced((v) => !v)}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground w-full transition-colors"
            >
              <Settings2 className="h-3 w-3" />
              <span>Advanced parameters</span>
              {showAdvanced ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
            </button>

            {showAdvanced && (
              <div className="rounded-xl bg-muted/20 border border-border/40 p-4 space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
                <SliderRow
                  label="VAD Threshold"
                  value={noiseSettings.vadDb}
                  onChange={(v) => setNoiseSettings({ vadDb: v })}
                  min={-60}
                  max={-10}
                  step={1}
                  formatValue={(v) => `${v} dB`}
                />
                <SliderRow
                  label="Attack Time"
                  value={noiseSettings.attackMs}
                  onChange={(v) => setNoiseSettings({ attackMs: v })}
                  min={1}
                  max={50}
                  step={1}
                  unit=" ms"
                />
                <SliderRow
                  label="Release Time"
                  value={noiseSettings.releaseMs}
                  onChange={(v) => setNoiseSettings({ releaseMs: v })}
                  min={20}
                  max={500}
                  step={5}
                  unit=" ms"
                />
                <SliderRow
                  label="Hold Time"
                  value={noiseSettings.holdMs}
                  onChange={(v) => setNoiseSettings({ holdMs: v })}
                  min={0}
                  max={300}
                  step={10}
                  unit=" ms"
                />
                <div className="border-t border-border/40 pt-4 space-y-3">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Compressor</p>
                  <SliderRow
                    label="Threshold"
                    value={noiseSettings.compressorThresholdDb}
                    onChange={(v) => setNoiseSettings({ compressorThresholdDb: v })}
                    min={-60}
                    max={0}
                    step={1}
                    formatValue={(v) => `${v} dB`}
                  />
                  <SliderRow
                    label="Ratio"
                    value={noiseSettings.compressorRatio}
                    onChange={(v) => setNoiseSettings({ compressorRatio: v })}
                    min={1}
                    max={20}
                    step={0.5}
                    formatValue={(v) => `${v}:1`}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Feature toggles ── */}
      <div className="space-y-3">
        <SettingRow
          icon={Shield}
          iconColor="text-sky-400"
          label="Voice Activity Detection"
          description="Keeps gate open while you're talking so your voice is never clipped mid-sentence."
          badge="VAD"
        >
          <Switch
            checked={noiseSettings.vadEnabled}
            onCheckedChange={(v) => setNoiseSettings({ vadEnabled: v })}
            disabled={!noiseSettings.enabled}
          />
        </SettingRow>

        <SettingRow
          icon={Activity}
          iconColor="text-violet-400"
          label="Soft-Knee Expander"
          description="Attenuates moderate ambient sounds (typing, fan hum) that are above the gate but below speech level."
        >
          <Switch
            checked={noiseSettings.expanderEnabled}
            onCheckedChange={(v) => setNoiseSettings({ expanderEnabled: v })}
            disabled={!noiseSettings.enabled}
          />
        </SettingRow>

        <SettingRow
          icon={Headphones}
          iconColor="text-emerald-400"
          label="80 Hz High-Pass Filter"
          description="Removes desk rumble, HVAC hum, and low-frequency vibration before the noise gate runs."
        >
          <Switch
            checked={noiseSettings.highPassEnabled}
            onCheckedChange={(v) => setNoiseSettings({ highPassEnabled: v })}
            disabled={!noiseSettings.enabled}
          />
        </SettingRow>
      </div>

      {/* ── General audio section ── */}
      <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-border/60">
          <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider">General Audio</span>
        </div>
        <div className="p-4 space-y-3">
          <SettingRow
            icon={Volume2}
            iconColor="text-emerald-400"
            label="Auto Gain Control"
            description="Automatically normalises your mic volume so you never fade or clip."
            badge="AGC"
          >
            <Switch checked={agcEnabled} onCheckedChange={setAgcEnabled} />
          </SettingRow>

          <SettingRow
            icon={Zap}
            iconColor="text-amber-400"
            label="Echo Cancellation"
            description="Removes speaker bleed from your microphone feed when not using headphones."
          >
            <Switch checked={echoCancellationEnabled} onCheckedChange={setEchoCancellationEnabled} />
          </SettingRow>
        </div>

        {/* Mic boost */}
        <div className="px-5 pb-5 pt-2">
          <div className="rounded-xl bg-muted/30 border border-border/50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Mic className="h-3.5 w-3.5 text-primary" />
              <span className="text-sm font-medium">Mic Boost</span>
            </div>
            <SliderRow
              label="Input Gain"
              value={micBoost}
              onChange={setMicBoost}
              min={50}
              max={200}
              step={5}
              formatValue={(v) => `${v}%`}
            />
          </div>
        </div>
      </div>

      {/* ── Reset ── */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={resetAll}
        >
          <RotateCcw className="h-3 w-3" />
          Reset to defaults
        </Button>
      </div>
    </div>
  )
}

