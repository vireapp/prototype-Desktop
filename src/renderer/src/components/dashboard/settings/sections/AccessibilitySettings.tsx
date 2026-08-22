"use client";

import { InfoTooltip } from "@/components/ui/info-tooltip";
import { Switch } from "@/components/ui/switch";
import { updateUserSettings } from "@/components/dashboard/settings/actions";
import { useState, useTransition, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSystemSettings } from "@/stores/use-system-settings";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface AccessibilityProps {
  initialReducedMotion?: boolean;
  initialColorblindMode?: string;
  initialScreenReader?: boolean;
}

export function AccessibilitySettings({
  initialReducedMotion = false,
  initialColorblindMode = "none",
  initialScreenReader = false,
}: AccessibilityProps) {
  const [isPending, startTransition] = useTransition();

  const [reducedMotion, setReducedMotion] = useState(initialReducedMotion);
  const [colorblindMode, setColorblindMode] = useState(initialColorblindMode);
  const [screenReader, setScreenReader] = useState(initialScreenReader);

  const { textScale, setSetting } = useSystemSettings();

  // Live Previews
  useEffect(() => {
    if (reducedMotion) {
      document.body.classList.add("reduced-motion");
    } else {
      document.body.classList.remove("reduced-motion");
    }
  }, [reducedMotion]);

  useEffect(() => {
    if (screenReader) {
      document.body.classList.add("screen-reader-opt");
    } else {
      document.body.classList.remove("screen-reader-opt");
    }
  }, [screenReader]);

  useEffect(() => {
    // Remove all old colorblind classes first
    const classes = Array.from(document.body.classList);
    for (const cls of classes) {
      if (cls.startsWith("colorblind-")) {
        document.body.classList.remove(cls);
      }
    }

    if (colorblindMode && colorblindMode !== "none") {
      document.body.classList.add(`colorblind-${colorblindMode}`);
    }
  }, [colorblindMode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.set("reduced_motion", reducedMotion.toString());
    formData.set("colorblind_mode", colorblindMode);
    formData.set("screen_reader_opt", screenReader.toString());

    startTransition(async () => {
      const result = await updateUserSettings(null, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Accessibility settings saved");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10 animate-fade-in">
      <div>
        <h2 className="text-3xl font-light tracking-tight text-foreground mb-2">Accessibility</h2>
        <p className="text-sm text-muted-foreground">
          Customize Vire to meet your sensory and navigational needs.
        </p>
      </div>

      <div className="space-y-8">
        <div className="flex items-center justify-between p-6 rounded-2xl bg-muted/50 border border-border hover:bg-muted transition-colors">
          <div className="space-y-1">
            <span className="text-sm font-medium text-foreground">
              Reduced Motion{" "}
              <span className="inline-block align-middle ml-1">
                <InfoTooltip content="Disables dynamic micro-animations and scaling effects for a more static interface." />
              </span>
            </span>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Minimize animations
            </p>
          </div>
          <Switch
            checked={reducedMotion}
            onCheckedChange={setReducedMotion}
            className="data-[state=checked]:bg-primary"
          />
        </div>

        <div className="flex items-center justify-between p-6 rounded-2xl bg-muted/50 border border-border hover:bg-muted transition-colors">
          <div className="space-y-1">
            <span className="text-sm font-medium text-foreground">
              Screen Reader Optimization{" "}
              <span className="inline-block align-middle ml-1">
                <InfoTooltip content="Enforces strict ARIA focus trapping and enhanced semantic HTML structures." />
              </span>
            </span>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Improve reader focus
            </p>
          </div>
          <Switch
            checked={screenReader}
            onCheckedChange={setScreenReader}
            className="data-[state=checked]:bg-primary"
          />
        </div>

        <div className="space-y-6">
          <span className="block text-center text-xs uppercase tracking-widest text-muted-foreground">
            Colorblind Mode{" "}
            <span className="inline-block align-middle ml-1">
              <InfoTooltip content="Adjusts interface and status colors to be distinguishable for specific color vision deficiencies." />
            </span>
          </span>
          <div className="flex flex-wrap justify-center gap-1 bg-muted rounded-[calc(var(--radius)+0.25rem)] p-1 border border-border">
            {[
              { id: "none", label: "None" },
              { id: "protanopia", label: "Protanopia" },
              { id: "deuteranopia", label: "Deuteranopia" },
              { id: "tritanopia", label: "Tritanopia" },
            ].map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setColorblindMode(mode.id)}
                className={cn(
                  "flex-1 min-w-[20%] py-2 text-xs rounded-[calc(var(--radius)+0.25rem)] transition-all",
                  colorblindMode === mode.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <span className="block text-center text-xs uppercase tracking-widest text-muted-foreground">
            Text Scaling{" "}
            <span className="inline-block align-middle ml-1">
              <InfoTooltip content="Adjust the global font size for better readability." />
            </span>
          </span>
          <div className="p-5 rounded-[calc(var(--radius)+0.25rem)] bg-muted/50 border border-border space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Scale</Label>
              <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-md">{textScale}%</span>
            </div>
            <Slider 
              value={[textScale]} 
              onValueChange={([v]) => setSetting('textScale', v)} 
              min={80} 
              max={150} 
              step={5} 
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-12">
        <Button
          type="submit"
          disabled={isPending}
          className={cn(
            "bg-primary hover:bg-primary/90 rounded-[var(--radius)] h-10 px-8 text-xs font-medium tracking-widest uppercase text-primary-foreground shadow-lg transition-all hover:scale-105",
            isPending && "opacity-70",
          )}
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          {isPending ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </form>
  );
}

