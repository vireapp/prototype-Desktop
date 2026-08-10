import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  on: (channel: string, callback: (...args: any[]) => void) => {
    const subscription = (_event, ...args: any[]) => callback(...args)
    ipcRenderer.on(channel, subscription)
    return () => ipcRenderer.removeListener(channel, subscription)
  },
  onNavigate: (callback: (route: string) => void) => {
    ipcRenderer.on('navigate-to', (_event, route) => callback(route))
  },
  setProgress: (value: number) => ipcRenderer.send('set-progress', value),
  setBadgeCount: (count: number) => ipcRenderer.send('set-badge-count', count),

  // Window controls
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  onMaximizedChanged: (callback: (isMaximized: boolean) => void) => {
    ipcRenderer.on('window-maximized-changed', (_event, isMaximized) => callback(isMaximized))
  },

  // Auto-Update APIs
  onUpdateStatus: (callback: (data: any) => void) => {
    ipcRenderer.on('update-status', (_event, data) => callback(data))
  },
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.send('install-update'),

  // Secure Cloud APIs (moved to main process)
  aiChat: (messages: any[], options?: any) => ipcRenderer.invoke('ai-chat', messages, options),
  youtubeSearch: (query: string) => ipcRenderer.invoke('youtube-search', query),
  youtubePopular: (regionCode?: string, categoryId?: string) => ipcRenderer.invoke('youtube-popular', regionCode, categoryId),

  // System & Persistence APIs
  updateSystemSettings: (settings: any) => ipcRenderer.send('update-system-settings', settings),
  getSystemSettings: () => ipcRenderer.invoke('get-system-settings'),
  updatePersistedSettings: (settings: any) => ipcRenderer.send('update-persisted-settings', settings),
  getPersistedSettings: () => ipcRenderer.invoke('get-persisted-settings'),
  
  // Tray APIs
  trayAction: (action: string, payload?: any) => ipcRenderer.send('tray-action', action, payload),

  // System info
  getHostname: () => ipcRenderer.invoke('get-hostname')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
