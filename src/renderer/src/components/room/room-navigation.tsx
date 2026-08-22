"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid,
  PenTool,
  Music2,
  ListTodo,
  MessageSquare,
  Users,
  Bot,
  Monitor,
  Home,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export type ActivityType =
  | "media"
  | "screen_share"
  | "whiteboard"
  | "games"
  | "notes"
  | "timer"
  | "tasks"
  | "music"
  | "virtual_tv"
  | "home"
  | "conference";

export type SidebarType = "chat" | "participants" | "ai" | "none";

interface RoomNavigationProps {
  currentActivity: ActivityType;
  onActivityChange: (activity: ActivityType) => void;
  activeSidebar: SidebarType;
  onSidebarChange: (sidebar: SidebarType) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  activityCounts?: Record<string, number>;
  isRoomPublic?: boolean;
  isLightTheme?: boolean;
  hasUnreadPolls?: boolean;
}

export function RoomNavigation({
  currentActivity,
  onActivityChange,
  activeSidebar,
  onSidebarChange,
  isSidebarOpen,
  onToggleSidebar,
  activityCounts = {},
  isRoomPublic = false,
  isLightTheme = false,
  hasUnreadPolls = false,
}: RoomNavigationProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const mainApps: NavItemDef[] = [
    { id: "media", label: "Watch", icon: Monitor, accentColor: "59, 130, 246" },
    // { id: "virtual_tv", label: "TV", icon: Tv, accentColor: "99, 102, 241" },
    { id: "whiteboard", label: "Canvas", icon: PenTool, accentColor: "245, 158, 11" },
    { id: "notes", label: "Notes", icon: FileText, accentColor: "20, 184, 166" },
    { id: "games", label: "Games", icon: LayoutGrid, accentColor: "168, 85, 247" },
  ];

  const utilityApps: NavItemDef[] = [
    { id: "tasks", label: "Tasks", icon: ListTodo, accentColor: "16, 185, 129" },
    { id: "music", label: "Music", icon: Music2, accentColor: "236, 72, 153" },
  ];

  const sidebarTools: NavItemDef[] = [
    { id: "chat", label: "Chat", icon: MessageSquare, accentColor: "99, 102, 241" },
    { id: "participants", label: "People", icon: Users, accentColor: "249, 115, 22" },
    { id: "ai", label: "AI", icon: Bot, accentColor: "244, 63, 94" },
  ];

  const handleSidebarClick = (id: string) => {
    if (id === "participants") {
      onSidebarChange(id as SidebarType);
      return;
    }
    if (activeSidebar === id && isSidebarOpen) {
      onToggleSidebar();
    } else {
      if (!isSidebarOpen) onToggleSidebar();
      onSidebarChange(id as SidebarType);
    }
  };

  const pillBg =
    "bg-black/40 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]";

  return (
    <motion.div
      className={cn(
        "relative flex items-center gap-1 px-2 py-1.5 border rounded-2xl backdrop-blur-2xl",
        pillBg,
      )}
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 32, delay: 0.1 }}
    >
      {/* Home button */}
      <NavItem
        id="home"
        label="Home"
        icon={Home}
        active={currentActivity === "home"}
        hovered={hoveredItem === "home"}
        count={activityCounts?.["home"]}
        accentColor="255, 255, 255"
        isLightTheme={isLightTheme}
        onClick={() => onActivityChange("home")}
        onHover={(h) => setHoveredItem(h ? "home" : null)}
      />

      {/* Divider */}
      <div
        className={cn("w-px h-5 mx-0.5", isLightTheme ? "bg-black/[0.08]" : "bg-white/[0.07]")}
      />

      {/* Main apps */}
      {mainApps.map((app) => (
        <NavItem
          key={app.id}
          id={app.id}
          label={app.label}
          icon={app.icon}
          active={currentActivity === app.id}
          hovered={hoveredItem === app.id}
          count={activityCounts[app.id]}
          accentColor={app.accentColor}
          isLightTheme={isLightTheme}
          onClick={() => onActivityChange(app.id as ActivityType)}
          onHover={(h) => setHoveredItem(h ? app.id : null)}
        />
      ))}

      {/* Divider */}
      <div
        className={cn("w-px h-5 mx-0.5", isLightTheme ? "bg-black/[0.08]" : "bg-white/[0.07]")}
      />

      {/* Utility apps */}
      {utilityApps.map((app) => (
        <NavItem
          key={app.id}
          id={app.id}
          label={app.label}
          icon={app.icon}
          active={currentActivity === app.id}
          hovered={hoveredItem === app.id}
          count={activityCounts[app.id]}
          accentColor={app.accentColor}
          isLightTheme={isLightTheme}
          onClick={() => onActivityChange(app.id as ActivityType)}
          onHover={(h) => setHoveredItem(h ? app.id : null)}
        />
      ))}

      {/* Divider */}
      <div
        className={cn("w-px h-5 mx-0.5", isLightTheme ? "bg-black/[0.08]" : "bg-white/[0.07]")}
      />

      {/* Sidebar tools */}
      <div
        className={cn(
          "flex items-center gap-0.5 px-1 py-0.5 rounded-xl",
          isLightTheme ? "bg-black/[0.04]" : "bg-white/[0.04]",
        )}
      >
        {sidebarTools.map((tool) => (
          <SidebarNavItem
            key={tool.id}
            id={tool.id}
            label={tool.label}
            icon={tool.icon}
            active={isSidebarOpen && activeSidebar === tool.id}
            hovered={hoveredItem === `sb-${tool.id}`}
            accentColor={tool.accentColor}
            isLightTheme={isLightTheme}
            onClick={() => handleSidebarClick(tool.id)}
            onHover={(h) => setHoveredItem(h ? `sb-${tool.id}` : null)}
          />
        ))}
      </div>
    </motion.div>
  );
}

