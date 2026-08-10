/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { createClient } from "@/lib/supabase/client";
import {
  getMessages,
  sendMessage,
  deleteMessage,
  editMessage,
  fetchLinkMetadata,
  uploadAudio,
  uploadImage,
} from "./actions";
import { initiateCall } from "../friends/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  User,
  Pencil,
  Trash2,
  Phone,
  Video,
  Info,
  Smile,
  Plus,
  Gift,
  Film,
  CornerUpLeft,
  SmilePlus,
  Mic,
  Square,
  Code,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { useTheme } from "next-themes";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { GiphyFetch } from "@giphy/js-fetch-api";
import { Grid } from "@giphy/react-components";

const gf = new GiphyFetch(import.meta.env.VITE_GIPHY_API_KEY || "");

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  updated_at?: string;
  is_edited?: boolean;
};

type MessageMetadata = {
  replyToId?: string;
  reactions?: Record<string, string[]>;
  linkPreview?: {
    title: string;
    description?: string;
    image: string | null;
    url: string;
  };
};

const parseMessageContent = (content: string): { text: string; metadata: MessageMetadata } => {
  const match = content.match(/^\[METADATA\]([\s\S]*?)\[\/METADATA\]([\s\S]*)$/);
  if (match) {
    try {
      return { metadata: JSON.parse(match[1]), text: match[2] };
    } catch {
      return { metadata: {}, text: content };
    }
  }
  return { metadata: {}, text: content };
};

const buildMessageContent = (text: string, metadata: MessageMetadata): string => {
  if (Object.keys(metadata).length === 0) return text;
  return `[METADATA]${JSON.stringify(metadata)}[/METADATA]${text}`;
};

