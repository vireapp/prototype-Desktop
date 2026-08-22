'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  DialogDescription,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { updateRoom, deleteRoom, RoomRole, getRoomBans, unbanRoomUser } from '@/components/rooms/actions'
import { toast } from 'sonner'
import {
  Settings,
  Loader2,
  RefreshCw,
  Copy,
  Check,
  Trash2,
  Lock,
  UserCog,
  Volume2,
  Users,
  LayoutDashboard,
  ShieldCheck,
  Palette,
  Monitor,
  MessageSquare as ChatIcon,
  Skull,
  Zap,
  Globe,
  Bot,
  Ban
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
const useRouter = () => {
  const navigate = useNavigate()
  return {
    push: (path: string) => navigate(path),
    replace: (path: string) => navigate(path, { replace: true }),
    refresh: () => window.location.reload(),
    back: () => navigate(-1)
  }
}
import { RoomMembersList } from './room-members-list'
import { cn } from '@/lib/utils'

interface RoomSettingsDialogProps {
  room: {
    id: string
    name: string
    description: string | null
    is_public: boolean
    code: string | null
    chat_settings?: {
      slowModeSeconds: number
      emojiOnly: boolean
      blockLinks: boolean
      welcomeMessage?: string
    }
    permissions?: {
      canScreenShare: string
      canUseMic: string
      canUseCamera: string
      maxParticipants?: number
      lockRoom?: boolean
      waitingRoom?: boolean
      syncActivities?: boolean
      aiSettings?: {
        aiCanChangeMusic: boolean
        aiCanChangeTheme: boolean
        aiCanSwitchActivity: boolean
        aiCanTriggerReactions: boolean
        aiCanKickUsers: boolean
        aiCanLockRoom: boolean
        aiCanClearChat: boolean
        aiCanUpdateRoomInfo: boolean
      }
    }
    appearance?: {
      theme: string
      background: string
      hideParticipants?: boolean
      videoQuality?: string
      noiseSuppression?: boolean
    }
  }
  userRole?: RoomRole
  personalSettings?: {
    masterVolume: number
    bandwidthSaver: boolean
    hideReactions: boolean
    compactMode: boolean
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUpdatePersonalSettings?: (settings: any) => void
  children?: React.ReactNode
  userRegion?: { code: string; name: string } | null
  onRefreshRegion?: () => void
}

export function RoomSettingsDialog({
  room,
  userRole = 'member',
  personalSettings,
  onUpdatePersonalSettings,
  children,
  userRegion,
  onRefreshRegion
}: RoomSettingsDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [name, setName] = useState(room.name)
  const [description, setDescription] = useState(room.description || '')
  const [isPublic, setIsPublic] = useState(room.is_public)

  // Chat Settings State
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [slowMode, setSlowMode] = useState(room.chat_settings?.slowModeSeconds || 0)
  const [emojiOnly, setEmojiOnly] = useState(room.chat_settings?.emojiOnly || false)
  const [blockLinks, setBlockLinks] = useState(room.chat_settings?.blockLinks || false)
  const [welcomeMessage, setWelcomeMessage] = useState(room.chat_settings?.welcomeMessage || '')

  // Permissions State
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [canScreenShare, setCanScreenShare] = useState(room.permissions?.canScreenShare || 'all')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [canUseMic, setCanUseMic] = useState(room.permissions?.canUseMic || 'all')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [canUseCamera, setCanUseCamera] = useState(room.permissions?.canUseCamera || 'all')
  const [maxParticipants, setMaxParticipants] = useState(room.permissions?.maxParticipants || 50)

  // New Permissions State
  const [lockRoom, setLockRoom] = useState(room.permissions?.lockRoom || false)
  const [waitingRoom, setWaitingRoom] = useState(room.permissions?.waitingRoom || false)
  const [syncActivities, setSyncActivities] = useState(room.permissions?.syncActivities || false)

  // Granular AI Permissions State
  const [aiCanChangeMusic, setAiCanChangeMusic] = useState(room.permissions?.aiSettings?.aiCanChangeMusic ?? true)
  const [aiCanChangeTheme, setAiCanChangeTheme] = useState(room.permissions?.aiSettings?.aiCanChangeTheme ?? true)
  const [aiCanSwitchActivity, setAiCanSwitchActivity] = useState(room.permissions?.aiSettings?.aiCanSwitchActivity ?? true)
  const [aiCanTriggerReactions, setAiCanTriggerReactions] = useState(room.permissions?.aiSettings?.aiCanTriggerReactions ?? true)
  
  const [aiCanKickUsers, setAiCanKickUsers] = useState(room.permissions?.aiSettings?.aiCanKickUsers ?? false)
  const [aiCanLockRoom, setAiCanLockRoom] = useState(room.permissions?.aiSettings?.aiCanLockRoom ?? false)
  const [aiCanClearChat, setAiCanClearChat] = useState(room.permissions?.aiSettings?.aiCanClearChat ?? false)
  const [aiCanUpdateRoomInfo, setAiCanUpdateRoomInfo] = useState(room.permissions?.aiSettings?.aiCanUpdateRoomInfo ?? false)

  // Appearance State
  const [hideParticipants, setHideParticipants] = useState(
    room.appearance?.hideParticipants || false
  )

  // Banned Users State
  const [bannedUsers, setBannedUsers] = useState<any[]>([])
  
  useEffect(() => {
    if (userRole === 'owner' || userRole === 'admin' || userRole === 'moderator') {
      getRoomBans(room.id).then((bans) => {
        setBannedUsers(bans)
      }).catch((e) => console.error("Error fetching bans", e))
    }
  }, [room.id, userRole])

  const handleUnban = async (userId: string) => {
    try {
      await unbanRoomUser(room.id, userId)
      setBannedUsers(prev => prev.filter(b => b.user_id !== userId))
      toast.success('User unbanned')
    } catch (e: any) {
      toast.error(e.message || 'Failed to unban user')
    }
  }

  // Media Settings (stored in appearance for now)
  const [videoQuality, setVideoQuality] = useState(room.appearance?.videoQuality || '720p')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [noiseSuppression, setNoiseSuppression] = useState(
    room.appearance?.noiseSuppression ?? true
  )

  // Local helper for personal settings
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlePersonalChange = (key: string, value: any) => {
    if (onUpdatePersonalSettings && personalSettings) {
      onUpdatePersonalSettings({
        ...personalSettings,
        [key]: value
      })
    }
  }

  const [copied, setCopied] = useState(false)
  const router = useRouter()

  // Role Checks
  const canManageGeneral = userRole === 'owner'
  const canManageAccess = userRole === 'owner' || userRole === 'admin'
  const canManageSettings = userRole === 'owner' || userRole === 'admin' || userRole === 'moderator'

  const handleSave = async () => {
    setLoading(true)
    try {
      await updateRoom(room.id, {
        name,
        description,
        isPublic,
        chatSettings: {
          slowModeSeconds: Number(slowMode),
          emojiOnly,
          blockLinks,
          welcomeMessage
        },
        permissions: {
          canScreenShare,
          canUseMic,
          canUseCamera,
          maxParticipants: Number(maxParticipants),
          lockRoom,
          waitingRoom,
          syncActivities,
          aiSettings: {
            aiCanChangeMusic,
            aiCanChangeTheme,
            aiCanSwitchActivity,
            aiCanTriggerReactions,
            aiCanKickUsers,
            aiCanLockRoom,
            aiCanClearChat,
            aiCanUpdateRoomInfo
          }
        },
        appearance: {
          theme: 'cyberpunk', // Default theme
          background: 'default', // Default background
          hideParticipants,
          videoQuality,
          noiseSuppression
        }
      })
      toast.success('Room settings updated')
      setOpen(false)
      router.refresh()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.message || 'Failed to update settings')
    } finally {
      setLoading(false)
    }
  }

  const handleRegenerateCode = async () => {
    if (!confirm('This will invalidate the old code. Continue?')) return
    setLoading(true)
    try {
      await updateRoom(room.id, {
        name,
        description,
        isPublic,
        regenerateCode: true
      })
      toast.success('Room code regenerated')
      router.refresh()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteRoom(room.id)
      toast.success('Room deleted successfully')
      router.push('/dashboard/rooms')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete room')
      setIsDeleting(false)
    }
  }

  const copyCode = () => {
    if (room.code) {
      navigator.clipboard.writeText(room.code)
      setCopied(true)
      toast.success('Code copied')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen} modal={false}>
      <DialogTrigger asChild>
        {children || (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        className="bg-black/95 dark:bg-black/95 border-white/10 text-white backdrop-blur-2xl sm:max-w-[800px] h-[80vh] sm:h-[600px] shadow-2xl p-0 gap-0 overflow-hidden flex flex-col sm:flex-row"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <Tabs defaultValue="personal" className="w-full h-full flex flex-col sm:flex-row">
          {/* Sidebar */}
          <div className="w-full sm:w-[240px] border-b sm:border-b-0 sm:border-r border-white/10 flex flex-col bg-white/5 shrink-0">
            <div className="p-4 border-b border-white/5 shrink-0">
              <DialogTitle className="text-sm font-medium text-zinc-400 uppercase tracking-widest pl-2">
                Settings
              </DialogTitle>
            </div>
            {/* Scrollable Tabs Container */}
            <div className="w-full overflow-x-auto no-scrollbar bg-transparent">
              <TabsList className="flex flex-row sm:flex-col justify-start h-auto bg-transparent p-2 gap-1 w-max sm:w-full">
                <TabsTrigger
                  value="personal"
                  className="flex-shrink-0 min-w-[100px] sm:min-w-0 w-auto sm:w-full justify-center sm:justify-start px-3 py-2 text-sm data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400 rounded-md whitespace-nowrap"
                >
                  <UserCog className="w-4 h-4 mr-2" /> Personal
                </TabsTrigger>

                {canManageSettings && (
                  <TabsTrigger
                    value="members"
                    className="flex-shrink-0 min-w-[100px] sm:min-w-0 w-auto sm:w-full justify-center sm:justify-start px-3 py-2 text-sm data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400 rounded-md whitespace-nowrap"
                  >
                    <Users className="w-4 h-4 mr-2" /> Members
                  </TabsTrigger>
                )}

                {canManageGeneral && (
                  <div className="py-2 px-2 hidden sm:block">
                    <div className="h-px bg-white/10 my-1" />
                  </div>
                )}

                {canManageGeneral && (
                  <TabsTrigger
                    value="general"
                    className="flex-shrink-0 min-w-[100px] sm:min-w-0 w-auto sm:w-full justify-center sm:justify-start px-3 py-2 text-sm data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400 rounded-md whitespace-nowrap"
                  >
                    <LayoutDashboard className="w-4 h-4 mr-2" /> General
                  </TabsTrigger>
                )}

                {canManageAccess && (
                  <TabsTrigger
                    value="access"
                    className="flex-shrink-0 min-w-[100px] sm:min-w-0 w-auto sm:w-full justify-center sm:justify-start px-3 py-2 text-sm data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400 rounded-md whitespace-nowrap"
                  >
                    <Lock className="w-4 h-4 mr-2" /> Access
                  </TabsTrigger>
                )}

                {canManageSettings && (
                  <>
                    <div className="py-2 px-2 hidden sm:block">
                      <div className="h-px bg-white/10 my-1" />
                    </div>
                    <TabsTrigger
                      value="chat"
                      className="flex-shrink-0 min-w-[100px] sm:min-w-0 w-auto sm:w-full justify-center sm:justify-start px-3 py-2 text-sm data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400 rounded-md whitespace-nowrap"
                    >
                      <ChatIcon className="w-4 h-4 mr-2" /> Chat
                    </TabsTrigger>
                    <TabsTrigger
                      value="perms"
                      className="flex-shrink-0 min-w-[100px] sm:min-w-0 w-auto sm:w-full justify-center sm:justify-start px-3 py-2 text-sm data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400 rounded-md whitespace-nowrap"
                    >
                      <ShieldCheck className="w-4 h-4 mr-2" /> Permissions
                    </TabsTrigger>
                    <TabsTrigger
                      value="av"
                      className="flex-shrink-0 min-w-[100px] sm:min-w-0 w-auto sm:w-full justify-center sm:justify-start px-3 py-2 text-sm data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400 rounded-md whitespace-nowrap"
                    >
                      <Monitor className="w-4 h-4 mr-2" /> Media
                    </TabsTrigger>
                    <TabsTrigger
                      value="look"
                      className="flex-shrink-0 min-w-[100px] sm:min-w-0 w-auto sm:w-full justify-center sm:justify-start px-3 py-2 text-sm data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400 rounded-md whitespace-nowrap"
                    >
                      <Palette className="w-4 h-4 mr-2" /> Look
                    </TabsTrigger>
                    <TabsTrigger
                      value="ai"
                      className="flex-shrink-0 min-w-[100px] sm:min-w-0 w-auto sm:w-full justify-center sm:justify-start px-3 py-2 text-sm data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400 rounded-md whitespace-nowrap"
                    >
                      <Bot className="w-4 h-4 mr-2" /> AI Settings
                    </TabsTrigger>
                  </>
                )}

                {canManageGeneral && (
                  <div className="mt-auto pt-4 hidden sm:block">
                    <TabsTrigger
                      value="danger"
                      className="w-full justify-start px-3 py-2 text-sm data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400 text-zinc-500 hover:text-red-400 rounded-md"
                    >
                      <Skull className="w-4 h-4 mr-2" /> Danger Zone
                    </TabsTrigger>
                  </div>
                )}
                {canManageGeneral && (
                  <TabsTrigger
                    value="danger"
                    className="flex-shrink-0 sm:hidden min-w-[100px] w-auto justify-center px-3 py-2 text-sm data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400 text-zinc-500 hover:text-red-400 rounded-md whitespace-nowrap"
                  >
                    <Skull className="w-4 h-4 mr-2" /> Danger
                  </TabsTrigger>
                )}
              </TabsList>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex flex-col min-h-0 bg-black/40 relative">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Header in Content */}
              {/* Tabs Content */}
              <TabsContent
                value="personal"
                className="mt-0 space-y-6 animate-in fade-in zoom-in-95 duration-200"
              >
                <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                  <UserCog className="w-6 h-6 text-zinc-400" />
                  <div>
                    <h2 className="text-lg font-medium text-white">Personal Settings</h2>
                    <p className="text-xs text-zinc-500">
                      Customize your experience. These only apply to you.
                    </p>
                  </div>
                </div>
                {/* ... Content ... */}
                <div className="space-y-4">
                  <div className="bg-white/5 border border-white/5 rounded-xl p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-zinc-200">Master Volume</Label>
                        <p className="text-[10px] text-zinc-500">
                          Global volume for media and voice.
                        </p>
                      </div>
                      <span className="text-sm font-mono text-zinc-400 bg-black/20 px-2 py-0.5 rounded">
                        {personalSettings?.masterVolume || 100}%
                      </span>
                    </div>
                    <Input
                      type="range"
                      min="0"
                      max="100"
                      value={personalSettings?.masterVolume || 100}
                      onChange={(e) => handlePersonalChange('masterVolume', Number(e.target.value))}
                      className="h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <Volume2 className="w-5 h-5 text-emerald-400" />
                        <Switch
                          checked={personalSettings?.bandwidthSaver || false}
                          onCheckedChange={(c) => handlePersonalChange('bandwidthSaver', c)}
                        />
                      </div>
                      <div>
                        <Label className="text-zinc-200">Bandwidth Saver</Label>
                        <p className="text-[10px] text-zinc-500 mt-1">
                          Turn off incoming video streams to save data.
                        </p>
                      </div>
                    </div>

                    <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <Zap className="w-5 h-5 text-amber-400" />
                        <Switch
                          checked={personalSettings?.hideReactions || false}
                          onCheckedChange={(c) => handlePersonalChange('hideReactions', c)}
                        />
                      </div>
                      <div>
                        <Label className="text-zinc-200">Hide Reactions</Label>
                        <p className="text-[10px] text-zinc-500 mt-1">
                          Hide floating emojis / confetti.
                        </p>
                      </div>
                    </div>

                    <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <Globe className="w-5 h-5 text-blue-400" />
                          <Label className="text-zinc-200">Region Detection</Label>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs border-white/10 hover:bg-white/10"
                          onClick={onRefreshRegion}
                        >
                          <RefreshCw className="w-3 h-3 mr-2" />
                          Refresh
                        </Button>
                      </div>
                      <div className="text-sm text-zinc-400 bg-black/20 p-2 rounded-md font-mono flex justify-between">
                        <span>Detected:</span>
                        <span className="text-white">
                          {userRegion
                            ? `${userRegion.name} (${userRegion.code.toUpperCase()})`
                            : 'Detecting...'}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500">
                        Used to optimize Virtual TV content for your location.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent
                value="members"
                className="mt-0 space-y-6 animate-in fade-in zoom-in-95 duration-200"
              >
                <div className="flex items-center justify-between pb-4 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <Users className="w-6 h-6 text-zinc-400" />
                    <div>
                      <h2 className="text-lg font-medium text-white">Room Members</h2>
                      <p className="text-xs text-zinc-500">Manage participants and roles.</p>
                    </div>
                  </div>
                  {canManageSettings && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20"
                      onClick={async () => {
                        if (confirm("Mute everyone's microphone?")) {
                          const { createClient } = await import('@/lib/supabase/client')
                          const sb = createClient()
                          await sb.channel(`room-controls:${room.id}`).send({
                            type: 'broadcast',
                            event: 'mute_all',
                            payload: { target: 'all' }
                          })
                          toast.success('Mute all command sent.')
                        }
                      }}
                    >
                      <Volume2 className="w-4 h-4 mr-2" /> Mute All
                    </Button>
                  )}
                </div>
                <div className="bg-white/5 border border-white/5 rounded-xl overflow-hidden">
                  <RoomMembersList roomId={room.id} currentUserRole={userRole} />
                </div>
              </TabsContent>

              {/* General Tab */}
              <TabsContent
                value="general"
                className="mt-0 space-y-6 animate-in fade-in zoom-in-95 duration-200"
              >
                <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                  <LayoutDashboard className="w-6 h-6 text-zinc-400" />
                  <div>
                    <h2 className="text-lg font-medium text-white">General</h2>
                    <p className="text-xs text-zinc-500">Basic room information.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-200">Room Name</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-white/5 border-white/10 text-white focus:border-white/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-200">Description</Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="bg-white/5 border-white/10 text-white focus:border-white/20 min-h-[100px]"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Access Tab (Modified) */}
              <TabsContent
                value="access"
                className="mt-0 space-y-6 animate-in fade-in zoom-in-95 duration-200"
              >
                <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                  <Lock className="w-6 h-6 text-zinc-400" />
                  <div>
                    <h2 className="text-lg font-medium text-white">Access Control</h2>
                    <p className="text-xs text-zinc-500">Manage visibility and entry.</p>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="space-y-0.5">
                      <Label className="text-base text-white">Public Room</Label>
                      <p className="text-xs text-zinc-400">Visible to the community.</p>
                    </div>
                    <Switch
                      checked={isPublic}
                      onCheckedChange={setIsPublic}
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </div>

                  {!isPublic && (
                    <div className="pt-4 border-t border-white/5 animate-in slide-in-from-top-2 fade-in">
                      <Label className="mb-2 block text-zinc-400">Invite Code</Label>
                      <div className="flex gap-2">
                        <div className="flex-1 bg-black/40 border border-white/10 rounded-md flex items-center justify-center font-mono text-xl tracking-widest text-emerald-400 h-12">
                          {room.code || '...'}
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-12 w-12 border-white/10 bg-transparent text-white hover:bg-white/10"
                          onClick={copyCode}
                        >
                          {copied ? (
                            <Check className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <Copy className="w-5 h-5" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-12 w-12 border-white/10 bg-transparent text-white hover:bg-white/10"
                          onClick={handleRegenerateCode}
                        >
                          <RefreshCw className={cn('w-5 h-5', loading && 'animate-spin')} />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-white">Lock Room</Label>
                    <p className="text-xs text-zinc-400">Prevent anyone new from joining.</p>
                  </div>
                  <Switch
                    checked={lockRoom}
                    onCheckedChange={setLockRoom}
                    className="data-[state=checked]:bg-red-500"
                  />
                </div>

                <div className="bg-white/5 border border-white/5 rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-white/5 flex items-center gap-2">
                    <Ban className="w-5 h-5 text-red-400" />
                    <div>
                      <h3 className="text-sm font-medium text-white">Banned Users</h3>
                      <p className="text-xs text-zinc-400">Users permanently removed from this room.</p>
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    {bannedUsers.length === 0 ? (
                      <div className="text-center py-4 text-xs text-zinc-500">No banned users</div>
                    ) : (
                      bannedUsers.map((ban) => (
                        <div key={ban.user_id} className="flex items-center justify-between p-2 rounded-lg bg-black/20 border border-white/5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center">
                              {ban.profile?.avatar_url ? (
                                <img src={ban.profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xs text-white">{ban.profile?.full_name?.charAt(0) || ban.profile?.username?.charAt(0) || '?'}</span>
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm text-white">{ban.profile?.full_name || ban.profile?.username || 'Unknown User'}</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs text-zinc-400 hover:text-white hover:bg-white/10"
                            onClick={() => handleUnban(ban.user_id)}
                          >
                            Unban
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Chat Tab - Simplified */}
              <TabsContent
                value="chat"
                className="mt-0 space-y-6 animate-in fade-in zoom-in-95 duration-200"
              >
                <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                  <ChatIcon className="w-6 h-6 text-zinc-400" />
                  <div>
                    <h2 className="text-lg font-medium text-white">Chat Settings</h2>
                    <p className="text-xs text-zinc-500">Customize the chat experience.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-200">Welcome Message</Label>
                    <Textarea
                      value={welcomeMessage}
                      onChange={(e) => setWelcomeMessage(e.target.value)}
                      className="bg-white/5 border-white/10 text-white focus:border-white/20 min-h-[80px]"
                      placeholder="Hello everyone! Welcome to..."
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-white/5 p-3 rounded-lg flex items-center justify-between">
                      <Label className="text-zinc-300">Block Links</Label>
                      <Switch checked={blockLinks} onCheckedChange={setBlockLinks} />
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg flex items-center justify-between">
                      <Label className="text-zinc-300">Emoji Only</Label>
                      <Switch checked={emojiOnly} onCheckedChange={setEmojiOnly} />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Perms Tab - Simplified */}
              <TabsContent
                value="perms"
                className="mt-0 space-y-6 animate-in fade-in zoom-in-95 duration-200"
              >
                <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                  <ShieldCheck className="w-6 h-6 text-zinc-400" />
                  <div>
                    <h2 className="text-lg font-medium text-white">Permissions</h2>
                    <p className="text-xs text-zinc-500">What can people do?</p>
                  </div>
                </div>
                <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-zinc-200">Max Participants</Label>
                    <Input
                      type="number"
                      value={maxParticipants}
                      onChange={(e) => setMaxParticipants(Number(e.target.value))}
                      className="w-24 bg-black/20 border-white/10 text-white text-center"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <Label className="text-zinc-200">Waiting Room</Label>
                    <Switch checked={waitingRoom} onCheckedChange={setWaitingRoom} />
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="space-y-0.5">
                      <Label className="text-zinc-200">Sync Activities</Label>
                      {/* eslint-disable-next-line react/no-unescaped-entities */}
                      <p className="text-[10px] text-zinc-400">
                        Force everyone to follow host's activity.
                      </p>
                    </div>
                    <Switch
                      checked={syncActivities}
                      onCheckedChange={setSyncActivities}
                      className="data-[state=checked]:bg-blue-500"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* AV Tab */}
              <TabsContent
                value="av"
                className="mt-0 space-y-6 animate-in fade-in zoom-in-95 duration-200"
              >
                <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                  <Monitor className="w-6 h-6 text-zinc-400" />
                  <div>
                    <h2 className="text-lg font-medium text-white">Audio & Video</h2>
                    <p className="text-xs text-zinc-500">Default media settings.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-200">Default Quality</Label>
                    <Select value={videoQuality} onValueChange={setVideoQuality}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="360p">360p</SelectItem>
                        <SelectItem value="720p">720p</SelectItem>
                        <SelectItem value="1080p">1080p</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              {/* Look Tab */}
              <TabsContent
                value="look"
                className="mt-0 space-y-6 animate-in fade-in zoom-in-95 duration-200"
              >
                <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                  <Palette className="w-6 h-6 text-zinc-400" />
                  <div>
                    <h2 className="text-lg font-medium text-white">Appearance</h2>
                    <p className="text-xs text-zinc-500">Customize room visuals.</p>
                  </div>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center justify-between">
                  <Label className="text-zinc-200">Hide Participants (Focus Mode)</Label>
                  <Switch checked={hideParticipants} onCheckedChange={setHideParticipants} />
                </div>
              </TabsContent>

              {/* AI Settings Tab */}
              <TabsContent
                value="ai"
                className="mt-0 space-y-6 animate-in fade-in zoom-in-95 duration-200"
              >
                <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                  <Bot className="w-6 h-6 text-zinc-400" />
                  <div>
                    <h2 className="text-lg font-medium text-white">AI Permissions</h2>
                    <p className="text-xs text-zinc-500">
                      Control what the AI companion (VIRE) can do in this room.
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Vibe Controls */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-zinc-400">Vibe & Environment</h3>
                    
                    <div className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/5">
                      <div className="space-y-0.5">
                        <Label className="text-white">Change Music</Label>
                        <p className="text-xs text-zinc-500">Allow AI to play, pause, or change the track.</p>
                      </div>
                      <Switch checked={aiCanChangeMusic} onCheckedChange={setAiCanChangeMusic} />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/5">
                      <div className="space-y-0.5">
                        <Label className="text-white">Change Theme</Label>
                        <p className="text-xs text-zinc-500">Allow AI to change the room's visual theme.</p>
                      </div>
                      <Switch checked={aiCanChangeTheme} onCheckedChange={setAiCanChangeTheme} />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/5">
                      <div className="space-y-0.5">
                        <Label className="text-white">Switch Activity</Label>
                        <p className="text-xs text-zinc-500">Allow AI to launch games or apps.</p>
                      </div>
                      <Switch checked={aiCanSwitchActivity} onCheckedChange={setAiCanSwitchActivity} />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/5">
                      <div className="space-y-0.5">
                        <Label className="text-white">Trigger Reactions</Label>
                        <p className="text-xs text-zinc-500">Allow AI to fire confetti and emojis.</p>
                      </div>
                      <Switch checked={aiCanTriggerReactions} onCheckedChange={setAiCanTriggerReactions} />
                    </div>
                  </div>

                  {/* Moderation Controls */}
                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <h3 className="text-sm font-semibold text-red-400/80">Moderation (Admin Only)</h3>
                    <p className="text-xs text-zinc-500 mb-2">
                      Even if enabled, AI will only execute these for Admins/Owners.
                    </p>

                    <div className="flex items-center justify-between p-3 rounded-lg border border-red-500/10 bg-red-500/5">
                      <div className="space-y-0.5">
                        <Label className="text-red-200">Kick Users</Label>
                        <p className="text-xs text-red-400/60">Allow AI to kick unruly users.</p>
                      </div>
                      <Switch checked={aiCanKickUsers} onCheckedChange={setAiCanKickUsers} />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border border-red-500/10 bg-red-500/5">
                      <div className="space-y-0.5">
                        <Label className="text-red-200">Lock Room</Label>
                        <p className="text-xs text-red-400/60">Allow AI to lock/unlock the room.</p>
                      </div>
                      <Switch checked={aiCanLockRoom} onCheckedChange={setAiCanLockRoom} />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border border-red-500/10 bg-red-500/5">
                      <div className="space-y-0.5">
                        <Label className="text-red-200">Clear Chat</Label>
                        <p className="text-xs text-red-400/60">Allow AI to clear the room chat.</p>
                      </div>
                      <Switch checked={aiCanClearChat} onCheckedChange={setAiCanClearChat} />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border border-red-500/10 bg-red-500/5">
                      <div className="space-y-0.5">
                        <Label className="text-red-200">Update Info</Label>
                        <p className="text-xs text-red-400/60">Allow AI to rename the room or update description.</p>
                      </div>
                      <Switch checked={aiCanUpdateRoomInfo} onCheckedChange={setAiCanUpdateRoomInfo} />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Danger Tab */}
              <TabsContent
                value="danger"
                className="mt-0 space-y-6 animate-in fade-in zoom-in-95 duration-200"
              >
                <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                  <Skull className="w-6 h-6 text-red-400" />
                  <div>
                    <h2 className="text-lg font-medium text-red-500">Danger Zone</h2>
                    <p className="text-xs text-zinc-500">Destructive actions.</p>
                  </div>
                </div>
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl space-y-4">
                  <h3 className="text-white font-medium">Delete Room</h3>
                  <p className="text-sm text-zinc-400">
                    Permanently delete this room and all its data. This action cannot be undone.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="w-full"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    Delete Room
                  </Button>
                </div>
              </TabsContent>
            </div>

            {/* Footer with Save Action */}
            <div className="shrink-0 p-4 bg-black/60 backdrop-blur-xl border-t border-white/10 flex justify-end gap-2 z-10 w-full">
              <Button
                variant="ghost"
                onClick={() => setOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading}
                className="bg-white text-black hover:bg-zinc-200"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Save Changes
              </Button>
            </div>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