interface NavItemDef {
  id: string;
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  accentColor: string;
}

interface NavItemProps extends NavItemDef {
  active: boolean;
  hovered: boolean;
  count?: number;
  isLightTheme: boolean;
  onClick: () => void;
  onHover: (h: boolean) => void;
}

function NavItem({
  id,
  label,
  icon: Icon,
  active,
  hovered,
  count,
  accentColor,
  isLightTheme,
  onClick,
  onHover,
}: NavItemProps) {
  const activeTextColor = isLightTheme ? "text-zinc-900" : "text-white";
  const inactiveTextColor = isLightTheme
    ? "text-zinc-500 hover:text-zinc-800"
    : "text-white/40 hover:text-white/80";

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            suppressHydrationWarning
            onClick={onClick}
            onMouseEnter={() => onHover(true)}
            onMouseLeave={() => onHover(false)}
            className={cn(
              "relative flex flex-col items-center justify-center w-10 h-9 rounded-xl transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20",
              active ? activeTextColor : inactiveTextColor,
            )}
            whileTap={{ scale: 0.92 }}
          >
            {/* Active background glow */}
            <AnimatePresence>
              {active && (
                <motion.div
                  className="absolute inset-0 rounded-xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    background: isLightTheme
                      ? `rgba(${accentColor}, 0.1)`
                      : `rgba(${accentColor}, 0.15)`,
                  }}
                />
              )}
            </AnimatePresence>

            {/* Hover background */}
            {!active && (
              <motion.div
                className="absolute inset-0 rounded-xl"
                animate={{
                  opacity: hovered ? 1 : 0,
                  background: isLightTheme ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)",
                }}
                transition={{ duration: 0.12 }}
              />
            )}

            {/* Presence count badge */}
            {count !== undefined && count > 0 && !active && (
              <motion.span
                className={cn(
                  "absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full",
                  isLightTheme ? "bg-zinc-400" : "bg-white/30",
                )}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500 }}
              />
            )}

            {/* Icon */}
            <div className="relative z-10">
              <Icon className="w-[18px] h-[18px]" strokeWidth={active ? 2 : 1.5} />
            </div>

            {/* Active underline indicator */}
            <AnimatePresence>
              {active && (
                <motion.div
                  layoutId={`nav-indicator-${id}`}
                  className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-[2px] rounded-full"
                  style={{
                    width: "16px",
                    background: `rgba(${accentColor}, 0.9)`,
                    boxShadow: `0 0 6px rgba(${accentColor}, 0.5)`,
                  }}
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  exit={{ opacity: 0, scaleX: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </AnimatePresence>
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs font-medium px-2.5 py-1.5 rounded-lg">
          {label}
          {count !== undefined && count > 0 && <span className="ml-1.5 opacity-50">{count}</span>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface SidebarNavItemProps {
  id: string;
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  active: boolean;
  hovered: boolean;
  accentColor: string;
  isLightTheme: boolean;
  onClick: () => void;
  onHover: (h: boolean) => void;
}

function SidebarNavItem({
  id,
  label,
  icon: Icon,
  active,
  hovered,
  accentColor,
  isLightTheme,
  onClick,
  onHover,
}: SidebarNavItemProps) {
  const activeTextColor = isLightTheme ? "text-zinc-900" : "text-white";
  const inactiveTextColor = isLightTheme
    ? "text-zinc-500 hover:text-zinc-700"
    : "text-white/40 hover:text-white/70";

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            suppressHydrationWarning
            onClick={onClick}
            onMouseEnter={() => onHover(true)}
            onMouseLeave={() => onHover(false)}
            className={cn(
              "relative flex items-center justify-center w-8 h-7 rounded-lg transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20",
              active ? activeTextColor : inactiveTextColor,
            )}
            whileTap={{ scale: 0.9 }}
          >
            {/* Active state background */}
            <AnimatePresence>
              {active && (
                <motion.div
                  className="absolute inset-0 rounded-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                  style={{
                    background: isLightTheme
                      ? `rgba(${accentColor}, 0.12)`
                      : `rgba(${accentColor}, 0.18)`,
                  }}
                />
              )}
            </AnimatePresence>

            {/* Hover background */}
            {!active && (
              <motion.div
                className="absolute inset-0 rounded-lg"
                animate={{
                  opacity: hovered ? 1 : 0,
                  background: isLightTheme ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.06)",
                }}
                transition={{ duration: 0.1 }}
              />
            )}

            <Icon className="w-3.5 h-3.5 relative z-10" strokeWidth={active ? 2 : 1.5} />

            {/* Active dot */}
            <AnimatePresence>
              {active && (
                <motion.span
                  className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ background: `rgba(${accentColor}, 1)` }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500 }}
                />
              )}
            </AnimatePresence>
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs rounded-lg">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