export function ChatInterface({ currentUser, otherUser }: { currentUser: any; otherUser: any }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [gifSearch, setGifSearch] = useState("");
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  // Voice Memo State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const supabase = createClient();
  const navigate = useNavigate();

  // "Conversation Info" Panel Toggle
  const [showInfo, setShowInfo] = useState(false);
  const { theme } = useTheme();

  const handleTyping = () => {
    if (!channelRef.current) return;

    channelRef.current.track({ typing: true });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      if (channelRef.current) channelRef.current.track({ typing: false });
    }, 2000);
  };

  const handleEmojiClick = (emojiObj: any) => {
    setInput((prev) => prev + emojiObj.emoji);
  };

  const handleSendGift = async (gift: string) => {
    const tempId = crypto.randomUUID();
    const content = `[GIFT:${gift}]`;
    const tempMessage: Message = {
      id: tempId,
      sender_id: currentUser.id,
      receiver_id: otherUser.id,
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMessage]);

    const formData = new FormData();
    formData.append("id", tempId);
    formData.append("receiverId", otherUser.id);
    formData.append("content", content);

    const res = await sendMessage(formData);
    if (res.error) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      toast.error("Failed to send gift");
    }
  };



  const handleShareImage = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    
    fileInput.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      if (file.size > 200 * 1024) {
        toast.error("Large uploads (>200KB) are only available for premium users (Coming Soon!)");
        return;
      }

      const tempId = crypto.randomUUID();
      const content = `![Image](loading)`;
      
      const tempMessage: Message = {
        id: tempId,
        sender_id: currentUser.id,
        receiver_id: otherUser.id,
        content,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempMessage]);

      const formData = new FormData();
      formData.append("file", file);
      
      const uploadRes = await uploadImage(formData);
      if (uploadRes.error) {
        setMessages((prev) => prev.filter(m => m.id !== tempId));
        toast.error(uploadRes.error);
        return;
      }

      const finalContent = `![Image](${uploadRes.url})`;
      setMessages((prev) => prev.map(m => m.id === tempId ? { ...m, content: finalContent } : m));

      const sendFormData = new FormData();
      sendFormData.append("id", tempId);
      sendFormData.append("receiverId", otherUser.id);
      sendFormData.append("content", finalContent);
      await sendMessage(sendFormData);
    };
    
    fileInput.click();
  };

  const handleStartCall = async (type: "video" | "voice") => {
    // 1. Send system message
    const formData = new FormData();
    formData.append("content", `📞 Started a ${type} call`);
    await sendMessage(formData);

    // 2. Signal the call
    const res = await initiateCall(otherUser.id, type);
    if (res.error) {
      toast.error("Could not start call");
      return;
    }

    // 3. Navigate to call
    navigate(`/dashboard/messages?username=${otherUser.username}&call=${type}`);
  };

  // Fetch messages
  useEffect(() => {
    const loadMessages = async () => {
      const msgs = await getMessages(otherUser.id);
      setMessages(msgs || []);
      
      // Backfill missing link previews for pre-uploaded links
      if (msgs && msgs.length > 0) {
        msgs.forEach(async (msg: Message) => {
          const { text, metadata } = parseMessageContent(msg.content);
          if (!metadata.linkPreview) {
            const urlMatch = text.match(/(https?:\/\/[^\s]+)/);
            if (urlMatch) {
              const preview = await fetchLinkMetadata(urlMatch[0]);
              if (preview) {
                 const newMetadata = { ...metadata, linkPreview: preview };
                 const newContent = buildMessageContent(text, newMetadata);
                 setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, content: newContent } : m));
                 editMessage(msg.id, newContent);
              }
            }
          }
        });
      }
    };
    loadMessages();
  }, [otherUser.id]);

  const handleRealtimeEvent = useCallback(
    (payload: any) => {
      // INSERT
      if (payload.eventType === "INSERT") {
        const newMsg = payload.new as Message;
        if (
          (newMsg.sender_id === otherUser.id && newMsg.receiver_id === currentUser.id) ||
          (newMsg.sender_id === currentUser.id && newMsg.receiver_id === otherUser.id)
        ) {
          setMessages((prev) => {
            if (prev.find((m) => m.id === newMsg.id)) return prev;

            // Deduplicate optimistic messages if the server assigned a different ID
            const optimisticMatch = prev.find(
              (m) =>
                m.sender_id === newMsg.sender_id &&
                m.content === newMsg.content &&
                Math.abs(new Date(newMsg.created_at).getTime() - new Date(m.created_at).getTime()) <
                  5000,
            );

            if (optimisticMatch) {
              return prev.map((m) => (m.id === optimisticMatch.id ? newMsg : m));
            }

            return [...prev, newMsg];
          });
        }
      }
      // DELETE
      if (payload.eventType === "DELETE") {
        setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
      }
      // UPDATE
      if (payload.eventType === "UPDATE") {
        setMessages((prev) =>
          prev.map((m) => (m.id === payload.new.id ? { ...m, ...payload.new } : m)),
        );
      }
    },
    [currentUser.id, otherUser.id],
  );

  // Subscribe to realtime messages and presence
  useEffect(() => {
    const channel = supabase.channel(`chat_${currentUser.id}_${otherUser.id}`, {
      config: { presence: { key: currentUser.id } },
    });
    channelRef.current = channel;

    channel
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "direct_messages",
          filter: `receiver_id=in.(${currentUser.id},${otherUser.id})`,
        },
        (payload) => {
          handleRealtimeEvent(payload);
        },
      )
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const otherUserPresence = state[otherUser.id] as any[];
        if (otherUserPresence && otherUserPresence.length > 0) {
          setIsTyping(otherUserPresence[0].typing || false);
        } else {
          setIsTyping(false);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser.id, otherUser.id, supabase, handleRealtimeEvent]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, editingId]);

  const handleSend = async (e?: React.FormEvent, customContent?: string) => {
    if (e) e.preventDefault();
    const finalInput = customContent || input;
    if (!finalInput.trim()) return;

    const tempId = crypto.randomUUID();
    const metadata: MessageMetadata = {};
    if (replyingTo) metadata.replyToId = replyingTo.id;

    const urlMatch = finalInput.match(/(https?:\/\/[^\s]+)/);

    let content = buildMessageContent(finalInput, metadata);

    const tempMessage: Message = {
      id: tempId,
      sender_id: currentUser.id,
      receiver_id: otherUser.id,
      content,
      created_at: new Date().toISOString(),
    };

    // Optimistic update
    setMessages((prev) => [...prev, tempMessage]);
    setInput("");
    setReplyingTo(null);

    // Fetch link metadata asynchronously if URL exists
    if (urlMatch) {
      fetchLinkMetadata(urlMatch[0]).then((preview) => {
        if (preview) {
          metadata.linkPreview = preview;
          content = buildMessageContent(finalInput, metadata);
          setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, content } : m)));

          // Send updated content to backend immediately
          const updateData = new FormData();
          updateData.append("id", tempId);
          updateData.append("receiverId", otherUser.id);
          updateData.append("content", content);
          sendMessage(updateData);
        }
      });
    }

    const formData = new FormData();
    formData.append("id", tempId);
    formData.append("receiverId", otherUser.id);
    formData.append("content", content);

    const res = await sendMessage(formData);
    if (res.error) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      console.error(res.error);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());

        // Optimistic UI for Audio
        const tempId = crypto.randomUUID();
        const tempMessage: Message = {
          id: tempId,
          sender_id: currentUser.id,
          receiver_id: otherUser.id,
          content: `![AUDIO](loading)`,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, tempMessage]);

        const formData = new FormData();
        formData.append("file", audioBlob);
        const uploadRes = await uploadAudio(formData);

        if (uploadRes.error) {
          setMessages((prev) => prev.filter((m) => m.id !== tempId));
          toast.error("Failed to upload audio");
          return;
        }

        const finalContent = buildMessageContent(
          `![AUDIO](${uploadRes.url})`,
          replyingTo ? { replyToId: replyingTo.id } : {},
        );
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, content: finalContent } : m)),
        );

        const sendFormData = new FormData();
        sendFormData.append("id", tempId);
        sendFormData.append("receiverId", otherUser.id);
        sendFormData.append("content", finalContent);

        await sendMessage(sendFormData);
        setReplyingTo(null);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    } catch (error) {
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const handleDelete = async (messageId: string) => {
    // Optimistic delete
    const previousMessages = [...messages];
    setMessages((prev) => prev.filter((m) => m.id !== messageId));

    const res = await deleteMessage(messageId);
    if (res.error) {
      setMessages(previousMessages);
      toast.error("Failed to delete");
    }
  };

  const startEdit = (msg: Message) => {
    setEditingId(msg.id);
    setEditContent(parseMessageContent(msg.content).text);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  const saveEdit = async () => {
    if (!editingId || !editContent.trim()) return;

    const msgToEdit = messages.find((m) => m.id === editingId);
    if (!msgToEdit) return;

    const parsed = parseMessageContent(msgToEdit.content);
    const newContent = buildMessageContent(editContent, parsed.metadata);

    // Optimistic update
    const previousMessages = [...messages];
    setMessages((prev) =>
      prev.map((m) => (m.id === editingId ? { ...m, content: newContent } : m)),
    );

    const idToSave = editingId;
    setEditingId(null);

    const res = await editMessage(idToSave, newContent, true);
    if (res.error) {
      setMessages(previousMessages);
      toast.error("Failed to edit");
    }
  };

  const toggleReaction = async (msg: Message, emoji: string) => {
    const parsed = parseMessageContent(msg.content);
    const reactions = parsed.metadata.reactions || {};
    const users = reactions[emoji] || [];

    if (users.includes(currentUser.id)) {
      reactions[emoji] = users.filter((id) => id !== currentUser.id);
      if (reactions[emoji].length === 0) delete reactions[emoji];
    } else {
      reactions[emoji] = [...users, currentUser.id];
    }

    const newMetadata = { ...parsed.metadata, reactions };
    const newContent = buildMessageContent(parsed.text, newMetadata);

    // Optimistic update
    const previousMessages = [...messages];
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, content: newContent } : m)));

    const res = await editMessage(msg.id, newContent);
    if (res.error) {
      setMessages(previousMessages);
      toast.error("Failed to add reaction");
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-transparent">
      {/* Header - Transparent/Glass Top Bar */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0 z-20 bg-transparent">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden -ml-2 h-8 w-8 rounded-full bg-muted text-muted-foreground mr-1"
            onClick={() => navigate("/dashboard/messages")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="relative">
            <Avatar className="h-10 w-10 border border-border shadow-sm">
              <AvatarImage src={otherUser.avatar_url} />
              <AvatarFallback className="bg-muted text-muted-foreground font-bold text-sm">
                {otherUser.username[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {otherUser.status === "online" && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background" />
            )}
          </div>
          <div>
            <h2 className="font-bold text-foreground text-base leading-none">
              @{otherUser.username}
            </h2>
            <p className="text-xs text-muted-foreground font-medium mt-1">
              {otherUser.status === "online" ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-muted-foreground">
          <Button
            variant="ghost"
            size="icon"
            className="hover:text-foreground hover:bg-muted rounded-full"
            title="Start Voice Call"
            onClick={() => handleStartCall("voice")}
          >
            <Phone className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hover:text-foreground hover:bg-muted rounded-full"
            title="Start Video Call"
            onClick={() => handleStartCall("video")}
          >
            <Video className="w-5 h-5" />
          </Button>
          <div className="w-px h-6 bg-border mx-2" />
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "rounded-full transition-colors",
              showInfo ? "text-foreground bg-muted" : "hover:text-foreground hover:bg-muted",
            )}
            title="Conversation Details"
            onClick={() => setShowInfo(!showInfo)}
          >
            <Info className="w-5 h-5" />
          </Button>
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden relative">
        {/* Messages Stream - Discord Style */}
        <div className="flex-1 flex flex-col min-w-0">
          <div
            className="flex-1 overflow-y-auto px-6 py-4 space-y-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent"
            ref={scrollRef}
          >
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                  <User className="w-10 h-10 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    This is the beginning of your history
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Say hello to @{otherUser.username}!
                  </p>
                </div>
              </div>
            )}

            {messages.map((msg, idx) => {
              const isMe = msg.sender_id === currentUser.id;
              const isEditing = editingId === msg.id;
              const parsed = parseMessageContent(msg.content);
              const textContent = parsed.text;
              const metadata = parsed.metadata;
              const isJumboEmoji = textContent.trim().length > 0 && /^(\p{Extended_Pictographic}|\s)+$/u.test(textContent);
              const parentMsg = metadata.replyToId
                ? messages.find((m) => m.id === metadata.replyToId)
                : null;

              // Logic for Grouping (don't group if it's a reply)
              const prevMsg = messages[idx - 1];
              const isSequence =
                !parentMsg &&
                prevMsg &&
                prevMsg.sender_id === msg.sender_id &&
                new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() <
                  5 * 60 * 1000; // 5 min grouping threshold

              return (
                <div
                  key={msg.id || idx}
                  className={cn(
                    "group flex pr-4 relative hover:bg-muted/30 -mx-4 px-4 py-0.5 transition-colors",
                    !isSequence ? "mt-4 pt-1" : "",
                  )}
                >
                  {/* Left Side: Avatar or Time (on hover) */}
                  <div className="w-[50px] shrink-0 cursor-pointer select-none">
                    {!isSequence ? (
                      <Avatar className="w-10 h-10 ring-1 ring-border hover:ring-muted transition-all active:translate-y-0.5 mt-0.5">
                        <AvatarImage src={isMe ? currentUser.avatar_url : otherUser.avatar_url} />
                        {/* Fallback for ME if no avatar_url provided in prop, assuming it's passed or handled */}
                        <AvatarFallback className="bg-muted text-xs text-muted-foreground">
                          {(isMe ? currentUser.username : otherUser.username)?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <span className="text-[10px] text-muted-foreground hidden group-hover:inline-block w-full text-right pr-3 pt-1 select-none font-mono opacity-50">
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>

                  {/* Right Side: Content */}
                  <div className="flex-1 min-w-0 pl-3">
                    {/* Reply Preview */}
                    {parentMsg && (
                      <div
                        className="flex items-center gap-2 mb-1 text-xs text-muted-foreground cursor-pointer hover:text-white"
                        onClick={() => {
                          // In a real app, this would scroll to the message
                        }}
                      >
                        <div className="w-6 h-4 border-l-2 border-t-2 border-border rounded-tl-md -ml-2 -mt-2" />
                        <span className="font-bold">
                          @
                          {parentMsg.sender_id === currentUser.id
                            ? currentUser.username
                            : otherUser.username}
                        </span>
                        <span className="truncate max-w-sm">
                          {parseMessageContent(parentMsg.content).text}
                        </span>
                      </div>
                    )}

                    {/* Header (Only for first in sequence) */}
                    {!isSequence && (
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={cn(
                            "font-semibold text-[15px] hover:underline cursor-pointer",
                            isMe ? "text-primary" : "text-foreground",
                          )}
                        >
                          {isMe ? currentUser.username : otherUser.username}
                        </span>
                        <span className="text-xs text-muted-foreground font-medium ml-1">
                          {new Date(msg.created_at).toLocaleDateString()} at{" "}
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    )}

                    {/* Message Content */}
                    <div className="relative group/content">
                      {isEditing ? (
                        <div className="bg-muted p-2 rounded-lg border border-border max-w-3xl">
                          <Input
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="bg-background border-0 focus-visible:ring-0 text-foreground"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                saveEdit();
                              }
                              if (e.key === "Escape") cancelEdit();
                            }}
                          />
                          <div className="flex gap-2 text-xs mt-2 text-muted-foreground">
                            <span>
                              escape to{" "}
                              <button
                                onClick={cancelEdit}
                                className="text-foreground hover:underline"
                              >
                                cancel
                              </button>
                            </span>
                            •
                            <span>
                              enter to{" "}
                              <button
                                onClick={saveEdit}
                                className="text-foreground hover:underline"
                              >
                                save
                              </button>
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div
                          className={cn(
                            "text-[15px] whitespace-pre-wrap leading-relaxed break-words",
                            isMe ? "text-foreground" : "text-foreground/90",
                          )}
                        >
                          {textContent.startsWith("[GIFT:") ? (
                            <div className="flex flex-col items-center justify-center p-2 w-32 relative group/gift cursor-default">
                              <span
                                className="text-7xl mb-1 animate-bounce drop-shadow-2xl"
                                style={{ animationDuration: "2.5s" }}
                              >
                                {textContent.replace("[GIFT:", "").replace("]", "")}
                              </span>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 opacity-0 group-hover/gift:opacity-100 transition-opacity">
                                Gift
                              </span>
                            </div>
                          ) : textContent.startsWith("![Image]") ? (
                            <img
                              src={textContent.match(/\((.*?)\)/)?.[1]}
                              alt="Shared image"
                              className="max-w-sm rounded-lg border border-border mt-2"
                            />
                          ) : textContent.startsWith("![AUDIO]") ? (
                            <div className="flex items-center gap-2 bg-background border border-border p-2 rounded-md min-w-[250px]">
                              {textContent.includes("loading") ? (
                                <div className="animate-pulse flex items-center gap-2 w-full">
                                  <div className="w-8 h-8 bg-muted rounded-full shrink-0" />
                                  <div className="h-2 bg-muted rounded w-full" />
                                </div>
                              ) : (
                                <audio
                                  controls
                                  className="h-8 w-full outline-none"
                                  src={textContent.match(/\((.*?)\)/)?.[1]}
                                >
                                  Your browser does not support the audio element.
                                </audio>
                              )}
                            </div>
                          ) : textContent.startsWith("![GIF]") ? (
                            <img
                              src={textContent.match(/\((.*?)\)/)?.[1]}
                              alt="Shared GIF"
                              className="max-w-sm rounded-lg border border-border mt-2"
                            />
                          ) : textContent.startsWith("```") ? (
                            <pre className="bg-muted p-3 rounded-lg border border-border mt-2 overflow-x-auto text-sm font-mono">
                              <code>
                                {textContent.replace(/```[a-z]*\n?/g, "").replace(/```/g, "")}
                              </code>
                            </pre>
                          ) : (
                            <p className={cn("inline", isJumboEmoji ? "text-5xl leading-none block my-2" : "")}>{textContent}</p>
                          )}
                          {(msg.is_edited ||
                            (msg.updated_at && msg.updated_at !== msg.created_at)) && (
                            <span className="text-[10px] text-muted-foreground ml-1 select-none inline-block">
                              (edited)
                            </span>
                          )}
                        </div>
                      )}

                      {/* Link Preview Card */}
                      {metadata.linkPreview && !isEditing && (
                        <div className="mt-1 max-w-sm rounded-md border border-border bg-background overflow-hidden">
                          {metadata.linkPreview.image && (
                            <div className="w-full h-32 bg-muted relative">
                              <img
                                src={metadata.linkPreview.image}
                                alt="Link thumbnail"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="p-3">
                            <h4
                              className="font-bold text-foreground text-[15px] truncate hover:underline cursor-pointer"
                              onClick={() => window.open(metadata.linkPreview!.url, "_blank")}
                            >
                              {metadata.linkPreview.title}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {metadata.linkPreview.description}
                            </p>
                            <span className="text-[10px] text-muted-foreground mt-2 block font-medium">
                              {new URL(metadata.linkPreview.url).hostname}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Reaction Badges */}
                      {metadata.reactions && Object.keys(metadata.reactions).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Object.entries(metadata.reactions).map(([emoji, users]) => {
                            const hasReacted = users.includes(currentUser.id);
                            return (
                              <button
                                key={emoji}
                                onClick={() => toggleReaction(msg, emoji)}
                                className={cn(
                                  "flex items-center gap-1.5 px-1.5 py-0.5 rounded-[4px] text-[11px] font-medium border transition-colors",
                                  hasReacted
                                    ? "bg-primary/20 border-primary text-white"
                                    : "bg-background border-transparent hover:border-border text-muted-foreground",
                                )}
                              >
                                <span>{emoji}</span>
                                <span>{users.length}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Manage Buttons (Floating) - Discord Style */}
                  <div
                    className={cn(
                      "absolute right-4 top-0 -translate-y-1/2 bg-background border border-border rounded-[4px] shadow-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center z-10 overflow-hidden",
                      isEditing ? "hidden" : "",
                    )}
                  >
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-muted rounded-none border-r border-border"
                        >
                          <SmilePlus className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        side="top"
                        align="center"
                        className="w-auto p-1.5 border-border bg-background rounded-lg shadow-xl mb-1"
                      >
                        <div className="flex gap-1">
                          {["👍", "❤️", "😂", "😮", "😢", "👀"].map((emoji) => (
                            <Button
                              key={emoji}
                              variant="ghost"
                              className="h-8 w-8 p-0 hover:bg-muted rounded-[4px] text-lg hover:scale-110 transition-all"
                              onClick={() => toggleReaction(msg, emoji)}
                            >
                              {emoji}
                            </Button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-muted rounded-none border-r border-border"
                      onClick={() => setReplyingTo(msg)}
                    >
                      <CornerUpLeft className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                    </Button>
                    {isMe && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-muted rounded-none border-r border-border"
                          onClick={() => startEdit(msg)}
                        >
                          <Pencil className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-destructive rounded-none group/delete"
                          onClick={() => handleDelete(msg.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive group-hover/delete:text-white" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input Area - Discord Style */}
          <div className="px-4 pb-6 pt-2 shrink-0 z-20 relative">
            {replyingTo && (
              <div className="bg-background mx-4 mb-2 p-2 rounded-t-md flex items-center justify-between border-l-4 border-primary">
                <div className="flex flex-col min-w-0">
                  <span className="text-foreground text-xs font-bold">
                    Replying to{" "}
                    {replyingTo.sender_id === currentUser.id
                      ? currentUser.username
                      : otherUser.username}
                  </span>
                  <span className="text-muted-foreground text-xs truncate max-w-md">
                    {parseMessageContent(replyingTo.content).text}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-white"
                  onClick={() => setReplyingTo(null)}
                >
                  <Plus className="w-4 h-4 rotate-45" />
                </Button>
              </div>
            )}
            {isTyping && (
              <div className="absolute -top-3 left-8 text-xs text-muted-foreground italic flex items-center gap-1.5 animate-in fade-in slide-in-from-bottom-2">
                <span className="flex gap-0.5">
                  <span
                    className="w-1 h-1 rounded-full bg-[#b5bac1] animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-1 h-1 rounded-full bg-[#b5bac1] animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-1 h-1 rounded-full bg-[#b5bac1] animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </span>
                {otherUser.username} is typing...
              </div>
            )}
            <form
              onSubmit={handleSend}
              className={cn(
                "bg-muted rounded-md flex items-center px-4 py-2 gap-3 transition-colors ring-offset-background",
                isRecording
                  ? "ring-2 ring-destructive"
                  : "focus-within:ring-2 focus-within:ring-ring",
              )}
            >
              {isRecording ? (
                <div className="flex-1 flex items-center gap-3 text-destructive animate-pulse py-1.5">
                  <div className="w-2.5 h-2.5 bg-destructive rounded-full" />
                  <span className="font-mono font-medium">
                    {Math.floor(recordingTime / 60)}:
                    {(recordingTime % 60).toString().padStart(2, "0")}
                  </span>
                  <span className="text-sm font-medium">
                    Recording Voice Message... (Release to send)
                  </span>
                </div>
              ) : (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted shrink-0 rounded-full transition-transform active:scale-95"
                      >
                        <Plus className="w-5 h-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      side="top"
                      className="w-48 mb-2 p-1.5 border-none bg-card shadow-xl rounded-[4px]"
                    >
                      <DropdownMenuItem
                        onClick={handleShareImage}
                        className="cursor-pointer gap-2 p-2 rounded-[2px] hover:bg-primary/90 focus:bg-primary/90 text-foreground"
                      >
                        <ImageIcon className="w-4 h-4" />
                        <span className="font-medium text-sm">Upload Image</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Input
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      handleTyping();
                    }}
                    placeholder={`Message @${otherUser.username}`}
                    className="flex-1 bg-transparent hover:bg-transparent shadow-none border-0 hover:border-transparent focus-visible:ring-0 text-foreground placeholder:text-muted-foreground/50 px-0 text-[15px]"
                  />
                </>
              )}

              <div className="flex items-center gap-2 shrink-0">
                {!isRecording && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-transform active:scale-95"
                      >
                        <Gift className="w-5 h-5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      side="top"
                      align="center"
                      className="w-64 p-3 border-border bg-background"
                    >
                      <h4 className="font-bold text-sm mb-3 text-white">Send a Gift</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {["🎁", "💐", "💖", "🎉", "👑", "🍕"].map((gift) => (
                          <Button
                            key={gift}
                            variant="outline"
                            className="h-16 text-3xl hover:scale-105 transition-transform bg-muted border-0 hover:bg-muted"
                            onClick={() => handleSendGift(gift)}
                          >
                            {gift}
                          </Button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}

                {!isRecording && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-transform active:scale-95"
                      >
                        <Film className="w-5 h-5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      side="top"
                      align="end"
                      className="w-80 p-0 border-border bg-background"
                    >
                      <div className="p-2 pb-0">
                        <Input
                          placeholder="Search Tenor..."
                          value={gifSearch}
                          onChange={(e) => setGifSearch(e.target.value)}
                          className="bg-muted border-0 text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-0 mb-2 h-8 text-xs"
                        />
                      </div>
                      <div className="h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                        <Grid
                          width={318}
                          columns={2}
                          gutter={4}
                          fetchGifs={
                            gifSearch
                              ? (offset) => gf.search(gifSearch, { offset, limit: 10 })
                              : (offset) => gf.trending({ offset, limit: 10 })
                          }
                          key={gifSearch}
                          onGifClick={(gif, e) => {
                            e.preventDefault();
                            handleSend(undefined, `![GIF](${gif.images.fixed_height.url})`);
                          }}
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                )}

                {!isRecording && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-transform active:scale-95"
                      >
                        <Smile className="w-5 h-5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent side="top" align="end" className="w-auto p-0 border-border">
                      <EmojiPicker onEmojiClick={handleEmojiClick} theme={theme as Theme} />
                    </PopoverContent>
                  </Popover>
                )}

                {input.trim() === "" ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-8 w-8 rounded-full transition-all duration-200",
                      isRecording
                        ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 scale-110"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95",
                    )}
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    onMouseLeave={stopRecording}
                  >
                    {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-5 h-5" />}
                  </Button>
                ) : null}
              </div>
            </form>
          </div>
        </div>{" "}
        {/* End flex-1 col */}
        {/* Right Sidebar - Info Panel */}
        {showInfo && (
          <div className="w-80 shrink-0 border-l border-border bg-card animate-in slide-in-from-right-5 duration-300 flex flex-col">
            <div className="p-6 flex flex-col items-center border-b border-border">
              <Avatar className="w-24 h-24 mb-4 ring-4 ring-background shadow-xl">
                <AvatarImage src={otherUser.avatar_url} />
                <AvatarFallback className="text-2xl bg-muted text-muted-foreground">
                  {otherUser.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-lg font-bold text-foreground">
                {otherUser.full_name || otherUser.username}
              </h3>
              <p className="text-sm text-muted-foreground">@{otherUser.username}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Pinned Messages Mockup */}
              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
                  Pinned Messages
                </h4>
                <div className="bg-muted/50 rounded-lg p-3 text-sm text-foreground/80 border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar className="w-4 h-4">
                      <AvatarImage src={otherUser.avatar_url} />
                      <AvatarFallback className="text-[8px]">
                        {otherUser.username[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-bold text-foreground text-xs">@{otherUser.username}</span>
                  </div>
                  &quot;Let&apos;s meet at 8pm!&quot;
                </div>
              </div>

              {/* Shared Media Mockup */}
              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
                  Shared Media
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="aspect-square bg-muted rounded-md border border-border hover:bg-muted/80 transition-colors cursor-pointer"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>{" "}
      {/* End main flex container */}
    </div>
  );
}


