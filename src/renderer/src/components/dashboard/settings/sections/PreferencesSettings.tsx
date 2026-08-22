"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Subtitles } from "lucide-react";
import { toast } from "sonner";
import { updateUserSettings } from "@/components/dashboard/settings/actions";
import { Loader2 } from "lucide-react";

interface PreferencesProps {
  initialLanguage?: string;
  initialTimezone?: string;
  initialReducedMotion?: boolean;
  initialFontScale?: number;
  initialAutoCaptions?: boolean;
  initialTranslation?: string;
}

export function PreferencesSettings({
  initialLanguage = "en",
  initialTimezone = "UTC",
  initialReducedMotion = false,
  initialFontScale = 1.0,
  initialAutoCaptions = false,
  initialTranslation = "none",
}: PreferencesProps) {
  const [isPending, startTransition] = useTransition();

  // Local state for immediate UI feedback
  const [language, setLanguage] = useState(initialLanguage);
  const [timezone, setTimezone] = useState(initialTimezone);
  const [autoCaptions, setAutoCaptions] = useState(initialAutoCaptions);
  const [translation, setTranslation] = useState(initialTranslation);

  const [fontScale, setFontScale] = useState(initialFontScale);

  const handleSave = () => {
    const formData = new FormData();
    formData.append("language", language);
    formData.append("timezone", timezone);
    formData.append("font_scale", String(fontScale));
    formData.append("auto_captions", String(autoCaptions));
    formData.append("default_translation", translation);

    startTransition(async () => {
      const result = await updateUserSettings(null, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Preferences updated");
      }
    });
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Subtitles & Translation */}
      <Card className="border-border bg-card backdrop-blur-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border">
          <CardTitle className="flex items-center gap-3 text-foreground font-medium text-lg">
            <Subtitles className="w-5 h-5 text-primary" />
            Real-Time Subtitles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border">
            <div className="space-y-1">
              <Label className="text-sm font-medium text-foreground">Auto-Captions</Label>
              <p className="text-xs text-muted-foreground">Always show captions when available.</p>
            </div>
            <Switch
              checked={autoCaptions}
              onCheckedChange={setAutoCaptions}
              className="data-[state=checked]:bg-primary"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground/70 text-xs uppercase tracking-widest font-semibold">
              Default Translation
            </Label>
            <Select value={translation} onValueChange={setTranslation}>
              <SelectTrigger className="bg-muted/50 border-input text-foreground h-12 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-popover-foreground">
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="en">Translate to English</SelectItem>
                <SelectItem value="es">Translate to Spanish</SelectItem>
                <SelectItem value="fr">Translate to French</SelectItem>
                <SelectItem value="jp">Translate to Japanese</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center pt-8 border-t border-border/50">
        <Button
          onClick={handleSave}
          disabled={isPending}
          className="bg-primary hover:bg-primary/90 rounded-full h-12 px-12 text-sm font-medium tracking-widest uppercase text-primary-foreground shadow-lg transition-all hover:scale-105"
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Preferences
        </Button>
      </div>
    </div>
  );
}

