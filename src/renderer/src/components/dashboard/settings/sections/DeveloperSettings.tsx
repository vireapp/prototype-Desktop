"use client";

import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useState } from "react";
import { Terminal, Bug, Activity, Trash2, RotateCcw, Database } from "lucide-react";

export function DeveloperSettings() {
  // Mock States - these would ideally persist to localStorage or a dev-only store
  const [debugMode, setDebugMode] = useState(false);
  const [showPerf, setShowPerf] = useState(false);
  const [apiEnv, setApiEnv] = useState("prod");

  const handleClearCache = () => {
    localStorage.clear();
    sessionStorage.clear();
    toast.info("Local storage and session storage cleared. Refreshing...", {
      duration: 2000,
      onAutoClose: () => window.location.reload(),
    });
    setTimeout(() => window.location.reload(), 1500);
  };

  const handleResetOnboarding = () => {
    // Mock action
    toast.success("Onboarding flags reset.");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header / Warning */}
      <div className="p-4 border border-yellow-500/20 bg-yellow-500/5 rounded-2xl flex items-start gap-3">
        <Terminal className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-yellow-500">Developer Zone</h3>
          <p className="text-xs text-muted-foreground">
            These settings are for development and debugging purposes only. Changes may affect
            application stability.
          </p>
        </div>
      </div>

      {/* Debug Tools */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-primary">
          <Bug className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Debug Tools</span>
        </div>

        <div className="grid gap-6">
          <div className="flex items-center justify-between p-4 rounded-3xl bg-muted/20 border border-border/50 hover:bg-muted/30 transition-colors">
            <div className="space-y-0.5">
              <label className="text-base font-medium text-foreground">Debug Mode</label>
              <p className="text-xs text-muted-foreground">
                Enable verbose logging and visual debug overlays
              </p>
            </div>
            <Switch
              checked={debugMode}
              onCheckedChange={(c) => {
                setDebugMode(c);
                toast(c ? "Debug Mode Enabled" : "Debug Mode Disabled");
              }}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-3xl bg-muted/20 border border-border/50 hover:bg-muted/30 transition-colors">
            <div className="space-y-0.5">
              <label className="text-base font-medium text-foreground">Performance Monitor</label>
              <p className="text-xs text-muted-foreground">
                Show FPS, Memory, and Network latency stats
              </p>
            </div>
            <Switch checked={showPerf} onCheckedChange={setShowPerf} />
          </div>
        </div>
      </div>

      {/* Environment Configuration */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-primary">
          <Database className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Environment</span>
        </div>

        <div className="p-6 rounded-3xl bg-muted/20 border border-border/50 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">API Endpoint</label>
            <Select value={apiEnv} onValueChange={setApiEnv}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prod">Production (api.example.com)</SelectItem>
                <SelectItem value="staging">Staging (staging-api.example.com)</SelectItem>
                <SelectItem value="local">Localhost (localhost:3000)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            Switching environments will force a session refresh.
          </p>
        </div>
      </div>

      {/* Destructive Actions */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-red-500">
          <Activity className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Danger Zone</span>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Button
            variant="outline"
            onClick={handleClearCache}
            className="h-auto py-6 rounded-3xl flex flex-col gap-2 items-center justify-center border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 hover:border-red-500/40 transition-all duration-300 group"
          >
            <Trash2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <div className="text-center">
              <span className="block text-sm font-bold uppercase tracking-widest">Wipe Cache</span>
              <span className="text-[10px] opacity-60">Clear all local storage</span>
            </div>
          </Button>

          <Button
            variant="outline"
            onClick={handleResetOnboarding}
            className="h-auto py-6 rounded-3xl flex flex-col gap-2 items-center justify-center border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10 text-orange-500 hover:border-orange-500/40 transition-all duration-300 group"
          >
            <RotateCcw className="w-6 h-6 group-hover:rotate-[-45deg] transition-transform" />
            <div className="text-center">
              <span className="block text-sm font-bold uppercase tracking-widest">
                Reset Onboarding
              </span>
              <span className="text-[10px] opacity-60">Re-trigger welcome flow</span>
            </div>
          </Button>
        </div>
      </div>

      {/* Action */}
      <div className="flex justify-center pt-8 border-t border-border/50">
        <Button
          className="liquid-metal rounded-full h-12 px-12 text-sm font-medium tracking-widest uppercase transition-all hover:scale-105"
          onClick={() => toast.success("Developer parameters synchronized")}
        >
          Deploy Changes
        </Button>
      </div>
    </div>
  );
}
