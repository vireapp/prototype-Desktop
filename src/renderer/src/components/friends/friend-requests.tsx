'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { acceptFriendRequest, rejectFriendRequest } from './actions'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { X, Check, UserPlus, Clock } from 'lucide-react'
import { toast } from 'sonner'

export function FriendRequestList({ userId }: { userId: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [requests, setRequests] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    const fetchRequests = async () => {
      const { data } = await supabase
        .from('friend_requests')
        .select(
          `
                    id,
                    created_at,
                    sender:profiles!sender_id(*)
                `
        )
        .eq('receiver_id', userId)
        .eq('status', 'pending')

      setRequests(data || [])
    }

    fetchRequests()

    const channel = supabase
      .channel('friend_reqs_list')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friend_requests',
          filter: `receiver_id=eq.${userId}`
        },
        () => {
          fetchRequests()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase])

  const handleAccept = async (id: string) => {
    const res = await acceptFriendRequest(id)
    if (res.error) toast.error(res.error)
    else {
      toast.success('Request accepted!')
      setRequests((prev) => prev.filter((r) => r.id !== id))
    }
  }

  const handleReject = async (id: string) => {
    const res = await rejectFriendRequest(id)
    if (res.error) toast.error(res.error)
    else {
      toast.success('Request rejected')
      setRequests((prev) => prev.filter((r) => r.id !== id))
    }
  }

  if (requests.length === 0) {
    return (
      <div className="col-span-full flex flex-col items-center justify-center py-20 text-center rounded-3xl border border-border bg-muted/5">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Clock className="w-6 h-6 text-muted-foreground opacity-50" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">All caught up</h3>
        <p className="text-muted-foreground max-w-sm">No waiting friend requests.</p>
      </div>
    )
  }

  return (
    <>
      {requests.map((req) => (
        <div
          key={req.id}
          className="group relative flex flex-col p-4 rounded-xl border border-border bg-card/50 hover:bg-card hover:border-primary/15 transition-all duration-300"
        >
          <div className="flex items-start gap-3.5 mb-4">
            <Avatar className="w-11 h-11 ring-1 ring-border">
              <AvatarImage src={req.sender.avatar_url} />
              <AvatarFallback className="bg-muted text-muted-foreground font-medium text-sm">
                {req.sender.username?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm text-foreground truncate pr-2">
                  {req.sender.full_name || req.sender.username}
                </p>
                <span className="text-[9px] text-primary font-semibold border border-primary/20 bg-primary/5 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                  New
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 font-mono">@{req.sender.username}</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1.5">
                {new Date(req.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-3 border-t border-border">
            <Button
              className="flex-1 h-8 bg-muted/50 hover:bg-destructive/10 text-muted-foreground hover:text-destructive border border-border hover:border-destructive/20 transition-all text-xs"
              onClick={() => handleReject(req.id)}
            >
              <X className="w-3.5 h-3.5 mr-1" /> Decline
            </Button>
            <Button
              className="flex-1 h-8 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:border-primary/30 transition-all text-xs font-medium"
              onClick={() => handleAccept(req.id)}
            >
              <Check className="w-3.5 h-3.5 mr-1" /> Accept
            </Button>
          </div>
        </div>
      ))}
    </>
  )
}
