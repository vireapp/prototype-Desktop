"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AvatarUpload } from "@/components/avatar-upload";
import { BannerUpload } from "@/components/banner-upload";
import { Sparkles, Wand2, Smile, Globe, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { FaGithub as Github, FaXTwitter as Twitter } from "react-icons/fa6";
import { updateProfile } from "@/components/dashboard/settings/actions";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Profile {
  full_name: string | null;
  date_of_birth: string | null;
  username: string | null;
  avatar_url: string | null;
  banner_url?: string | null;
  bio?: string | null;
  status_text?: string | null;
  status_emoji?: string | null;
  social_links?:
    | {
        github?: string;
        twitter?: string;
        website?: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }
    | any;
}

export function ProfileSettings({ profile }: { profile: Profile }) {
  const [isPending, startTransition] = useTransition();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url);
  const [bannerUrl, setBannerUrl] = useState<string | null>(profile.banner_url || null);
  const [date, setDate] = useState<Date | undefined>(
    profile.date_of_birth ? new Date(profile.date_of_birth) : undefined,
  );

  const handleProfileSubmit = (formData: FormData) => {
    if (avatarUrl) formData.set("avatar_url", avatarUrl);
    if (bannerUrl) formData.set("banner_url", bannerUrl);

    startTransition(async () => {
      const result = await updateProfile(null, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Profile updated");
      }
    });
  };

  const handleGenerateAiAvatar = () => {
    const seed = Math.random().toString(36).substring(7);
    // Using DiceBear 'Notionists' style for a clean, modern look
    const newAvatarUrl = `https://api.dicebear.com/9.x/notionists/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
    setAvatarUrl(newAvatarUrl);
    toast.success("New avatar generated");
  };

  const handleGenerateBanner = () => {
    const seed = Math.random().toString(36).substring(7);
    // Using a high quality random image service
    // 1200x400 ensures the 3:1 aspect ratio
    const newBannerUrl = `https://picsum.photos/seed/${seed}/1200/400`;
    setBannerUrl(newBannerUrl);
    toast.success("New banner generated");
  };

  return (
    <form action={handleProfileSubmit} className="max-w-2xl mx-auto space-y-12">
      {/* Banner & Avatar Group */}
      <div className="relative mb-24">
        {/* Banner Area - Enforcing 3:1 Aspect Ratio container (2:1 on mobile) */}
        <div className="relative w-full aspect-[2/1] md:aspect-[3/1] rounded-2xl overflow-hidden bg-muted border border-border group shadow-sm">
          <BannerUpload value={bannerUrl} onUploadComplete={(url) => setBannerUrl(url)} />

          {/* Generate Button (Floating top right) */}
          <Button
            type="button"
            size="icon"
            onClick={handleGenerateBanner}
            className="absolute top-4 right-4 rounded-full w-8 h-8 bg-black/50 hover:bg-black/70 backdrop-blur-xl border border-white/20 shadow-lg z-20 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Generate Random Banner"
          >
            <Sparkles className="w-4 h-4 text-white" />
          </Button>
        </div>

        {/* Avatar (Overlapping) */}
        <div className="absolute -bottom-12 md:-bottom-16 left-4 md:left-8 flex items-end gap-4 md:gap-6">
          <div className="relative group cursor-pointer">
            <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full p-1 ring-4 ring-background bg-background">
              <AvatarUpload value={avatarUrl} onUploadComplete={(url) => setAvatarUrl(url)} />
            </div>
            <Button
              type="button"
              size="icon"
              onClick={handleGenerateAiAvatar}
              className="absolute bottom-0 right-0 rounded-full w-8 h-8 bg-black/50 hover:bg-black/70 backdrop-blur-xl border border-white/20 shadow-lg z-20"
            >
              <Wand2 className="w-4 h-4 text-white" />
            </Button>
          </div>

          <div className="mb-2 md:mb-4 space-y-1">
            <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">
              {profile.full_name || "Anonymous"}
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground font-mono">
              @{profile.username}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Identity Section */}
        <div className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                Display Name
              </Label>
              <Input
                name="full_name"
                defaultValue={profile.full_name || ""}
                className="bg-background border-border focus-visible:ring-1 focus-visible:ring-ring transition-all rounded-md text-foreground shadow-sm"
              />
            </div>
            <div className="space-y-2 flex flex-col">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                Origin Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full pl-3 text-left font-normal bg-background border-border hover:bg-muted focus-visible:ring-1 focus-visible:ring-ring transition-all rounded-md text-foreground shadow-sm",
                      !date && "text-muted-foreground",
                    )}
                  >
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 bg-[#0a0a0f] border border-white/[0.08] shadow-[0_16px_70px_-12px_rgba(139,92,246,0.25)] backdrop-blur-xl rounded-xl"
                  align="start"
                  sideOffset={8}
                >
                  <div className="px-4 pt-3 pb-1">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-violet-400/60 font-medium">
                      Select Date
                    </p>
                  </div>
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    defaultMonth={date || new Date(2000, 0)}
                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                  />
                  {date && (
                    <div className="px-4 pb-3 pt-1 border-t border-white/[0.04]">
                      <p className="text-[11px] text-muted-foreground text-center">
                        {format(date, "EEEE, MMMM d, yyyy")}
                      </p>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
              <input
                type="hidden"
                name="date_of_birth"
                value={date ? format(date, "yyyy-MM-dd") : ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">
              Bio / About
            </Label>
            <Textarea
              name="bio"
              defaultValue={profile.bio || ""}
              placeholder="Tell us about yourself..."
              className="bg-background border-border focus-visible:ring-1 focus-visible:ring-ring transition-all rounded-md text-foreground min-h-[100px] resize-none shadow-sm"
              maxLength={160}
            />
            <p className="text-[10px] text-muted-foreground/80 text-right">Max 160 chars</p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">
              Status
            </Label>
            <div className="flex gap-2">
              <div className="relative w-16">
                <span className="absolute left-3 top-2.5 text-muted-foreground pointer-events-none">
                  <Smile className="w-4 h-4" />
                </span>
                <Input
                  name="status_emoji"
                  defaultValue={profile.status_emoji || "👋"}
                  className="pl-9 bg-background border-border focus-visible:ring-1 focus-visible:ring-ring transition-all rounded-md text-foreground text-center shadow-sm"
                  maxLength={2}
                />
              </div>
              <Input
                name="status_text"
                defaultValue={profile.status_text || ""}
                placeholder="What's on your mind?"
                className="flex-1 bg-background border-border focus-visible:ring-1 focus-visible:ring-ring transition-all rounded-md text-foreground shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="space-y-4 pt-4 border-t border-border">
          <Label className="text-xs uppercase tracking-widest text-muted-foreground">
            Connections
          </Label>
          <div className="grid gap-4">
            <div className="relative">
              <Github className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                name="social_github"
                defaultValue={profile.social_links?.github || ""}
                placeholder="GitHub Username"
                className="pl-10 bg-background border-border focus-visible:ring-1 focus-visible:ring-ring transition-all rounded-md text-foreground shadow-sm"
              />
            </div>
            <div className="relative">
              <Twitter className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                name="social_twitter"
                defaultValue={profile.social_links?.twitter || ""}
                placeholder="Twitter / X Handle"
                className="pl-10 bg-background border-border focus-visible:ring-1 focus-visible:ring-ring transition-all rounded-md text-foreground shadow-sm"
              />
            </div>
            <div className="relative">
              <Globe className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                name="social_website"
                defaultValue={profile.social_links?.website || ""}
                placeholder="Personal Website"
                className="pl-10 bg-background border-border focus-visible:ring-1 focus-visible:ring-ring transition-all rounded-md text-foreground shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action */}
      <div className="flex justify-end pt-8">
        <Button
          type="submit"
          disabled={isPending}
          className={cn(
            "rounded-xl h-11 px-8 text-sm font-medium tracking-wide bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all",
            isPending && "opacity-70 cursor-not-allowed",
          )}
        >
          <span className="flex items-center gap-2">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isPending ? "Saving..." : "Save Changes"}
          </span>
        </Button>
      </div>
    </form>
  );
}

