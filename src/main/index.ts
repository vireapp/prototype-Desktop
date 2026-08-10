import {
  app,
  shell,
  BrowserWindow,
  ipcMain,
  Tray,
  Menu,
  nativeImage,
  nativeTheme,
  globalShortcut,
  desktopCapturer,
  session
} from 'electron'
import { join } from 'path'
import icon from '../../resources/images/vire_logo.png?asset'
import { initAutoUpdater } from './updater'
import Groq from 'groq-sdk'
import { getLinkPreview } from 'link-preview-js'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false

// Ensure app name is correct
app.setName('VIRE')

// Set protocol for deep linking
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('vire', process.execPath, [join(__dirname, '../../')])
  }
} else {
  app.setAsDefaultProtocolClient('vire')
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, commandLine) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
      mainWindow.show()
    }

    // Handle deep link from command line
    const url = commandLine.pop()
    if (url && url.startsWith('vire://')) {
      handleDeepLink(url)
    }
  })

  // Load persistent system settings from disk
  const fs = require('fs')
  const path = require('path')
  const configPath = path.join(app.getPath('userData'), 'system-settings.json')
  let persistedSettings = { hotkey: 'Alt+V', hardwareAcceleration: true }
  
  try {
    if (fs.existsSync(configPath)) {
      persistedSettings = { ...persistedSettings, ...JSON.parse(fs.readFileSync(configPath, 'utf-8')) }
    }
  } catch (e) {
    console.error('Failed to load system settings:', e)
  }

  // Hardware Acceleration must be set before app is ready
  if (!persistedSettings.hardwareAcceleration) {
    app.disableHardwareAcceleration()
  }

  app.whenReady().then(() => {
    createWindow()
    createTray()

    app.on('activate', function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })

    // Register Global Shortcut
    const registerShortcut = (accelerator: string) => {
      globalShortcut.unregisterAll()
      try {
        globalShortcut.register(accelerator, () => {
          if (mainWindow) {
            if (mainWindow.isVisible() && mainWindow.isFocused()) {
              mainWindow.hide()
            } else {
              mainWindow.show()
              mainWindow.focus()
            }
          }
        })
      } catch (e) {
        console.error('Failed to register shortcut:', e)
      }
    }

    registerShortcut(persistedSettings.hotkey)

    // IPC to update persisted settings
    ipcMain.on('update-persisted-settings', (_event, settings: any) => {
      if (!settings || typeof settings !== 'object') return

      // Validate hotkey: must be a non-empty string of safe characters only
      const sanitized: typeof persistedSettings = { ...persistedSettings }
      if (typeof settings.hotkey === 'string' && /^[A-Za-z0-9+]+$/.test(settings.hotkey) && settings.hotkey.length <= 30) {
        sanitized.hotkey = settings.hotkey
      }
      if (typeof settings.hardwareAcceleration === 'boolean') {
        sanitized.hardwareAcceleration = settings.hardwareAcceleration
      }

      fs.writeFileSync(configPath, JSON.stringify(sanitized))
      
      if (sanitized.hotkey !== persistedSettings.hotkey) {
        registerShortcut(sanitized.hotkey)
      }
      
      persistedSettings = sanitized
    })

    ipcMain.handle('get-persisted-settings', () => persistedSettings)
  })
}

// Allowlist of routes reachable via deep link / tray navigation
const ALLOWED_NAVIGATE_ROUTES = [
  '/dashboard',
  '/dashboard/friends',
  '/dashboard/messages',
  '/dashboard/rooms',
  '/dashboard/join',
  '/dashboard/settings',
  '/dashboard/shop',
  '/dashboard/ai',
  '/community',
  '/discover',
  '/about',
  '/changelog',
  '/privacy',
  '/terms'
]

function isAllowedRoute(route: string): boolean {
  return ALLOWED_NAVIGATE_ROUTES.some((allowed) => route === allowed || route.startsWith('/room/'))
}

function handleDeepLink(url: string): void {
  if (!mainWindow) return

  // Extract path from vire://path/to/page
  const route = url.replace('vire://', '/')
  if (!isAllowedRoute(route)) {
    console.warn(`[DeepLink] Blocked navigation to disallowed route: ${route}`)
    return
  }
  mainWindow.webContents.send('navigate-to', route)
}

let trayWindow: BrowserWindow | null = null

