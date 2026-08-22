/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface RoomMediaProps {
  roomId: string
  user: any
  onBack?: () => void
  initialUrl?: string
}

export function RoomMedia({ roomId, user, onBack, initialUrl }: RoomMediaProps) {
  const [url, setUrl] = useState<string>(
    (initialUrl || 'https://www.youtube.com/feed/trending').replace('//m.youtube.com', '//www.youtube.com')
  )
  const supabase = createClient()
  const channelRef = useRef<any>(null)
  const webviewRef = useRef<any>(null)

  const broadcast = useCallback(
    async (type: string, payload: any) => {
      if (!channelRef.current) return
      await channelRef.current.send({
        type: 'broadcast',
        event: 'media-state',
        payload: { type, sender: user.id, ...payload }
      })
    },
    [user.id]
  )

  // Sync URL from parent
  useEffect(() => {
    if (initialUrl) {
      const fixedUrl = initialUrl.replace('//m.youtube.com', '//www.youtube.com')
      if (fixedUrl !== url) {
        setUrl(fixedUrl)
        broadcast('url', { url: fixedUrl })
      }
    }
  }, [initialUrl, broadcast])

  // Supabase peer synchronization
  useEffect(() => {
    const channel = supabase
      .channel(`room-media:${roomId}`)
      .on('broadcast', { event: 'media-state' }, ({ payload }) => {
        if (payload.type === 'url' && payload.sender !== user.id) {
          const fixedUrl = payload.url.replace('//m.youtube.com', '//www.youtube.com')
          setUrl(fixedUrl)
        }
      })
      .subscribe()

    channelRef.current = channel
    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, supabase, user.id])

  useEffect(() => {
    const webview = webviewRef.current
    if (!webview) return

    const handleDidNavigate = (e: any) => {
      if (e.url && e.url !== url) {
        const newUrl = e.url.replace('//m.youtube.com', '//www.youtube.com')
        setUrl(newUrl)
        broadcast('url', { url: newUrl })
        if (e.url.includes('m.youtube.com')) {
          webview.loadURL(newUrl)
        }
      }
    }
    const handleDidNavigateInPage = (e: any) => {
      if (e.url && e.url !== url) {
        const newUrl = e.url.replace('//m.youtube.com', '//www.youtube.com')
        setUrl(newUrl)
        broadcast('url', { url: newUrl })
        if (e.url.includes('m.youtube.com')) {
          webview.loadURL(newUrl)
        }
      }
    }

    const handleDomReady = () => {
      webview.insertCSS(`
        ytd-ad-slot-renderer,
        ytd-promoted-sparkles-web-renderer,
        ytd-promoted-video-renderer,
        .ytp-ad-module,
        .video-ads,
        ytd-banner-promo-renderer,
        ytd-statement-banner-renderer,
        div#masthead-ad {
          display: none !important;
        }
      `)
      webview.executeJavaScript(`
        setInterval(() => {
          const skipBtn = document.querySelector('.ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-skip-ad-button');
          if (skipBtn) skipBtn.click();
          const adVideo = document.querySelector('.ad-showing video');
          if (adVideo && adVideo.duration) adVideo.currentTime = adVideo.duration;
        }, 500);
      `)
    }

    webview.addEventListener('dom-ready', handleDomReady)
    webview.addEventListener('did-navigate', handleDidNavigate)
    webview.addEventListener('did-navigate-in-page', handleDidNavigateInPage)

    return () => {
      webview.removeEventListener('dom-ready', handleDomReady)
      webview.removeEventListener('did-navigate', handleDidNavigate)
      webview.removeEventListener('did-navigate-in-page', handleDidNavigateInPage)
    }
  }, [url, broadcast])

  return (
    <div className="flex flex-col w-full h-full bg-black relative">
      <div className="flex-1 relative bg-black flex flex-col overflow-hidden">
        <webview
          ref={webviewRef}
          src={url}
          disablewebsecurity="true"
          style={{ flex: 1, width: '100%', height: '100%', border: 'none', backgroundColor: '#000' }}
          allowpopups="true"
        />

        {/* Navigation Controls */}
        <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-start pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-2">
            {onBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="text-white hover:bg-black/50 bg-black/20 rounded-full backdrop-blur-sm shadow-md"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
