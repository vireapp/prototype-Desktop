/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getMessages, sendMessage, deleteMessage, editMessage } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, User, Loader2, MoreVertical, Pencil, Trash2, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
};

export function ChatInterface({ otherUser, currentUser }: { otherUser: any; currentUser: any }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const handleRealtimeEvent = useCallback(
    (payload: any) => {
      // INSERT
      if (payload.eventType === "INSERT") {
        const newMessage = payload.new as Message;
        // Only add if relevant to this chat AND not already present (dedup by ID)
        if (
          newMessage.sender_id === otherUser.id ||
          newMessage.receiver_id === otherUser.id ||
          (newMessage.sender_id === currentUser.id && newMessage.receiver_id === otherUser.id)
        ) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMessage.id)) return prev;

            // Deduplicate optimistic messages if the server assigned a different ID
            const optimisticMatch = prev.find(
              (m) =>
                m.sender_id === newMessage.sender_id &&
                m.content === newMessage.content &&
                Math.abs(
                  new Date(newMessage.created_at).getTime() - new Date(m.created_at).getTime(),
                ) < 5000,
            );

            if (optimisticMatch) {
              return prev.map((m) => (m.id === optimisticMatch.id ? newMessage : m));
            }

            return [...prev, newMessage];
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
    [currentUser.id, otherUser],
  );

  // Subscribe to incoming messages (INSERT, UPDATE, DELETE)
  useEffect(() => {
    if (!otherUser) return;

    const channel = supabase
      .channel("direct_messages")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all events
          schema: "public",
          table: "direct_messages",
          filter: `receiver_id=eq.${currentUser.id}`,
        },
        (payload) => {
          handleRealtimeEvent(payload);
        },
      )
      // Also listen to messages sent by ME (to sync deletions/edits across devices or tabs)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "direct_messages",
          filter: `sender_id=eq.${currentUser.id}`,
        },
        (payload) => {
          handleRealtimeEvent(payload);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser.id, otherUser, supabase, handleRealtimeEvent]);

  // Fetch messages when selecting a user
  useEffect(() => {
    if (!otherUser) return;

    const loadMessages = async () => {
      setLoading(true);
      const msgs = await getMessages(otherUser.id);
      setMessages(msgs || []);
      setLoading(false);
    };
    loadMessages();
  }, [otherUser]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, editingId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !otherUser) return;

    const tempId = crypto.randomUUID(); // Client-generated ID
    const tempMessage: Message = {
      id: tempId,
      sender_id: currentUser.id,
      receiver_id: otherUser.id,
      content: input.trim(),
      created_at: new Date().toISOString(),
    };

    // Optimistic update
    setMessages((prev) => [...prev, tempMessage]);
    setInput("");

    const formData = new FormData();
    formData.append("id", tempId);
    formData.append("receiverId", otherUser.id);
    formData.append("content", tempMessage.content);

    const res = await sendMessage(formData);
    if (res.error) {
      // Revert on error
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      toast.error("Failed to send message");
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
    setEditContent(msg.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  const saveEdit = async () => {
    if (!editingId || !editContent.trim()) return;

    // Optimistic update
    const previousMessages = [...messages];
    setMessages((prev) =>
      prev.map((m) => (m.id === editingId ? { ...m, content: editContent } : m)),
    );

    const idToSave = editingId;
    setEditingId(null); // Exit edit mode immediately

    const res = await editMessage(idToSave, editContent);
    if (res.error) {
      setMessages(previousMessages);
      toast.error("Failed to edit");
    }
  };

  if (!otherUser) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground h-full">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <User className="w-8 h-8 opacity-50" />
        </div>
        <p>Select a friend to start chatting</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Chat Header */}
      <div className="p-4 border-b border-border bg-card flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <Avatar className="h-10 w-10 border">
          <AvatarImage src={otherUser.avatar_url} />
          <AvatarFallback>{otherUser.username?.[0]}</AvatarFallback>
        </Avatar>
        <div>
          <span className="font-semibold block">{otherUser.full_name || otherUser.username}</span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            {otherUser.status === "online" ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Online
              </>
            ) : null}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={scrollRef}>
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-10 opacity-50">
            No messages yet. Say hi! 👋
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUser.id;
            const isEditing = editingId === msg.id;

            return (
              <div
                key={msg.id}
                className={cn(
                  "flex w-full group animate-in fade-in slide-in-from-bottom-2",
                  isMe ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn("flex gap-2 max-w-[75%]", isMe ? "flex-row-reverse" : "flex-row")}
                >
                  {/* Avatar for receiver side */}
                  {!isMe && (
                    <Avatar className="h-8 w-8 mt-1 border border-border/50 shadow-sm">
                      <AvatarImage src={otherUser.avatar_url} />
                      <AvatarFallback className="text-[10px]">
                        {otherUser.username?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div
                    className={cn(
                      "relative px-4 py-3 text-sm shadow-sm transition-all",
                      isMe
                        ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
                        : "bg-muted border border-border rounded-2xl rounded-tl-sm",
                      isEditing && "ring-2 ring-accent",
                    )}
                  >
                    {/* Edit Mode */}
                    {isEditing ? (
                      <div className="flex flex-col gap-2 min-w-[200px]">
                        <Input
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="bg-background/20 border-white/20 text-inherit placeholder:text-white/50 h-8"
                          autoFocus
                        />
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 hover:bg-white/20"
                            onClick={cancelEdit}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 hover:bg-white/20"
                            onClick={saveEdit}
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="whitespace-pre-wrap break-words leading-relaxed">
                          {msg.content}
                        </p>
                        <div
                          className={cn(
                            "text-[10px] mt-1 opacity-70 flex items-center gap-1",
                            isMe ? "justify-end" : "justify-start",
                          )}
                        >
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </>
                    )}

                    {/* Actions Menu (Only for own messages) */}
                    {isMe && !isEditing && (
                      <div className="absolute top-0 right-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 rounded-full bg-background/50 border shadow-sm hover:bg-background"
                            >
                              <MoreVertical className="w-3 h-3 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => startEdit(msg)}>
                              <Pencil className="w-3 h-3 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDelete(msg.id)}
                            >
                              <Trash2 className="w-3 h-3 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-background border-t">
        <form onSubmit={handleSend} className="flex gap-2 relative">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message ${otherUser.username} ...`}
            className="flex-1 pr-12 rounded-md border-muted-foreground/20 focus-visible:ring-primary/20 bg-muted/20"
          />
          <Button
            type="submit"
            size="icon"
            className="absolute right-1 top-1 rounded-md h-8 w-8 shadow-md"
            disabled={!input.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

