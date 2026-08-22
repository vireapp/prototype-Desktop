"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: number;
  isSystem?: boolean;
  huddleGroupId?: number;
}

interface QuickChatBarProps {
  roomId: string;
  user: any;
  channelSecret: string;
  roomName: string;
  roomDescription?: string;
  currentActivity?: string;
  onMessageSent?: (msg: string) => void;
}

export function QuickChatBar({
  roomId,
  user,
  channelSecret,
  roomName,
  roomDescription,
  currentActivity,
  onMessageSent,
}: QuickChatBarProps) {
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [transientMessages, setTransientMessages] = useState<Message[]>([]);
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);

  // Subscribe to room chat
  useEffect(() => {
    if (!roomId || !channelSecret) return;

    // Use the SAME channel as chat.tsx to ensure all messages are seen
    const channel = supabase
      .channel(`room_${roomId}_chat`)
      .on("broadcast", { event: "chat_message" }, ({ payload }) => {
        // Show in transient viewer
        const msg = payload as Message;
        setTransientMessages((prev) => [...prev, msg]);

        // Remove after 5 seconds
        setTimeout(() => {
          setTransientMessages((prev) => prev.filter((m) => m.id !== msg.id));
        }, 5000);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, channelSecret, supabase]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;
    if (!user) {
      toast.error("You must be logged in to chat");
      return;
    }

    const text = input.trim();
    setIsSending(true);
    setInput("");

    try {
      // Regular room chat (including @username, @bot, etc)
      const msgId = Math.random().toString(36).substring(7);
      const msg: Message = {
        id: msgId,
        senderId: user.id,
        senderName: user.user_metadata?.full_name || user.email?.split("@")[0] || "Guest",
        senderAvatar: user.user_metadata?.avatar_url,
        content: text,
        timestamp: Date.now(),
      };

        // Optimistically add it to our own transient view (chat.tsx relies on channel broadcast but we might miss our own payload if we don't listen to ourselves on the same channel)
        setTransientMessages((prev) => [...prev, msg]);
        setTimeout(() => {
          setTransientMessages((prev) => prev.filter((m) => m.id !== msgId));
        }, 5000);

        // Dispatch local event for chat.tsx to render immediately
        window.dispatchEvent(new CustomEvent('local-chat-message', { detail: msg }));
        
        // If AI is summoned, dispatch local event for ai-chat.tsx to render the prompt
        if (text.toLowerCase().match(/\b(@?vire\s*ai|@vire|@ai|vire|@bot|bot)\b/)) {
          window.dispatchEvent(new CustomEvent('ai-chat-message', { detail: { role: 'user', content: text } }));
        }

        // Broadcast to main channel
        await supabase.channel(`room_${roomId}_chat`).send({
          type: "broadcast",
          event: "chat_message",
          payload: msg,
        });
        
        if (onMessageSent) {
          onMessageSent(text);
        }
    } catch (err) {
      console.error("Failed to send global chat", err);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  // Helper to render message with @ highlights
  const renderMessageContent = (content: string) => {
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith("@")) {
        return (
          <span key={i} className="text-emerald-400 font-semibold bg-emerald-500/10 px-1 rounded">
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div
      className="hidden md:flex relative flex-col justify-end pointer-events-none z-40 w-[320px]"
    >
      {/* Transient Glimpse Viewer */}
      <div className="absolute bottom-full mb-4 flex flex-col gap-2 px-2 w-full max-h-[350px] overflow-hidden pointer-events-none">
        <AnimatePresence>
          {transientMessages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="bg-[#111111]/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-3 shadow-2xl self-end max-w-full pointer-events-auto w-full"
            >
              <div className="flex items-center gap-2 mb-1">
                {msg.senderId === "ai_bot" ? (
                  <Bot className="w-4 h-4 text-purple-400" />
                ) : (
                  <Users className="w-4 h-4 text-emerald-400" />
                )}
                <span className="text-xs font-semibold text-white/80">{msg.senderName}</span>
              </div>
              <p className="text-sm text-white/90 leading-snug break-words">
                {renderMessageContent(msg.content)}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input Bar - styled like the media dock */}
      <div className="pointer-events-auto relative">
        <form onSubmit={handleSend} className="relative flex items-center bg-[#111111]/80 backdrop-blur-2xl border border-white/5 rounded-2xl p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type @username to DM, @bot for AI, or just chat..."
            className="w-full !bg-transparent !border-transparent !ring-0 focus-visible:!ring-0 h-9 pl-3 pr-10 text-white placeholder:text-white/40 focus:outline-none shadow-none text-sm"
            disabled={isSending}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isSending}
            className="absolute right-1.5 h-8 w-8 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
