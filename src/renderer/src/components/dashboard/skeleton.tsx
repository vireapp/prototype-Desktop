import { Skeleton } from '@/components/ui/skeleton'
import { motion } from 'framer-motion'

export function SettingsSkeleton() {
  return (
    <div className="flex flex-col md:flex-row h-full overflow-hidden bg-background">
      {/* Settings Sidebar Skeleton */}
      <div className="w-full md:w-64 border-r border-border/5 p-6 space-y-8 shrink-0">
        <div className="space-y-4">
          <Skeleton className="h-4 w-20 opacity-40" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-10 w-full rounded-xl" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-4 w-20 opacity-40" />
          <div className="space-y-2">
            {[1, 2].map(i => (
              <Skeleton key={i} className="h-10 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>

      {/* Settings Content Skeleton */}
      <div className="flex-1 p-8 md:p-12 overflow-y-auto space-y-12">
        <div className="space-y-4">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-4 w-96 opacity-60" />
        </div>

        <div className="space-y-8 max-w-2xl">
          {[1, 2].map(i => (
            <div key={i} className="space-y-6 p-6 rounded-3xl border border-border/5 bg-muted/10">
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48 opacity-60" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="h-full overflow-y-auto overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6 pb-10">
        {/* Greeting Skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-48 opacity-60" />
        </div>

        {/* Quick Actions Skeleton */}
        <div className="flex gap-3">
          <Skeleton className="h-10 w-32 rounded-full" />
          <Skeleton className="h-10 w-32 rounded-full" />
          <Skeleton className="h-10 w-32 rounded-full opacity-60" />
        </div>

        {/* Main Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
          {/* Col 1 */}
          <div className="flex flex-col gap-4">
            {/* Profile Widget Skeleton */}
            <Skeleton className="h-[280px] w-full rounded-2xl" />
            {/* AI Widget Skeleton */}
            <Skeleton className="h-[180px] w-full rounded-2xl" />
          </div>

          {/* Col 2 */}
          <div className="flex flex-col gap-4">
            {/* Friends Widget Skeleton */}
            <Skeleton className="h-[360px] w-full rounded-2xl" />
            {/* Notifications Widget Skeleton */}
            <Skeleton className="h-[300px] w-full rounded-2xl" />
          </div>

          {/* Col 3 */}
          <div className="flex flex-col gap-4 md:col-span-2 xl:col-span-1">
            {/* Live Rooms Widget Skeleton */}
            <Skeleton className="h-[300px] w-full rounded-2xl" />
            {/* Community Widget Skeleton */}
            <Skeleton className="h-[300px] w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function ShellSkeleton() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar Skeleton */}
      <div className="w-[240px] border-r border-white/[0.05] p-4 flex flex-col gap-6">
        <div className="flex items-center gap-3 px-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-5 w-24" />
        </div>
        
        <div className="space-y-3 mt-4">
          <Skeleton className="h-9 w-full rounded-lg" />
          <Skeleton className="h-9 w-full rounded-lg opacity-80" />
          <Skeleton className="h-9 w-full rounded-lg opacity-60" />
          <Skeleton className="h-9 w-full rounded-lg opacity-40" />
        </div>

        <div className="mt-auto p-2 border-t border-white/[0.05] pt-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-16 opacity-60" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-12 border-b border-white/[0.05] flex items-center px-6">
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex-1 overflow-hidden">
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
    <div className="h-screen w-screen bg-[#050505] overflow-hidden flex flex-col">
      {/* Top Bar Skeleton */}
      <div className="h-14 border-b border-white/[0.05] flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      </div>

      {/* Main Stage Skeleton */}
      <div className="flex-1 flex gap-4 p-4">
        <div className="flex-1 rounded-3xl border border-white/[0.05] bg-white/[0.01] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full opacity-20" />
            <Skeleton className="h-4 w-48 opacity-10" />
          </div>
        </div>

        {/* Sidebar/Chat Skeleton */}
        <div className="w-80 flex flex-col gap-4">
          <div className="flex-1 rounded-3xl border border-white/[0.05] bg-white/[0.01] p-4 space-y-4">
            <Skeleton className="h-6 w-24" />
            <div className="space-y-3">
              <Skeleton className="h-12 w-full rounded-xl opacity-60" />
              <Skeleton className="h-12 w-full rounded-xl opacity-40" />
              <Skeleton className="h-12 w-full rounded-xl opacity-20" />
            </div>
          </div>
          <div className="h-48 rounded-3xl border border-white/[0.05] bg-white/[0.01] p-4">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="flex -space-x-2">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-8 w-8 rounded-full border border-[#050505]" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function FriendsSkeleton() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto px-6 py-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <Skeleton className="h-5 w-24 rounded" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </div>

      {/* Tabs & Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-6">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-20 opacity-60" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-56 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="p-4 rounded-2xl border border-border/5 bg-muted/20 flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24 opacity-60" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function MessagesSkeleton() {
  return (
    <div className="h-full flex flex-col">
      <div className="w-full h-full flex flex-col md:flex-row border-0 bg-card/50 overflow-hidden">
        {/* Messages Sidebar Skeleton */}
        <div className="w-full md:w-80 border-r border-border/5 p-4 flex flex-col gap-6">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full rounded-xl" />
            <div className="flex gap-2 overflow-hidden">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-12 w-12 rounded-full shrink-0" />
              ))}
            </div>
          </div>
          <div className="space-y-3 mt-2">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="flex items-center gap-3 p-2">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32 opacity-60" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area Skeleton (Empty state) */}
        <div className="hidden md:flex flex-1 flex-col items-center justify-center p-8 space-y-6">
          <Skeleton className="w-20 h-20 rounded-2xl" />
          <div className="space-y-3 flex flex-col items-center">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 opacity-60" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-32 rounded-xl" />
            <Skeleton className="h-10 w-32 rounded-xl opacity-60" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function RoomsSkeleton() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <Skeleton className="h-6 w-32 rounded-full" />
          <Skeleton className="h-10 w-64" />
        </div>
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <Skeleton className="h-11 w-full md:w-80 rounded-2xl" />
        <div className="flex gap-2 w-full md:w-auto overflow-hidden">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-9 w-24 rounded-full" />
          ))}
        </div>
      </div>

      {/* Room Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="rounded-3xl border border-border/5 bg-card/40 overflow-hidden flex flex-col">
            <Skeleton className="h-48 w-full" />
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 opacity-60" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full opacity-60" />
              </div>
              <div className="pt-2">
                <Skeleton className="h-11 w-full rounded-2xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ShopSkeleton() {
  return (
    <div className="space-y-12 max-w-7xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-4">
          <Skeleton className="h-6 w-32 rounded-full" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-12 w-32 rounded-2xl" />
          <Skeleton className="h-12 w-12 rounded-2xl" />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-hidden pb-4 border-b border-border/5">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Skeleton key={i} className="h-10 w-28 rounded-xl shrink-0" />
        ))}
      </div>

      {/* Featured Item Skeleton */}
      <div className="relative h-[300px] rounded-3xl overflow-hidden border border-border/5 bg-muted/10 p-10 flex flex-col justify-center gap-6">
        <div className="space-y-4">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-12 w-80" />
          <Skeleton className="h-4 w-96 opacity-60" />
        </div>
        <Skeleton className="h-12 w-48 rounded-xl" />
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <div key={i} className="aspect-[4/5] rounded-3xl border border-border/5 bg-muted/10 p-6 flex flex-col gap-4">
            <Skeleton className="flex-1 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-4 w-12 opacity-60" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DiscoverSkeleton() {
  return (
    <div className="space-y-20 max-w-6xl mx-auto px-6 py-12">
      {/* Hero Skeleton */}
      <div className="relative aspect-[21/9] rounded-3xl overflow-hidden border border-border/5 bg-muted/20 flex flex-col justify-end p-12 gap-4">
        <Skeleton className="h-6 w-32 rounded-full" />
        <Skeleton className="h-16 w-96" />
        <Skeleton className="h-6 w-2/3 opacity-60" />
        <div className="flex gap-4">
          <Skeleton className="h-14 w-40 rounded-full" />
          <div className="flex -space-x-3">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-10 w-10 rounded-full border-2 border-background" />
            ))}
          </div>
        </div>
      </div>

      {/* Ticker Skeleton */}
      <div className="h-16 border-y border-border/5 bg-muted/10 flex items-center gap-12 overflow-hidden px-12">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Skeleton key={i} className="h-6 w-32 opacity-30" />
        ))}
      </div>

      {/* Categories Skeleton */}
      <div className="space-y-12">
        <div className="space-y-3">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-64 opacity-60" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-64 rounded-3xl border border-border/5 bg-muted/20 p-8 flex flex-col justify-between">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-3">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-32 opacity-60" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function CommunitySkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-24">
      {/* Hero */}
      <div className="flex flex-col items-center text-center space-y-8">
        <Skeleton className="h-9 w-40 rounded-full" />
        <Skeleton className="h-20 w-3/4" />
        <Skeleton className="h-6 w-1/2 opacity-60" />
      </div>

      {/* Stats Ticker */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-muted/10 border border-border/5 rounded-2xl p-8">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex flex-col items-center space-y-3 border-r border-border/5 last:border-0">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-20 opacity-60" />
          </div>
        ))}
      </div>

      {/* Platform Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {[1, 2].map(i => (
          <div key={i} className="h-80 rounded-[2.5rem] border border-border/5 bg-muted/10 p-8 flex flex-col gap-6">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <div className="space-y-3">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-16 w-full opacity-60" />
            </div>
            <Skeleton className="h-6 w-24 mt-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}
