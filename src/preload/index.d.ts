import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      onNavigate: (callback: (route: string) => void) => void
      setProgress: (value: number) => void
      setBadgeCount: (count: number) => void
      minimize: () => void
      maximize: () => void
      close: () => void
      isMaximized: () => Promise<boolean>
      onMaximizedChanged: (callback: (isMaximized: boolean) => void) => void
      onUpdateStatus: (callback: (data: any) => void) => void
      checkForUpdates: () => Promise<any>
      downloadUpdate: () => Promise<any>
      installUpdate: () => void
      aiChat: (messages: any[], options?: any) => Promise<any>
      youtubeSearch: (query: string) => Promise<any[]>
      youtubePopular: (regionCode?: string) => Promise<any[]>
      getHostname: () => Promise<string>
    }
  }
}
