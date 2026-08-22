'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useSystemSettings } from '@/stores/use-system-settings'
import { 
  Monitor, 
  Settings, 
  Zap, 
  Type, 
  Keyboard, 
  MousePointer2, 
  Power,
  RotateCcw,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'

export function SystemSettings() {
  const { 
    minimizeToTray, 
    closeToTray, 
    launchOnStartup, 
    startMinimized,
    hardwareAcceleration,
    hotkey,
    textScale,
    setSetting 
  } = useSystemSettings()

  const handleRestart = () => {
    toast.info('Application restart required for some changes to take effect.', {
      action: {
        label: 'Restart Now',
        onClick: () => window.api.close() // Close will exit if closeToTray is false, but we need a real restart
      }
    })
  }

  return (
    <div className="space-y-10 max-w-2xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Window Management */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Monitor className="w-4 h-4 text-primary/70" />
          <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground/70">Window Management</h3>
        </div>
        <div className="grid gap-3">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/50 hover:bg-muted/30 transition-all">
            <div className="space-y-1">
              <Label className="text-sm font-semibold">Minimize to Tray</Label>
              <p className="text-xs text-muted-foreground">Keep the app running in the system tray when minimized</p>
            </div>
            <Switch checked={minimizeToTray} onCheckedChange={(v) => setSetting('minimizeToTray', v)} />
          </div>
          <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/50 hover:bg-muted/30 transition-all">
            <div className="space-y-1">
              <Label className="text-sm font-semibold">Close to Tray</Label>
              <p className="text-xs text-muted-foreground">Clicking 'X' hides the app instead of quitting</p>
            </div>
            <Switch checked={closeToTray} onCheckedChange={(v) => setSetting('closeToTray', v)} />
          </div>
        </div>
      </section>

      {/* Startup Options */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Power className="w-4 h-4 text-emerald-400/70" />
          <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground/70">Startup Options</h3>
        </div>
        <div className="grid gap-3">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/50 hover:bg-muted/30 transition-all">
            <div className="space-y-1">
              <Label className="text-sm font-semibold">Launch on Startup</Label>
              <p className="text-xs text-muted-foreground">Automatically open VIRE when you log in</p>
            </div>
            <Switch checked={launchOnStartup} onCheckedChange={(v) => setSetting('launchOnStartup', v)} />
          </div>
          <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/50 hover:bg-muted/30 transition-all">
            <div className="space-y-1">
              <Label className="text-sm font-semibold">Start Minimized</Label>
              <p className="text-xs text-muted-foreground">Launch the app silently in the system tray</p>
            </div>
            <Switch checked={startMinimized} onCheckedChange={(v) => setSetting('startMinimized', v)} disabled={!launchOnStartup} />
          </div>
        </div>
      </section>

      {/* Performance */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Zap className="w-4 h-4 text-amber-400/70" />
          <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground/70">Performance</h3>
        </div>
        <div className="p-5 rounded-3xl bg-muted/20 border border-border/50 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-semibold">Hardware Acceleration</Label>
              <p className="text-xs text-muted-foreground">Use GPU for smoother rendering (disabling may fix graphical issues)</p>
            </div>
            <Switch 
              checked={hardwareAcceleration} 
              onCheckedChange={(v) => {
                setSetting('hardwareAcceleration', v)
                handleRestart()
              }} 
            />
          </div>
          
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-200/80 leading-relaxed uppercase tracking-wider font-bold">
              Changing hardware acceleration requires a complete application restart to apply.
            </p>
          </div>
        </div>
      </section>



      {/* Shortcuts */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Keyboard className="w-4 h-4 text-purple-400/70" />
          <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground/70">Global Shortcuts</h3>
        </div>
        <div className="p-5 rounded-3xl bg-muted/20 border border-border/50 space-y-6">
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Summon Shortcut</Label>
            <div className="flex gap-2">
              <Input 
                value={hotkey} 
                onChange={(e) => setSetting('hotkey', e.target.value)}
                placeholder="e.g. Alt+V"
                className="font-mono text-sm bg-background/50"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setSetting('hotkey', 'Alt+V')}
                className="shrink-0"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">Global key combination to show/hide the application. Use standard Electron accelerators (e.g., CommandOrControl+Shift+V).</p>
          </div>
        </div>
      </section>
    </div>
  )
}

