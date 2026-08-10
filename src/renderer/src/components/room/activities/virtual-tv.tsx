'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { HlsPlayer } from '@/components/ui/hls-player'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {
  Search,
  Globe,
  Tv,
  RefreshCw,
  AlertCircle,
  SkipBack,
  SkipForward,
  Minimize2,
  Play,
  Pause,
  Link
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import Hls from 'hls.js' // Import Hls.js manually
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

interface Channel {
  id: string
  name: string
  url: string
  logo?: string
  country?: string
  category?: string
}

interface VirtualTVProps {
  currentChannelUrl?: string
  onChannelSelect: (url: string, name: string) => void
  isOwner: boolean
  userRegion?: { code: string; name: string } | null
}

// Group channels by category for better UX
const CATEGORIES = [
  'All',
  'Custom',
  'News',
  'Music',
  'Entertainment',
  'Movies',
  'Documentary',
  'Kids',
  'Lifestyle',
  'Sports',
  'Education',
  'Comedy',
  'Animation',
  'Relax',
  'Religious',
  'Weather'
]

// Keywords for smarter category matching
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  News: ['news', 'weather', 'business', 'info', 'journal'],
  Music: ['music', 'hit', 'radio', 'song', 'dance', 'rock', 'pop', 'classic'],
  Entertainment: ['entertainment', 'variety', 'lifestyle', 'reality', 'game'],
  Movies: ['movie', 'cinema', 'film', 'drama', 'action', 'comedy', 'thriller', 'horror'],
  Documentary: ['documentary', 'docu', 'nature', 'science', 'history', 'geo', 'wild'],
  Kids: ['kids', 'children', 'cartoon', 'animation', 'anime', 'baby', 'disney', 'nick', 'jr'],
  Lifestyle: ['lifestyle', 'travel', 'food', 'cook', 'health', 'fashion', 'home'],
  Sports: ['sport', 'soccer', 'cricket', 'football', 'tennis', 'racing', 'league', 'cup'],
  Education: ['education', 'learn', 'school', 'knowledge', 'university', 'ted'],
  Comedy: ['comedy', 'funny', 'standup', 'sitcom'],
  Animation: ['animation', 'anime', 'cartoon'],
  Relax: ['relax', 'chill', 'ambient', 'nature', 'meditation'],
  Religious: ['religion', 'faith', 'islam', 'christian', 'hindu', 'church', 'god'],
  Weather: ['weather', 'climate', 'meteo']
}

