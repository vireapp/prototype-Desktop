'use client'

import { useState } from 'react'
import { searchUsers, sendFriendRequest } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { UserPlus, Search, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function AddFriendDialog({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [results, setResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSearching(true)

    const formData = new FormData()
    formData.append('query', searchQuery)

    const res = await searchUsers(formData)
    setIsSearching(false)
    if (res.error) {
      toast.error(res.error)
      setResults([])
    } else {
      setResults(res.users || [])
    }
  }

  const handleSendRequest = async (receiverId: string) => {
    const formData = new FormData()
    formData.append('receiverId', receiverId)
    const res = await sendFriendRequest(formData)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Friend request sent!')
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground font-medium rounded-xl shadow-lg shadow-primary/20 transition-all text-sm px-5 h-9">
          <UserPlus className="w-4 h-4" strokeWidth={2} /> Add Friend
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-popover/95 border-border backdrop-blur-xl shadow-2xl text-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl font-light tracking-wide">Add Friend</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Search for people by their username to connect.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                name="query"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search username..."
                required
                minLength={3}
                className="pl-9 bg-muted/50 border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-emerald-500/30"
              />
            </div>
            <Button
              type="submit"
              disabled={isSearching}
              className="bg-muted hover:bg-muted/80 text-foreground border border-border"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
            </Button>
          </form>

          <ScrollArea className="max-h-[300px] -mx-6 px-6">
            <div className="space-y-2">
              {results.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 ring-1 ring-border">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback className="bg-muted text-muted-foreground">
                        {user.username[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm text-foreground">{user.full_name}</p>
                      <p className="text-xs text-muted-foreground font-mono">@{user.username}</p>
                    </div>
                  </div>
                  {user.id !== userId && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 h-8"
                      onClick={() => handleSendRequest(user.id)}
                    >
                      <UserPlus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              {results.length === 0 && !isSearching && (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">Enter a username to search.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
