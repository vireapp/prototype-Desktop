"use client";

import { useState } from "react";
import { Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { verifyRoomPassword } from "@/components/rooms/actions";
import { useNavigate } from "react-router-dom";

export function RoomPasswordGate({ roomId }: { roomId: string }) {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setIsLoading(true);
    try {
      const result = await verifyRoomPassword(roomId, password);
      if (result.success) {
        toast.success("Access granted");
        window.location.reload();
      } else {
        toast.error(result.error || "Incorrect password");
        setPassword("");
      }
    } catch (error) {
      toast.error("Failed to verify password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background flair */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-3xl rounded-3xl p-8 shadow-2xl">
        <div className="flex flex-col items-center text-center space-y-4 mb-8">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
            <Lock className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">Room is Locked</h1>
            <p className="text-sm text-white/50 mt-1">
              Please enter the password to join this room.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-black/40 border-white/10 text-white h-12 text-center text-lg tracking-widest focus:border-emerald-500/50 focus:ring-emerald-500/20"
            autoFocus
          />
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-md font-medium shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Join Room"}
          </Button>
        </form>
      </div>
    </div>
  );
}