export function VirtualTV({
  currentChannelUrl,
  onChannelSelect,
  isOwner,
  userRegion
}: VirtualTVProps) {
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [currentChannelName, setCurrentChannelName] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(50) // Pagination limit
  const [customPlaylistUrl, setCustomPlaylistUrl] = useState(
    'https://iptv-org.github.io/iptv/index.m3u'
  )

  // Country Filter State
  const [countries, setCountries] = useState<{ name: string; code: string }[]>([])
  const [selectedCountry, setSelectedCountry] = useState<string>('all')

  // Language Filter State
  const [languages, setLanguages] = useState<{ name: string; code: string }[]>([])
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all')
  // View Mode State: 'browser' | 'player'
  const [viewMode, setViewMode] = useState<'browser' | 'player'>('browser')
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = React.useRef<HTMLVideoElement>(null)

  // Initial fetch of countries

  // Helper function to parse M3U playlists
  const parseM3U = async (content: string): Promise<Channel[]> => {
    const lines = content.split('\n')
    const channels: Channel[] = []
    let currentChannel: Partial<Channel> = {}
    const CHUNK_SIZE = 500

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (i % CHUNK_SIZE === 0) await new Promise((resolve) => setTimeout(resolve, 0))

      if (line.startsWith('#EXTINF:')) {
        const info = line.substring(8)
        const parts = info.split(',')
        currentChannel.name = parts[parts.length - 1].trim()
        const logoMatch = info.match(/tvg-logo="([^"]*)"/)
        if (logoMatch) currentChannel.logo = logoMatch[1]
        const idMatch = info.match(/tvg-id="([^"]*)"/)
        currentChannel.id = idMatch ? idMatch[1] : Math.random().toString(36)
        const groupMatch = info.match(/group-title="([^"]*)"/)
        if (groupMatch) currentChannel.category = groupMatch[1]
      } else if (line.startsWith('http')) {
        currentChannel.url = line.trim()
        if (currentChannel.name && currentChannel.url) {
          channels.push(currentChannel as Channel)
        }
        currentChannel = {}
      }
    }
    return channels
  }

  const fetchChannels = async () => {
    setLoading(true)
    setError(null)
    setChannels([])
    setVisibleCount(50)
    try {
      let url = ''
      let isCountrySpecific = false

      if (selectedCategory === 'Custom') {
        url = customPlaylistUrl
      } else if (selectedLanguage !== 'all') {
        url = `https://iptv-org.github.io/iptv/languages/${selectedLanguage}.m3u`
        isCountrySpecific = true
      } else if (selectedCountry !== 'all') {
        isCountrySpecific = true
        url = `https://iptv-org.github.io/iptv/countries/${selectedCountry.toLowerCase()}.m3u`
      } else {
        const cat =
          selectedCategory === 'All' ? 'news' : selectedCategory.toLowerCase().replace(' ', '')
        url = `https://iptv-org.github.io/iptv/categories/${cat}.m3u`
      }

      // Try direct fetch, fallback to proxy
      let text = ''
      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error('Direct fetch failed')
        text = await res.text()
      } catch (err) {
        console.warn('Direct fetch failed, trying proxy...', err)
        const proxyRes = await fetch(`/api/proxy?url=${encodeURIComponent(url)}`)
        if (!proxyRes.ok) throw new Error('Failed to load channel list via proxy')
        text = await proxyRes.text()
      }

      const parsed = await parseM3U(text)
      const filtered = parsed.filter((c) => c.url && c.name)

      if (isCountrySpecific && selectedCategory !== 'All' && selectedCategory !== 'Custom') {
        const keywords = CATEGORY_KEYWORDS[selectedCategory] || [selectedCategory.toLowerCase()]
        const searchTerms = [selectedCategory.toLowerCase(), ...keywords]

        const final = filtered.filter((c) => {
          const cat = c.category?.toLowerCase() || ''
          const name = c.name.toLowerCase()
          return searchTerms.some((term) => cat.includes(term) || name.includes(term))
        })
        setChannels(final)
      } else {
        setChannels(filtered)
      }
    } catch (e) {
      console.error(e)
      setError(`Failed to load channels: ${e instanceof Error ? e.message : 'Unknown Error'}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Polyfill Hls for ReactPlayer to use forceHLS
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any).Hls = Hls
    }

    const fetchMetadata = async () => {
      try {
        // Fetch Countries
        const resC = await fetch('https://iptv-org.github.io/api/countries.json')
        let countryList: { name: string; code: string }[] = []
        if (resC.ok) {
          const data = await resC.json()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          countryList = data.sort((a: any, b: any) => a.name.localeCompare(b.name))
          setCountries(countryList)
        }

        // Fetch Languages
        const resL = await fetch('https://iptv-org.github.io/api/languages.json')
        if (resL.ok) {
          const data = await resL.json()
          // Filter to common ones or sort?
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setLanguages(data.sort((a: any, b: any) => a.name.localeCompare(b.name)))
        }

        // Auto-detect User Region
        if (userRegion) {
          // Use prop if available (Fast Path)
          const userCountryCode = userRegion.code.toLowerCase()
          const supported = countryList.find((c) => c.code.toLowerCase() === userCountryCode)
          if (supported) {
            setSelectedCountry(supported.code) // Store the code from the list to be safe
          } else if (userRegion.code) {
            // If loop didn't find it (maybe empty list yet?), set it anyway if it looks valid
            setSelectedCountry(userRegion.code.toLowerCase())
          }
        } else {
          try {
            const resIP = await fetch('https://ipwho.is/')
            if (resIP.ok) {
              const data = await resIP.json()
              if (data.success) {
                const userCountryCode = data.country_code?.toLowerCase()
                const supported = countryList.find((c) => c.code.toLowerCase() === userCountryCode)
                if (supported) {
                  setSelectedCountry(userCountryCode)
                  toast.success(`Region detected: ${supported.name}`)
                }
              }
            }
          } catch (e) {
            console.warn('Failed to auto-detect region', e)
          }
        }
      } catch (e) {
        console.error('Failed to fetch metadata', e)
      }
    }
    fetchMetadata()
  }, [userRegion])

  useEffect(() => {
    // Wait for countries to be loaded before initial fetch to prioritize region
    // But if it takes too long, we shouldn't block forever.
    if (countries.length > 0 || loading) {
      fetchChannels()
    }
  }, [selectedCategory, selectedCountry, selectedLanguage, countries]) // Add countries dependency

  // Fetch Channels when filters change
  useEffect(() => {
    // Debounce fetching slightly or just trigger
    // If we are in initial load (auto-detecting), we might want to wait?
    // Actually the IP detection will update selectedCountry which triggers this.
    if (selectedCategory === 'Custom' && !customPlaylistUrl) return
    fetchChannels()
  }, [selectedCategory, selectedCountry, selectedLanguage, customPlaylistUrl])

  const filteredChannels = useMemo(() => {
    if (!searchQuery) return channels
    return channels.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [channels, searchQuery])

  // Find info for current channel url if possible
  // Find info for current channel url if possible
  useEffect(() => {
    if (currentChannelUrl && channels.length > 0) {
      const match = channels.find((c) => c.url === currentChannelUrl)
      if (match) setCurrentChannelName(match.name)
      // Auto-switch to player if a channel is active and we are owner (or just always?)
      // If user is just joining, they might want to see what's playing.
      setViewMode('player')
    }
  }, [currentChannelUrl, channels])

  const handleChannelSelect = (url: string, name: string) => {
    if (isOwner) {
      onChannelSelect(url, name)
      setViewMode('player')
    } else {
      toast.error('Only the host can change channels')
    }
  }

  const handleBackToBrowser = () => {
    setViewMode('browser')
  }

  const handlePlayPause = () => {
    if (!videoRef.current) return
    if (videoRef.current.paused) {
      videoRef.current.play()
      setIsPlaying(true)
    } else {
      videoRef.current.pause()
      setIsPlaying(false)
    }
  }

  const handleNextChannel = () => {
    if (filteredChannels.length === 0) return
    const currentIndex = filteredChannels.findIndex((c) => c.url === currentChannelUrl)
    const nextIndex = (currentIndex + 1) % filteredChannels.length
    const nextChannel = filteredChannels[nextIndex]
    onChannelSelect(nextChannel.url, nextChannel.name)
  }

  const handlePrevChannel = () => {
    if (filteredChannels.length === 0) return
    const currentIndex = filteredChannels.findIndex((c) => c.url === currentChannelUrl)
    const prevIndex = (currentIndex - 1 + filteredChannels.length) % filteredChannels.length
    const prevChannel = filteredChannels[prevIndex]
    onChannelSelect(prevChannel.url, prevChannel.name)
  }

  return (
    <div className="flex flex-col h-full w-full bg-black/90 text-white rounded-xl overflow-hidden border border-white/10 shadow-2xl relative">
      {/* Player Mode */}
      {viewMode === 'player' && (
        <div className="absolute inset-0 z-20 bg-black flex items-center justify-center">
          {currentChannelUrl ? (
            <div className="relative w-full h-full bg-black group">
              <HlsPlayer
                ref={videoRef}
                src={currentChannelUrl}
                autoPlay={true}
                controls={false}
                onError={(e) => toast.error(`Playback Error: ${e}`)}
                className="w-full h-full object-contain"
                onPlay={() => setIsPlaying(true)}
              />

              {/* Top Gradient Overlay */}
              <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/80 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Bottom Gradient Overlay */}
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/80 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Channel Info Overlay (Top Left) */}
              <div className="absolute top-6 left-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <h2 className="text-white text-xl font-bold drop-shadow-md">
                  {currentChannelName || 'Select a Channel'}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-white/80 text-xs font-medium uppercase tracking-wider">
                    Live
                  </span>
                </div>
              </div>

              {/* Custom Controls (Bottom Center) */}
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                <button
                  onClick={handlePrevChannel}
                  className="p-4 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all active:scale-95 group/btn"
                  title="Previous Channel"
                >
                  <SkipBack className="w-6 h-6 fill-white/80 group-hover/btn:fill-white" />
                </button>

                <button
                  onClick={handlePlayPause}
                  className="p-5 rounded-full bg-white text-black hover:scale-105 transition-all active:scale-95 shadow-lg shadow-white/20"
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <Pause className="w-8 h-8 fill-current" />
                  ) : (
                    <Play className="w-8 h-8 fill-current ml-1" />
                  )}
                </button>

                <button
                  onClick={handleNextChannel}
                  className="p-4 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all active:scale-95 group/btn"
                  title="Next Channel"
                >
                  <SkipForward className="w-6 h-6 fill-white/80 group-hover/btn:fill-white" />
                </button>
              </div>

              {/* Mobile Back Button (Top Right) */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBackToBrowser}
                  className="text-white hover:bg-white/20 rounded-full"
                >
                  <Minimize2 className="w-6 h-6" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center p-8 text-neutral-500">
              <p>No Channel Playing</p>
              <Button onClick={handleBackToBrowser} variant="outline" className="mt-4">
                Back to Channels
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Browser Mode - Fullscreen */}
      <div
        className={cn(
          'flex flex-col h-full w-full transition-opacity duration-500',
          viewMode === 'player' ? 'opacity-0 pointer-events-none absolute inset-0' : 'opacity-100'
        )}
      >
        {/* Toolbar */}
        <div className="p-3 border-b border-white/5 flex flex-col gap-3">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'px-4 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap',
                  selectedCategory === cat
                    ? 'bg-white text-black shadow-lg scale-105'
                    : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <div className="shrink-0">
              {selectedCategory === 'Custom' ? (
                <div className="flex gap-2 w-[400px]">
                  <Input
                    value={customPlaylistUrl}
                    onChange={(e) => setCustomPlaylistUrl(e.target.value)}
                    placeholder="Enter .m3u8 Playlist URL"
                    className="h-9 bg-white/5 border-white/10 text-xs"
                  />
                  <Button size="sm" onClick={() => fetchChannels()} className="h-9">
                    Load
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="w-[140px] shrink-0">
                    <Select
                      value={selectedCountry}
                      onValueChange={(val) => {
                        setSelectedCountry(val)
                        if (val !== 'all') setSelectedLanguage('all')
                      }}
                    >
                      <SelectTrigger className="h-9 bg-white/5 border-white/10 text-xs">
                        <SelectValue placeholder="Region" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        <SelectItem value="all">Global / All</SelectItem>
                        {countries.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Language Selector */}
                  <div className="w-[140px] shrink-0">
                    <Select
                      value={selectedLanguage}
                      onValueChange={(val) => {
                        setSelectedLanguage(val)
                        if (val !== 'all') setSelectedCountry('all')
                      }}
                    >
                      <SelectTrigger className="h-9 bg-white/5 border-white/10 text-xs">
                        <SelectValue placeholder="Language" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        <SelectItem value="all">Any Language</SelectItem>
                        {languages.map((l) => (
                          <SelectItem key={l.code} value={l.code}>
                            {l.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={`Search channels...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white/5 border-white/10 h-9 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Channel List */}
        <ScrollArea className="flex-1 w-full min-h-0">
          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {loading ? (
              Array(6)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="h-12 w-full rounded-lg bg-white/5 animate-pulse" />
                ))
            ) : error ? (
              <div className="col-span-full text-center py-8 text-red-400 text-sm flex flex-col items-center gap-2">
                <AlertCircle className="w-6 h-6" />
                {error}
                <Button variant="outline" size="sm" onClick={() => fetchChannels()}>
                  Retry
                </Button>
              </div>
            ) : filteredChannels.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground text-sm">
                No channels found
              </div>
            ) : (
              filteredChannels.slice(0, visibleCount).map((channel, idx) => (
                <button
                  key={idx + channel.name}
                  onClick={() => handleChannelSelect(channel.url, channel.name)}
                  disabled={!isOwner}
                  className={cn(
                    'group relative flex flex-col items-start gap-2 p-3 rounded-xl transition-all border text-left h-[100px]',
                    currentChannelUrl === channel.url
                      ? 'bg-primary/10 border-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.3)]'
                      : 'bg-neutral-900/50 border-white/5 hover:bg-white/5 hover:border-white/10 hover:-translate-y-0.5 hover:shadow-lg'
                  )}
                >
                  <div className="flex w-full gap-3 h-full">
                    {/* Logo / Thumbnail */}
                    <div className="aspect-video h-full rounded-lg bg-black/40 flex items-center justify-center shrink-0 overflow-hidden relative border border-white/5 group-hover:border-white/10 transition-colors">
                      {channel.logo ? (
                        <img
                          src={channel.logo}
                          alt={channel.name}
                          className="w-full h-full object-contain p-2"
                          loading="lazy"
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-muted-foreground gap-1">
                          <Tv className="w-5 h-5 opacity-50" />
                        </div>
                      )}

                      {/* Play Overlay */}
                      <div
                        className={cn(
                          'absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity duration-300',
                          currentChannelUrl === channel.url
                            ? 'opacity-0'
                            : 'opacity-0 group-hover:opacity-100'
                        )}
                      >
                        <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-4 h-4 ml-0.5"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 flex flex-col justify-center min-w-0">
                      <div className="text-sm font-semibold text-white/90 truncate leading-tight mb-1 group-hover:text-primary transition-colors">
                        {channel.name}
                      </div>
                      {channel.category && (
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">
                          {channel.category}
                        </div>
                      )}

                      {currentChannelUrl === channel.url && (
                        <div className="mt-2 text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          Now Playing
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
            {filteredChannels.length > visibleCount && (
              <div className="col-span-full py-4 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setVisibleCount((prev) => prev + 50)}
                  className="bg-white/5 border-white/10 hover:bg-white/10"
                >
                  Load More
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
