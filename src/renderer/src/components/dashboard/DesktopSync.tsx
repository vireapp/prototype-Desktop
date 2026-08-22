'use client'

import { useEffect } from 'react'
import { usePresence } from './presence-provider'
import { useAudioSettings } from '@/stores/use-audio-settings'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

/**
 * DesktopSync handles all global IPC events from the Electron main process
 * and synchronizes them with the renderer state/stores.
 */
export function DesktopSync() {
  const { setUserStatus } = usePresence()
  const { setNoiseSettings } = useAudioSettings()
  const navigate = useNavigate()

  useEffect(() => {
    if (!window.api) return

    // 1. Status Sync (from Tray)
    const removeStatusListener = window.api.on('status-change', (status: any) => {
      setUserStatus(status)
      toast.info(`Status changed to ${status}`)
    })

    // 2. Mute Sync (from Tray/Global Shortcut)
    const removeMuteListener = window.api.on('toggle-mute', (isMuted: boolean) => {
      setNoiseSettings({ enabled: !isMuted })
      toast(isMuted ? 'Microphone Muted' : 'Microphone Unmuted', {
        icon: isMuted ? '🔇' : '🎙️'
      })
    })

    return () => {
      removeStatusListener()
      removeMuteListener()
    }
  }, [setUserStatus, setNoiseSettings, navigate])

  return null
}
