import './assets/globals.css'
import { startWriteQueue } from '@/lib/write-queue'

// Bootstrap the persistent write queue — replays any writes
// that were buffered during a previous session that ended unexpectedly.
startWriteQueue()

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ThemeProvider } from 'next-themes'

console.log('Renderer: main.tsx starting...')

try {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <App />
      </ThemeProvider>
    </StrictMode>
  )
  console.log('Renderer: render called successfully')
} catch (error) {
  console.error('Renderer: Fatal error during render:', error)
  document.body.innerHTML = `<div style="padding: 20px; color: white; background: #800; font-family: sans-serif;">
    <h1>Fatal Error</h1>
    <pre>${error instanceof Error ? error.stack : String(error)}</pre>
  </div>`
}
