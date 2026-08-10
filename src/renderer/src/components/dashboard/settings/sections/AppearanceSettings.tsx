"use client";

import { InfoTooltip } from "@/components/ui/info-tooltip";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState, useTransition } from "react";
import { updateUserSettings } from "@/components/dashboard/settings/actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface AppearanceProps {
  initialFont?: string;
  initialRadius?: string;
  initialContrast?: boolean;
  initialAccent?: string;
  initialDensity?: string;
  initialBlur?: string;
}

export function AppearanceSettings({
  initialFont,
  initialRadius,
  initialContrast,
  initialAccent,
  initialDensity,
  initialBlur,
}: AppearanceProps) {
  const { theme, setTheme } = useTheme();
  const [font, setFont] = useState(initialFont || "inter");
  const [borderRadius, setBorderRadius] = useState(initialRadius || "0.5rem");
  const [highContrast, setHighContrast] = useState(initialContrast || false);
  const [primaryAccent, setPrimaryAccent] = useState(initialAccent || "default");
  const [layoutDensity, setLayoutDensity] = useState(initialDensity || "standard");
  const [glassBlur, setGlassBlur] = useState(initialBlur || "md");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const fontMap: Record<string, string> = {
      inter: "'Inter', sans-serif",
      orbitron: "'Orbitron', sans-serif",
      serif: "'Playfair Display', serif",
      mono: "'JetBrains Mono', monospace",
      poppins: "'Poppins', sans-serif",
      sora: "'Sora', sans-serif",
    };
    const selectedFont = fontMap[font] || fontMap["inter"];
    document.body.style.setProperty("--font-body", selectedFont);
    document.body.style.setProperty("--font-heading", selectedFont);
  }, [font]);

  useEffect(() => {
    document.body.style.setProperty("--radius", borderRadius);
  }, [borderRadius]);

  useEffect(() => {
    if (highContrast) {
      document.body.classList.add("high-contrast");
    } else {
      document.body.classList.remove("high-contrast");
    }
  }, [highContrast]);

  useEffect(() => {
    // Remove all old theme classes first
    const themes = [
      "theme-neon_cyan",
      "theme-sunset_orange",
      "theme-acid_green",
      "theme-purple_haze",
      "theme-rose_gold",
      "theme-crimson_red",
      "theme-electric_blue",
    ];
    document.body.classList.remove(...themes);

    if (primaryAccent && primaryAccent !== "default") {
      document.body.classList.add(`theme-${primaryAccent}`);
    }
  }, [primaryAccent]);

  useEffect(() => {
    const densities = ["density-compact", "density-standard", "density-relaxed"];
    document.documentElement.classList.remove(...densities);

    if (layoutDensity) {
      document.documentElement.classList.add(`density-${layoutDensity}`);
    }
  }, [layoutDensity]);

  useEffect(() => {
    const blurMap: Record<string, string> = {
      sm: "4px",
      md: "12px",
      lg: "24px",
      xl: "32px",
    };
    const selectedBlur = blurMap[glassBlur] || "12px";
    document.body.style.setProperty("--glass-blur", selectedBlur);
  }, [glassBlur]);

  const handleSubmit = (formData: FormData) => {
    formData.set("theme", theme || "system");
    formData.set("font_family", font);
    formData.set("border_radius", borderRadius);
    formData.set("high_contrast", String(highContrast));
    formData.set("primary_accent", primaryAccent);
    formData.set("layout_density", layoutDensity);
    formData.set("glass_blur_intensity", glassBlur);

    startTransition(async () => {
      const result = await updateUserSettings(null, formData);
      if (result.error) toast.error(result.error);
      else toast.success("Visual parameters realigned");
    });
  };

  return (
    <form action={handleSubmit} className="max-w-2xl mx-auto space-y-16">
      {/* Theme Spheres */}
      <div className="flex flex-col items-center gap-6">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">
          Luminescence
        </span>
        <div className="flex gap-8">
          {["light", "dark", "system"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTheme(t)}
              className={cn(
                "w-16 h-16 rounded-[calc(var(--radius)+0.25rem)] border transition-all duration-500 flex items-center justify-center relative overflow-hidden group",
                theme === t
                  ? "border-primary/50 bg-primary/10 shadow-lg scale-110"
                  : "border-border bg-transparent hover:bg-muted/50",
              )}
            >
              <div
                className={cn(
                  "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-foreground/10 to-transparent",
                  theme === t ? "opacity-100" : "",
                )}
              />
              <span
                className={cn(
                  "text-[10px] uppercase font-medium relative z-10",
                  theme === t ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {t}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Typography Grid */}
      <div className="space-y-6">
        <div className="text-center text-xs uppercase tracking-widest text-muted-foreground mb-8">
          Typeface Material
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { id: "inter", name: "Inter" },
            { id: "orbitron", name: "Orbitron" },
            { id: "serif", name: "Playfair" },
            { id: "mono", name: "JetBrains" },
            { id: "poppins", name: "Poppins" },
            { id: "sora", name: "Sora" },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFont(f.id)}
              className={cn(
                "h-14 rounded-xl border transition-all duration-300 flex items-center justify-center text-sm",
                font === f.id
                  ? "border-primary/40 bg-primary/5 text-foreground shadow-lg"
                  : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {f.name}
            </button>
          ))}
        </div>
      </div>

      {/* Corner Radius & Toggles */}
      <div className="grid md:grid-cols-2 gap-12 pt-8">
        <div className="space-y-6">
          <span className="block text-center text-xs uppercase tracking-widest text-muted-foreground">
            Geometry{" "}
            <span className="inline-block align-middle ml-1">
              <InfoTooltip content="Adjusts the roundness and sharpness of interface elements like cards, buttons, and inputs." />
            </span>
          </span>
          <div className="flex justify-between bg-muted rounded-[calc(var(--radius)+0.25rem)] p-1 border border-border">
            {["0px", "0.25rem", "0.5rem", "1rem", "2rem"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setBorderRadius(r)}
                className={cn(
                  "flex-1 py-2 text-[10px] sm:text-xs rounded-[calc(var(--radius)+0.25rem)] transition-all",
                  borderRadius === r
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {r === "0px"
                  ? "Sharp"
                  : r === "0.25rem"
                    ? "Slight"
                    : r === "0.5rem"
                      ? "Soft"
                      : r === "1rem"
                        ? "Round"
                        : "Pill"}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <span className="block text-center text-xs uppercase tracking-widest text-muted-foreground">
            Clarity
          </span>
          <div className="flex items-center justify-between px-4">
            <span className="text-sm text-muted-foreground">High Contrast</span>
            <Switch
              checked={highContrast}
              onCheckedChange={setHighContrast}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </div>
      </div>

      {/* Accent & Blur (New) */}
      <div className="grid md:grid-cols-2 gap-12 pt-8">
        <div className="space-y-6">
          <span className="block text-center text-xs uppercase tracking-widest text-muted-foreground">
            Accent Color{" "}
            <span className="inline-block align-middle ml-1">
              <InfoTooltip content="Changes the primary brand color used for highlights, toggles, and active states." />
            </span>
          </span>
          <div className="flex flex-wrap justify-center gap-1 bg-muted rounded-[calc(var(--radius)+0.25rem)] p-1 border border-border">
            {[
              { id: "default", label: "Def" },
              { id: "neon_cyan", label: "Cyan" },
              { id: "sunset_orange", label: "Sun" },
              { id: "acid_green", label: "Acid" },
              { id: "purple_haze", label: "Haze" },
              { id: "rose_gold", label: "Rose" },
              { id: "crimson_red", label: "Crim" },
              { id: "electric_blue", label: "Blue" },
            ].map((accent) => (
              <button
                key={accent.id}
                type="button"
                onClick={() => setPrimaryAccent(accent.id)}
                className={cn(
                  "flex-1 min-w-[15%] py-2 text-[10px] rounded-[calc(var(--radius)+0.25rem)] transition-all",
                  primaryAccent === accent.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {accent.label}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <span className="block text-center text-xs uppercase tracking-widest text-muted-foreground">
            Layout Density{" "}
            <span className="inline-block align-middle ml-1">
              <InfoTooltip content="Adjusts the overall scale and padding of the interface. Compact fits more content, while Relaxed breathes more." />
            </span>
          </span>
          <div className="flex justify-between bg-muted rounded-[calc(var(--radius)+0.25rem)] p-1 border border-border">
            {["compact", "standard", "relaxed"].map((density) => (
              <button
                key={density}
                type="button"
                onClick={() => setLayoutDensity(density)}
                className={cn(
                  "flex-1 py-2 text-xs rounded-[calc(var(--radius)+0.25rem)] transition-all capitalize",
                  layoutDensity === density
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {density}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Blur Intensity */}
      <div className="space-y-6 pt-4 px-8 max-w-md mx-auto">
        <span className="block text-center text-xs uppercase tracking-widest text-muted-foreground">
          Glass Blur Intensity{" "}
          <span className="inline-block align-middle ml-1">
            <InfoTooltip content="Controls the strength of the frosted glass blur effect in backgrounds and floating panels." />
          </span>
        </span>
        <div className="flex justify-between bg-muted rounded-[calc(var(--radius)+0.25rem)] p-1 border border-border">
          {["sm", "md", "lg", "xl"].map((blur) => (
            <button
              key={blur}
              type="button"
              onClick={() => setGlassBlur(blur)}
              className={cn(
                "flex-1 py-2 text-xs rounded-full transition-all uppercase",
                glassBlur === blur
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {blur}
            </button>
          ))}
        </div>
      </div>

      {/* Action */}
      <div className="flex justify-center pt-12">
        <Button
          type="submit"
          disabled={isPending}
          className={cn(
            "liquid-metal rounded-[var(--radius)] h-12 px-12 text-sm font-medium tracking-widest uppercase text-primary-foreground shadow-lg transition-all hover:scale-105",
            isPending && "opacity-70",
          )}
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          {isPending ? "Refracting..." : "Crystallize"}
        </Button>
      </div>
    </form>
  );
}
