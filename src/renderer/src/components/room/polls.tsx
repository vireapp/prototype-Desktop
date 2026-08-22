"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  X,
  Check,
  BarChart3,
  HelpCircle,
  Trash2,
  Clock,
  Settings2,
  Edit2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PollOption {
  id: string;
  text: string;
  votes: string[]; // userIds
}

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  createdBy: string;
  isActive: boolean;
  isImportant: boolean;
  isMultipleChoice: boolean;
  expiresAt: number | null;
}

interface RoomPollsProps {
  roomId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any;
  isOpen: boolean;
  onClose: () => void;
  onNewPollEvent?: (poll: Poll) => void;
}

export function RoomPolls({ roomId, user, isOpen, onClose, onNewPollEvent }: RoomPollsProps) {
  const [activePoll, setActivePoll] = useState<Poll | null>(null);

  const [creationMode, setCreationMode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [isImportant, setIsImportant] = useState(false);
  const [isMultipleChoice, setIsMultipleChoice] = useState(false);
  const [duration, setDuration] = useState("unlimited"); // "1", "5", "15", "unlimited"
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const channel = supabase.channel(`room_${roomId}_polls`);

    channel
      .on("broadcast", { event: "new_poll" }, ({ payload }) => {
        setActivePoll(payload.poll);
        toast.info("New poll started!");
        if (onNewPollEvent) {
          onNewPollEvent(payload.poll);
        }
      })
      .on("broadcast", { event: "update_poll" }, ({ payload }) => {
        setActivePoll(payload.poll);
      })
      .on("broadcast", { event: "vote" }, ({ payload }) => {
        setActivePoll((current) => {
          if (!current || current.id !== payload.pollId) return current;

          const newOptions = current.options.map((opt) => {
            let cleanVotes = opt.votes;
            if (!current.isMultipleChoice) {
              // Remove user from all options first (single vote)
              cleanVotes = opt.votes.filter((uid) => uid !== payload.userId);
            }

            // Add to target option
            if (opt.id === payload.optionId) {
              if (current.isMultipleChoice && opt.votes.includes(payload.userId)) {
                // Un-vote
                return { ...opt, votes: opt.votes.filter((uid) => uid !== payload.userId) };
              }
              return { ...opt, votes: [...cleanVotes, payload.userId] };
            }
            return { ...opt, votes: cleanVotes };
          });

          return { ...current, options: newOptions };
        });
      })
      .on("broadcast", { event: "close_poll" }, () => {
        setActivePoll(null);
        toast.info("Poll ended");
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, supabase, onNewPollEvent]);

  // Timer Effect
  useEffect(() => {
    if (!activePoll || !activePoll.expiresAt) {
      setTimeLeft(null);
      return;
    }

    const interval = setInterval(() => {
      const remaining = activePoll.expiresAt! - Date.now();
      if (remaining <= 0) {
        clearInterval(interval);
        setTimeLeft(0);
        if (activePoll.createdBy === user.id) {
          handleClosePoll();
        }
      } else {
        setTimeLeft(Math.ceil(remaining / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activePoll, user.id]);

  const handleCreatePoll = async () => {
    if (!question.trim() || options.some((o) => !o.trim())) {
      toast.error("Please fill in all fields");
      return;
    }

    const expiresAt = duration === "unlimited" ? null : Date.now() + parseInt(duration) * 60 * 1000;

    const newPoll: Poll = {
      id: Math.random().toString(36).substring(7),
      question,
      options: options.map((text) => ({
        id: Math.random().toString(36).substring(7),
        text,
        votes: [],
      })),
      createdBy: user.id,
      isActive: true,
      isImportant,
      isMultipleChoice,
      expiresAt,
    };

    setActivePoll(newPoll);
    setCreationMode(false);

    await supabase.channel(`room_${roomId}_polls`).send({
      type: "broadcast",
      event: "new_poll",
      payload: { poll: newPoll },
    });
  };

  const handleEditPoll = () => {
    if (!activePoll) return;
    setQuestion(activePoll.question);
    setOptions(activePoll.options.map((o) => o.text));
    setIsImportant(activePoll.isImportant);
    setIsMultipleChoice(activePoll.isMultipleChoice);
    setDuration(
      activePoll.expiresAt
        ? String(Math.round((activePoll.expiresAt - Date.now()) / 60000))
        : "unlimited",
    );
    setIsEditing(true);
    setActivePoll(null); // Temporarily hide active view
  };

  const handleUpdatePoll = async () => {
    if (!question.trim() || options.some((o) => !o.trim())) {
      toast.error("Please fill in all fields");
      return;
    }

    const expiresAt = duration === "unlimited" ? null : Date.now() + parseInt(duration) * 60 * 1000;

    const updatedPoll: Poll = {
      id: Math.random().toString(36).substring(7), // Change ID to reset votes
      question,
      options: options.map((text) => ({
        id: Math.random().toString(36).substring(7),
        text,
        votes: [], // reset votes
      })),
      createdBy: user.id,
      isActive: true,
      isImportant,
      isMultipleChoice,
      expiresAt,
    };

    setActivePoll(updatedPoll);
    setIsEditing(false);

    await supabase.channel(`room_${roomId}_polls`).send({
      type: "broadcast",
      event: "new_poll", // broadcast as new poll so others see it as a fresh poll
      payload: { poll: updatedPoll },
    });
  };

  const handleVote = async (optionId: string) => {
    if (!activePoll) return;

    // Optimistic update
    setActivePoll((current) => {
      if (!current) return null;
      const newOptions = current.options.map((opt) => {
        let cleanVotes = opt.votes;
        if (!current.isMultipleChoice) {
          cleanVotes = opt.votes.filter((uid) => uid !== user.id);
        }

        if (opt.id === optionId) {
          if (current.isMultipleChoice && opt.votes.includes(user.id)) {
            return { ...opt, votes: opt.votes.filter((uid) => uid !== user.id) };
          }
          return { ...opt, votes: [...cleanVotes, user.id] };
        }
        return { ...opt, votes: cleanVotes };
      });
      return { ...current, options: newOptions };
    });

    await supabase.channel(`room_${roomId}_polls`).send({
      type: "broadcast",
      event: "vote",
      payload: {
        pollId: activePoll.id,
        optionId,
        userId: user.id,
      },
    });
  };

  const handleClosePoll = async () => {
    setActivePoll(null);
    onClose();
    await supabase.channel(`room_${roomId}_polls`).send({
      type: "broadcast",
      event: "close_poll",
      payload: {},
    });
  };

  const totalVotes = activePoll?.options.reduce((acc, opt) => acc + opt.votes.length, 0) || 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
          />
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-zinc-900/90 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] z-[101] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-xl tracking-tight">Room Poll</h3>
                  <p className="text-sm text-white/50 font-medium">Gather opinions in real-time</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full hover:bg-white/10 text-white/70 hover:text-white"
                onClick={onClose}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-8">
              {!activePoll ? (
                // Creation View
                <div className="flex flex-col gap-8">
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-white/70 flex items-center gap-2 uppercase tracking-wider">
                      <HelpCircle className="w-4 h-4 text-indigo-400" /> Question
                    </label>
                    <Input
                      placeholder="What would you like to ask?"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      className="h-14 bg-black/40 border-white/10 text-lg rounded-2xl focus-visible:ring-indigo-500/50 text-white placeholder:text-white/30 px-5"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-semibold text-white/70 uppercase tracking-wider">
                      Options
                    </label>
                    <div className="flex flex-col gap-3">
                      <AnimatePresence>
                        {options.map((opt, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex gap-2 items-center"
                          >
                            <Input
                              placeholder={`Option ${idx + 1}`}
                              value={opt}
                              onChange={(e) => {
                                const newOpts = [...options];
                                newOpts[idx] = e.target.value;
                                setOptions(newOpts);
                              }}
                              className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl px-4 flex-1 focus-visible:ring-indigo-500/50"
                            />
                            {idx > 1 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setOptions(options.filter((_, i) => i !== idx))}
                                className="h-12 w-12 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl shrink-0"
                              >
                                <Trash2 className="w-5 h-5" />
                              </Button>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      {options.length < 6 && (
                        <Button
                          variant="outline"
                          onClick={() => setOptions([...options, ""])}
                          className="w-full h-12 border-dashed border-white/20 text-white/60 hover:text-white hover:bg-white/10 rounded-xl bg-transparent mt-2 transition-colors"
                        >
                          <Plus className="w-5 h-5 mr-2" /> Add Option
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-14 w-14 rounded-2xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-white/10 shrink-0 transition-all"
                        >
                          <Settings2 className="w-6 h-6" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        side="top"
                        align="start"
                        className="w-80 p-5 bg-zinc-900 border-white/10 rounded-2xl shadow-xl space-y-5 z-[105]"
                      >
                        <h4 className="font-semibold text-white/90 uppercase tracking-wider text-sm flex items-center gap-2">
                          <Settings2 className="w-4 h-4 text-indigo-400" /> Settings
                        </h4>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="multiple-choice" className="text-white font-medium">
                            Multiple Choice
                          </Label>
                          <Switch
                            id="multiple-choice"
                            checked={isMultipleChoice}
                            onCheckedChange={setIsMultipleChoice}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="important-poll" className="text-white font-medium">
                            Important (Auto-opens)
                          </Label>
                          <Switch
                            id="important-poll"
                            checked={isImportant}
                            onCheckedChange={setIsImportant}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label
                            htmlFor="duration"
                            className="text-white font-medium flex items-center gap-2"
                          >
                            Duration
                          </Label>
                          <Select value={duration} onValueChange={setDuration}>
                            <SelectTrigger className="w-[140px] bg-white/5 border-white/10 text-white">
                              <Clock className="w-4 h-4 mr-2 text-indigo-400" />
                              <SelectValue placeholder="Duration" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unlimited">Unlimited</SelectItem>
                              <SelectItem value="1">1 Minute</SelectItem>
                              <SelectItem value="5">5 Minutes</SelectItem>
                              <SelectItem value="15">15 Minutes</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </PopoverContent>
                    </Popover>

                    <Button
                      onClick={isEditing ? handleUpdatePoll : handleCreatePoll}
                      className="h-14 flex-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl text-lg font-bold shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transition-all"
                    >
                      {isEditing ? "Update Poll" : "Launch Poll"}
                    </Button>
                  </div>
                </div>
              ) : (
                // Active Poll View
                <div className="flex flex-col gap-8">
                  <div className="text-center space-y-3 pb-4 border-b border-white/5">
                    <h3 className="font-bold text-white text-3xl leading-tight tracking-tight">
                      {activePoll.question}
                    </h3>
                    <div className="flex items-center justify-center gap-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-white/70">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        {totalVotes} {totalVotes === 1 ? "vote" : "votes"} cast
                      </div>
                      {timeLeft !== null && (
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-sm text-orange-400 font-medium">
                          <Clock className="w-4 h-4" />
                          {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
                        </div>
                      )}
                      {activePoll.isMultipleChoice && (
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-sm text-indigo-400 font-medium">
                          Multiple Choice
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    {activePoll.options.map((opt) => {
                      const percent =
                        totalVotes === 0 ? 0 : Math.round((opt.votes.length / totalVotes) * 100);
                      const hasVoted = opt.votes.includes(user.id);

                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleVote(opt.id)}
                          className={cn(
                            "relative w-full h-16 rounded-2xl overflow-hidden transition-all duration-300 group border text-left",
                            hasVoted
                              ? "border-indigo-500 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.15)] scale-[1.02]"
                              : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20",
                          )}
                        >
                          {/* Progress Bar Background */}
                          <div
                            className={cn(
                              "absolute inset-y-0 left-0 transition-all duration-1000 ease-out",
                              hasVoted ? "bg-indigo-500/20" : "bg-white/5",
                            )}
                            style={{ width: `${percent}%` }}
                          />

                          <div className="absolute inset-0 flex items-center justify-between px-6 z-10">
                            <span
                              className={cn(
                                "font-semibold text-lg flex items-center gap-3 transition-colors",
                                hasVoted
                                  ? "text-indigo-200"
                                  : "text-white/90 group-hover:text-white",
                              )}
                            >
                              {opt.text}
                              {hasVoted && (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                  <Check className="w-5 h-5 text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                                </motion.div>
                              )}
                            </span>
                            <span
                              className={cn(
                                "font-mono text-base font-bold transition-colors",
                                hasVoted
                                  ? "text-indigo-300"
                                  : "text-white/60 group-hover:text-white/90",
                              )}
                            >
                              {percent}%
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {activePoll.createdBy === user.id && (
                    <div className="mt-4 flex gap-3">
                      <Button
                        variant="outline"
                        onClick={handleEditPoll}
                        className="flex-1 h-12 rounded-xl font-bold bg-white/5 hover:bg-white/10 text-white border-white/10 transition-all"
                      >
                        <Edit2 className="w-4 h-4 mr-2" /> Edit Poll
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            className="flex-1 h-12 rounded-xl font-bold bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 border border-red-500/30 transition-all"
                          >
                            End Poll
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-zinc-900 border-white/10">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-white">
                              End this poll?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-white/60">
                              This action cannot be undone. Users will no longer be able to vote and
                              the poll will be closed for everyone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleClosePoll}
                              className="bg-red-500 text-white hover:bg-red-600"
                            >
                              End Poll
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
