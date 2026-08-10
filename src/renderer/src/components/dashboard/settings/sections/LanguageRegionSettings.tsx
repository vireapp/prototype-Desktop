"use client";

import { InfoTooltip } from "@/components/ui/info-tooltip";
import { updateUserSettings } from "@/components/dashboard/settings/actions";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LanguageRegionProps {
  initialLanguage?: string;
  initialTimezone?: string;
  initialClockFormat?: string;
}

export function LanguageRegionSettings({
  initialLanguage = "en",
  initialTimezone = "UTC",
  initialClockFormat = "12h",
}: LanguageRegionProps) {
  const [isPending, startTransition] = useTransition();

  const [language, setLanguage] = useState(initialLanguage);
  const [timezone, setTimezone] = useState(initialTimezone);
  const [clockFormat, setClockFormat] = useState(initialClockFormat);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.set("language", language);
    formData.set("timezone", timezone);
    formData.set("clock_format", clockFormat);

    startTransition(async () => {
      const result = await updateUserSettings(null, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Language & Region settings saved");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10 animate-fade-in">
      <div>
        <h2 className="text-3xl font-light tracking-tight text-foreground mb-2">
          Language & Region
        </h2>
        <p className="text-sm text-muted-foreground">
          Tailor your localization preferences and display formats.
        </p>
      </div>

      <div className="space-y-8">
        <div className="flex items-center justify-between p-6 rounded-2xl bg-muted/50 border border-border hover:bg-muted transition-colors">
          <div className="space-y-1">
            <span className="text-sm font-medium text-foreground">
              Display Language{" "}
              <span className="inline-block align-middle ml-1">
                <InfoTooltip content="Changes the primary language of the Vire interface." />
              </span>
            </span>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              App localization
            </p>
          </div>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-[180px] bg-background/50">
              <SelectValue placeholder="Select Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English (US)</SelectItem>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="fr">Français</SelectItem>
              <SelectItem value="de">Deutsch</SelectItem>
              <SelectItem value="ja">日本語 (Japanese)</SelectItem>
              <SelectItem value="ko">한국어 (Korean)</SelectItem>
              <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between p-6 rounded-2xl bg-muted/50 border border-border hover:bg-muted transition-colors">
          <div className="space-y-1">
            <span className="text-sm font-medium text-foreground">
              Timezone{" "}
              <span className="inline-block align-middle ml-1">
                <InfoTooltip content="Overrides your system timezone for scheduling and message timestamps." />
              </span>
            </span>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Local time reference
            </p>
          </div>
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger className="w-[180px] bg-background/50">
              <SelectValue placeholder="Select Timezone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="UTC">UTC (Default)</SelectItem>
              <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
              <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
              <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
              <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
              <SelectItem value="Europe/London">London (GMT)</SelectItem>
              <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
              <SelectItem value="Asia/Kolkata">IST (Indian Standard Time)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-6">
          <span className="block text-center text-xs uppercase tracking-widest text-muted-foreground">
            Clock Format{" "}
            <span className="inline-block align-middle ml-1">
              <InfoTooltip content="Determines whether time is displayed in a 12-hour (AM/PM) or 24-hour format." />
            </span>
          </span>
          <div className="flex flex-wrap justify-center gap-1 bg-muted rounded-[calc(var(--radius)+0.25rem)] p-1 border border-border">
            {[
              { id: "12h", label: "12-Hour (AM/PM)" },
              { id: "24h", label: "24-Hour" },
            ].map((format) => (
              <button
                key={format.id}
                type="button"
                onClick={() => setClockFormat(format.id)}
                className={cn(
                  "flex-1 min-w-[30%] py-2 text-xs rounded-[calc(var(--radius)+0.25rem)] transition-all",
                  clockFormat === format.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {format.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-12">
        <Button
          type="submit"
          disabled={isPending}
          className={cn(
            "liquid-metal rounded-[var(--radius)] h-10 px-8 text-xs font-medium tracking-widest uppercase text-primary-foreground shadow-lg transition-all hover:scale-105",
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
