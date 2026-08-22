'use client'

import { useEffect, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Loader2, MoreVertical, Shield, Trash2, Circle, LayoutGrid, List } from 'lucide-react'
import { getRoomMembers, updateMemberRole, kickMember, RoomRole } from '@/components/rooms/actions'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface RoomMembersListProps {
  roomId: string
  currentUserRole: RoomRole
  onlineUserIds?: string[]
  onSwitchToGrid?: () => void
  onSwitchToList?: () => void
  isGridView?: boolean
  hideHeader?: boolean
  isAIPresent?: boolean
}

type MemberWithProfile = {
  id: string // room_member id
  user_id: string
  role: RoomRole
  joined_at: string
  profile: {
    id: string
    full_name: string | null
    avatar_url: string | null
    email?: string
  }
}

export function RoomMembersList({
  roomId,
  currentUserRole,
  onlineUserIds = [],
  onSwitchToGrid,
  onSwitchToList,
  isGridView = false,
  hideHeader = false,
  isAIPresent = false
}: RoomMembersListProps) {
  const [members, setMembers] = useState<MemberWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const supabase = createClient()

  const fetchMembers = async () => {
    try {
      const data = await getRoomMembers(roomId)
      // Sort: Owner first, then Admins, then Mods, then Members
      const roleOrder: Record<RoomRole, number> = { owner: 0, admin: 1, moderator: 2, member: 3 }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sorted = (data as any[]).sort(
        (a, b) => roleOrder[a.role as RoomRole] - roleOrder[b.role as RoomRole]
      )
      setMembers(sorted)
    } catch (error) {
      console.error(error)
      toast.error('Failed to load members')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMembers()

    // Realtime Subscription
    const channel = supabase
      .channel(`members_list:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_members',
          filter: `room_id=eq.${roomId}`
        },
        () => {
          fetchMembers()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId])

  const handleRoleChange = async (userId: string, newRole: RoomRole) => {
    setActionLoading(userId)
    try {
      await updateMemberRole(roomId, userId, newRole)
      toast.success('Role updated successfully')
      // No need to fetchMembers manually, realtime will catch it, but fast UI update is nice
      // fetchMembers();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleKick = async (userId: string) => {
    if (!confirm('Are you sure you want to kick this user?')) return
    setActionLoading(userId)
    try {
      await kickMember(roomId, userId)
      toast.success('User kicked successfully')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setActionLoading(null)
    }
  }

  const canManageRole = (targetRole: RoomRole) => {
    if (currentUserRole === 'owner') return targetRole !== 'owner'
    if (currentUserRole === 'admin') return targetRole === 'member' || targetRole === 'moderator'
    return false
  }

  const canKick = (targetRole: RoomRole) => {
    if (currentUserRole === 'owner') return targetRole !== 'owner' // Owner can kick everyone else
    if (currentUserRole === 'admin') return targetRole !== 'owner' && targetRole !== 'admin' // Admin can't kick Owner or other Admins
    if (currentUserRole === 'moderator') return targetRole === 'member' // Mod can only kick Members
    return false
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    )
  }

  const displayMembers = isAIPresent
    ? [
        ...members,
        {
          id: 'ai-member',
          user_id: 'vire_ai',
          role: 'member' as RoomRole,
          joined_at: new Date().toISOString(),
          profile: {
            id: 'vire_ai',
            full_name: 'VIRE AI',
            avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=vire'
          }
        }
      ]
    : members

  return (
    <div className="flex flex-col h-full min-h-[300px]">
      {!hideHeader && (
        <div className="px-4 py-3 border-b border-white/5 bg-white/5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-zinc-200">Members</h3>
            {onlineUserIds.length > 0 && (
              <Badge
                variant="outline"
                className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px] h-5"
              >
                {onlineUserIds.length}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onSwitchToGrid && onSwitchToList && (
              <div className="flex items-center p-0.5 bg-black/20 rounded-lg border border-white/5">
                <button
                  onClick={onSwitchToList}
                  className={cn(
                    'p-1 rounded-md transition-all',
                    !isGridView
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-300'
                  )}
                  title="List View"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={onSwitchToGrid}
                  className={cn(
                    'p-1 rounded-md transition-all',
                    isGridView
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-300'
                  )}
                  title="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchMembers}
              disabled={loading}
              className="h-7 w-7 text-xs rounded-full hover:bg-white/10"
            >
              <span className="sr-only">Refresh</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-rotate-cw"
              >
                <path d="M21 12a9 9 0 1 1-9-9c5.2 0 8 3.2 9 8" />
                <path d="M21 3v9h-9" />
              </svg>
            </Button>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {displayMembers.map((member) => {
            const isOnline = member.user_id === 'vire_ai' ? true : onlineUserIds.includes(member.user_id)
            return (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10 border border-white/10 shadow-inner">
                      <AvatarImage src={member.profile.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-zinc-800 to-zinc-900 text-zinc-400 font-medium">
                        {member.profile.full_name?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    {isOnline && (
                      <span
                        className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-zinc-900 rounded-full shadow-lg"
                        title="Online"
                      />
                    )}
                  </div>
                  <div className="grid gap-0.5">
                    <div className="text-sm font-medium text-zinc-100 flex items-center gap-2">
                      {member.profile.full_name || 'Unknown User'}
                      {member.role === 'owner' && (
                        <Shield className="w-3 h-3 text-amber-500 fill-amber-500/20" />
                      )}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {isOnline ? (
                        <span className="text-green-400 font-medium flex items-center gap-1">
                          Online
                        </span>
                      ) : (
                        <span>Joined {new Date(member.joined_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge
                    variant="outline"
                    className={cn(
                      'capitalize border-0 font-medium px-2.5 py-0.5 shadow-sm backdrop-blur-md',
                      member.role === 'owner' &&
                        'bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20',
                      member.role === 'admin' &&
                        'bg-red-500/10 text-red-500 ring-1 ring-red-500/20',
                      member.role === 'moderator' &&
                        'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20',
                      member.role === 'member' &&
                        'bg-zinc-500/10 text-zinc-400 ring-1 ring-zinc-500/20'
                    )}
                  >
                    {member.role}
                  </Badge>

                  {/* Actions */}
                  {(canManageRole(member.role) || canKick(member.role)) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-zinc-500 hover:text-white hover:bg-white/10 rounded-full"
                          disabled={actionLoading === member.user_id}
                        >
                          {actionLoading === member.user_id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <MoreVertical className="w-4 h-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-48 bg-zinc-950/95 backdrop-blur-xl border-white/10 text-white shadow-2xl rounded-xl p-1"
                      >
                        {canManageRole(member.role) && (
                          <>
                            <div className="px-2 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                              Change Role
                            </div>
                            {currentUserRole !== 'admin' && (
                              <DropdownMenuItem
                                onClick={() => handleRoleChange(member.user_id, 'admin')}
                                className="rounded-lg focus:bg-white/10 focus:text-white cursor-pointer inset-0"
                              >
                                Make Admin
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleRoleChange(member.user_id, 'moderator')}
                              className="rounded-lg focus:bg-white/10 focus:text-white cursor-pointer"
                            >
                              {member.role === 'member'
                                ? 'Promote to Moderator'
                                : 'Set to Moderator'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleRoleChange(member.user_id, 'member')}
                              className="rounded-lg focus:bg-white/10 focus:text-white cursor-pointer"
                            >
                              Demote to Member
                            </DropdownMenuItem>
                            <div className="h-px bg-white/10 my-1 mx-2" />
                          </>
                        )}

                        {canKick(member.role) && (
                          <DropdownMenuItem
                            className="text-red-400 focus:text-red-300 focus:bg-red-500/20 rounded-lg cursor-pointer"
                            onClick={() => handleKick(member.user_id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Kick User
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
