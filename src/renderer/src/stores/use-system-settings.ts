import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SystemSettingsState {
  // --- Window & Tray ---
  minimizeToTray: boolean
  closeToTray: boolean
  launchOnStartup: boolean
  startMinimized: boolean

  // --- Performance ---
  hardwareAcceleration: boolean

  // --- Productivity ---
  hotkey: string

  // --- Accessibility ---
  textScale: number

  // --- Actions ---
  setSetting: (key: string, value: any) => void
  syncWithMain: () => Promise<void>
}

const DEFAULT_STATE = {
  minimizeToTray: true,
  closeToTray: true,
  launchOnStartup: false,
  startMinimized: false,
  hardwareAcceleration: true,
  hotkey: 'Alt+V',
  textScale: 100
}

export const useSystemSettings = create<SystemSettingsState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_STATE,

      setSetting: (key, value) => {
        set({ [key]: value })

        // Notify main process for relevant settings
        if (['minimizeToTray', 'closeToTray', 'launchOnStartup', 'startMinimized'].includes(key)) {
          if (window.api && window.api.updateSystemSettings) {
            window.api.updateSystemSettings({ [key]: value })
          }
        }

        if (['hotkey', 'hardwareAcceleration'].includes(key)) {
          if (window.api && window.api.updatePersistedSettings) {
            window.api.updatePersistedSettings({ [key]: value })
          }
        }

        // Apply accessibility settings immediately
        if (key === 'textScale') {
          document.documentElement.style.fontSize = `${(value / 100) * 16}px`
        }
      },

      syncWithMain: async () => {
        if (window.api) {
          try {
            // Get transient settings (tray, startup)
            const sys = await window.api.getSystemSettings()
            // Get persistent settings (hotkey, hw-accel)
            const pers = await window.api.getPersistedSettings()

            set({
              minimizeToTray: sys.minimizeToTray,
              closeToTray: sys.closeToTray,
              launchOnStartup: sys.actualLaunchOnStartup,
              startMinimized: sys.startMinimized,
              hotkey: pers.hotkey,
              hardwareAcceleration: pers.hardwareAcceleration
            })

            // Ensure main process matches current state if needed
            window.api.updateSystemSettings({
              minimizeToTray: get().minimizeToTray,
              closeToTray: get().closeToTray,
              launchOnStartup: get().launchOnStartup,
              startMinimized: get().startMinimized
            })
            
            // Apply text scale on load
            document.documentElement.style.fontSize = `${(get().textScale / 100) * 16}px`
          } catch (e) {
            console.error('Failed to sync system settings:', e)
          }
        }
      }
    }),
    {
      name: 'system-settings-v1',
      onRehydrateStorage: () => (state) => {
        state?.syncWithMain()
      }
    }
  )
)
