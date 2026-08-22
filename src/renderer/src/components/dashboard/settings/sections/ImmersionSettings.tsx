"use client";

import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Volume2, CloudRain, Coffee, Rocket, Loader2 } from "lucide-react";
import { useState, useEffect, useTransition } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { updateUserSettings } from "@/components/dashboard/settings/actions";
import { Button } from "@/components/ui/button";

const AMBIENCE_OPTIONS = [
  { id: "off", label: "VOID", icon: Volume2 },
  { id: "forest_rain", label: "NATURE", icon: CloudRain },
  { id: "zen_garden", label: "ZEN", icon: Coffee },
  { id: "white_noise", label: "FOCUS", icon: Rocket },
];

interface ImmersionProps {
  initialSounds?: boolean;
  initialOpacity?: number;
  initialSpatialAudio?: boolean;
  initialAiVoice?: boolean;
  initialAmbient?: string;
}

export function ImmersionSettings({
  initialSounds,
  initialOpacity,
  initialSpatialAudio,
  initialAiVoice,
  initialAmbient,
}: ImmersionProps) {
  const [ambience, setAmbience] = useState(initialAmbient || "none");
  const [glassOpacity, setGlassOpacity] = useState([initialOpacity ?? 0.4]);
  const [uiSounds, setUiSounds] = useState(initialSounds ?? true);
  const [spatialAudio, setSpatialAudio] = useState(initialSpatialAudio ?? false);
  const [aiVoice, setAiVoice] = useState(initialAiVoice ?? false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    document.body.style.setProperty("--glass-opacity", glassOpacity[0].toString());
  }, [glassOpacity]);

  const handleAmbienceChange = (id: string) => {
    setAmbience(id);
    window.dispatchEvent(new CustomEvent("ambience-change", { detail: { track: id } }));
  };

  const handleSave = () => {
    const formData = new FormData();
    formData.append("ui_sounds", String(uiSounds));
    formData.append("glass_opacity", String(glassOpacity[0]));
    formData.append("spatial_audio", String(spatialAudio));
    formData.append("ai_voice_isolation", String(aiVoice));
    formData.append("ambient_background", ambience);

    startTransition(async () => {
      const result = await updateUserSettings(null, formData);
      if (result.error) toast.error(result.error);
      else toast.success("Environment modified");
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-16">
      {/* Sonic Atmosphere */}
      <div className="space-y-8">
        <div className="text-center text-xs uppercase tracking-widest text-muted-foreground">
          Sonic Atmosphere
        </div>
        <div className="flex justify-center gap-6 md:gap-10">
          {AMBIENCE_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isActive = ambience === option.id;
            return (
              <button
                key={option.id}
                onClick={() => handleAmbienceChange(option.id)}
                className={cn(
                  "group flex flex-col items-center gap-3 transition-all duration-500",
                  isActive ? "transform scale-110" : "opacity-50 hover:opacity-80",
                )}
              >
                <div
                  className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center border transition-all",
                    isActive
                      ? "bg-primary/10 border-primary/50 shadow-lg text-primary"
                      : "bg-transparent border-border text-muted-foreground group-hover:text-foreground",
                  )}
                >
                  <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-current")} />
                </div>
                <span
                  className={cn(
                    "text-[9px] font-bold tracking-widest",
                    isActive ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Material Density */}
      <div className="space-y-8 px-8">
        <div className="text-center text-xs uppercase tracking-widest text-muted-foreground">
          Material Density
        </div>
        <div className="relative pt-6">
          <Slider
            value={glassOpacity}
            onValueChange={setGlassOpacity}
            min={0.1}
            max={1}
            step={0.05}
            className="w-full"
          />
          <div className="flex justify-between mt-2 text-[10px] text-muted-foreground uppercase tracking-widest">
            <span>Ethereal</span>
            <span>Solid</span>
          </div>
        </div>
      </div>

      {/* Sensory Toggles */}
      <div className="grid md:grid-cols-2 gap-12 pt-8">
        <div className="flex items-center justify-between px-4 border-b border-border pb-4">
          <span className="text-sm text-foreground/70">Haptic Feedback</span>
          <Switch
            checked={uiSounds}
            onCheckedChange={setUiSounds}
            className="data-[state=checked]:bg-primary"
          />
        </div>
        <div className="flex items-center justify-between px-4 border-b border-border pb-4">
          <span className="text-sm text-foreground/70">Spatial Audio Panning</span>
          <Switch
            checked={spatialAudio}
            onCheckedChange={setSpatialAudio}
            className="data-[state=checked]:bg-primary"
          />
        </div>
        <div className="flex items-center justify-between px-4 border-b border-border pb-4">
          <span className="text-sm text-foreground/70">AI Voice Isolation</span>
          <Switch
            checked={aiVoice}
            onCheckedChange={setAiVoice}
            className="data-[state=checked]:bg-primary"
          />
        </div>
      </div>

      {/* Action */}
      <div className="flex justify-center pt-8">
        <Button
          onClick={handleSave}
          disabled={isPending}
          className="bg-primary hover:bg-primary/90 rounded-full h-12 px-12 text-sm font-medium tracking-widest uppercase text-primary-foreground shadow-lg transition-all hover:scale-105"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          <span>Stabilize</span>
        </Button>
      </div>
    </div>
  );
}

