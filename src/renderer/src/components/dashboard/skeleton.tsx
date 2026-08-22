import { Skeleton } from '@/components/ui/skeleton'
import { motion } from 'framer-motion'

export function SettingsSkeleton() {
  return (
    <div className="flex w-full h-full bg-background overflow-hidden font-sans text-foreground">
      {/* Ambient backgrounds */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Settings Sidebar Skeleton */}
      <aside className="w-[300px] flex-shrink-0 bg-background/80 backdrop-blur-xl border-r border-border/50 relative z-10 flex flex-col h-full window-drag">
        <div className="mb-6 p-6 pt-10 px-8">
          <Skeleton className="h-7 w-24" />
        </div>
        <div className="px-5 pb-6 flex-1 space-y-8 window-no-drag">
          <div className="space-y-1">
            <Skeleton className="h-4 w-20 opacity-40 ml-3 mb-3" />
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-9 w-full rounded-lg" />
            ))}
          </div>
          <div className="space-y-1">
            <Skeleton className="h-4 w-20 opacity-40 ml-3 mb-3" />
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-9 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </aside>

      {/* Settings Content Skeleton */}
      <main className="flex-1 relative flex flex-col h-full bg-background/50 backdrop-blur-3xl overflow-hidden shadow-[-10px_0_30px_rgba(0,0,0,0.1)] border-l border-border/50">
        <div className="absolute top-0 right-0 p-6 z-20 window-no-drag">
          <Skeleton className="w-10 h-10 rounded-full" />
        </div>
        
        <div className="flex-1 overflow-y-auto pt-16 pb-24 px-8 lg:px-16 window-no-drag">
          <div className="max-w-3xl mx-auto w-full relative min-h-full">
            <div className="mb-10 pb-6 border-b border-border/40">
              <Skeleton className="h-9 w-40" /> {/* "My Profile" */}
            </div>

            <div className="max-w-2xl mx-auto space-y-12">
              {/* Banner & Avatar Group */}
              <div className="relative mb-24">
                {/* Banner Area */}
                <Skeleton className="w-full aspect-[2/1] md:aspect-[3/1] rounded-2xl" />
                {/* Avatar (Overlapping) */}
                <div className="absolute -bottom-12 md:-bottom-16 left-4 md:left-8 flex items-end gap-4 md:gap-6">
                  <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full p-1 ring-4 ring-background bg-background">
                    <Skeleton className="w-full h-full rounded-full" />
                  </div>
                  <div className="mb-2 md:mb-4 space-y-2">
                    <Skeleton className="h-7 w-48" />
                    <Skeleton className="h-4 w-24 opacity-60" />
                  </div>
                </div>
              </div>

              {/* Main Content Blocks */}
              <div className="space-y-6">
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-48 w-full rounded-xl" />
                <Skeleton className="h-32 w-full rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="h-full overflow-y-auto overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <Skeleton className="h-[280px] w-full rounded-3xl" />
          <Skeleton className="h-[280px] w-full rounded-3xl" />
          <Skeleton className="h-[280px] w-full rounded-3xl" />
          <Skeleton className="h-[300px] w-full rounded-3xl" />
          <Skeleton className="h-[300px] w-full rounded-3xl" />
          <Skeleton className="h-[300px] w-full rounded-3xl" />
        </div>
      </div>
    </div>
  )
}

export function ShellSkeleton() {
  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar Skeleton (Matches DesktopSidebar) */}
      <div className="w-[68px] pt-9 h-full flex flex-col shrink-0 z-20 relative bg-background border-r border-border">
        {/* Navigation Links */}
        <div className="flex flex-col gap-1.5 flex-1 w-full px-2">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="w-11 h-11 rounded-xl mx-auto" />
          ))}
          <div className="flex items-center justify-center my-1">
            <div className="w-8 h-px bg-border" />
          </div>
          {/* AI Toggle */}
          <Skeleton className="w-11 h-11 rounded-xl mx-auto" />
        </div>

        {/* Bottom controls */}
        <div className="flex flex-col items-center gap-1 w-full pt-3 mt-auto px-2 pb-3 border-t border-border">
          <Skeleton className="w-10 h-10 rounded-full" />
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex flex-col gap-1 w-full mt-1">
            <Skeleton className="w-full h-10 rounded-2xl" />
            <Skeleton className="w-full h-10 rounded-2xl" />
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10 bg-background pt-9">
        <div className="flex-1 overflow-x-hidden overflow-y-auto w-full h-full">
          <DashboardSkeleton />
        </div>
      </div>
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto px-6 py-6">
      {/* Header Skeleton */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20 opacity-50" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </div>

      {/* Tabs/Actions Skeleton */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-24 opacity-60" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-48 rounded-full" />
          <Skeleton className="h-8 w-16 rounded-full" />
        </div>
      </div>

      {/* Grid Content Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}

export function RoomSkeleton() {
  return (
    <div className="h-screen w-screen bg-[#050505] overflow-hidden flex flex-col p-4 gap-4">
      <Skeleton className="h-16 w-full rounded-2xl bg-white/5" />
      <div className="flex-1 flex gap-4 overflow-hidden">
        <Skeleton className="flex-1 h-full rounded-2xl bg-white/5" />
        <Skeleton className="hidden md:block w-[360px] h-full rounded-2xl bg-white/5" />
      </div>
      <Skeleton className="h-16 w-full rounded-2xl bg-white/5" />
    </div>
  )
}

export function DuoRoomSkeleton() {
  return (
    <div className="absolute inset-0 top-8 flex flex-col bg-background p-4 gap-4">
      <Skeleton className="h-16 w-full rounded-2xl" />
      <div className="flex-1 flex gap-4 overflow-hidden">
        <Skeleton className="flex-1 h-full rounded-2xl" />
        <Skeleton className="w-[280px] h-full rounded-2xl" />
      </div>
    </div>
  )
}

export function FriendsSkeleton() {
  return (
    <div className="space-y-6 p-6 pt-10 pb-6">
      <div className="flex justify-between">
        <Skeleton className="h-12 w-48 rounded-xl" />
        <Skeleton className="h-12 w-32 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}

export function MessagesSkeleton() {
  return (
    <div className="h-full flex flex-col md:flex-row p-4 gap-4">
      <div className="w-full md:w-80 space-y-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
      <div className="hidden md:flex flex-1">
        <Skeleton className="h-full w-full rounded-2xl" />
      </div>
    </div>
  )
}

export function RoomsSkeleton() {
  return (
    <div className="space-y-8 p-6 pt-10 pb-8">
      <div className="flex justify-between">
        <Skeleton className="h-12 w-48 rounded-xl" />
        <Skeleton className="h-12 w-32 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-[240px] w-full rounded-2xl" />
        ))}
      </div>
    </div>
  )
}

export function ShopSkeleton() {
  return (
    <div className="space-y-6 p-6 pt-10 pb-8">
      <div className="flex justify-between mb-8">
        <Skeleton className="h-12 w-48 rounded-xl" />
        <Skeleton className="h-12 w-32 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}

export function DiscoverSkeleton() {
  return (
    <div className="p-6 pt-10 space-y-8">
      <Skeleton className="h-[400px] w-full rounded-3xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-64 rounded-3xl" />
        ))}
      </div>
    </div>
  )
}

export function CommunitySkeleton() {
  return (
    <div className="p-6 pt-10 space-y-8 max-w-6xl mx-auto">
      <Skeleton className="h-64 w-full rounded-3xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="md:col-span-2 h-96 rounded-3xl" />
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    </div>
  )
}
