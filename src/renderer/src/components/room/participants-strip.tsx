"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MicOff, Users, ChevronUp } from "lucide-react";
import { PeerStream, PeerMetadata } from "../../hooks/use-webrtc";
import { useAudioLevel } from "../../hooks/use-audio-level";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ParticipantsStripProps {
  localStream: MediaStream | null;
  remoteStreams: PeerStream[];
  peersMetadata: Record<string, PeerMetadata>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any;
  onExpand: () => void;
  isMicOn: boolean;
  isCamOn: boolean;
}

function ParticipantAvatar({
  stream,
  name,
  avatarUrl,
  isLocal = false,
  isMicOn = true,
  isCamOn = false,
  onClick,
  index = 0,
}: {
  stream: MediaStream | null;
  name: string;
  avatarUrl?: string;
  isLocal?: boolean;
  isMicOn?: boolean;
  isCamOn?: boolean;
  onClick: () => void;
  index?: number;
}) {
  const { isSpeaking } = useAudioLevel(stream);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    if (videoRef.current && stream && isCamOn) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, isCamOn]);

  const getInitials = (n?: string) => {
    if (!n) return "U";
    return n
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          className="relative cursor-pointer flex-shrink-0"
          onClick={onClick}
          initial={{ opacity: 0, scale: 0.7, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.7, y: 8 }}
          transition={{
            type: "spring",
            stiffness: 460,
            damping: 28,
            delay: index * 0.04,
          }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Speaking ring */}
          <AnimatePresence>
            {isSpeaking && (
              <motion.div
                className="absolute -inset-[3px] rounded-full ring-2 ring-green-400/70"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              />
            )}
          </AnimatePresence>

          {/* Avatar / Video */}
          <div
            className={cn(
              "w-9 h-9 border-2 transition-all duration-200 rounded-full overflow-hidden relative",
              isSpeaking
                ? "border-green-400/60"
                : isLocal
                  ? "border-indigo-400/40"
                  : "border-white/[0.12]",
            )}
          >
            {isCamOn && stream ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <Avatar className="w-full h-full border-none">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback
                  className={cn(
                    "text-[11px] font-semibold",
                    isLocal ? "bg-indigo-500/20 text-indigo-300" : "bg-white/[0.06] text-white/60",
                  )}
                >
                  {getInitials(name)}
                </AvatarFallback>
              </Avatar>
            )}
          </div>

          {/* Mic off badge */}
          {!isMicOn && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#0d0d10] border border-white/[0.1] flex items-center justify-center">
              <MicOff className="w-2 h-2 text-red-400" />
            </div>
          )}

          {/* Local user badge */}
          {isLocal && (
            <div className="absolute -top-0.5 -left-0.5 w-3.5 h-3.5 rounded-full bg-indigo-500 border border-[#0d0d10] flex items-center justify-center">
              <span className="text-[6px] font-bold text-white">Y</span>
            </div>
          )}
        </motion.div>
      </TooltipTrigger>
      <TooltipContent side="left" className="text-xs rounded-lg">
        {isLocal ? `${name} (you)` : name}
      </TooltipContent>
    </Tooltip>
  );
}

export function ParticipantsStrip({
  localStream,
  remoteStreams,
  peersMetadata,
  user,
  onExpand,
  isMicOn,
  isCamOn,
}: ParticipantsStripProps) {
  const MAX_VISIBLE = 4;
  const allParticipants = [
    {
      id: user?.id || "local",
      stream: localStream,
      name: user?.user_metadata?.name || user?.email?.split("@")[0] || "You",
      avatarUrl: user?.user_metadata?.avatar_url,
      isLocal: true,
      isMicOn,
      isCamOn,
    },
    ...Object.entries(peersMetadata).map(([userId, metadata]) => {
      const rs = remoteStreams.find((s) => s.userId === userId);
      return {
        id: userId,
        stream: rs?.stream || null,
        name: (metadata as any)?.username || (metadata as any)?.name || "Guest",
        avatarUrl: metadata?.avatarUrl,
        isLocal: false,
        isMicOn: rs ? rs.audioEnabled : false,
        isCamOn: rs ? rs.videoEnabled : false,
      };
    }),
  ];

  const visible = allParticipants.slice(0, MAX_VISIBLE);
  const overflow = allParticipants.length - MAX_VISIBLE;

  return (
    <TooltipProvider delayDuration={300}>
      <motion.div
        className="flex flex-col items-center gap-2"
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          type: "spring",
          stiffness: 380,
          damping: 30,
          delay: 0.2,
        }}
      >
        {/* Expand button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              onClick={onExpand}
              className="w-9 h-9 rounded-full bg-[#0d0d10]/80 border border-white/[0.08] backdrop-blur-xl flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              suppressHydrationWarning
            >
              <Users className="w-3.5 h-3.5" />
            </motion.button>
          </TooltipTrigger>
          <TooltipContent side="left" className="text-xs rounded-lg">
            {allParticipants.length} people — click to expand
          </TooltipContent>
        </Tooltip>

        {/* Thin divider */}
        <div className="w-px h-4 bg-white/[0.08]" />

        {/* Avatar list */}
        <AnimatePresence>
          {visible.map((p, i) => (
            <ParticipantAvatar
              key={p.isLocal ? "local" : p.id}
              stream={p.stream}
              name={p.name}
              avatarUrl={p.avatarUrl}
              isLocal={p.isLocal}
              isMicOn={p.isMicOn}
              isCamOn={p.isCamOn}
              onClick={onExpand}
              index={i}
            />
          ))}
        </AnimatePresence>

        {/* Overflow indicator */}
        {overflow > 0 && (
          <motion.button
            onClick={onExpand}
            className="w-9 h-9 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-white/40 hover:text-white/70 text-[10px] font-medium transition-all"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 500 }}
            whileHover={{ scale: 1.05 }}
            suppressHydrationWarning
          >
            +{overflow}
          </motion.button>
        )}

        {/* Expand chevron hint */}
        <motion.button
          onClick={onExpand}
          className="w-6 h-6 rounded-full flex items-center justify-center text-white/20 hover:text-white/50 transition-colors"
          whileHover={{ scale: 1.1 }}
          suppressHydrationWarning
        >
          <ChevronUp className="w-3 h-3" />
        </motion.button>
      </motion.div>
    </TooltipProvider>
  );
}
