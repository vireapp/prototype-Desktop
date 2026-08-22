/// <reference types="vite/client" />

import { ElectronAPI } from '@electron-toolkit/preload'

interface CustomAPI {
  onNavigate: (callback: (route: string) => void) => () => void
  minimize: () => void
  maximize: () => void
  close: () => void
  isMaximized: () => Promise<boolean>
  onMaximizedChanged: (callback: (isMaximized: boolean) => void) => void
  setProgress: (value: number) => void
  setBadgeCount: (count: number) => void
  onUpdateStatus: (callback: (data: any) => void) => void
  checkForUpdates: () => Promise<void>
  downloadUpdate: () => Promise<void>
  installUpdate: () => void
}

declare global {
  namespace JSX {
    type Element = React.JSX.Element
    type IntrinsicElements = React.JSX.IntrinsicElements
  }
  interface Window {
    electron: ElectronAPI
    api: CustomAPI
  }
}
