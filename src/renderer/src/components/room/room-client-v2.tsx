/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import { sounds } from "@/lib/sounds";
import { useWebRTC } from "../../hooks/use-webrtc";
import { RoomHomeOverlay } from "./room-home-overlay";
import { RoomMedia } from "@/components/room/room-media";
import { VideoConference } from "./video-conference";
import { RoomChat } from "@/components/room/chat";

import { ParticipantsStrip } from "./participants-strip";
import { RoomNavigation, SidebarType } from "@/components/room/room-navigation";
import { MediaSelector, MediaService } from "@/components/room/media-selector";
import { ExternalServiceView } from "@/components/room/external-service-view";
import { Button } from "@/components/ui/button";
import { RoomAIChat } from "@/components/room/ai-chat";
import { RoomWhiteboard } from "@/components/room/whiteboard";
import { RoomReactionOverlay, ReactionItem } from "@/components/room/reaction-overlay";
import { VirtualTV } from "@/components/room/activities/virtual-tv";
import { RoomReactionBar } from "@/components/room/reaction-bar";
import { RoomPolls } from "@/components/room/polls";
import { GameCenter, GameType } from "@/components/room/games/game-center";
import { RoomNotes } from "@/components/room/notes";

import { RoomTaskBoard } from "@/components/room/task-board";
import { RoomPasswordGate } from "@/components/room/room-password-gate";
import { QuickChatBar } from "@/components/room/quick-chat-bar";
import { ActiveRoomTimer } from "@/components/room/active-room-timer";
import { RoomMobileDock } from "@/components/room/room-mobile-dock";
import {
  PhoneOff,
  Copy,
  Check,
  LayoutGrid,
  Users,
  Monitor,
  Maximize2,
  Minimize2,
  PartyPopper,
  BarChart2,
  PanelRightClose,
  PanelRightOpen,
  Smile,
  X,
  MoreVertical,
  Settings,
  PanelBottom,
  Mic,
  MicOff,
  Video,
  VideoOff,
  RefreshCw,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link, useNavigate } from "react-router-dom";
import { ScreenSharePicker } from "@/components/room/screen-share-picker";
import { submitChat } from "@/lib/ai/actions";

import { joinRoom, getRoomRole, RoomRole } from "@/components/rooms/actions";
import { toast } from "sonner";
const useRouter = (): {
  push: (path: string) => void
  replace: (path: string) => void
  refresh: () => void
  back: () => void
} => {
  const navigate = useNavigate()
  return {
    push: (path: string) => navigate(path),
    replace: (path: string) => navigate(path, { replace: true }),
    refresh: () => window.location.reload(),
    back: () => navigate(-1)
  }
}
import { RoomSettingsDialog } from "@/components/room/room-settings-dialog";
import { cn } from "@/lib/utils";
import { RoomWelcomeScreen } from "@/components/room/room-welcome-screen";
import type { CameraConfig } from "@/components/room/camera-source-picker";

import YouTube from "react-youtube";

import { createClient } from "@/lib/supabase/client";

import { useRoom } from '@/lib/room-context';
import { useRoomState } from "@/hooks/use-room-state";
import { useRoomSubscriptions } from "@/hooks/use-room-subscriptions";
import { RoomMembersList } from "./room-members-list";
import { RoomAudioRenderer } from "@/components/room/room-audio-renderer";
import { ChannelSecretContext } from "./channel-secret-context";
import { RoomMusicPlayer } from "@/components/room/music-player/room-music-player";

import ReactPlayer from 'react-player';

const BASE_STATIONS = [
  {
    id: "lofi",
    name: "Lo-Fi Girl Mix",
    url: "https://www.youtube.com/watch?v=4xDzrUhVKcg",
    description: "Beats to relax/study to",
    color: "text-rose-400",
  },
  {
    id: "synthwave",
    name: "Synthwave",
    url: "https://www.youtube.com/watch?v=MVPTGNGiI-4",
    description: "Retro futuristic chill",
    color: "text-violet-400",
  },
  {
    id: "coffee",
    name: "Coffee Shop",
    url: "https://www.youtube.com/watch?v=e3L1PIY1oBY",
    description: "Jazz & Rain ambience",
    color: "text-amber-400",
  },
  {
    id: "classical",
    name: "Classical",
    url: "https://www.youtube.com/watch?v=mIYzp5rcTvU",
    description: "Dark Academia Classical",
    color: "text-slate-300",
  },
];

const INITIAL_STATIONS: Array<{
  name: string;
  url: string;
  type: "lofi" | "radio" | "youtube" | "custom";
}> = [];

interface RoomClientV2Props {
  room: any;
  user: any;
  channelSecret: string;
  isGhostMode?: boolean;
}

