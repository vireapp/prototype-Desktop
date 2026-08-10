"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Download, CloudCog } from "lucide-react";
import { toast } from "sonner";

export function DataSettings() {
  const handleExport = () => {
    // Pseudo-export functionality
    const mockData = {
      profile: {
        name: "User",
        joined: "2024-01-01",
        rooms: ["Room A", "Room B"],
      },
      settings: {
        theme: "dark",
      },
    };

    const blob = new Blob([JSON.stringify(mockData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "my-data-export.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Download started");
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Card className="border-border bg-card backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Database className="w-5 h-5 text-teal-500" />
            Your Data
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Manage your personal data and exports.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400">
                <Download className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-foreground">Export My Data</h4>
                <p className="text-xs text-muted-foreground">
                  Download a copy of your profile, friends, and settings.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleExport}
              className="liquid-metal rounded-full h-11 px-10 text-xs font-medium tracking-widest uppercase transition-all hover:scale-105"
            >
              Download JSON
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <CloudCog className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-foreground">API Access</h4>
                <p className="text-xs text-muted-foreground">
                  Manage API keys for bot integrations (Coming Soon).
                </p>
              </div>
            </div>
            <Button disabled variant="ghost" className="w-full sm:w-auto text-muted-foreground">
              Coming Soon
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
