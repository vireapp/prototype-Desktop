'use client'

import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Loader2, Play, Globe } from 'lucide-react'
import { toast } from 'sonner'
import { searchYouTube, YouTubeVideo } from '@/lib/youtube'
// No next/image import needed
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

interface YouTubeSearchProps {
  onSelect: (url: string) => void
  categoryId?: string
  variant?: 'grid' | 'list'
}

const REGIONS = [
  { code: 'US', name: 'United States' },
  { code: 'IN', name: 'India' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'JP', name: 'Japan' },
  { code: 'DE', name: 'Germany' },
  { code: 'BR', name: 'Brazil' },
  { code: 'FR', name: 'France' },
  { code: 'KR', name: 'South Korea' }
]

export function YouTubeSearch({
  onSelect,
  categoryId,
  variant = 'grid'
}: YouTubeSearchProps): React.JSX.Element {
  const [query, setQuery] = useState('')
  const [videos, setVideos] = useState<YouTubeVideo[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [regionCode, setRegionCode] = useState('US')

  const performSearch = React.useCallback(
    async (searchTerm: string, region: string = regionCode): Promise<void> => {
      setLoading(true)
      setSearched(true)
      try {
        const items = await searchYouTube(searchTerm, region, categoryId)
        setVideos(items as unknown as YouTubeVideo[])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        toast.error(error.message || 'Failed to search')
      } finally {
        setLoading(false)
      }
    },
    [regionCode, categoryId]
  )

  // Initial "Home Feed" (Trending)
  useEffect(() => {
    // Try to detect region once on mount, or default to US
    const detected = typeof window !== 'undefined' ? navigator.language.split('-')[1] || 'US' : 'US'
    // If detected is in our list, use it; otherwise default to US or keep detected if supported
    setRegionCode(detected)
    performSearch('', detected)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = async (e?: React.FormEvent): Promise<void> => {
    e?.preventDefault()
    performSearch(query)
  }

  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto p-4 md:p-8 animate-in ignore-y duration-500 fade-in">
      <div className="flex flex-col items-center gap-6 mb-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold font-heading text-white drop-shadow-md">
            {query ? 'Search Results' : 'Search'}
          </h2>
          <p className="text-muted-foreground text-sm">Find and watch videos together</p>
        </div>

        <div className="flex flex-col md:flex-row gap-2 w-full max-w-2xl items-center">
          <Select
            value={regionCode}
            onValueChange={(val) => {
              setRegionCode(val)
              performSearch(query, val)
            }}
          >
            <SelectTrigger className="w-full md:w-[180px] bg-muted border-border text-foreground h-11 rounded-full md:rounded-r-none md:rounded-l-full">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <SelectValue placeholder="Region" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {REGIONS.map((r) => (
                <SelectItem key={r.code} value={r.code}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <form onSubmit={handleSearch} className="flex gap-2 w-full relative">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="bg-muted border-border h-11 pl-4 md:pl-4 rounded-full md:rounded-l-none md:rounded-r-full text-foreground placeholder:text-muted-foreground focus-visible:ring-red-500/50 flex-1"
              autoFocus
            />
            <Button
              type="submit"
              disabled={loading}
              className="absolute right-1 top-1 rounded-full bg-red-600 hover:bg-red-700 text-white h-9 px-4"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </form>
        </div>

        {/* Categories - Only show if no category is enforced */}
        {!categoryId && (
          <div className="flex gap-2 overflow-x-auto pb-2 w-full max-w-lg no-scrollbar mask-gradient justify-center">
            {['Music', 'Gaming', 'Lofi', 'News', 'Live', 'Coding', 'Podcasts'].map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setQuery(cat)
                  performSearch(cat)
                }}
                className="px-4 py-1.5 rounded-full text-xs font-medium bg-muted hover:bg-accent text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap border border-border"
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-[300px]">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
          </div>
        ) : videos.length > 0 ? (
          <div
            className={
              variant === 'grid'
                ? 'grid grid-cols-2 lg:grid-cols-3 gap-4 pb-4'
                : 'flex flex-col gap-2 pb-4'
            }
          >
            {videos.map((video) => (
              <button
                key={video.id.videoId}
                onClick={() => onSelect(`https://www.youtube.com/watch?v=${video.id.videoId}`)}
                className={
                  variant === 'grid'
                    ? 'group relative flex flex-col text-left gap-2 p-3 rounded-xl hover:bg-muted/50 border border-transparent hover:border-border transition-all'
                    : 'group relative flex items-center text-left gap-3 p-2 rounded-lg hover:bg-muted/50 border border-transparent hover:border-border transition-all w-full'
                }
              >
                <div
                  className={
                    variant === 'grid'
                      ? 'relative aspect-video w-full overflow-hidden rounded-lg bg-black shadow-md'
                      : 'relative aspect-video w-32 shrink-0 overflow-hidden rounded-md bg-black shadow-sm'
                  }
                >
                  <img
                    src={video.snippet.thumbnails.high.url}
                    alt={video.snippet.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Play Overlay - specific styling for grid vs list if needed, keeping common for now */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div
                      className={
                        variant === 'grid'
                          ? 'w-12 h-12 rounded-full bg-red-600 flex items-center justify-center shadow-lg transform scale-50 group-hover:scale-100 transition-transform'
                          : 'w-8 h-8 rounded-full bg-red-600 flex items-center justify-center shadow-lg transform scale-50 group-hover:scale-100 transition-transform'
                      }
                    >
                      <Play
                        className={
                          variant === 'grid'
                            ? 'w-5 h-5 text-white fill-current'
                            : 'w-3 h-3 text-white fill-current'
                        }
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <h3
                    className={
                      variant === 'grid'
                        ? 'font-medium text-sm text-foreground line-clamp-2 leading-tight group-hover:text-red-500 transition-colors'
                        : 'font-medium text-sm text-foreground line-clamp-2 leading-tight group-hover:text-red-500 transition-colors'
                    }
                  >
                    {video.snippet.title}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {video.snippet.channelTitle}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : searched ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <p>No videos found</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
