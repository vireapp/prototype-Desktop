"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Mic, Video, Play, Wifi, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateUserSettings } from "@/components/dashboard/settings/actions";
import { cn } from "@/lib/utils";

interface RoomDefaultsProps {
  initialMic?: boolean;
  initialCam?: boolean;
  initialAutoplay?: boolean;
  initialBandwidth?: boolean;
  initialAutoFraming?: boolean;
  initialStreamPriority?: string;
  initialHardware?: boolean;
}

export function RoomDefaultsSettings({
  initialMic,
  initialCam,
  initialAutoplay,
  initialBandwidth,
  initialAutoFraming,
  initialStreamPriority,
  initialHardware,
}: RoomDefaultsProps) {
  const [micDefault, setMicDefault] = useState(initialMic || false);
  const [camDefault, setCamDefault] = useState(initialCam || false);
  const [autoplay, setAutoplay] = useState(initialAutoplay ?? true);
  const [lowBandwidth, setLowBandwidth] = useState(initialBandwidth || false);
  const [autoFraming, setAutoFraming] = useState(initialAutoFraming || false);
  const [streamPriority, setStreamPriority] = useState(initialStreamPriority || "balanced");
  const [hardwareAcceleration, setHardwareAcceleration] = useState(initialHardware ?? true);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    const formData = new FormData();
    formData.append("room_default_mic", String(micDefault));
    formData.append("room_default_camera", String(camDefault));
    formData.append("room_autoplay", String(autoplay));
    formData.append("room_low_bandwidth", String(lowBandwidth));
    formData.append("auto_framing", String(autoFraming));
    formData.append("stream_priority", streamPriority);
    formData.append("hardware_acceleration", String(hardwareAcceleration));

    startTransition(async () => {
      const result = await updateUserSettings(null, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Default state captured");
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-12">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Audio */}
        <div
          className={cn(
            "p-6 rounded-3xl border transition-all duration-300 flex flex-col items-center gap-4 text-center cursor-pointer",
            micDefault
              ? "bg-muted border-primary/50"
              : "bg-transparent border-border hover:border-primary/30",
          )}
          onClick={() => setMicDefault(!micDefault)}
        >
          <div
            className={cn(
              "p-4 rounded-full bg-muted",
              micDefault ? "text-destructive" : "text-muted-foreground",
            )}
          >
            <Mic className="w-6 h-6" />
          </div>
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            Start Muted
          </span>
        </div>

        {/* Video */}
        <div
          className={cn(
            "p-6 rounded-3xl border transition-all duration-300 flex flex-col items-center gap-4 text-center cursor-pointer",
            camDefault
              ? "bg-muted border-primary/50"
              : "bg-transparent border-border hover:border-primary/30",
          )}
          onClick={() => setCamDefault(!camDefault)}
        >
          <div
            className={cn(
              "p-4 rounded-full bg-muted",
              camDefault ? "text-destructive" : "text-muted-foreground",
            )}
          >
            <Video className="w-6 h-6" />
          </div>
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            Start Hidden
          </span>
        </div>
      </div>

      <div className="space-y-6 pt-4">
        <div className="text-center text-xs uppercase tracking-widest text-muted-foreground">
          Data Consumption
        </div>

        <div className="bg-muted/30 rounded-2xl border border-border overflow-hidden divide-y divide-border">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Play className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground/80">Auto-Play Media</span>
            </div>
            <Switch
              checked={autoplay}
              onCheckedChange={setAutoplay}
              className="data-[state=checked]:bg-primary"
            />
          </div>
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wifi className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground/80">Low Bandwidth Mode</span>
            </div>
            <Switch
              checked={lowBandwidth}
              onCheckedChange={setLowBandwidth}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </div>
      </div>

      <div className="space-y-6 pt-4">
        <div className="text-center text-xs uppercase tracking-widest text-muted-foreground">
          Video AI & Performance
        </div>

        <div className="bg-muted/30 rounded-2xl border border-border overflow-hidden divide-y divide-border">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-foreground/80">Auto-Framing (Center Stage)</span>
            </div>
            <Switch
              checked={autoFraming}
              onCheckedChange={setAutoFraming}
              className="data-[state=checked]:bg-primary"
            />
          </div>
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-foreground/80">Hardware Acceleration</span>
            </div>
            <Switch
              checked={hardwareAcceleration}
              onCheckedChange={setHardwareAcceleration}
              className="data-[state=checked]:bg-primary"
            />
          </div>
          <div className="p-4 flex flex-col gap-3">
            <span className="text-sm text-foreground/80">Stream Priority Mode</span>
            <div className="flex bg-background border border-border p-1 rounded-lg">
              {["framerate", "balanced", "resolution"].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setStreamPriority(mode)}
                  className={cn(
                    "flex-1 py-1.5 text-xs rounded-md transition-all capitalize",
                    streamPriority === mode
                      ? "bg-primary/20 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-8">
        <Button
          onClick={handleSubmit}
          disabled={isPending}
          className="liquid-metal rounded-full h-12 px-12 text-sm font-medium tracking-widest uppercase text-primary-foreground shadow-lg transition-all hover:scale-105"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          <span>Sync Preferences</span>
        </Button>
      </div>
    </div>
  );
}
