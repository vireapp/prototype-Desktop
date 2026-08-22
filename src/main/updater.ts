import { autoUpdater, UpdateInfo } from 'electron-updater'
import { BrowserWindow, ipcMain } from 'electron'
import log from 'electron-log'

autoUpdater.logger = log
autoUpdater.autoDownload = false // Don't download automatically, give user control
autoUpdater.autoInstallOnAppQuit = false // Never install silently — require explicit user action
autoUpdater.forceDevUpdateConfig = true // Force update check in development mode
autoUpdater.allowPrerelease = true // Allow fetching beta/pre-releases
let isUpdaterInitialized = false

export function initAutoUpdater(mainWindow: BrowserWindow): void {
  if (isUpdaterInitialized) return
  isUpdaterInitialized = true

  // Check for updates 5 seconds after startup
  setTimeout(() => {
    autoUpdater.checkForUpdates()
  }, 5000)

  // Also check every 4 hours automatically
  setInterval(
    () => {
      autoUpdater.checkForUpdates()
    },
    4 * 60 * 60 * 1000
  )

  // --- Events ---
  autoUpdater.removeAllListeners()

  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for updates...')
    mainWindow.webContents.send('update-status', { status: 'checking' })
  })

  autoUpdater.on('update-available', (info: UpdateInfo) => {
    log.info('Update available:', info.version)
    mainWindow.webContents.send('update-status', {
      status: 'available',
      version: info.version,
      releaseNotes: info.releaseNotes,
      releaseDate: info.releaseDate
    })
  })

  autoUpdater.on('update-not-available', () => {
    log.info('App is up to date.')
    mainWindow.webContents.send('update-status', { status: 'up-to-date' })
  })

  autoUpdater.on('download-progress', (progress) => {
    log.info(`Download progress: ${Math.round(progress.percent)}%`)
    mainWindow.webContents.send('update-status', {
      status: 'downloading',
      percent: progress.percent,
      bytesPerSecond: progress.bytesPerSecond,
      transferred: progress.transferred,
      total: progress.total
    })
    // Show progress on Windows taskbar
    mainWindow.setProgressBar(progress.percent / 100)
  })

  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    log.info('Update downloaded:', info.version)
    mainWindow.setProgressBar(-1) // Clear taskbar progress
    mainWindow.webContents.send('update-status', {
      status: 'downloaded',
      version: info.version
    })
  })

  autoUpdater.on('error', (err) => {
    log.error('Update error:', err)
    mainWindow.webContents.send('update-status', {
      status: 'error',
      message: err.message
    })
  })

  // --- IPC Handlers from Renderer ---

  ipcMain.removeHandler('check-for-updates')
  ipcMain.handle('check-for-updates', async () => {
    try {
      const result = await autoUpdater.checkForUpdates()
      return result?.updateInfo
    } catch (err) {
      log.error('Manual update check failed:', err)
      return null
    }
  })

  ipcMain.removeHandler('download-update')
  ipcMain.handle('download-update', async () => {
    try {
      await autoUpdater.downloadUpdate()
      return true
    } catch (err) {
      log.error('Download update failed:', err)
      return false
    }
  })

  ipcMain.removeAllListeners('install-update')
  ipcMain.on('install-update', () => {
    autoUpdater.quitAndInstall(false, true)
  })
}
