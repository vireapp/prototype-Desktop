"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateEmail, updatePassword } from "@/components/dashboard/settings/account-actions";
import { Loader2, Mail, Lock, ShieldAlert } from "lucide-react";

export function AccountSettings({ email }: { email?: string }) {
  const [isEmailPending, startEmailTransition] = useTransition();
  const [isPasswordPending, startPasswordTransition] = useTransition();

  const handleEmailSubmit = (formData: FormData) => {
    startEmailTransition(async () => {
      const result = await updateEmail(null, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.success);
      }
    });
  };

  const handlePasswordSubmit = (formData: FormData) => {
    startPasswordTransition(async () => {
      const result = await updatePassword(null, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.success);
        // Optionally clear the form here if we had refs, but standard form reset relies on key change or manual reset.
        // For now, simple success toast.
        (document.getElementById("password-form") as HTMLFormElement)?.reset();
      }
    });
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Email Section */}
      <Card className="border-border bg-card backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Mail className="w-5 h-5 text-cyan-500" />
            Email Address
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Update your primary email address. A confirmation link will be sent to the new address.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleEmailSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground/70">
                Current Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={email}
                required
                className="bg-muted/50 border-input text-foreground focus:border-cyan-500/50"
              />
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isEmailPending}
                className="liquid-metal rounded-full h-11 px-10 text-xs font-medium tracking-widest uppercase transition-all hover:scale-105"
              >
                {isEmailPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Email
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Password Section */}
      <Card className="border-border bg-card backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Lock className="w-5 h-5 text-purple-500" />
            Password
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Ensure your account is secure with a strong password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id="password-form" action={handlePasswordSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground/70">
                  New Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  className="bg-muted/50 border-input text-foreground focus:border-purple-500/50"
                  placeholder="••••••"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-foreground/70">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  minLength={6}
                  className="bg-muted/50 border-input text-foreground focus:border-purple-500/50"
                  placeholder="••••••"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isPasswordPending}
                className="liquid-metal rounded-full h-11 px-10 text-xs font-medium tracking-widest uppercase transition-all hover:scale-105"
              >
                {isPasswordPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Danger Section */}
      <Card className="border-red-500/20 bg-destructive/5 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-400">
            <ShieldAlert className="w-5 h-5" />
            Danger Zone
          </CardTitle>
          <CardDescription className="text-red-400/70">
            Irreversible account actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-destructive/10 rounded-lg bg-destructive/10">
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-red-400">Delete Account</h4>
              <p className="text-xs text-red-400/60">
                Permanently delete your account and all data.
              </p>
            </div>
            <Button
              variant="destructive"
              className="w-full sm:w-auto bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:text-red-300"
            >
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