export function RoomClientV2({
  room,
  user,
  channelSecret,
  isGhostMode = false,
}: RoomClientV2Props) {
  const supabase = createClient();
  const [currentRoom, setCurrentRoom] = useState(room); // Local state for realtime updates
  const isOwner = user?.id === room.created_by;
  
  const { minimizeRoom, isMinimized, endRoom } = useRoom();

  // Realtime Subscription for Room Updates handled by useRoomSubscriptions now

  // Dynamic Video Constraints
  const videoConstraints = React.useMemo(() => {
    let width = 1280;
    let height = 720;
    const quality = currentRoom.appearance?.videoQuality || "hd";

    if (quality === "sd") {
      width = 640;
      height = 480;
    }
    if (quality === "low") {
      width = 320;
      height = 240;
    }

    return {
      width: { ideal: width },
      height: { ideal: height },
      frameRate: { ideal: 24 },
    };
  }, [currentRoom.appearance?.videoQuality]);

  // Stable ref so the onScreenShareStop callback passed to useWebRTC always
  // calls the latest sendScreen, even though sendScreen is defined further below.
  const screenShareStopRef = React.useRef<() => void>(() => {});

  // Camera/mic source chosen by the user in the welcome screen.
  // null = welcome screen not yet dismissed (delays media initialisation).
  const [cameraConfig, setCameraConfig] = React.useState<CameraConfig | null>(null);

  const {
    localStream,
    remoteStreams,
    participants,
    cameraActive,
    micActive,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    debugInfo,
  } = useWebRTC(
    currentRoom.id,
    user,
    videoConstraints,
    // Delegate to the ref — avoids referencing sendScreen before it's declared
    () => screenShareStopRef.current(),
    // Pass camera config — null keeps media paused until welcome screen is done
    cameraConfig,
    isGhostMode,
  );

  const peersMetadata = participants;

  const { ui, activity: activityState, media, presenter } = useRoomState(isOwner);

  // Destructure for compatibility
  const {
    sidebarView,
    setSidebarView,
    mobileTab,
    setMobileTab,
    isSidebarOpen,
    setIsSidebarOpen,
    showWelcome,
    setShowWelcome,
    showReactions,
    setShowReactions,
    showDebug,
    setShowDebug,
  } = ui;
  const {
    current: activity,
    set: setActivity,
    game: activeGame,
    setGame: setActiveGame,
    virtualChannel: virtualTVChannel,
    setVirtualChannel: setVirtualTVChannel,
  } = activityState;

  // NOTE: Renaming activity state variable locally to match old code usage if needed,
  // but old code used 'activity' string state and 'activeGame' object.
  // My hook has 'activity.current' which maps to 'activity'.
  // CONSTANT NAME CLASH: 'activity' is used in old code.

  const {
    mode: mediaMode,
    setMode: setMediaMode,
    url: selectedMediaUrl,
    setUrl: setSelectedMediaUrl,
    external: externalService,
    setExternal: setExternalService,
    launch: launchMedia,
    music,
  } = media;
  const {
    playing: musicPlaying,
    setPlaying: setMusicPlaying,
    muted: musicMuted,
    setMuted: setMusicMuted,
    volume: musicVolume,
    setVolume: setMusicVolume,
  } = music;
  const { id: presenterId, setId: setPresenterId } = presenter;

  const [player, setPlayer] = useState<any>(null);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isDockVisible, setIsDockVisible] = useState(true);

  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  const [reactions, setReactions] = useState<ReactionItem[]>([]);
  const [userRole, setUserRole] = useState<RoomRole>(isOwner ? "owner" : "member");
  const [mobilePeopleView, setMobilePeopleView] = useState<"grid" | "list">("grid"); // New state for mobile toggle

  // Personal Settings State
  const [personalSettings, setPersonalSettings] = useState({
    masterVolume: 100,
    bandwidthSaver: false,
    hideReactions: false,
    compactMode: false,
  });

  // User Region State (for optimizing Virtual TV)
  const [userRegion, setUserRegion] = useState<{
    code: string;
    name: string;
  } | null>(null);

  /* State for Presence */
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [isAIPresent, setIsAIPresent] = useState(false);
  const aiChatHistoryRef = useRef<any[]>([]);

  const isAlone = onlineUserIds.length === 1 && user && onlineUserIds[0] === user.id;

  useEffect(() => {
    if (!isAlone || isAIPresent) return;
    
    const timer = setTimeout(() => {
      setIsAIPresent(true);
      const prompt = "The user is alone in the room. Join the room and suggest an activity (e.g. playing a game, listening to music, or just chatting) to keep them company. Keep it short, friendly, and act like a real person who just walked in.";
      
      submitChat(prompt, aiChatHistoryRef.current, onlineUserIds, activity).then(async (result) => {
        if (result.response) {
          aiChatHistoryRef.current.push({ role: 'user', content: [{ text: prompt }] });
          aiChatHistoryRef.current.push({ role: 'model', content: [{ text: result.response }] });
          
          const channel = supabase.channel(`room_${room.id}_chat`);
          await channel.send({
            type: 'broadcast',
            event: 'chat_message',
            payload: {
              id: Math.random().toString(36).substring(7),
              senderId: 'vire_ai',
              senderName: 'VIRE AI',
              senderAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=vire',
              content: result.response,
              timestamp: Date.now(),
              isSystem: false
            }
          });
        }
      }).catch(err => console.error("AI presence failed:", err));
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [isAlone, isAIPresent, room.id, supabase, user]);

  const handleUserMessage = (msgContent: string) => {
    const contentLower = msgContent.toLowerCase();
    
    // Check if AI is being summoned when not present
    const isSummoning = /\b(@?vire\s*ai|@vire|@ai|vire|@bot|bot)\b/.test(contentLower);
    
    // If AI is not present and not being summoned, do nothing
    if (!isAIPresent && !isSummoning) return;

    // If AI is being summoned, ensure it is marked as present
    if (isSummoning && !isAIPresent) {
      setIsAIPresent(true);
    }

    const isDismissal = /\b(bye|goodbye|good bye|leave|go away|see ya|cya|get out)\b/.test(contentLower);
    
    const prompt = isDismissal
      ? `${msgContent}\n\n[SYSTEM: The user wants you to leave the room. Say a brief goodbye, acknowledging you are leaving. Do not offer to stay.]`
      : msgContent;

    submitChat(prompt, aiChatHistoryRef.current, onlineUserIds, activity).then(async (result) => {
      if (result.response) {
        let aiResponseText = result.response;
        const commandRegex = /<<<COMMAND:(.*?)>>>/g;
        let match;
        
        // Extract and execute commands
        while ((match = commandRegex.exec(result.response)) !== null) {
          try {
            const commandObj = JSON.parse(match[1]);
            handleAICommand(commandObj);
          } catch (e) {
            console.error("Failed to parse AI command", e);
          }
        }
        
        // Remove commands from the visible message
        aiResponseText = aiResponseText.replace(commandRegex, '').trim();

        aiChatHistoryRef.current.push({ role: 'user', content: [{ text: msgContent }] });
        aiChatHistoryRef.current.push({ role: 'model', content: [{ text: result.response }] });
        
        // Dispatch local event for ai-chat.tsx
        window.dispatchEvent(new CustomEvent('ai-chat-message', { detail: { role: 'model', content: result.response } }));
        
        if (aiResponseText) {
          const aiMsg = {
            id: Math.random().toString(36).substring(7),
            senderId: 'vire_ai',
            senderName: 'VIRE AI',
            senderAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=vire',
            content: aiResponseText,
            timestamp: Date.now(),
            isSystem: false
          };

          // Emit local chat message so our own chat.tsx shows the AI response too
          window.dispatchEvent(new CustomEvent('local-chat-message', { detail: aiMsg }));

          const channel = supabase.channel(`room_${room.id}_chat`);
          await channel.send({
            type: 'broadcast',
            event: 'chat_message',
            payload: aiMsg
          });
        }

        if (isDismissal) {
          // Give the user 1.5 seconds to read the goodbye message before the AI disappears
          setTimeout(() => {
            setIsAIPresent(false);
            aiChatHistoryRef.current = []; // Reset history for next time
          }, 1500);
        }
      }
    }).catch(err => console.error("AI chat failed:", err));
  };

  /* People Overlay State (Floating) */
  const [isPeopleOverlayOpen, setIsPeopleOverlayOpen] = useState(false);
  const [isScreenSharePickerOpen, setIsScreenSharePickerOpen] = useState(false);

  /* Polls State (Modal) */
  const [isPollsOpen, setIsPollsOpen] = useState(false);
  const [hasUnreadPoll, setHasUnreadPoll] = useState(false);

  /* Huddles State */
  const [huddles, setHuddles] = useState<{ active: boolean; assignments: Record<string, number> }>({
    active: false,
    assignments: {},
  });

  // Auto-detect User Region
  const detectRegion = async (force: boolean = false) => {
    try {
      // Check session storage first unless forced
      if (!force) {
        const cached = sessionStorage.getItem("user_region");
        if (cached) {
          setUserRegion(JSON.parse(cached));
          return;
        }
      }

      toast.info("Detecting region...");
      const res = await fetch("https://ipwho.is/");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const region = {
            code: data.country_code?.toLowerCase(),
            name: data.country,
          };
          setUserRegion(region);
          sessionStorage.setItem("user_region", JSON.stringify(region));
          toast.success(`Region detected: ${data.country}`);
        }
      }
    } catch (e) {
      console.warn("Failed to pre-fetch region", e);
      toast.error("Region detection failed");
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    detectRegion();
  }, []);

  // Load Persisted Settings

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("vire_room_settings");
      if (saved) {
        try {
          setPersonalSettings((prev) => ({ ...prev, ...JSON.parse(saved) }));
        } catch (e) {
          console.error("Failed to load settings", e);
        }
      }
    }
  }, []);

  const updatePersonalSettings = (newSettings: any) => {
    setPersonalSettings(newSettings);
    localStorage.setItem("vire_room_settings", JSON.stringify(newSettings));
  };

  useEffect(() => {
    const initRole = async () => {
      await joinRoom(room.id);
      const role = await getRoomRole(room.id);
      setUserRole(role);
    };
    initRole();
  }, [room.id]);

  // Music State
  const [currentStationIndex, setCurrentStationIndex] = useState(-1);
  const [playlist, setPlaylist] = useState<
    Array<{
      name: string;
      url: string;
      type: "lofi" | "radio" | "youtube" | "custom";
    }>
  >(INITIAL_STATIONS);

  const handleAddCustomStation = (url: string, title?: string) => {
    const name = title || "Custom Track " + (playlist.length + 1);
    const newStation = { name, url, type: "custom" as const };
    setPlaylist((prev) => [...prev, newStation]);
    setCurrentStationIndex(playlist.length);
    setMusicPlaying(true);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.code === "Backquote") {
        // Ctrl + Tilde/Backtick
        setShowDebug((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const themeColor = room.appearance?.theme === "modern" ? "#ffffff" : "#000000";

  const isSpotify =
    currentStationIndex >= 0 && playlist[currentStationIndex]?.url?.includes("spotify");
  const isYouTube =
    currentStationIndex >= 0 && playlist[currentStationIndex]?.url?.includes("youtu");

  const extractVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url?.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const router = useRouter();

  const handleAICommand = async (command: { type: string; [key: string]: any }) => {
    console.log("AI Command:", command);
    if (command.type === "play_video" && command.query) {
      if (mobileTab !== "none") setMobileTab("none");
      // Search YouTube
      try {
        const res = await fetch(
          `/api/youtube/search?q=${encodeURIComponent(command.query)}&regionCode=US`,
        );
        const data = await res.json();
        if (data.items && data.items.length > 0) {
          const videoId = data.items[0].id.videoId;
          const url = `https://www.youtube.com/watch?v=${videoId}`;
          setSelectedMediaUrl(url);
          setMediaMode("youtube");
          setActivity("media");
          toast.success(`Playing: ${data.items[0].snippet.title}`);
        } else {
          toast.error("No video found for " + command.query);
        }
      } catch (e) {
        console.error("AI Search Error", e);
        toast.error("Failed to search video");
      }
    }

    if (command.type === "launch_game" && command.game) {
      if (mobileTab !== "none") setMobileTab("none");
      setActivity("games");
      setActiveGame(command.game as GameType);
      toast.success("Launching " + command.game);
    }

    if (command.type === "launch_service" && command.service) {
      if (mobileTab !== "none") setMobileTab("none");
      const service = command.service.toLowerCase();
      const serviceUrls: Record<string, string> = {
        netflix: "https://www.netflix.com",
        prime: "https://www.primevideo.com",
        hotstar: "https://www.hotstar.com",
        disney: "https://www.disneyplus.com",
      };

      if (Object.prototype.hasOwnProperty.call(serviceUrls, service)) {
        setExternalService({
          name: service.charAt(0).toUpperCase() + service.slice(1),
          url: serviceUrls[service],
        });
        setMediaMode("external");
        setActivity("media");
        toast.success(`Launching ${service}...`);
      } else {
        toast.error("Unknown service: " + service);
      }
    }

    // New AI Capabilities
    if (command.type === "trigger_confetti") {
      await handleTriggerConfetti();
    }

    if (command.type === "toggle_music") {
      setMusicPlaying(command.state ?? !musicPlaying);
      toast.success(command.state ? "Music playing" : "Music paused");
    }

    if (command.type === "change_theme") {
      toast.success(`Theme changed to ${command.theme}`);
      // Assuming you have a way to update appearance locally, e.g., currentRoom state:
      setCurrentRoom((prev: any) => ({
        ...prev,
        appearance: { ...prev.appearance, background: command.theme },
      }));
    }

    if (command.type === "switch_activity") {
      setActivity(command.activity);
      toast.success(`Switched to ${command.activity}`);
    }

    if (command.type === "toggle_focus_mode") {
      setIsFocusMode(!isFocusMode);
      toast.success(isFocusMode ? "Focus mode disabled" : "Focus mode enabled");
    }

    if (command.type === "toggle_huddles") {
      toggleHuddles();
    }

    if (command.type === "update_room_info" && isOwner) {
      setCurrentRoom((prev: any) => ({ ...prev, name: command.name }));
      toast.success(`Room name changed to ${command.name}`);
      // Should ideally call an API to persist, but for now we update locally to show the change
      supabase.from("rooms").update({ name: command.name }).eq("id", room.id).then();
    }

    if (command.type === "toggle_lock" && isOwner) {
      const newLocked = command.locked ?? !currentRoom.permissions?.lockRoom;
      setCurrentRoom((prev: any) => ({
        ...prev,
        permissions: { ...prev.permissions, lockRoom: newLocked },
      }));
      toast.success(newLocked ? "Room Locked" : "Room Unlocked");
      supabase
        .from("rooms")
        .update({
          permissions: { ...currentRoom.permissions, lockRoom: newLocked },
        })
        .eq("id", room.id)
        .then();
    }

    if (command.type === "kick_user" && isOwner && command.userId) {
      toast.success(`Kicked user ${command.userId}`);
      // Calling API to kick member
      fetch(`/api/rooms/${room.id}/kick`, {
        method: "POST",
        body: JSON.stringify({ userId: command.userId }),
      }).then();
    }

    if (command.type === "clear_chat" && isOwner) {
      toast.success("Chat cleared");
    }

    if (command.type === "create_poll") {
      toast.success(`Poll Created: ${command.question}`);
      setIsPollsOpen(true);
    }
  };

  const hideParticipants = room.appearance?.hideParticipants && !isOwner;

  useEffect(() => {
    // Lock Room Logic
    if (room.permissions?.lockRoom && !isOwner) {
      // Redirect or show blocked message
      // For now, simple redirect
      toast.error("This room is currently locked by the host.");
      router.push("/dashboard/rooms");
      return;
    }

    const hasSeen = localStorage.getItem(`seen_welcome_${room.id}`);
    if (hasSeen) {
      setShowWelcome(false);
      // If we skip welcome, we might can't auto-play audio reliably without interaction,
      // but the user has "entered" before. We'll leave it to them to press play if needed.
    }
  }, [room.id, room.permissions?.lockRoom, isOwner, router, setShowWelcome]);

  useEffect(() => {
    const channel = supabase
      .channel(`room_${room.id}_huddles`)
      .on("broadcast", { event: "huddle_sync" }, ({ payload }) => {
        setHuddles(payload);
        if (payload.active)
          toast.success(`You were moved to Huddle Group ${payload.assignments[user.id] || 1}`);
        else toast.info("Huddles ended. Everyone is back in the main room.");
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [room.id, user.id, supabase]);

  const toggleHuddles = () => {
    if (huddles.active) {
      const payload = { active: false, assignments: {} };
      setHuddles(payload);
      supabase
        .channel(`room_${room.id}_huddles`)
        .send({ type: "broadcast", event: "huddle_sync", payload });
    } else {
      const assignments: Record<string, number> = {};
      const usersToAssign = onlineUserIds.length > 0 ? onlineUserIds : [user.id];
      usersToAssign.forEach((uid) => (assignments[uid] = Math.floor(Math.random() * 3) + 1));
      const payload = { active: true, assignments };
      setHuddles(payload);
      supabase
        .channel(`room_${room.id}_huddles`)
        .send({ type: "broadcast", event: "huddle_sync", payload });
    }
  };

  useEffect(() => {
    if (hideParticipants && sidebarView === "participants") {
      setSidebarView("chat");
    }
  }, [hideParticipants, sidebarView]);

  // Subscriptions
  const {
    broadcastReaction: sendReaction,
    broadcastConfetti: sendConfetti,
    broadcastVirtualTV: sendTV,
    broadcastScreenShare: sendScreen,
  } = useRoomSubscriptions({
    roomId: room.id,
    userId: user.id,
    supabase,
    callbacks: {
      onRoomUpdate: (newRoom: any) => setCurrentRoom((prev: any) => ({ ...prev, ...newRoom })),
      onReaction: (emoji: any) => addReaction(emoji),
      onConfetti: () => triggerConfettiLocal(),
      onVirtualTVChange: ({ url }: any) => setVirtualTVChannel(url),
      onScreenShareChange: ({ presenterId, isSharing }: any) => {
        setPresenterId(presenterId);
        if (isSharing && presenterId && presenterId !== user.id) {
          setActivity("screen_share");
        } else if (!isSharing && activity === "screen_share") {
          setActivity("home");
        }
      },
      onRoleUpdate: (newRole: any) => {
        if (!isOwner) { // Owner role shouldn't be downgraded by room_members changes
          setUserRole(newRole);
          toast.success(`Your role was updated to: ${newRole}`);
        }
      },
    } as any,
  });

  // Now that sendScreen is available, wire up the screen-share-stop handler.
  // Using a ref means the callback in useWebRTC always sees the latest version.
  React.useEffect(() => {
    screenShareStopRef.current = async () => {
      setPresenterId(null);
      await sendScreen(false);
      toast.info("Screen sharing stopped");
    };
  }, [sendScreen]);

  const handleVirtualTVChannelSelect = async (url: string, name: string) => {
    setVirtualTVChannel(url);
    await sendTV(url, name);
  };

  const addReaction = (emoji: string) => {
    sounds.playReactionSound();
    if (emoji === "🎉" || emoji === "✨") {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"],
        zIndex: 99999,
      });
    } else {
      const array = new Uint32Array(2);
      crypto.getRandomValues(array);
      const id = array[0].toString(36);
      const x = (array[1] / 4294967296) * 80 + 10; // 10% to 90% width
      setReactions((prev) => [...prev, { id, emoji, x, y: 100 }]);
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== id));
      }, 3000); // Give it more time to float up
    }
  };

  const broadcastReaction = async (emoji: string) => {
    addReaction(emoji); // Show locally
    await sendReaction(emoji);
  };

  const handleLocalScreenShare = async () => {
    const isSharing = await toggleScreenShare();
    if (isSharing) {
      setPresenterId(user.id);
      setActivity("screen_share"); // Bug #17 fix: make the screen share view visible
      await sendScreen(true);
      toast.success("Screen sharing started");
      // Note: Stop is also handled via the onScreenShareStop callback in useWebRTC
      // (for browser-toolbar "Stop sharing" button)
    } else {
      // Explicit stop path (manual button click) — belt-and-suspenders
      // in case onScreenShareStop hasn't fired yet or channel is not ready.
      setPresenterId(null);
      setActivity("home");
      await sendScreen(false);
    }
    return isSharing;
  };

  const copyCode = () => {
    if (room.code) {
      navigator.clipboard.writeText(room.code);
      setCopied(true);
      toast.success("Code copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const triggerConfettiLocal = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#6366f1", "#a855f7", "#ec4899"],
        zIndex: 99999,
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#6366f1", "#a855f7", "#ec4899"],
        zIndex: 99999,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  const handleTriggerConfetti = async () => {
    triggerConfettiLocal();
    await sendConfetti();
  };

  const handleMediaSelect = (service: MediaService, url?: string) => {
    const serviceUrls: Record<string, string> = {
      youtube: "https://www.youtube.com/feed/trending",
      netflix: "https://www.netflix.com",
      prime: "https://www.primevideo.com",
      jiohotstar: "https://www.hotstar.com",
      crunchyroll: "https://www.crunchyroll.com",
      mxplayer: "https://www.mxplayer.in",
      hianime: "https://hianime.lol",
    };
    
    // We reuse the "youtube" mediaMode because it simply triggers RoomMedia
    // which now uses a universal webview that can handle ANY url!
    setSelectedMediaUrl(url || serviceUrls[service as string] || "https://google.com");
    setMediaMode("youtube");
  };

  const renderMediaContent = () => {
    if (mediaMode === "selector") {
      return <MediaSelector onSelect={handleMediaSelect} />;
    }
    if (mediaMode === "external" && externalService) {
      return (
        <ExternalServiceView
          serviceName={externalService.name}
          serviceUrl={externalService.url}
          onBack={() => setMediaMode("selector")}
          onLaunch={handleLocalScreenShare}
        />
      );
    }
    return (
      <RoomMedia
        roomId={room.id}
        user={user}
        onBack={() => setMediaMode("selector")}
        initialUrl={selectedMediaUrl}
      />
    );
  };

  const renderScreenShare = () => {
    let streamToRender: MediaStream | null = null;
    let presenterName = "";

    if (presenterId === user.id) {
      // Current user is presenting
      streamToRender = localStream;
      presenterName = "You";
    } else if (presenterId) {
      // Another user is presenting - find their stream in remoteStreams
      const presenterStream = remoteStreams.find((s) => s.userId === presenterId);
      if (presenterStream) {
        streamToRender = presenterStream.stream;
        presenterName = presenterStream.username || "Someone";
      }
    }

    return (
      <div className="absolute inset-0 bg-black flex items-center justify-center overflow-hidden">
        {streamToRender ? (
          <video
            autoPlay
            playsInline
            muted={presenterId === user.id}
            ref={(video) => {
              if (video) video.srcObject = streamToRender;
            }}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="text-white/50 flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-white/5 animate-pulse">
              <Monitor className="w-8 h-8 opacity-50" />
            </div>
            <p>
              {presenterId
                ? `${presenterName} is sharing screen...`
                : "Waiting for screen share..."}
            </p>
          </div>
        )}
      </div>
    );
  };

  const containerRef = React.useRef<HTMLDivElement>(null);

  // Layout Lock: Force the body to be fixed to prevent any scrolling or gaps
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    const originalPos = document.body.style.position;

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    document.body.style.height = "100%";
    document.body.style.inset = "0";

    // Prevent standard scroll
    const handleScroll = () => {
      // Relaxed window scroll lock for mobile support
      // if (window.scrollY !== 0) window.scrollTo(0, 0)
      if (containerRef.current && containerRef.current.scrollTop !== 0) {
        containerRef.current.scrollTop = 0;
      }
    };

    // Prevent wheel events from propagating to window
    const handleWheel = (e: WheelEvent) => {
      if (e.target === document.body || e.target === document.documentElement) {
        e.preventDefault();
      }
    };

    // Handle visual viewport resizing (mobile keyboard etc)
    const handleVisualViewportResize = () => {
      document.body.style.height = window.visualViewport?.height + "px";
      window.scrollTo(0, 0);
    };

    window.addEventListener("scroll", handleScroll, { passive: false });
    window.addEventListener("wheel", handleWheel, { passive: false });

    // Also listen to container scroll
    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll, { passive: false });
    }

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleVisualViewportResize);
      window.visualViewport.addEventListener("scroll", handleVisualViewportResize);
    }

    return () => {
      document.body.style.overflow = originalStyle;
      document.body.style.position = originalPos;
      document.body.style.width = "";
      document.body.style.height = "";
      document.body.style.inset = "";
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("wheel", handleWheel);
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleVisualViewportResize);
        window.visualViewport.removeEventListener("scroll", handleVisualViewportResize);
      }
    };
  }, []);

  const handleEnterRoom = async (config: CameraConfig) => {
    // Store the user's camera/mic choice — this unblocks useWebRTC's startMedia
    setCameraConfig(config);
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      } else if ((document.documentElement as any).webkitRequestFullscreen) {
        await (document.documentElement as any).webkitRequestFullscreen();
      } else if ((document.documentElement as any).msRequestFullscreen) {
        await (document.documentElement as any).msRequestFullscreen();
      }
    } catch (e) {
      // Sliently fail or log debug only, as this is expected on some devices/interactions
      console.debug("Full screen request failed:", e);
      // Optional: Toast to inform user if they expected it
      // toast.error("Could not enter full screen. Browser blocked the request.");
    }

    localStorage.setItem(`seen_welcome_${room.id}`, "true");
    setShowWelcome(false);
    sounds.playJoinSound();
    if (!musicPlaying) {
      setMusicPlaying(true);
    }
  };

  const handleLeaveRoom = () => {
    sounds.playLeaveSound();
    
    // Unmount the global overlay
    endRoom();

    try {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch((err) => {
          console.warn("Could not exit full screen:", err);
        });
      }
    } catch (e) {
      console.warn("Exit full screen not supported or blocked", e);
    }
  };

  // Sync state with YouTube Player (Imperative API)
  useEffect(() => {
    if (!player || !isYouTube || typeof player.mute !== "function" || !player.getIframe()) return;
    try {
      if (musicMuted) player.mute();
      else player.unMute();
      player.setVolume(musicVolume);
    } catch (e: any) {
      if (e?.name === "AbortError" || e?.message?.includes("interrupted")) return;
      console.warn("YouTube Player error:", e);
    }
  }, [musicMuted, musicVolume, player, isYouTube]);

  useEffect(() => {
    if (!player || !isYouTube || typeof player.playVideo !== "function" || !player.getIframe())
      return;
    try {
      if (musicPlaying) player.playVideo();
      else player.pauseVideo();
    } catch (e: any) {
      if (e?.name === "AbortError" || e?.message?.includes("interrupted"))
        console.warn("YouTube Player error:", e);
    }
  }, [musicPlaying, player, isYouTube]);

  // Media State — micActive is derived from the actual audio track state.
  // (cameraActive reflects the actual live video track state, not a toggled boolean).

  // Use a ref so the mute_all channel doesn't need to re-subscribe every mic toggle.
  // Re-subscribing on every toggle creates a brief window where mute_all events are lost.
  const micActiveRef = React.useRef(micActive);
  React.useEffect(() => {
    micActiveRef.current = micActive;
  }, [micActive]);

  // Mute All Listener
  useEffect(() => {
    const channel = supabase
      .channel(`room-controls:${room.id}`)
      .on("broadcast", { event: "mute_all" }, () => {
        if (micActiveRef.current) {
          toggleMic();
          toast.info("Microphone muted by host");
        }
      })
      .on("broadcast", { event: "sync_activity" }, ({ payload }) => {
        if (!isOwner && currentRoom.permissions?.syncActivities) {
          setActivity(payload.activity);
          toast.info(`Host switched activity to ${payload.activity}`);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // isMicOn intentionally removed from deps — use isMicOnRef instead to prevent
    // channel churn on every mic toggle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.id, toggleMic, isOwner, currentRoom.permissions?.syncActivities]);

  // Broadcast Activity Change (Owner Only)
  useEffect(() => {
    if (isOwner && currentRoom.permissions?.syncActivities) {
      const channel = supabase.channel(`room-controls:${room.id}`);
      channel.send({
        type: "broadcast",
        event: "sync_activity",
        payload: { activity },
      });
    }
  }, [activity, isOwner, currentRoom.permissions?.syncActivities, room.id, supabase]);

  // Handler wrappers
  const handleToggleMic = async () => {
    const success = await toggleMic();
    if (!success) {
      toast.error("Microphone permission denied or unavailable.");
    }
  };

  const handleToggleCam = async () => {
    const success = await toggleCamera();
    if (!success) {
      toast.error("Camera permission denied or unavailable.");
    }
    // isCamOn is derived from cameraActive (real track state), no setIsCamOn needed.
  };

  // Activity Presence
  const [presenceChannel, setPresenceChannel] = useState<any>(null);
  const [activityCounts, setActivityCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const channel = supabase.channel(`room-presence:${room.id}`);
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();

        // Convert presence state to activity counts AND online users list
        const counts = new Map<string, number>();
        const onlineIds = new Set<string>();

        Object.values(state)
          .flat()
          .forEach((p: any) => {
            if (p.activity) counts.set(p.activity, (counts.get(p.activity) || 0) + 1);
            if (p.user_id) onlineIds.add(p.user_id);
          });

        setActivityCounts(Object.fromEntries(counts));
        setOnlineUserIds(Array.from(onlineIds));
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setPresenceChannel(channel);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room.id, supabase]);

  // Update Presence when Activity Changes
  useEffect(() => {
    if (presenceChannel && activity && !isGhostMode) {
      presenceChannel.track({
        user_id: user.id,
        activity: activity,
      });
    }
  }, [presenceChannel, activity, user.id, isGhostMode]);

  return (
    <ChannelSecretContext.Provider value={channelSecret}>
      <div
        ref={containerRef}
        suppressHydrationWarning
        className={cn(
          "z-50 font-sans selection:bg-zinc-800 text-zinc-50 overflow-hidden",
          isMinimized ? "w-full h-full flex flex-row items-center justify-center p-0 bg-transparent" : "absolute inset-0 top-8 flex flex-col p-4 gap-4 bg-zinc-950"
        )}
      >
        {/* Dynamic Animated Background */}
        <div className={cn("pointer-events-none absolute inset-0 overflow-hidden flex items-center justify-center", )}>
          {room.appearance?.background === "mesh" ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-zinc-900 to-indigo-900/20"
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 90, 0],
                  borderRadius: ["30%", "50%", "30%"],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute top-[10%] left-[20%] w-[40vw] h-[40vw] bg-emerald-500/10 blur-[100px]"
              />
              <motion.div
                animate={{
                  scale: [1, 1.5, 1],
                  rotate: [0, -90, 0],
                  borderRadius: ["50%", "30%", "50%"],
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute bottom-[10%] right-[20%] w-[50vw] h-[50vw] bg-indigo-500/10 blur-[120px]"
              />
            </motion.div>
          ) : (
            <>
              <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-zinc-800/10 blur-[120px] mix-blend-screen" />
              <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-zinc-800/10 blur-[140px] mix-blend-screen" />
            </>
          )}
        </div>
        {showWelcome && (
          <RoomWelcomeScreen
            roomName={room.name}
            userName={user.email?.split("@")[0] || "Guest"}
            onEnter={handleEnterRoom}
          />
        )}

        {/* Mobile Dock (Only visible on mobile) */}
        <RoomMobileDock
          activeTab={mobileTab}
          onTabChange={setMobileTab}
          isAudioEnabled={micActive}
          toggleAudio={handleToggleMic}
          isVideoEnabled={cameraActive}
          toggleVideo={handleToggleCam}
        />



        {/* Mobile Overlays (Sheet-like) */}
        {mobileTab !== "none" && (
          <div
            className={cn(
              "md:hidden fixed inset-0 z-[60] flex flex-col animate-in slide-in-from-bottom-10 duration-300",
              mobileTab === "music"
                ? "bg-black/0 pointer-events-none" // Transparent & Pass-through for music
                : "bg-black/95 backdrop-blur-2xl",
            )}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-black/80 backdrop-blur-md z-10 shrink-0 pointer-events-auto">
              <h2 className="text-lg font-bold text-white capitalize">{mobileTab}</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileTab("none")}
                className="rounded-full"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
            <div
              className={cn(
                "flex-1 overflow-hidden relative",
                mobileTab === "music" ? "p-0" : "p-4",
              )}
            >
              <div className={cn("w-full h-full flex flex-col", mobileTab !== "chat" && "hidden")}>
                <RoomChat
                  roomId={room.id}
                  welcomeMessage={room.chat_settings?.welcomeMessage}
                  slowModeSeconds={room.chat_settings?.slowModeSeconds}
                  emojiOnly={room.chat_settings?.emojiOnly}
                  blockLinks={room.chat_settings?.blockLinks}
                  huddleGroupId={huddles.active ? huddles.assignments[user.id] : undefined}
                  onMessageSent={handleUserMessage}
                />
              </div>
              {mobileTab === "people" && (
                <div className="flex flex-col h-full">
                  {/* Mobile Header Toggle */}
                  <div className="flex items-center justify-center p-2 mb-2">
                    <div className="flex items-center p-1 bg-white/10 rounded-xl border border-white/5 w-full max-w-xs">
                      <button
                        onClick={() => setMobilePeopleView("grid")}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all",
                          mobilePeopleView === "grid"
                            ? "bg-white/10 text-white shadow-sm"
                            : "text-white/50 hover:text-white",
                        )}
                      >
                        <LayoutGrid className="w-4 h-4" /> Grid
                      </button>
                      <button
                        onClick={() => setMobilePeopleView("list")}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all",
                          mobilePeopleView === "list"
                            ? "bg-white/10 text-white shadow-sm"
                            : "text-white/50 hover:text-white",
                        )}
                      >
                        <Users className="w-4 h-4" /> List
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 relative">
                    {mobilePeopleView === "grid" ? (
                      <VideoConference
                        roomId={room.id}
                        user={user}
                        localStream={localStream}
                        remoteStreams={remoteStreams}
                        peersMetadata={
                          huddles.active
                            ? Object.fromEntries(
                                Object.entries(peersMetadata).filter(
                                  ([uid]) =>
                                    huddles.assignments[uid] === huddles.assignments[user.id],
                                ),
                              )
                            : peersMetadata
                        }
                        toggleMic={handleToggleMic}
                        toggleCamera={handleToggleCam}
                        toggleScreenShare={handleLocalScreenShare}
                        permissions={room.permissions}
                        isOwner={isOwner}
                        disableVideo={personalSettings.bandwidthSaver}
                        volume={personalSettings.masterVolume / 100}
                        isMicOn={micActive}
                        isCamOn={cameraActive}
                      />
                    ) : (
                      <div className="h-full overflow-hidden bg-white/5 rounded-xl border border-white/5 mx-2 mb-2">
                        <RoomMembersList
                          roomId={room.id}
                          currentUserRole={userRole}
                          onlineUserIds={onlineUserIds}
                          isAIPresent={isAIPresent}
                          hideHeader={true}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
              {mobileTab === "activities" && (
                <div className="flex flex-col gap-4">
                  <p className="text-white/50 text-sm text-center">
                    Select an activity to launch on stage
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      className="h-24 flex flex-col gap-2 bg-white/5 border-white/10"
                      onClick={() => {
                        setActivity("media");
                        setMobileTab("none");
                      }}
                    >
                      <Monitor className="w-8 h-8 text-blue-400" /> Watch
                    </Button>

                    <Button
                      variant="outline"
                      className="h-24 flex flex-col gap-2 bg-white/5 border-white/10"
                      onClick={() => {
                        setActivity("whiteboard");
                        setMobileTab("none");
                      }}
                    >
                      <Monitor className="w-8 h-8 text-yellow-400" /> Whiteboard
                    </Button>
                    <Button
                      variant="outline"
                      className="h-24 flex flex-col gap-2 bg-white/5 border-white/10"
                      onClick={() => {
                        setActivity("notes");
                        setMobileTab("none");
                      }}
                    >
                      <Monitor className="w-8 h-8 text-cyan-400" /> Notes
                    </Button>
                    <Button
                      variant="outline"
                      className="h-24 flex flex-col gap-2 bg-white/5 border-white/10"
                      onClick={() => {
                        setActivity("games");
                        setMobileTab("none");
                      }}
                    >
                      <Monitor className="w-8 h-8 text-purple-400" /> Games
                    </Button>
                    <Button
                      variant="outline"
                      className="h-24 flex flex-col gap-2 bg-white/5 border-white/10"
                      onClick={() => {
                        setActivity("tasks");
                        setMobileTab("none");
                      }}
                    >
                      <Check className="w-8 h-8 text-emerald-400" /> Tasks
                    </Button>
                    {!room.is_public && (
                    <Button
                      variant="outline"
                      className="h-24 flex flex-col gap-2 bg-white/5 border-white/10"
                      onClick={() => {
                        setActivity("virtual_tv");
                        setMobileTab("none");
                      }}
                    >
                      <Tv className="w-8 h-8 text-indigo-400" /> Virtual TV
                    </Button>
                  )}
                  </div>
                </div>
              )}
              <div className={cn("w-full h-full flex flex-col", mobileTab !== "ai" && "hidden")}>
                <RoomAIChat
                  roomId={room.id}
                  roomName={room.name}
                  roomDescription={room.description}
                  currentActivity={activity}
                  onCommand={handleAICommand}
                />
              </div>
              {mobileTab === "menu" && (
                <div className="flex flex-col gap-6 p-2">
                  {/* Room Info Card */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Room Details
                    </h3>

                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">{room.name}</span>
                      <ActiveRoomTimer createdAt={room.created_at} />
                    </div>

                    {room.code && (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-black/40 rounded-lg border border-white/5 px-3 py-2 font-mono text-sm text-center tracking-widest text-white/90">
                          {room.code}
                        </div>
                        <Button
                          size="icon"
                          variant="secondary"
                          onClick={copyCode}
                          className="shrink-0 bg-white/10 hover:bg-white/20 border-0"
                        >
                          {copied ? (
                            <Check className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Controls Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="h-14 bg-white/5 border-white/10 hover:bg-white/10 flex flex-col gap-1"
                      onClick={handleTriggerConfetti}
                    >
                      <PartyPopper className="w-5 h-5 text-pink-500" />
                      <span className="text-xs">Confetti</span>
                    </Button>

                    <Button
                      variant="outline"
                      className={cn(
                        "h-14 bg-white/5 border-white/10 hover:bg-white/10 flex flex-col gap-1",
                        !showReactions && "opacity-50",
                      )}
                      onClick={() => setShowReactions(!showReactions)}
                    >
                      <Smile className="w-5 h-5 text-yellow-500" />
                      <span className="text-xs">{showReactions ? "Hide" : "Show"} Reactions</span>
                    </Button>

                    <div className="col-span-2">
                      {/* We render the settings dialog trigger button manually to style it */}
                      <RoomSettingsDialog
                        room={currentRoom}
                        userRole={userRole}
                        personalSettings={personalSettings}
                        onUpdatePersonalSettings={updatePersonalSettings}
                      >
                        <Button
                          variant="outline"
                          className="w-full h-14 bg-white/5 border-white/10 hover:bg-white/10 flex items-center justify-center gap-2"
                        >
                          <Settings className="w-5 h-5" />
                          Room Settings
                        </Button>
                      </RoomSettingsDialog>
                    </div>
                  </div>

                  {/* Reload Room */}
                  <Button
                    variant="outline"
                    className="w-full mt-3 h-14 bg-white/5 border-white/10 hover:bg-white/10 flex items-center justify-center gap-2"
                    onClick={() => window.location.reload()}
                  >
                    <RefreshCw className="w-5 h-5" />
                    Reload Room
                  </Button>

                  {/* Leave Option */}
                  <Button variant="destructive" className="w-full mt-auto mb-4" asChild>
                    <Link to="/dashboard/rooms" onClick={handleLeaveRoom}>
                      <PhoneOff className="w-4 h-4 mr-2" /> Leave Room
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Background Layer */}
        <div className="fixed inset-0 pointer-events-none z-[0] overflow-hidden bg-aether-background">
          <div className="absolute top-1/4 left-1/4 w-[50vw] h-[50vw] bg-aether-tertiary-container/5 rounded-full blur-[100px] mix-blend-screen"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[40vw] h-[40vw] bg-aether-primary/5 rounded-full blur-[120px] mix-blend-screen"></div>
        </div>

        {/* Hidden Player 2: Universal Fallback (SoundCloud, Twitch, etc.) */}
        {currentStationIndex >= 0 && !isSpotify && !isYouTube && (
          <div className="fixed top-0 left-[-9999px] w-10 h-10 opacity-0 pointer-events-none">
            <ReactPlayer
              url={playlist[currentStationIndex]?.url || ""}
              playing={musicPlaying && !showWelcome}
              volume={musicVolume / 100}
              muted={musicMuted}
              width="100%"
              height="100%"
              onStart={() => console.log("Universal Player Started")}
              onError={(e: any) => {
                if (e?.name === "AbortError" || e?.message?.includes("interrupted")) return;
                console.error("Universal Player Error", e);
              }}
            />
          </div>
        )}

        {!isMinimized && !personalSettings.hideReactions && <RoomReactionOverlay reactions={reactions} />}

        {/* Mobile Header (Minimal) */}
        <header className="md:hidden flex-none h-14 w-full flex items-center justify-between px-4 z-40 relative bg-gradient-to-b from-black/80 to-transparent" style={{ display: isMinimized ? 'none' : undefined }}>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/rooms"
              className="p-2 bg-white/10 rounded-full backdrop-blur-md"
              onClick={handleLeaveRoom}
            >
              <PhoneOff className="w-4 h-4 text-white" />
            </Link>
            <h1 className="text-sm font-bold text-white shadow-black drop-shadow-md">
              {room.name}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 bg-white/10 rounded-full backdrop-blur-md border border-white/5 text-[10px] uppercase font-bold tracking-widest text-white/80">
              {activity}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileTab("menu")}
              className="text-white hover:bg-white/10 rounded-full"
            >
              <MoreVertical className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Header */}
        <header
          className={cn(
            "relative w-full shrink-0 h-16 z-50 hidden md:flex items-center justify-between px-6 transition-transform duration-300",
            "bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 shadow-lg",
            (isFocusMode || (activity === "games" && activeGame)) && "hidden"
          )}
          style={{ display: isMinimized ? 'none' : undefined }}
        >
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-bold font-heading tracking-tight flex items-center gap-2 text-white/90">
              {room.name}
            </h1>
            <ActiveRoomTimer createdAt={room.created_at} />
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "text-muted-foreground hover:text-white",
                !showReactions && "opacity-50",
              )}
              onClick={() => setShowReactions(!showReactions)}
              title={showReactions ? "Hide Reactions" : "Show Reactions"}
            >
              <Smile className="w-5 h-5" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full bg-gradient-to-r from-pink-500/10 to-violet-500/10 border-white/10 hover:border-white/20 text-white/80 hover:text-white hidden sm:flex"
              onClick={handleTriggerConfetti}
            >
              <PartyPopper className="w-4 h-4 mr-2 text-pink-500" />
              Fun
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full bg-gradient-to-r from-pink-500/10 to-violet-500/10 border-white/10 hover:border-white/20 text-white/80 hover:text-white sm:hidden p-2 h-auto"
              onClick={handleTriggerConfetti}
            >
              <PartyPopper className="w-4 h-4 text-pink-500" />
            </Button>

            {isOwner && (
              <Button
                size="sm"
                variant={huddles.active ? "default" : "outline"}
                className={cn(
                  "rounded-full border-white/10 text-white hidden sm:flex",
                  huddles.active
                    ? "bg-emerald-500 hover:bg-emerald-600"
                    : "bg-white/5 hover:bg-white/10",
                )}
                onClick={toggleHuddles}
              >
                <Users className="w-4 h-4 mr-2" />
                {huddles.active ? "End Huddles" : "Start Huddles"}
              </Button>
            )}

            {room.code && (
              <button
                onClick={copyCode}
                suppressHydrationWarning={true}
                className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all text-xs font-mono text-muted-foreground hover:text-white hidden sm:flex"
              >
                <span className="tracking-widest text-white font-bold">{room.code}</span>
                {copied ? (
                  <Check className="w-3 h-3 text-emerald-500" />
                ) : (
                  <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-white"
              onClick={() => { minimizeRoom(); router.push('/dashboard/rooms'); }}
              title="Minimize to PiP"
            >
              <Minimize2 className="w-5 h-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-white"
              onClick={() => setIsDockVisible(!isDockVisible)}
              title={isDockVisible ? "Hide Dock" : "Show Dock"}
            >
              {isDockVisible ? (
                <PanelBottom className="w-5 h-5" />
              ) : (
                <LayoutGrid className="w-5 h-5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-white"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
            >
              {isSidebarOpen ? (
                <PanelRightClose className="w-5 h-5" />
              ) : (
                <PanelRightOpen className="w-5 h-5" />
              )}
            </Button>

            <RoomSettingsDialog
              room={currentRoom}
              userRole={userRole}
              personalSettings={personalSettings}
              onUpdatePersonalSettings={updatePersonalSettings}
              userRegion={userRegion}
              onRefreshRegion={() => detectRegion(true)}
            />
            
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-white"
              onClick={() => window.location.reload()}
              title="Reload Room"
            >
              <RefreshCw className="w-5 h-5" />
            </Button>

            <Button
              variant="secondary"
              size="sm"
              className="rounded-full px-5 bg-white/10 hover:bg-white/20 text-white border-0 shadow-none backdrop-blur-md"
              asChild
            >
              <Link to="/dashboard/rooms" onClick={handleLeaveRoom}>
                <PhoneOff className="w-4 h-4 mr-2 opacity-70" /> Leave
              </Link>
            </Button>
          </div>
        </header>


        {/* Main Body - Grid Layout Fix */}
        <motion.main
          layout
          animate={{ scale: 1, rotate: 0, opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.3 }}
          className={cn(
            "relative flex-1 flex w-full overflow-hidden min-h-0 z-10 transition-all duration-300",
            isFocusMode || isMinimized ? "pb-0" : (isDockVisible ? "pb-[88px]" : "pb-0")
            
          )}
          style={{ display: isMinimized ? 'none' : undefined }}
        >
          {/* Left Content Stage */}
          <div className="flex-1 flex flex-col min-w-0 bg-black/40 backdrop-blur-xl border border-white/10 relative rounded-2xl overflow-hidden h-full shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            {/* Toolbar */}
            <div className="flex-1 overflow-hidden relative group/stage bg-black/20">
              {/* Persistent Audio Renderer - Ensures audio works even if sidebar is closed */}
              <RoomAudioRenderer
                remoteStreams={remoteStreams}
                volume={personalSettings.masterVolume / 100}
              />

              <div className="w-full h-full relative overflow-hidden">
                {huddles.active && (
                  <div className="absolute top-4 left-4 z-50 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold tracking-widest backdrop-blur-md animate-pulse">
                    HUDDLE GROUP {huddles.assignments[user.id] || 1}
                  </div>
                )}
                {/* Persistent YouTube Music Player (Visual & Audio) */}
                <div
                  className={cn(
                    "transition-all duration-500",
                    activity === "music" || mobileTab === "music"
                      ? "absolute inset-0 z-0 pointer-events-auto"
                      : "absolute top-0 left-[-9999px] w-1 h-1 opacity-0 pointer-events-none invisible",
                  )}
                >
                  <webview
                    src="https://music.youtube.com"
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                    useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                    allowpopups="true"
                    ref={(webview: any) => {
                      if (webview && !webview.hasAdblocker) {
                        webview.hasAdblocker = true;
                        webview.addEventListener('dom-ready', () => {
                          webview.insertCSS(`
                            ytmusic-mealbar-promo-renderer,
                            ytmusic-popup-container,
                            .ytp-ad-module,
                            .video-ads {
                              display: none !important;
                            }
                          `);
                          webview.executeJavaScript(`
                            setInterval(() => {
                              const skipBtn = document.querySelector('.ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-skip-ad-button');
                              if (skipBtn) skipBtn.click();
                              const adVideo = document.querySelector('.ad-showing video');
                              if (adVideo && adVideo.duration) adVideo.currentTime = adVideo.duration;
                            }, 500);
                          `);
                        });
                      }
                    }}
                  />
                </div>

                {(() => {
                  const displayActivity = (isMinimized && activity === "home") ? "conference" : activity;
                  return (
                    <AnimatePresence mode="wait">
                      {displayActivity === "home" ? (
                        <RoomHomeOverlay
                          key="home"
                          onSelectActivity={(act) => {
                            if (act === "screen_share") {
                              setIsScreenSharePickerOpen(true);
                            } else {
                              setActivity(act);
                            }
                          }}
                          userName={user?.name}
                          isRoomPublic={room.is_public}
                          onOpenPolls={() => {
                            setIsPollsOpen(true);
                            setHasUnreadPoll(false);
                          }}
                          hasUnreadPolls={hasUnreadPoll}
                        />
                      ) : (
                        <motion.div
                          key={displayActivity}
                          initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                          exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
                          className={cn(
                            "absolute inset-0 w-full h-full flex flex-col items-center justify-center",
                            displayActivity === "music" && "pointer-events-none",
                          )}
                        >
                          {displayActivity === "media" && mobileTab !== "music" && renderMediaContent()}

                          {/* Conference / Video Grid View */}
                          {displayActivity === "conference" && (
                            <div className="w-full h-full flex items-center justify-center p-4">
                              <VideoConference
                            roomId={room.id}
                            user={user}
                            localStream={localStream}
                            remoteStreams={remoteStreams}
                            peersMetadata={
                              huddles.active
                                ? Object.fromEntries(
                                    Object.entries(peersMetadata).filter(
                                      ([uid]) =>
                                        huddles.assignments[uid] === huddles.assignments[user.id],
                                    ),
                                  )
                                : peersMetadata
                            }
                            toggleMic={handleToggleMic}
                            toggleCamera={handleToggleCam}
                            toggleScreenShare={handleLocalScreenShare}
                            permissions={room.permissions}
                            isOwner={isOwner}
                            disableVideo={personalSettings.bandwidthSaver}
                            volume={personalSettings.masterVolume / 100}
                            isMicOn={micActive}
                            isCamOn={cameraActive}
                          />
                        </div>
                      )}

                      {displayActivity === "screen_share" && renderScreenShare()}
                      {displayActivity === "whiteboard" && (
                        <RoomWhiteboard
                          roomId={room.id}
                          user={user}
                          onBack={() => setActivity("media")}
                        />
                      )}
                      {displayActivity === "notes" && <RoomNotes roomId={room.id} user={user} />}
                      {/* {displayActivity === 'timer' && <RoomTimer roomId={room.id} user={user} />} */}
                      {displayActivity === "games" && (
                        <GameCenter
                          roomId={room.id}
                          user={user}
                          activeGame={activeGame}
                          onGameChangeAction={setActiveGame}
                        />
                      )}
                      {displayActivity === "tasks" && <RoomTaskBoard roomId={room.id} user={user} />}
                      {displayActivity === "virtual_tv" && !room.is_public && (
                        <VirtualTV
                          currentChannelUrl={virtualTVChannel}
                          onChannelSelect={handleVirtualTVChannelSelect}
                          isOwner={isOwner}
                          userRegion={userRegion}
                          onExit={() => setActivity("media")}
                        />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
                );
              })()}

                {/* Bottom Center Floating Reactions Bar */}
                {showReactions && !personalSettings.hideReactions && (
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2 shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-5 fade-in duration-500">
                    <RoomReactionBar onReaction={broadcastReaction} />
                  </div>
                )}

                {/* Exit Focus Button */}
                {isFocusMode && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsFocusMode(false)}
                    className="absolute top-4 right-4 z-50 bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10"
                  >
                    <Minimize2 className="w-4 h-4 mr-2" /> Exit Focus
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* PiP Mode Overlay Controls */}
          {isMinimized && (
            <div className="flex-1 flex items-center justify-center gap-1.5 z-[60] bg-transparent opacity-100 w-full">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleMic}
                className={cn("w-9 h-9 rounded-full", micActive ? "text-white hover:bg-white/10" : "text-red-400 bg-red-500/20 hover:bg-red-500/30")}
              >
                {micActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleCam}
                className={cn("w-9 h-9 rounded-full", cameraActive ? "text-white hover:bg-white/10" : "text-red-400 bg-red-500/20 hover:bg-red-500/30")}
              >
                {cameraActive ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </Button>
            </div>
          )}

          {/* Right Sidebar - Floating Strip + Collapsable Panel */}

          {/* Floating People Overlay (Replaces Sidebar View) */}
          {isPeopleOverlayOpen && !isFocusMode && (
            <div className="absolute right-4 top-24 bottom-24 w-[320px] z-[60] flex flex-col animate-in fade-in slide-in-from-right-10 duration-500 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between shrink-0">
                <h2 className="text-lg font-medium text-white">People</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsPeopleOverlayOpen(false)}
                  className="h-8 w-8 text-white/50 hover:text-white rounded-full hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-hidden relative">
                <RoomMembersList
                  roomId={room.id}
                  currentUserRole={userRole}
                  onlineUserIds={onlineUserIds}
                  isAIPresent={isAIPresent}
                  isGridView={activity === "conference"}
                  onSwitchToGrid={() => {
                    setActivity("conference");
                    // In floating mode, we just switch the main stage
                  }}
                  onSwitchToList={() => {
                    if (activity === "conference") setActivity("home");
                  }}
                />
              </div>
            </div>
          )}

          {/* Floating Participants Strip (Summary View) - Hide if overlay is open or minimized */}
          {!isSidebarOpen && !isFocusMode && !isPeopleOverlayOpen && !isMinimized && (
            <div className="hidden md:flex flex-col items-center absolute right-4 top-1/2 -translate-y-1/2 z-[60] animate-in fade-in slide-in-from-right-10 duration-500">
              <ParticipantsStrip
                localStream={localStream}
                remoteStreams={remoteStreams}
                peersMetadata={peersMetadata}
                user={user}
                onExpand={() => {
                  setIsPeopleOverlayOpen(true);
                }}
                isMicOn={micActive}
                isCamOn={cameraActive}
              />

              {/* Quick Media Toggles (visible when dock is visible) */}
              <AnimatePresence>
                {isDockVisible && (
                  <motion.div
                    className="flex flex-col gap-2 p-2 mt-4 bg-[#0d0d10]/80 border border-white/[0.08] backdrop-blur-xl rounded-full shadow-lg"
                    initial={{ opacity: 0, scale: 0.8, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: -10 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={handleToggleMic}
                            suppressHydrationWarning
                            className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                              micActive
                                ? "bg-white/[0.06] text-white/80 hover:bg-white/[0.1] hover:text-white"
                                : "bg-red-500/20 text-red-400 hover:bg-red-500/30",
                            )}
                          >
                            {micActive ? (
                              <Mic className="w-4 h-4" />
                            ) : (
                              <MicOff className="w-4 h-4" />
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="text-xs rounded-lg">
                          {micActive ? "Turn off mic" : "Turn on mic"}
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={handleToggleCam}
                            suppressHydrationWarning
                            className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                              cameraActive
                                ? "bg-white/[0.06] text-white/80 hover:bg-white/[0.1] hover:text-white"
                                : "bg-red-500/20 text-red-400 hover:bg-red-500/30",
                            )}
                          >
                            {cameraActive ? (
                              <Video className="w-4 h-4" />
                            ) : (
                              <VideoOff className="w-4 h-4" />
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="text-xs rounded-lg">
                          {cameraActive ? "Turn off camera" : "Turn on camera"}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <motion.aside
            layout
            className={cn(
              "hidden md:flex flex-col shrink-0 transition-all duration-300 ease-in-out z-40 relative h-full rounded-2xl backdrop-blur-3xl bg-black/40 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden",
              isFocusMode || !isSidebarOpen || isMinimized
                ? "w-0 opacity-0 border-0 ml-0"
                : "w-[360px] opacity-100 ml-4"
            )}
            style={{ display: isMinimized ? 'none' : undefined }}
          >
            {/* Mobile Close Handle (only visible on mobile) */}
            <div className="md:hidden flex items-center justify-center p-2 border-b border-white/5">
              <div className="w-12 h-1.5 rounded-full bg-white/20" />
            </div>

            <div className="h-4" />

            <div className="flex-1 overflow-hidden relative">
              <div className={cn("w-full h-full flex flex-col", sidebarView !== "chat" && "hidden")}>
                <RoomChat
                  roomId={room.id}
                  user={user}
                  welcomeMessage={room.chat_settings?.welcomeMessage}
                  slowModeSeconds={room.chat_settings?.slowModeSeconds}
                  emojiOnly={room.chat_settings?.emojiOnly}
                  blockLinks={room.chat_settings?.blockLinks}
                  isActive={isSidebarOpen && sidebarView === "chat"}
                  onMessageSent={handleUserMessage}
                />
              </div>
              {sidebarView === "participants" && !hideParticipants && (
                <div className="flex-1 flex items-center justify-center text-white/50 text-sm">
                  {/* Deprecated Sidebar View - now handled by Floating Overlay */}
                  <p>Moved to People Overlay</p>
                </div>
              )}
              <div className={cn("w-full h-full flex flex-col", sidebarView !== "ai" && "hidden")}>
                <RoomAIChat
                  roomId={room.id}
                  roomName={room.name}
                  roomDescription={room.description}
                  currentActivity={activity}
                  onCommand={handleAICommand}
                  aiSettings={room.chat_settings?.aiSettings}
                  userRole={isOwner ? "owner" : "member"}
                  isActive={isSidebarOpen && sidebarView === "ai"}
                />
              </div>
              {/* Music Sidebar View Removed */}
            </div>
          </motion.aside>
        </motion.main>
            {/* Toolbar - Unified Navigation Container */}
            <div
              className={cn(
                "hidden md:flex fixed bottom-4 inset-x-4 z-50 h-[72px] items-center justify-between transition-all duration-300 pointer-events-none rounded-2xl",
                isDockVisible ? "bg-black/40 backdrop-blur-xl border border-white/10" : "bg-transparent border-transparent"
              )}
            >
              {/* Left Spacer */}
              <div className="flex-1" />

              {/* Center Dock */}
              <div
                className={cn(
                  "flex items-center justify-center gap-3 transition-all duration-300 pointer-events-auto",
                  (isFocusMode || (activity === "games" && activeGame) || !isDockVisible || isMinimized) &&
                    "opacity-0 pointer-events-none translate-y-24",
                )}
              >
                <RoomNavigation
                  currentActivity={activity}
                  onActivityChange={setActivity}
                  activeSidebar={isPeopleOverlayOpen ? "participants" : (sidebarView as SidebarType)}
                  onSidebarChange={(id) => {
                    if (id === "participants") {
                      setIsPeopleOverlayOpen(!isPeopleOverlayOpen);
                    } else {
                      if (id !== "none") setSidebarView(id as "chat" | "participants" | "ai");
                    }
                  }}
                  isSidebarOpen={isSidebarOpen}
                  onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                  activityCounts={activityCounts}
                  isRoomPublic={room.is_public}
                  hasUnreadPolls={hasUnreadPoll}
                />

                <div className="flex items-center gap-1 px-2 py-1.5 border rounded-2xl backdrop-blur-2xl bg-[#111111]/80 border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                  {/* Polls Button (Desktop) */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsPollsOpen(true);
                      setHasUnreadPoll(false);
                    }}
                    className="text-white/50 hover:text-white hover:bg-white/10 rounded-xl w-10 h-9 p-0 flex items-center justify-center transition-colors relative"
                    title="Polls"
                  >
                    <div className="relative">
                      <BarChart2 className="w-5 h-5" />
                      {hasUnreadPoll && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-zinc-900 shadow-[0_0_10px_rgba(239,68,68,0.6)]" />
                      )}
                    </div>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsFocusMode(!isFocusMode)}
                    className="text-white/50 hover:text-white hover:bg-white/10 rounded-xl w-10 h-9 p-0 flex items-center justify-center transition-colors"
                    title="Focus Mode"
                  >
                    <Maximize2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Right Quick Chat */}
              <div 
                className={cn(
                  "flex-1 flex justify-end transition-all duration-300 pointer-events-auto",
                  (isFocusMode || isMinimized) && "opacity-0 pointer-events-none translate-y-24"
                )}
              >
                <QuickChatBar
                  roomId={room.id}
                  user={user}
                  channelSecret={channelSecret}
                  roomName={room.name}
                  roomDescription={room.description || ""}
                  currentActivity={activity}
                  onMessageSent={handleUserMessage}
                />
              </div>
            </div>

        {/* Debug Overlay */}
        {showDebug && (
          <div className="absolute bottom-4 left-4 z-50 p-4 bg-black/90 border border-white/10 text-xs font-mono text-green-400 rounded-lg shadow-2xl max-w-sm max-h-[300px] overflow-y-auto">
            <div className="flex justify-between items-center mb-2 border-b border-green-900/50 pb-2">
              <span className="font-bold">WebRTC Debug ({user?.id?.slice(0, 8)})</span>
              <button
                onClick={() => setShowDebug(false)}
                className="text-red-400 hover:text-red-300 text-lg px-2"
              >
                ×
              </button>
            </div>
            <div className="mb-2">Local Stream: {localStream?.id ? "Active" : "None"}</div>
            <div className="mb-2">Remote Streams: {remoteStreams.length}</div>
            <div className="border-t border-green-900/50 my-2 pt-2">
              {debugInfo?.peers.map((p) => (
                <div key={p.userId} className="mb-1">
                  Peer: {p.userId.slice(0, 8)}
                  <br />
                  ICE: {p.ice}, Sig: {p.signaling}
                  <br />
                  Dir: {p.direction}
                  <br />
                  Audio Rx: {p.audioRx ? "Yes" : "No"}, En: {p.audioEnabled ? "T" : "F"}
                </div>
              ))}
              {debugInfo?.peers.length === 0 && <div>No Peers</div>}
            </div>
            <div className="border-t border-green-900/50 my-2 pt-2 opacity-50">
              {debugInfo?.logs.map((l, i) => (
                <div key={i}>{l}</div>
              ))}
            </div>
          </div>
        )}
        {/* Polls Overlay */}
        {!isMinimized && (
          <RoomPolls
            roomId={room.id}
            user={user}
            isOpen={isPollsOpen}
            onClose={() => setIsPollsOpen(false)}
            onNewPollEvent={(poll) => {
              if (poll.isImportant) {
                setIsPollsOpen(true);
                setHasUnreadPoll(false);
              } else if (!isPollsOpen) {
                setHasUnreadPoll(true);
              }
            }}
          />
        )}
      </div>
    
      {/* Screen Share Source Picker */}
      {!isMinimized && (
        <ScreenSharePicker
          open={isScreenSharePickerOpen}
          onClose={() => setIsScreenSharePickerOpen(false)}
          onSelect={async (sourceId) => {
            await handleLocalScreenShare(sourceId)
            setActivity('screen_share')
          }}
        />
      )}

    </ChannelSecretContext.Provider>
  );
}
