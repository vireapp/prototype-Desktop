"use client";

import { InfoTooltip } from "@/components/ui/info-tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { updateUserSettings } from "@/components/dashboard/settings/actions";
import { useState, useTransition, useEffect } from "react";

import { Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PrivacyProps {
  initialProfile?: string;
  initialActivity?: boolean;
  initialSmartAway?: string;
  initialGhost?: boolean;
}

export function PrivacySettings({
  initialProfile,
  initialActivity,
  initialSmartAway,
  initialGhost,
}: PrivacyProps) {
  const [profileVisibility, setProfileVisibility] = useState(initialProfile || "public");
  const [activityVisibility, setActivityVisibility] = useState(initialActivity ?? true);
  const [smartAway, setSmartAway] = useState(initialSmartAway || "never");
  const [ghostMode, setGhostMode] = useState(initialGhost ?? false);
  const [isPending, startTransition] = useTransition();

  // Live Preview for Ghost Mode
  useEffect(() => {
    if (ghostMode) {
      document.body.classList.add("ghost-mode-active");
    } else {
      document.body.classList.remove("ghost-mode-active");
    }
  }, [ghostMode]);

  const handleSubmit = () => {
    const formData = new FormData();
    formData.append("privacy_profile_visibility", profileVisibility);
    formData.append("activity_visibility", String(activityVisibility));
    formData.append("smart_away_trigger", smartAway);
    formData.append("ghost_mode", String(ghostMode));

    startTransition(async () => {
      const result = await updateUserSettings(null, formData);
      if (result.error) toast.error(result.error);
      else toast.success("Protocol secured");
    });
  };

  return (
    <div className="max-w-xl mx-auto space-y-16">
      <div className="space-y-8">
        <div className="text-center text-xs uppercase tracking-widest text-muted-foreground mb-2">
          Visibility Matrix
        </div>

        <div className="relative">
          <Select value={profileVisibility} onValueChange={setProfileVisibility}>
            <SelectTrigger className="w-full h-16 bg-muted/50 border border-border rounded-2xl text-foreground focus:border-primary/30 focus:ring-0 text-center text-lg tracking-wide shadow-inner">
              <SelectValue placeholder="Visibility Mode" />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border rounded-xl backdrop-blur-xl text-popover-foreground">
              <SelectItem value="public">Global Access</SelectItem>
              <SelectItem value="friends">Trusted Nodes</SelectItem>
              <SelectItem value="private">Ghost Mode</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-8">
        <div className="flex items-center justify-between p-6 rounded-2xl bg-muted/50 border border-border hover:bg-muted transition-colors">
          <div className="space-y-1">
            <span className="text-sm font-medium text-foreground">
              Activity Visibility{" "}
              <span className="inline-block align-middle ml-1">
                <InfoTooltip content="Controls who can see what room you are currently in." />
              </span>
            </span>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Show current room
            </p>
          </div>
          <Switch
            checked={activityVisibility}
            onCheckedChange={setActivityVisibility}
            className="data-[state=checked]:bg-primary"
          />
        </div>

        <div className="flex items-center justify-between p-6 rounded-2xl bg-muted/50 border border-border hover:bg-muted transition-colors">
          <div className="space-y-1">
            <span className="text-sm font-medium text-foreground">
              Smart Away Trigger{" "}
              <span className="inline-block align-middle ml-1">
                <InfoTooltip content="Determines who can see your user profile and stats." />
              </span>
            </span>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Auto-hide when idle
            </p>
          </div>
          <div className="w-32">
            <Select value={smartAway} onValueChange={setSmartAway}>
              <SelectTrigger className="bg-background border-border text-foreground h-10 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-popover-foreground">
                <SelectItem value="never">Never</SelectItem>
                <SelectItem value="5m">5 Min</SelectItem>
                <SelectItem value="15m">15 Min</SelectItem>
                <SelectItem value="1h">1 Hour</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between p-6 rounded-2xl bg-muted/50 border border-border hover:bg-muted transition-colors">
          <div className="space-y-1">
            <span className="text-sm font-medium text-foreground">
              Ghost Mode{" "}
              <span className="inline-block align-middle ml-1">
                <InfoTooltip content="Makes you invisible to others while online. You appear offline but can still browse rooms." />
              </span>
            </span>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Temporary stealth mode
            </p>
          </div>
          <Switch
            checked={ghostMode}
            onCheckedChange={setGhostMode}
            className="data-[state=checked]:bg-primary"
          />
        </div>
      </div>

      <div className="flex justify-center pt-8">
        <Button
          onClick={handleSubmit}
          disabled={isPending}
          className="bg-primary hover:bg-primary/90 rounded-full h-12 px-12 text-sm font-medium tracking-widest uppercase text-primary-foreground shadow-lg transition-all hover:scale-105"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Shield className="w-4 h-4 mr-2" />
          )}
          <span>Encrypt</span>
        </Button>
      </div>
    </div>
  );
}

