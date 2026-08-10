"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Smartphone, Laptop, Loader2, Ban, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  unblockUser,
  logOutSession,
  enroll2FA,
  verify2FA,
  unenroll2FA,
} from "@/components/dashboard/settings/actions";

interface SecurityProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialBlocked?: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialSession?: any;
  initialFactorId?: string;
}

export function SecuritySettings({
  initialBlocked = [],
  initialSession,
  initialFactorId,
}: SecurityProps) {
  const [isPending, startTransition] = useTransition();

  // Sessions State
  // If we have an initial current session, use it. Otherwise default generic.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [sessions, setSessions] = useState<any[]>(
    initialSession
      ? [initialSession]
      : [{ id: "curr", device: "Unknown Device", ip: "Current", lastActive: "Now", current: true }],
  );

  // Blocked Users State
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [blockedUsers, setBlockedUsers] = useState<any[]>(initialBlocked);

  // 2FA State
  const [is2FASetup, setIs2FASetup] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(initialFactorId || null);
  const [verifyCode, setVerifyCode] = useState("");
  const [is2FAEnabled, setIs2FAEnabled] = useState(!!initialFactorId);

  const handleLogout = (sessionId: string) => {
    toast.promise(logOutSession(sessionId), {
      loading: "Terminating session...",
      success: () => {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        return "Session terminated";
      },
      error: "Failed to logout",
    });
  };

  const handleUnblock = (blockedRecordId: string) => {
    startTransition(async () => {
      const result = await unblockUser(blockedRecordId);
      if (result.success) {
        setBlockedUsers((prev) => prev.filter((b) => b.blocked_record_id !== blockedRecordId));
        toast.success(result.success);
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleSetup2FA = async () => {
    setIs2FASetup(true);
    startTransition(async () => {
      const result = await enroll2FA();
      if (result.success && result.data && result.data.totp) {
        setQrCode(result.data.totp.qr_code);
        setFactorId(result.data.id);
      } else {
        toast.error(result.error || "Failed to start 2FA setup");
        setIs2FASetup(false);
      }
    });
  };

  const handleVerify2FA = async () => {
    if (!factorId || !verifyCode) return;

    startTransition(async () => {
      const result = await verify2FA(factorId, verifyCode);
      if (result.success) {
        setIs2FAEnabled(true);
        setIs2FASetup(false);
        setQrCode(null);
        setVerifyCode("");
        toast.success(result.success);
      } else {
        toast.error(result.error || "Invalid code");
      }
    });
  };

  const handleDisable2FA = () => {
    if (!factorId) {
      toast.error("No active 2FA session found to disable.");
      return;
    }

    startTransition(async () => {
      const result = await unenroll2FA(factorId);
      if (result.success) {
        setIs2FAEnabled(false);
        setFactorId(null);
        toast.success(result.success);
      } else {
        // Even if it failed, if it's because it's already gone, we should likely update UI.
        // But for now trust the error.
        toast.error(result.error || "Failed to disable 2FA");
      }
    });
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* 2FA Section */}
      <Card className="border-border bg-card backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Smartphone className="w-5 h-5 text-emerald-500" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Add an extra layer of security to your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!is2FASetup && !is2FAEnabled && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-muted/50 border border-border">
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-foreground">Authenticator App</h4>
                <p className="text-xs text-muted-foreground">
                  Use apps like Google Authenticator or Authy.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleSetup2FA}
                disabled={isPending}
                className="liquid-metal rounded-full h-11 px-10 text-xs font-medium tracking-widest uppercase transition-all hover:scale-105"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Setup 2FA"}
              </Button>
            </div>
          )}

          {is2FASetup && qrCode && (
            <div className="p-6 rounded-xl bg-muted/50 border border-border space-y-6 animate-in fade-in slide-in-from-top-2">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="bg-white p-2 rounded-lg border border-border">
                  {/* Using standard img tag for data URI to handle raw SVG data safely. 
                                        Next.js Image can fail with very long data URIs. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrCode} alt="2FA QR Code" className="w-40 h-40 rounded block" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-foreground font-medium">Scan QR Code</h4>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    Open your authenticator app and scan the image above.
                  </p>
                </div>
              </div>

              <div className="space-y-3 max-w-xs mx-auto">
                <Label className="text-muted-foreground text-xs uppercase tracking-widest">
                  Verification Code
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value)}
                    placeholder="123456"
                    className="bg-muted border-input text-foreground text-center tracking-widest text-lg font-mono focus:border-emerald-500/50"
                    maxLength={6}
                  />
                  <Button
                    onClick={handleVerify2FA}
                    disabled={isPending || verifyCode.length < 6}
                    className="liquid-metal rounded-lg h-10 px-4 text-xs font-medium uppercase transition-all"
                  >
                    {isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIs2FASetup(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Cancel Setup
                </Button>
              </div>
            </div>
          )}

          {is2FAEnabled && (
            <div className="flex items-center justify-between p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-foreground">2FA Enabled</h4>
                  <p className="text-xs text-muted-foreground">Your account is secured.</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDisable2FA}
                disabled={isPending}
                className="text-muted-foreground hover:text-destructive"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Disable"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card className="border-border bg-card backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Laptop className="w-5 h-5 text-blue-500" />
            Active Sessions
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Manage devices logged into your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-muted/50 border border-border"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-muted">
                  <Laptop className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground flex items-center gap-2">
                    {session.device}
                    {session.current && (
                      <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full">
                        Current
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {session.ip} • {session.lastActive}
                  </p>
                </div>
              </div>
              {!session.current && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLogout(session.id)}
                  className="w-full sm:w-auto text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  Log out
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Blocked Users */}
      <Card className="border-border bg-card backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Ban className="w-5 h-5 text-destructive" />
            Blocked Users
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Accounts you have blocked from contacting you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {blockedUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No blocked users</div>
          ) : (
            <div className="space-y-2">
              {blockedUsers.map((user) => (
                <div
                  key={user.blocked_record_id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-muted/50 border border-border"
                >
                  <span className="text-sm text-foreground">
                    {user.name}{" "}
                    <span className="text-muted-foreground text-xs">@{user.username}</span>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUnblock(user.blocked_record_id)}
                    className="w-full sm:w-auto text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    Unblock
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
