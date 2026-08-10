'use client'

import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut
} from '@/components/ui/command'
import {
  User,
  Settings,
  Mic,
  Monitor,
  Bell,
  Lock,
  Shield,
  Search,
  MessageSquare,
  Users,
  Compass,
  LayoutDashboard,
  Bot,
  Power
} from 'lucide-react'
import { toast } from 'sonner'

export function QuickSwitcher() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const runCommand = (command: () => void) => {
    setOpen(false)
    command()
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => navigate('/dashboard'))}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/dashboard/rooms'))}>
            <Users className="mr-2 h-4 w-4" />
            <span>Rooms</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/dashboard/friends'))}>
            <User className="mr-2 h-4 w-4" />
            <span>Friends</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/discover'))}>
            <Compass className="mr-2 h-4 w-4" />
            <span>Discover</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings Quick Jump">
          <CommandItem onSelect={() => runCommand(() => navigate('/dashboard/settings'))}>
            <Settings className="mr-2 h-4 w-4" />
            <span>All Settings</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/dashboard/settings'))}>
            <User className="mr-2 h-4 w-4" />
            <span>Profile Settings</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/dashboard/settings'))}>
            <Mic className="mr-2 h-4 w-4" />
            <span>Audio & Video</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/dashboard/settings'))}>
            <Monitor className="mr-2 h-4 w-4" />
            <span>System & Desktop</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/dashboard/settings'))}>
            <Bell className="mr-2 h-4 w-4" />
            <span>Notifications</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/dashboard/settings'))}>
            <Shield className="mr-2 h-4 w-4" />
            <span>Privacy & Security</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="System Commands">
          <CommandItem onSelect={() => runCommand(() => {
            // Mute logic would go here, maybe via another store
            toast.info('Microphone Muted')
          })}>
            <Mic className="mr-2 h-4 w-4" />
            <span>Mute Microphone</span>
            <CommandShortcut>M</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => window.api.close())}>
            <Power className="mr-2 h-4 w-4 text-destructive" />
            <span className="text-destructive">Quit Application</span>
            <CommandShortcut>Q</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="AI Companion">
          <CommandItem onSelect={() => runCommand(() => navigate('/dashboard/ai'))}>
            <Bot className="mr-2 h-4 w-4" />
            <span>Vire AI Chat</span>
            <CommandShortcut>⌘A</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