function createTrayWindow(): void {
  trayWindow = new BrowserWindow({
    width: 250,
    height: 350,
    show: false,
    frame: false,
    fullscreenable: false,
    resizable: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  // Load the tray route
  if (process.env.NODE_ENV !== 'production' && process.env['ELECTRON_RENDERER_URL']) {
    trayWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '#/tray')
  } else {
    trayWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: 'tray' })
  }

  // Hide the window when it loses focus
  trayWindow.on('blur', () => {
    trayWindow?.hide()
  })
}

function toggleTrayWindow(): void {
  if (!trayWindow) return
  
  if (trayWindow.isVisible()) {
    trayWindow.hide()
  } else {
    const position = getTrayPosition()
    if (position) {
      trayWindow.setPosition(position.x, position.y, false)
    }
    trayWindow.show()
    trayWindow.focus()
  }
}

function getTrayPosition() {
  if (!trayWindow || !tray) return undefined
  const windowBounds = trayWindow.getBounds()
  const trayBounds = tray.getBounds()
  
  // Calculate position (assuming Windows taskbar at bottom)
  const x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2))
  const y = Math.round(trayBounds.y - windowBounds.height - 10)
  return { x, y }
}

function createTray(): void {
  const trayIcon = nativeImage.createFromPath(icon).resize({ width: 16, height: 16 })
  tray = new Tray(trayIcon)
  tray.setToolTip('VIRE Desktop')
  
  createTrayWindow()

  tray.on('click', () => toggleTrayWindow())
  tray.on('right-click', () => toggleTrayWindow())
}

// IPC Handlers for Tray actions
ipcMain.on('tray-action', (_event, action: string, payload?: any) => {
  switch (action) {
    case 'open':
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore()
        mainWindow.show()
        mainWindow.focus()
      }
      trayWindow?.hide()
      break
    case 'navigate':
      // Validate route against allowlist before forwarding
      if (typeof payload === 'string' && isAllowedRoute(payload)) {
        if (mainWindow) {
          if (mainWindow.isMinimized()) mainWindow.restore()
          mainWindow.show()
          mainWindow.focus()
          mainWindow.webContents.send('navigate-to', payload)
        }
        trayWindow?.hide()
      } else {
        console.warn(`[TrayAction] Blocked navigate to disallowed route: ${payload}`)
      }
      break
    case 'check-updates':
      mainWindow?.webContents.send('check-updates')
      trayWindow?.hide()
      break
    case 'quit':
      isQuitting = true
      app.quit()
      break
    case 'status-change': {
      const ALLOWED_STATUSES = ['online', 'away', 'invisible', 'offline']
      if (typeof payload === 'string' && ALLOWED_STATUSES.includes(payload)) {
        mainWindow?.webContents.send('status-change', payload)
        trayWindow?.hide()
      }
      break
    }
    case 'status-updated':
      // From main window to tray window
      trayWindow?.webContents.send('status-updated', payload)
      break
    case 'toggle-mute':
      mainWindow?.webContents.send('toggle-mute', payload)
      break
  }
})

