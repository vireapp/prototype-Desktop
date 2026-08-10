'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Badge } from '@/components/ui/badge'
import {
  MessageSquare,
  Video,
  Phone,
  MoreHorizontal,
  Globe,
  MapPin,
  Calendar,
  Ban,
  Flag,
  UserMinus,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Mail,
  Copy
} from 'lucide-react'

// Brand icons removed from lucide-react v1.0 — using inline SVGs
function GithubIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  )
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
    </svg>
  )
}
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Profile {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  banner_url?: string | null
  bio?: string | null
  location?: string | null
  website?: string | null
  created_at?: string
  status?: string
  status_text?: string | null
  status_emoji?: string | null
  social_links?:
    | {
        github?: string
        twitter?: string
        website?: string
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }
    | any
}

interface ProfileCardDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  profile: Profile | null
  onMessage?: () => void
  onVideoCall?: () => void
  onVoiceCall?: () => void
  onRemoveFriend?: () => void
  onBlockUser?: () => void
  onReportUser?: () => void
}

export function ProfileCardDialog({
  isOpen,
  onOpenChange,
  profile,
  onMessage,
  onVideoCall,
  onVoiceCall,
  onRemoveFriend,
  onBlockUser,
  onReportUser
}: ProfileCardDialogProps) {
  if (!profile) return null

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  const formattedDate = profile.created_at
    ? format(new Date(profile.created_at), 'MMMM yyyy')
    : null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden bg-card border-border sm:max-w-md gap-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Profile Card</DialogTitle>
        </DialogHeader>

        {/* Banner */}
        <div className="h-32 w-full relative bg-muted">
          {profile.banner_url ? (
            <img src={profile.banner_url} alt="Banner" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-emerald-500/20 to-purple-500/20" />
          )}
        </div>

        {/* Profile Content */}
        <div className="px-6 pb-6 -mt-12 relative">
          <div className="flex justify-between items-end mb-4">
            <div className="relative">
              <Avatar className="w-24 h-24 ring-4 ring-card bg-card">
                <AvatarImage src={profile.avatar_url || ''} />
                <AvatarFallback className="text-2xl">
                  {profile.username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div
                className={cn(
                  'absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-card',
                  profile.status === 'online' && 'bg-emerald-500',
                  profile.status === 'in-room' && 'bg-purple-500 animate-pulse',
                  profile.status === 'invisible' && 'bg-muted-foreground',
                  (profile.status === 'offline' || !profile.status) && 'bg-red-500'
                )}
              />
            </div>
            <div className="flex gap-2 mb-2">
              <Button size="icon" variant="outline" className="rounded-full" onClick={onMessage}>
                <MessageSquare className="w-4 h-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="outline" className="rounded-full">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem onClick={onVideoCall}>
                    <Video className="w-4 h-4 mr-2" /> Video Call
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onVoiceCall}>
                    <Phone className="w-4 h-4 mr-2" /> Voice Call
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCopy(profile.username, 'Username')}>
                    <Copy className="w-4 h-4 mr-2" /> Copy Username
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={onRemoveFriend}>
                    <UserMinus className="w-4 h-4 mr-2" /> Remove Friend
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={onBlockUser}>
                    <Ban className="w-4 h-4 mr-2" /> Block User
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={onReportUser}>
                    <Flag className="w-4 h-4 mr-2" /> Report User
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                {profile.full_name || profile.username}
                {profile.status_emoji && (
                  <span className="text-xl" title={profile.status_text || ''}>
                    {profile.status_emoji}
                  </span>
                )}
              </h2>
              <p className="text-muted-foreground font-mono">@{profile.username}</p>
            </div>

            {profile.bio && (
              <p className="text-sm text-foreground/80 leading-relaxed">{profile.bio}</p>
            )}

            <div className="flex flex-wrap gap-y-2 gap-x-4 text-sm text-muted-foreground">
              {profile.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{profile.location}</span>
                </div>
              )}
              {formattedDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Joined {formattedDate}</span>
                </div>
              )}
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-emerald-500 transition-colors"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Website</span>
                </a>
              )}
            </div>

            {/* Social Links */}
            {profile.social_links && Object.keys(profile.social_links).length > 0 && (
              <div className="flex gap-2 pt-2">
                {profile.social_links.github && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    asChild
                  >
                    <a
                      href={`https://github.com/${profile.social_links.github}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <GithubIcon className="w-4 h-4" />
                    </a>
                  </Button>
                )}
                {profile.social_links.twitter && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    asChild
                  >
                    <a
                      href={`https://twitter.com/${profile.social_links.twitter}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <TwitterIcon className="w-4 h-4" />
                    </a>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
