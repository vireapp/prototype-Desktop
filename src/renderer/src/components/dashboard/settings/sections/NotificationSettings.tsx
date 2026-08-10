"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell, Mail, Megaphone, AppWindow } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { updateUserSettings } from "@/components/dashboard/settings/actions";
import { Loader2 } from "lucide-react";

interface NotificationSettingsProps {
  initialPush?: boolean;
  initialEmail?: boolean;
  initialMarketing?: boolean;
  initialTray?: boolean;
}

export function NotificationSettings({
  initialPush = true,
  initialEmail = true,
  initialMarketing = false,
  initialTray = true
}: NotificationSettingsProps) {
  const [isPending, startTransition] = useTransition();
  const [notifications, setNotifications] = useState({
    push_notifications: initialPush,
    email_notifications: initialEmail,
    marketing_notifications: initialMarketing,
    tray_notifications: initialTray,
  });

  const toggle = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    Object.entries(notifications).forEach(([key, val]) => {
      formData.set(key, String(val));
    });

    startTransition(async () => {
      const result = await updateUserSettings(null, formData);
      if (result.error) toast.error(result.error);
      else toast.success("Notification preferences converged");
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border-border bg-card backdrop-blur-xl">
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Choose how you want to be notified.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border hover:bg-muted/70 transition-colors">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-full bg-primary/10 text-primary">
                <Bell className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <Label className="text-base">Push Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Receive notifications on your device
                </p>
              </div>
            </div>
            <Switch checked={notifications.push_notifications} onCheckedChange={() => toggle("push_notifications")} />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border hover:bg-muted/70 transition-colors">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-full bg-sky-500/10 text-sky-400">
                <AppWindow className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <Label className="text-base">System Tray Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Show discrete desktop popups when minimized to tray
                </p>
              </div>
            </div>
            <Switch checked={notifications.tray_notifications} onCheckedChange={() => toggle("tray_notifications")} />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border hover:bg-muted/70 transition-colors">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-full bg-purple-500/10 text-purple-400">
                <Mail className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <Label className="text-base">Email Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Receive status updates and activity digests
                </p>
              </div>
            </div>
            <Switch checked={notifications.email_notifications} onCheckedChange={() => toggle("email_notifications")} />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border hover:bg-muted/70 transition-colors">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-400">
                <Megaphone className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <Label className="text-base">Marketing & Updates</Label>
                <p className="text-xs text-muted-foreground">News about features and promotions</p>
              </div>
            </div>
            <Switch checked={notifications.marketing_notifications} onCheckedChange={() => toggle("marketing_notifications")} />
          </div>
        </CardContent>
      </Card>

      {/* Action */}
      <div className="flex justify-center pt-8">
        <Button
          type="submit"
          disabled={isPending}
          className="liquid-metal rounded-full h-11 px-10 text-xs font-medium tracking-widest uppercase transition-all hover:scale-105"
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isPending ? "Saving..." : "Save Preferences"}
        </Button>
      </div>
    </form>
  );
}