function createWindow(): void {
  Menu.setApplicationMenu(null)
  nativeTheme.themeSource = 'dark'

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    show: false,
    frame: false,
    autoHideMenuBar: true,
    title: 'VIRE',
    icon,
    backgroundColor: '#08090d',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: true,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    initAutoUpdater(mainWindow!)
  })

  // --- Screen Share: Allow getDisplayMedia in renderer ---
  // Without this handler, navigator.mediaDevices.getDisplayMedia() is silently
  // blocked in Electron. We use desktopCapturer to provide the source.
  mainWindow.webContents.session.setDisplayMediaRequestHandler(
    async (_request, callback) => {
      try {
        const sources = await desktopCapturer.getSources({ types: ['screen', 'window'] })
        // Default: pick the first screen (entire screen)
        const screen = sources.find((s) => s.id.startsWith('screen:')) || sources[0]
        if (screen) {
          callback({ video: screen, audio: 'loopback' })
        } else {
          callback({}) // deny
        }
      } catch (err) {
        console.error('[ScreenShare] desktopCapturer error:', err)
        callback({}) // deny
      }
    },
    { useSystemPicker: true } // Let Windows show its own native picker
  )

  // IPC: renderer can query available screen/window sources for a custom picker
  // Returns ONLY id + name. Thumbnails are fetched separately on demand to minimize exposure.
  ipcMain.handle('get-desktop-sources', async () => {
    const sources = await desktopCapturer.getSources({
      types: ['screen', 'window'],
      thumbnailSize: { width: 0, height: 0 } // no thumbnails on bulk fetch
    })
    return sources.map((s) => ({
      id: s.id,
      name: s.name
    }))
  })

  // IPC: fetch thumbnail for a single explicitly selected source
  ipcMain.handle('get-source-thumbnail', async (_event, sourceId: string) => {
    if (typeof sourceId !== 'string' || !sourceId.match(/^(screen|window):[0-9]+:[0-9]+$/)) {
      return null
    }
    const sources = await desktopCapturer.getSources({
      types: ['screen', 'window'],
      thumbnailSize: { width: 320, height: 180 }
    })
    const source = sources.find((s) => s.id === sourceId)
    return source ? source.thumbnail.toDataURL() : null
  })

  // --- System & Window Settings ---
  let systemSettings = {
    minimizeToTray: true,
    closeToTray: true,
    launchOnStartup: false,
    startMinimized: false,
    hardwareAcceleration: true
  }

  ipcMain.on('update-system-settings', (_event, settings: any) => {
    systemSettings = { ...systemSettings, ...settings }
    
    // Handle Launch on Startup
    if (settings.launchOnStartup !== undefined) {
      app.setLoginItemSettings({
        openAtLogin: settings.launchOnStartup,
        openAsHidden: settings.startMinimized,
        path: app.getPath('exe')
      })
    }
  })

  ipcMain.handle('get-system-settings', () => {
    return {
      ...systemSettings,
      actualLaunchOnStartup: app.getLoginItemSettings().openAtLogin
    }
  })

  // Expose system hostname so renderer can display the real PC name in session list
  ipcMain.handle('get-hostname', () => {
    const os = require('os')
    return os.hostname()
  })

  // Window Control IPC handlers
  ipcMain.on('window-minimize', () => {
    if (systemSettings.minimizeToTray) {
      mainWindow?.hide()
    } else {
      mainWindow?.minimize()
    }
  })
  ipcMain.on('window-maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })
  ipcMain.on('window-close', () => {
    if (systemSettings.closeToTray) {
      isQuitting = false
      mainWindow?.hide()
    } else {
      isQuitting = true
      app.quit()
    }
  })
  ipcMain.handle('window-is-maximized', () => {
    return mainWindow?.isMaximized() ?? false
  })

  // Notify renderer when maximize state changes
  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window-maximized-changed', true)
  })
  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window-maximized-changed', false)
  })

  // Taskbar Progress IPC
  ipcMain.on('set-progress', (_event, value: number) => {
    // value is 0 to 1
    mainWindow?.setProgressBar(value)
  })
  
  ipcMain.on('set-badge-count', (_event, count: number) => {
    if (app.setBadgeCount) app.setBadgeCount(count)
    if (count > 0) {
      mainWindow?.flashFrame(true)
    }
  })

  // --- Secure AI & YouTube IPC Handlers ---
  const ALLOWED_AI_MODELS = [
    'llama-3.1-8b-instant',
    'llama-3.3-70b-versatile',
    'llama3-8b-8192',
    'llama3-70b-8192',
    'mixtral-8x7b-32768',
    'gemma2-9b-it'
  ]
  const MAX_AI_MESSAGES = 50
  const MAX_AI_CHARS = 100_000
  const MAX_AI_TOKENS = 2000

  ipcMain.handle('ai-chat', async (_event, messages: any[], options: any = {}) => {
    try {
      // --- Input validation ---
      if (!Array.isArray(messages)) return { error: 'Invalid messages payload' }
      if (messages.length > MAX_AI_MESSAGES) return { error: 'Too many messages' }
      const totalChars = messages.reduce((s, m) => s + String(m?.content ?? '').length, 0)
      if (totalChars > MAX_AI_CHARS) return { error: 'Payload too large' }

      // Validate / sanitize options
      const model = ALLOWED_AI_MODELS.includes(options?.model)
        ? options.model
        : 'llama-3.1-8b-instant'
      const temperature = typeof options?.temperature === 'number'
        ? Math.min(Math.max(options.temperature, 0), 2)
        : 0.7
      const max_tokens = typeof options?.max_tokens === 'number'
        ? Math.min(Math.max(Math.floor(options.max_tokens), 1), MAX_AI_TOKENS)
        : 500

      const apiKey = process.env.GROQ_API_KEY || 
                     process.env.VITE_GROQ_API_KEY || 
                     (import.meta as any).env?.VITE_GROQ_API_KEY ||
                     (import.meta as any).env?.GROQ_API_KEY
      if (!apiKey) throw new Error('GROQ_API_KEY not found in environment')

      const groq = new Groq({ apiKey })
      const completion = await groq.chat.completions.create({
        messages,
        model,
        temperature,
        max_tokens
      })
      return { response: completion.choices[0]?.message?.content || '' }
    } catch (error: any) {
      console.error('[IPC:ai-chat] Error:', error)
      return { error: error.message || 'AI Service Error' }
    }
  })

  const MAX_YOUTUBE_QUERY_LEN = 200
  const ALLOWED_REGION_CODES = new Set([
    'US','GB','CA','AU','IN','DE','FR','JP','KR','BR','MX','ES','IT','NL','RU','PL','SE','NO','DK','FI'
  ])

  ipcMain.handle('youtube-search', async (_event, query: string) => {
    try {
      if (typeof query !== 'string' || query.trim().length === 0) return []
      const safeQuery = query.trim().slice(0, MAX_YOUTUBE_QUERY_LEN)

      const apiKey = process.env.GOOGLE_YOUTUBE_API_KEY || 
                     process.env.VITE_GOOGLE_YOUTUBE_API_KEY || 
                     (import.meta as any).env?.VITE_GOOGLE_YOUTUBE_API_KEY ||
                     (import.meta as any).env?.GOOGLE_YOUTUBE_API_KEY
      if (!apiKey) throw new Error('YouTube API Key not found in environment')

      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${encodeURIComponent(safeQuery)}&type=video&key=${apiKey}`
      const response = await fetch(url)
      const data: any = await response.json()
      return data.items || []
    } catch (error: any) {
      console.error('[IPC:youtube-search] Error:', error)
      return []
    }
  })

  ipcMain.handle('youtube-popular', async (_event, regionCode = 'US', categoryId?: string) => {
    try {
      const safeRegion = ALLOWED_REGION_CODES.has(String(regionCode).toUpperCase())
        ? String(regionCode).toUpperCase()
        : 'US'

      const apiKey = process.env.GOOGLE_YOUTUBE_API_KEY || 
                     process.env.VITE_GOOGLE_YOUTUBE_API_KEY || 
                     (import.meta as any).env?.VITE_GOOGLE_YOUTUBE_API_KEY ||
                     (import.meta as any).env?.GOOGLE_YOUTUBE_API_KEY
      if (!apiKey) throw new Error('YouTube API Key not found in environment')

      let url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&maxResults=20&key=${apiKey}&regionCode=${safeRegion}`
      if (categoryId) {
        url += `&videoCategoryId=${encodeURIComponent(categoryId)}`
      }
      
      const response = await fetch(url)
      const data: any = await response.json()
      return data.items || []
    } catch (error: any) {
      console.error('[IPC:youtube-popular] Error:', error)
      return []
    }
  })

  ipcMain.handle('fetch-link-metadata', async (_event, url: string) => {
    try {
      const data = await getLinkPreview(url, {
        timeout: 3000,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)",
        },
      });

      if (data && "title" in data) {
        return {
          title: data.title,
          description: data.description,
          image: data.images?.[0] || null,
          url: data.url,
        };
      }
      return null;
    } catch (error) {
      console.error("Link preview error:", error);
      return null;
    }
  })

  // Prevent window from closing, hide it instead (Minimize to Tray)
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      mainWindow?.hide()
    }
    return false
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    try {
      const parsedUrl = new URL(details.url)
      // Only allow opening http and https protocols
      if (['https:', 'http:'].includes(parsedUrl.protocol)) {
        shell.openExternal(details.url)
      } else {
        console.warn(`Blocked attempt to open insecure protocol: ${parsedUrl.protocol}`)
      }
    } catch (e) {
      console.error('Failed to parse URL for openExternal:', e)
    }
    return { action: 'deny' }
  })

  if (process.env.NODE_ENV !== 'production' && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Handle deep links on macOS
app.on('open-url', (event, url) => {
  event.preventDefault()
  if (url.startsWith('vire://')) {
    handleDeepLink(url)
  }
})
