'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  MessageSquare,
  MoreVertical,
  UserMinus,
  User,
  Copy,
  Ban,
  Video,
  Phone,
  UserPlus,
  Edit3,
  Pin,
  Share2,
  BellOff,
  EyeOff,
  Flag,
  PinOff,
  Bell,
  Eye,
  Sparkles
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { usePresence } from '@/components/dashboard/presence-provider'
import {
  removeFriend,
  blockUser,
  updateFriendNickname,
  togglePinFriend,
  toggleMuteFriend,
  toggleHideStatus,
  reportUser,
  initiateCall
} from './actions'
import { ProfileCardDialog } from '@/components/dashboard/profile-card-dialog'
import { toast } from 'sonner'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function FriendsList({ friends: initialFriends, view = 'grid' }: { friends: any[]; view?: 'grid' | 'list' }) {
  const [friends, setFriends] = useState(initialFriends)
  const { onlineUsers } = usePresence()

  // Dialog States
  const [isNicknameOpen, setIsNicknameOpen] = useState(false)
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedFriend, setSelectedFriend] = useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedProfile, setSelectedProfile] = useState<any>(null)
  const [tempNickname, setTempNickname] = useState('')
  const [reportReason, setReportReason] = useState('')

  const supabase = createClient()

  useEffect(() => {
    const sorted = [...initialFriends].sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1
      if (!a.is_pinned && b.is_pinned) return 1
      return 0
    })
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFriends(sorted)
  }, [initialFriends])

  useEffect(() => {
    const channel = supabase
      .channel('public:profiles')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
          setFriends((currentFriends) =>
            currentFriends.map((item) => {
              if (item.friend.id === payload.new.id) {
                return { ...item, friend: { ...item.friend, ...payload.new } }
              }
              return item
            })
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  // --- Actions ---
  const handleRemove = async (friendId: string, name: string) => {
    const res = await removeFriend(friendId)
    if (res.error) toast.error(res.error)
    else toast.success(`Removed ${name} from friends`)
  }

  const handleBlock = async (friendId: string, name: string) => {
    const res = await blockUser(friendId)
    if (res.error) toast.error(res.error)
    else toast.success(`Blocked ${name}`)
  }

  const handleCopyUsername = (username: string) => {
    navigator.clipboard.writeText(username)
    toast.success('Username copied to clipboard')
  }

  const handleShareProfile = (username: string) => {
    const url = `${window.location.origin}/profile/${username}`
    navigator.clipboard.writeText(url)
    toast.success('Profile link copied to clipboard')
  }

  const navigate = useNavigate()

  const handleStartCall = async (type: 'video' | 'voice', friendId: string, username: string) => {
    toast.info(`Connecting to ${type} call...`)
    const res = await initiateCall(friendId, type)
    if (res.error) {
      toast.error('Could not connect call')
      return
    }
    navigate(`/dashboard/messages?username=${username}&call=${type}`)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleInvite = (friendId: string) => {
    const dummyLink = `${window.location.origin}/room/invite/${Math.random().toString(36).substring(7)}`
    navigator.clipboard.writeText(dummyLink)
    toast.success('Room invite link copied!')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleTogglePin = async (item: any) => {
    const newStatus = !item.is_pinned
    setFriends((prev) =>
      prev
        .map((f) => (f.id === item.id ? { ...f, is_pinned: newStatus } : f))
        .sort((a, b) => {
          if (
            (a.id === item.id ? newStatus : a.is_pinned) &&
            !(b.id === item.id ? newStatus : b.is_pinned)
          )
            return -1
          if (
            !(a.id === item.id ? newStatus : a.is_pinned) &&
            (b.id === item.id ? newStatus : b.is_pinned)
          )
            return 1
          return 0
        })
    )
    const res = await togglePinFriend(item.friend.id, newStatus)
    if (res.error) toast.error(res.error)
    else toast.success(newStatus ? 'Friend pinned' : 'Friend unpinned')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleToggleMute = async (item: any) => {
    const newStatus = !item.is_muted
    setFriends((prev) => prev.map((f) => (f.id === item.id ? { ...f, is_muted: newStatus } : f)))
    const res = await toggleMuteFriend(item.friend.id, newStatus)
    if (res.error) toast.error(res.error)
    else toast.success(newStatus ? 'Notifications muted' : 'Notifications unmuted')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleToggleHideStatus = async (item: any) => {
    const newStatus = !item.hide_my_status
    setFriends((prev) =>
      prev.map((f) => (f.id === item.id ? { ...f, hide_my_status: newStatus } : f))
    )
    const res = await toggleHideStatus(item.friend.id, newStatus)
    if (res.error) toast.error(res.error)
    else toast.success(newStatus ? 'Status hidden from user' : 'Status visible to user')
  }

  // --- Dialog Handlers ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openNicknameDialog = (item: any) => {
    setSelectedFriend(item)
    setTempNickname(item.nickname || '')
    setIsNicknameOpen(true)
  }

  const submitNickname = async () => {
    if (!selectedFriend) return
    const res = await updateFriendNickname(selectedFriend.friend.id, tempNickname)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Nickname updated')
      setFriends((prev) =>
        prev.map((f) => (f.id === selectedFriend.id ? { ...f, nickname: tempNickname } : f))
      )
      setIsNicknameOpen(false)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openReportDialog = (item: any) => {
    setSelectedFriend(item)
    setReportReason('')
    setIsReportOpen(true)
  }

  const submitReport = async () => {
    if (!selectedFriend || !reportReason.trim()) return
    const res = await reportUser(selectedFriend.friend.id, reportReason)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('User reported. We will review this shortly.')
      setIsReportOpen(false)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleViewProfile = (item: any) => {
    setSelectedFriend(item)
    const isPresent = onlineUsers.has(item.friend.id)
    const dbStatus = item.friend.status
    let realStatus = 'offline'
    if (isPresent && dbStatus !== 'invisible' && dbStatus !== 'offline') {
      realStatus = 'online'
      if (dbStatus === 'in-room' || dbStatus === 'playing') realStatus = 'in-room'
    }
    const profileData = {
      id: item.friend.id,
      username: item.friend.username,
      full_name: item.friend.full_name,
      avatar_url: item.friend.avatar_url,
      banner_url: item.friend.banner_url,
      bio: item.friend.bio,
      status: realStatus,
      status_text: item.friend.status_text,
      status_emoji: item.friend.status_emoji,
      social_links: item.friend.social_links,
      location: item.friend.location,
      website: item.friend.website,
      created_at: item.friend.created_at,
      friendship_created_at: item.created_at
    }
    setSelectedProfile(profileData)
    setIsProfileOpen(true)
  }

  // Status text helper
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getStatusInfo = (item: any) => {
    const isPresent = onlineUsers.has(item.friend.id)
    const dbStatus = item.friend.status
    const isOnline = isPresent && dbStatus !== 'invisible' && dbStatus !== 'offline'
    const isInRoom = isPresent && (dbStatus === 'in-room' || dbStatus === 'playing')

    if (isInRoom) {
      return {
        dotColor: 'bg-violet-500',
        dotGlow: 'shadow-[0_0_6px_rgba(139,92,246,0.5)]',
        text: item.friend.status_text || 'In a Room',
        textColor: 'text-violet-400'
      }
    }
    if (isOnline) {
      return {
        dotColor: 'bg-emerald-500',
        dotGlow: 'shadow-[0_0_6px_rgba(16,185,129,0.5)]',
        text: item.friend.status_text || 'Online',
        textColor: 'text-emerald-400'
      }
    }
    return {
      dotColor: 'bg-zinc-500',
      dotGlow: '',
      text: item.friend.status_text || 'Offline',
      textColor: 'text-muted-foreground'
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ActionMenu = ({ item }: { item: any }) => (
    <>
      <DropdownMenuLabel className="text-xs font-normal text-muted-foreground uppercase tracking-wider mt-1">
        Communication
      </DropdownMenuLabel>
      <DropdownMenuItem asChild className="cursor-pointer gap-2 focus:bg-muted">
        <Link to={`/dashboard/messages?username=${item.friend.username}`}>
          <MessageSquare className="w-4 h-4 text-primary" />
          Message
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem
        className="cursor-pointer gap-2 focus:bg-muted"
        onClick={() => handleStartCall('video', item.friend.id, item.friend.username)}
      >
        <Video className="w-4 h-4 text-purple-400" />
        Video Call
      </DropdownMenuItem>
      <DropdownMenuItem
        className="cursor-pointer gap-2 focus:bg-muted"
        onClick={() => handleStartCall('voice', item.friend.id, item.friend.username)}
      >
        <Phone className="w-4 h-4 text-blue-400" />
        Voice Call
      </DropdownMenuItem>
      <DropdownMenuItem
        className="cursor-pointer gap-2 focus:bg-muted"
        onClick={() => handleInvite(item.friend.id)}
      >
        <UserPlus className="w-4 h-4 text-amber-400" />
        Invite to Room
      </DropdownMenuItem>

      <DropdownMenuSeparator className="bg-border" />

      <DropdownMenuLabel className="text-xs font-normal text-muted-foreground uppercase tracking-wider mt-1">
        Manage
      </DropdownMenuLabel>
      <DropdownMenuItem
        className="cursor-pointer gap-2 focus:bg-muted"
        onClick={() => openNicknameDialog(item)}
      >
        <Edit3 className="w-4 h-4" />
        Set Nickname
      </DropdownMenuItem>
      <DropdownMenuItem
        className="cursor-pointer gap-2 focus:bg-muted"
        onClick={() => handleTogglePin(item)}
      >
        {item.is_pinned ? (
          <>
            <PinOff className="w-4 h-4 text-orange-400" /> Unpin
          </>
        ) : (
          <>
            <Pin className="w-4 h-4" /> Pin
          </>
        )}
      </DropdownMenuItem>
      <DropdownMenuItem
        className="cursor-pointer gap-2 focus:bg-muted"
        onClick={() => handleShareProfile(item.friend.username)}
      >
        <Share2 className="w-4 h-4" />
        Share Profile
      </DropdownMenuItem>
      <DropdownMenuItem
        className="cursor-pointer gap-2 focus:bg-muted"
        onClick={() => handleCopyUsername(item.friend.username)}
      >
        <Copy className="w-4 h-4" />
        Copy Username
      </DropdownMenuItem>
      <DropdownMenuItem
        className="cursor-pointer gap-2 focus:bg-muted"
        onClick={() => handleViewProfile(item)}
      >
        <User className="w-4 h-4" />
        View Profile
      </DropdownMenuItem>

      <DropdownMenuSeparator className="bg-border" />

      <DropdownMenuLabel className="text-xs font-normal text-muted-foreground uppercase tracking-wider mt-1">
        Privacy
      </DropdownMenuLabel>
      <DropdownMenuItem
        className="cursor-pointer gap-2 focus:bg-muted"
        onClick={() => handleToggleMute(item)}
      >
        {item.is_muted ? (
          <>
            <Bell className="w-4 h-4 text-zinc-400" /> Unmute
          </>
        ) : (
          <>
            <BellOff className="w-4 h-4" /> Mute
          </>
        )}
      </DropdownMenuItem>
      <DropdownMenuItem
        className="cursor-pointer gap-2 focus:bg-muted"
        onClick={() => handleToggleHideStatus(item)}
      >
        {item.hide_my_status ? (
          <>
            <Eye className="w-4 h-4 text-zinc-400" /> Show Status
          </>
        ) : (
          <>
            <EyeOff className="w-4 h-4" /> Hide Status
          </>
        )}
      </DropdownMenuItem>
      <DropdownMenuItem
        className="cursor-pointer gap-2 text-rose-400 focus:text-rose-400 focus:bg-rose-500/10"
        onClick={() => handleBlock(item.friend.id, item.friend.full_name)}
      >
        <Ban className="w-4 h-4" />
        Block
      </DropdownMenuItem>
      <DropdownMenuItem
        className="cursor-pointer gap-2 text-rose-400 focus:text-rose-400 focus:bg-rose-500/10"
        onClick={() => openReportDialog(item)}
      >
        <Flag className="w-4 h-4" />
        Report
      </DropdownMenuItem>
      <DropdownMenuItem
        className="cursor-pointer gap-2 text-rose-400 focus:text-rose-400 focus:bg-rose-500/10"
        onClick={() => handleRemove(item.friend.id, item.friend.full_name)}
      >
        <UserMinus className="w-4 h-4" />
        Remove
      </DropdownMenuItem>
    </>
  )

  if (friends.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-border bg-card/50">
        <div className="w-14 h-14 rounded-2xl bg-muted/50 border border-border flex items-center justify-center mb-4">
          <Sparkles className="w-6 h-6 text-muted-foreground/40" strokeWidth={1.5} />
        </div>
        <h3 className="text-base font-medium text-foreground mb-1">No friends yet</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Connect with people using the &quot;Add Friend&quot; button above.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* ─── Friend Cards ─── */}
      <div className={cn(
        "transition-all duration-300",
        view === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
          : "flex flex-col gap-2"
      )}>
        {friends.map((item) => {
          const statusInfo = getStatusInfo(item)
          const displayName = item.nickname || item.friend.full_name || item.friend.username

          return (
            <div
              key={item.friend.id}
              className={cn(
                "group relative border border-border/60 bg-card/40 hover:bg-card/70 hover:border-primary/20 transition-all duration-300",
                view === 'grid'
                  ? "flex flex-col rounded-xl"
                  : "flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-xl p-3 pr-4"
              )}
            >
              {/* Pinned indicator */}
              {item.is_pinned && (
                <div className={cn("absolute z-20", view === 'grid' ? "top-3 right-3" : "top-1.5 left-1.5")}>
                  <Pin className="w-3 h-3 text-orange-400/60 fill-current" />
                </div>
              )}

              {/* ── Top Section: Avatar + Name + Status ── */}
              <div className={cn("flex items-center gap-3.5", view === 'grid' ? "p-4 pb-3" : "pl-1")}>
                {/* Avatar with status dot */}
                <div className="relative shrink-0">
                  <Avatar className="h-12 w-12 ring-2 ring-border/50">
                    <AvatarImage src={item.friend.avatar_url} className="object-cover" />
                    <AvatarFallback className="bg-muted text-muted-foreground text-sm font-medium">
                      {item.friend.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  {/* Status dot on avatar */}
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full ring-2 ring-card bg-card">
                    <span
                      className={cn(
                        'h-2 w-2 rounded-full',
                        statusInfo.dotColor,
                        statusInfo.dotGlow
                      )}
                    />
                  </span>
                </div>

                {/* Name + Status */}
                <div className={cn("min-w-0", view === 'grid' ? "flex-1" : "w-48")}>
                  <h4 className="text-[15px] font-semibold text-foreground truncate leading-tight">
                    {displayName}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 text-xs truncate',
                        statusInfo.textColor
                      )}
                    >
                      <span
                        className={cn(
                          'w-1.5 h-1.5 rounded-full shrink-0',
                          statusInfo.dotColor,
                          statusInfo.dotGlow
                        )}
                      />
                      {statusInfo.text}
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Bottom Section: Action Buttons ── */}
              <div className={cn("flex items-center gap-2", view === 'grid' ? "px-4 pb-4 pt-0 w-full" : "ml-auto")}>
                {/* Message Button */}
                <Button
                  size={view === 'grid' ? 'sm' : 'default'}
                  className={cn(
                    "bg-primary/15 hover:bg-primary/25 text-primary border-0 rounded-lg font-medium gap-1.5 transition-all text-xs",
                    view === 'grid' ? "flex-1 h-8" : "h-9 px-4"
                  )}
                  asChild
                >
                  <Link to={`/dashboard/messages?username=${item.friend.username}`}>
                    <MessageSquare className="w-3.5 h-3.5" strokeWidth={2} />
                    Message
                  </Link>
                </Button>

                {/* Call icon button */}
                <Button
                  size="icon"
                  variant="ghost"
                  className={cn(
                    "shrink-0 text-muted-foreground/50 hover:text-foreground hover:bg-muted/60 rounded-lg transition-all",
                    view === 'grid' ? "h-8 w-8" : "h-9 w-9"
                  )}
                  onClick={() =>
                    handleStartCall('voice', item.friend.id, item.friend.username)
                  }
                >
                  <Phone className="w-3.5 h-3.5" strokeWidth={1.5} />
                </Button>

                {/* More actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className={cn(
                        "shrink-0 text-muted-foreground/50 hover:text-foreground hover:bg-muted/60 rounded-lg transition-all",
                        view === 'grid' ? "h-8 w-8" : "h-9 w-9"
                      )}
                    >
                      <MoreVertical className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-52 bg-popover border-border backdrop-blur-xl"
                  >
                    <ActionMenu item={item} />
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )
        })}
      </div>

      {/* ─── Nickname Dialog ─── */}
      <Dialog open={isNicknameOpen} onOpenChange={setIsNicknameOpen}>
        <DialogContent className="bg-popover border-border text-foreground">
          <DialogHeader>
            <DialogTitle>Set Nickname</DialogTitle>
            <DialogDescription>
              Give your friend a custom nickname. Only you will see this.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nickname</Label>
              <Input
                value={tempNickname}
                onChange={(e) => setTempNickname(e.target.value)}
                placeholder="e.g. Bestie, Gym Buddy..."
                className="bg-muted/50 border-input text-foreground"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsNicknameOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitNickname} className="bg-primary hover:bg-primary/90">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Report Dialog ─── */}
      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="bg-popover border-border text-foreground">
          <DialogHeader>
            <DialogTitle>Report User</DialogTitle>
            <DialogDescription>Please tell us why you are reporting this user.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Describe the issue..."
                className="bg-muted/50 border-input text-foreground min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsReportOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitReport} variant="destructive">
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Profile Dialog ─── */}
      <ProfileCardDialog
        isOpen={isProfileOpen}
        onOpenChange={setIsProfileOpen}
        profile={selectedProfile}
        onMessage={() => {
          if (selectedProfile) {
            navigate(`/dashboard/messages?username=${selectedProfile.username}`)
            setIsProfileOpen(false)
          }
        }}
        onVideoCall={() => {
          if (selectedFriend) {
            handleStartCall('video', selectedFriend.friend.id, selectedFriend.friend.username)
            setIsProfileOpen(false)
          }
        }}
        onVoiceCall={() => {
          if (selectedFriend) {
            handleStartCall('voice', selectedFriend.friend.id, selectedFriend.friend.username)
            setIsProfileOpen(false)
          }
        }}
        onRemoveFriend={() => {
          if (selectedFriend) {
            handleRemove(selectedFriend.friend.id, selectedFriend.friend.full_name)
            setIsProfileOpen(false)
          }
        }}
        onBlockUser={() => {
          if (selectedFriend) {
            handleBlock(selectedFriend.friend.id, selectedFriend.friend.full_name)
            setIsProfileOpen(false)
          }
        }}
        onReportUser={() => {
          if (selectedFriend) {
            openReportDialog(selectedFriend)
            setIsProfileOpen(false)
          }
        }}
      />
    </div>
  )
}
