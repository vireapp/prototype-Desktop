"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sparkles, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect, useTransition } from "react";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { updateUserSettings } from "@/components/dashboard/settings/actions";

interface AISettingsProps {
  initialSummary?: boolean;
}

export function AISettings({ initialSummary = true }: AISettingsProps) {
  const [aiName, setAiName] = useState("VIRE");
  const [personality, setPersonality] = useState("helpful");
  const [autoSweep, setAutoSweep] = useState("0");
  const [sessionSummary, setSessionSummary] = useState(initialSummary);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const sweepVal = Cookies.get("ai_auto_sweep_days");
    if (sweepVal) setAutoSweep(sweepVal);
  }, []);

  const handleSave = () => {
    // Save local cookie settings
    Cookies.set("ai_auto_sweep_days", autoSweep, { expires: 365, path: "/" });

    // Save db settings
    const formData = new FormData();
    formData.append("ai_session_summaries", String(sessionSummary));

    startTransition(async () => {
      const result = await updateUserSettings(null, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("AI Synthesis complete");
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="border-border bg-card backdrop-blur-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border">
          <CardTitle className="flex items-center gap-3 text-foreground font-medium text-lg">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Companion Customization
          </CardTitle>
          <CardDescription>
            {/* eslint-disable-next-line react/no-unescaped-entities */}
            Personalize your AI assistant's identity.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-2">
            <Label
              htmlFor="ai-name"
              className="text-foreground/70 text-xs uppercase tracking-widest font-semibold"
            >
              Name
            </Label>
            <Input
              id="ai-name"
              value={aiName}
              onChange={(e) => setAiName(e.target.value)}
              className="bg-muted/50 border-input h-12 rounded-xl focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground/70 text-xs uppercase tracking-widest font-semibold">
              Personality
            </Label>
            <Select value={personality} onValueChange={setPersonality}>
              <SelectTrigger className="bg-muted/50 border-input h-12 rounded-xl">
                <SelectValue placeholder="Select personality" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-popover-foreground">
                <SelectItem value="helpful">
                  <span className="font-medium">Helpful & Professional</span>
                  <p className="text-[10px] text-muted-foreground">
                    Detailed and polite responses.
                  </p>
                </SelectItem>
                <SelectItem value="casual">
                  <span className="font-medium">Casual & Friendly</span>
                  <p className="text-[10px] text-muted-foreground">Like talking to a friend.</p>
                </SelectItem>
                <SelectItem value="sassy">
                  <span className="font-medium">Sassy & Witty</span>
                  <p className="text-[10px] text-muted-foreground">
                    Full of personality and jokes.
                  </p>
                </SelectItem>
                <SelectItem value="concise">
                  <span className="font-medium">Concise & Direct</span>
                  <p className="text-[10px] text-muted-foreground">Short answers, no fluff.</p>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground/70 text-xs uppercase tracking-widest font-semibold">
              Auto-Sweep Chat History
            </Label>
            <Select value={autoSweep} onValueChange={setAutoSweep}>
              <SelectTrigger className="bg-muted/50 border-input h-12 rounded-xl">
                <SelectValue placeholder="Select auto-sweep duration" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-popover-foreground">
                <SelectItem value="0">
                  <span className="font-medium">Never Delete</span>
                </SelectItem>
                <SelectItem value="7">
                  <span className="font-medium">7 Days</span>
                </SelectItem>
                <SelectItem value="15">
                  <span className="font-medium">15 Days</span>
                </SelectItem>
                <SelectItem value="30">
                  <span className="font-medium">30 Days</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border mt-4">
            <div className="space-y-1">
              <Label className="text-sm font-medium text-foreground">AI Session Summaries</Label>
              <p className="text-xs text-muted-foreground">
                Generate automatic insights after calls
              </p>
            </div>
            <Switch
              checked={sessionSummary}
              onCheckedChange={setSessionSummary}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          <div className="pt-8 flex justify-center border-t border-border/50">
            <Button
              onClick={handleSave}
              disabled={isPending}
              className="bg-primary hover:bg-primary/90 rounded-full h-12 px-12 text-sm font-medium tracking-widest uppercase text-primary-foreground shadow-lg transition-all hover:scale-105"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Synthesize
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

