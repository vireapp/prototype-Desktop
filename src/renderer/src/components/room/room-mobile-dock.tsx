"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Menu, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoomMobileDockProps {
  unreadCount?: number;
  activeTab: "none" | "chat" | "activities" | "people" | "music" | "menu" | "ai";
  onTabChange: (tab: "none" | "chat" | "activities" | "people" | "music" | "menu" | "ai") => void;
  isAudioEnabled: boolean;
  toggleAudio: () => void;
  isVideoEnabled: boolean;
  toggleVideo: () => void;
}

export function RoomMobileDock({
  unreadCount = 0,
  activeTab,
  onTabChange,
  isAudioEnabled,
  toggleAudio,
  isVideoEnabled,
  toggleVideo,
}: RoomMobileDockProps) {
  const [pressedTab, setPressedTab] = useState<string | null>(null);

  const handleTabPress = (tabId: string) => {
    setPressedTab(tabId);
    setTimeout(() => setPressedTab(null), 150);

    if (tabId === "audio") {
      toggleAudio();
      return;
    }
    if (tabId === "video") {
      toggleVideo();
      return;
    }

    const isActive = activeTab === tabId;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onTabChange(isActive ? "none" : (tabId as any));
  };

  // We define the 4 main actions for the mobile dock
  const actions = [
    {
      id: "audio",
      icon: isAudioEnabled ? Mic : MicOff,
      label: isAudioEnabled ? "Mute" : "Unmute",
      isActive: false,
      isToggle: true,
      color: isAudioEnabled ? "text-white" : "text-red-500",
      bg: isAudioEnabled ? "" : "bg-red-500/10",
    },
    {
      id: "video",
      icon: isVideoEnabled ? Video : VideoOff,
      label: isVideoEnabled ? "Stop Video" : "Start Video",
      isActive: false,
      isToggle: true,
      color: isVideoEnabled ? "text-white" : "text-red-500",
      bg: isVideoEnabled ? "" : "bg-red-500/10",
    },
    {
      id: "chat",
      icon: MessageSquare,
      label: "Chat",
      isActive: activeTab === "chat",
      isToggle: false,
      color: activeTab === "chat" ? "text-indigo-400" : "text-white/70",
      bg: activeTab === "chat" ? "bg-indigo-500/10" : "",
    },
    {
      id: "menu",
      icon: Menu,
      label: "More",
      isActive: activeTab === "menu",
      isToggle: false,
      color: activeTab === "menu" ? "text-white" : "text-white/70",
      bg: activeTab === "menu" ? "bg-white/10" : "",
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[70] pointer-events-auto pb-safe px-4 mb-4">
      <motion.div
        className="relative mx-auto max-w-sm bg-[#0d0d10]/95 backdrop-blur-2xl border border-white/[0.1] rounded-full overflow-hidden shadow-2xl"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 30,
          delay: 0.1,
        }}
      >
        {/* Navigation Items */}
        <div className="relative flex items-center justify-between p-2">
          {actions.map((action) => {
            const isPressed = pressedTab === action.id;

            return (
              <motion.button
                key={action.id}
                onClick={() => handleTabPress(action.id)}
                suppressHydrationWarning
                className={cn(
                  "group relative flex flex-col items-center justify-center w-[4.5rem] h-12 rounded-full transition-colors",
                  action.bg,
                )}
                whileTap={{ scale: 0.9 }}
                animate={{
                  scale: isPressed ? 0.9 : 1,
                }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
              >
                <AnimatePresence>
                  {isPressed && (
                    <motion.div
                      className="absolute inset-0 bg-white/20 rounded-full"
                      initial={{ opacity: 1 }}
                      animate={{ opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </AnimatePresence>

                <motion.div
                  className={cn(
                    "relative p-2 rounded-xl transition-colors duration-300 flex items-center justify-center",
                    action.color,
                  )}
                  animate={{
                    scale: action.isActive ? 1.1 : 1,
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                >
                  <action.icon
                    className={cn(
                      "w-6 h-6 transition-all duration-300",
                      action.isActive && "drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]",
                    )}
                    fill={action.isActive && action.id !== "menu" ? "currentColor" : "none"}
                  />

                  {/* Notification Badge */}
                  {action.id === "chat" && unreadCount > 0 && !action.isActive && (
                    <motion.div
                      className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full flex items-center justify-center border-2 border-zinc-900"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    >
                      <span className="text-[10px] font-bold text-white leading-none">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    </motion.div>
                  )}
                </motion.div>

                {/* Label for accessibility */}
                <span className="sr-only">{action.label}</span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
