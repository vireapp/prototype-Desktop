"use client";

import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import {
  User,
  Key,
  Monitor,
  Sliders,
  Bell,
  Shield,
  Bot,
  Hexagon,
  DoorOpen,
  Lock,
  Accessibility,
  Globe,
  Terminal,
  Cpu,
  Volume2
} from "lucide-react";

export type SettingsSection =
  | "profile"
  | "account"
  | "security"
  | "appearance"
  | "preferences"
  | "room_defaults"
  | "immersion"
  | "notifications"
  | "privacy"
  | "data"
  | "ai"
  | "accessibility"
  | "language_region"
  | "audio"
  | "system"
  | "developer";

interface SettingsSidebarProps {
  activeSection: SettingsSection;
  onNavigate: (section: SettingsSection) => void;
  className?: string;
}

export const navItems = [
  { id: "profile", icon: User },
  { id: "account", icon: Key },
  { id: "security", icon: Shield },
  { id: "privacy", icon: Lock },
  { id: "data", icon: Hexagon },
  { id: "language_region", icon: Globe },
  { id: "appearance", icon: Monitor },
  { id: "accessibility", icon: Accessibility },
  { id: "preferences", icon: Sliders },
  { id: "room_defaults", icon: DoorOpen },
  { id: "notifications", icon: Bell },
  { id: "ai", icon: Bot },
  { id: "immersion", icon: Sliders },
  { id: "audio", icon: Volume2 },
  { id: "system", icon: Cpu },
  { id: "developer", icon: Terminal },
] as const;

export const navCategories = [
  {
    label: "Account",
    items: [
      { id: "profile", icon: User },
      { id: "account", icon: Key },
      { id: "security", icon: Shield },
      { id: "privacy", icon: Lock },
      { id: "data", icon: Hexagon },
      { id: "language_region", icon: Globe },
    ],
  },
  {
    label: "Experience",
    items: [
      { id: "appearance", icon: Monitor },
      { id: "accessibility", icon: Accessibility },
      { id: "preferences", icon: Sliders },
      { id: "room_defaults", icon: DoorOpen },
      { id: "notifications", icon: Bell },
    ],
  },
  {
    label: "Advanced",
    items: [
      { id: "ai", icon: Bot },
      { id: "immersion", icon: Sliders },
      { id: "audio", icon: Volume2 },
      { id: "system", icon: Cpu },
      { id: "developer", icon: Terminal },
    ],
  },
] as const;

export function SettingsSidebar({ activeSection, onNavigate, className }: SettingsSidebarProps) {
  const { t } = useTranslation();

  return (
    <nav className={cn("flex flex-col gap-6 w-full", className)}>
      {navCategories.map((category, idx) => (
        <div key={idx} className="flex flex-col gap-1">
          <h3 className="px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">
            {t('categories', category.label.toLowerCase())}
          </h3>
          {category.items.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            const label = t('tabs', item.id);

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id as SettingsSection)}
                className={cn(
                  "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-primary/20 hover:scale-[1.02]",
                  isActive
                    ? "bg-accent/40 text-foreground font-semibold shadow-sm backdrop-blur-md border border-accent/50"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-transparent",
                )}
                suppressHydrationWarning
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full shadow-[0_0_8px_var(--primary)]" />
                )}
                <Icon
                  className={cn(
                    "w-[18px] h-[18px] transition-colors duration-300",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                  )}
                />
                {label}
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
