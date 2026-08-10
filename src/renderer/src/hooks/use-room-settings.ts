import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

export interface UserRegion {
  code: string
  name: string
}

export interface PersonalSettings {
  masterVolume: number
  bandwidthSaver: boolean
  hideReactions: boolean
  compactMode: boolean
  userRegion: UserRegion | null
}

const DEFAULT_SETTINGS: PersonalSettings = {
  masterVolume: 100,
  bandwidthSaver: false,
  hideReactions: false,
  compactMode: false,
  userRegion: null
}

const STORAGE_KEY = 'room-settings-v1'

export function useRoomSettings() {
  const [settings, setSettings] = useState<PersonalSettings>(DEFAULT_SETTINGS)
  const [loaded, setLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setSettings({ ...DEFAULT_SETTINGS, ...parsed })
      }
    } catch (e) {
      console.warn('Failed to load room settings', e)
    } finally {
      setLoaded(true)
    }
  }, [])

  // Save to localStorage whenever settings change
  useEffect(() => {
    if (!loaded) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings, loaded])

  // Listener for syncing changes across other components
  useEffect(() => {
    const handleStorageChange = (e: CustomEvent<PersonalSettings>) => {
      setSettings(e.detail)
    }
    window.addEventListener('room-settings-sync', handleStorageChange as EventListener)
    return () =>
      window.removeEventListener('room-settings-sync', handleStorageChange as EventListener)
  }, [])

  const updateSettings = useCallback((newSettings: Partial<PersonalSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...newSettings }
      // Dispatch event for other hooks
      const event = new CustomEvent('room-settings-sync', { detail: next })
      window.dispatchEvent(event)
      return next
    })
  }, [])

  const refreshRegion = useCallback(async () => {
    try {
      const res = await fetch('https://ipwho.is/')
      if (!res.ok) throw new Error('Network error')
      const data = await res.json()
      if (data.success) {
        const region: UserRegion = {
          code: data.country_code,
          name: data.country
        }
        updateSettings({ userRegion: region })
        toast.success(`Region updated: ${region.name}`)
        return region
      } else {
        throw new Error(data.message || 'Failed to detect region')
      }
    } catch (e) {
      console.error(e)
      toast.error('Failed to detect region')
      return null
    }
  }, [updateSettings])

  return {
    settings,
    updateSettings,
    refreshRegion,
    loaded
  }
}
