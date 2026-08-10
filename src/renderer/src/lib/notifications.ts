import { toast } from 'sonner'

interface NotifyOptions {
  title?: string
  body: string
  icon?: string
  playSound?: boolean
  onClick?: () => void
}

export const nativeNotify = ({ title = 'VIRE', body, icon, playSound = true, onClick }: NotifyOptions) => {
  // Play sound if requested
  if (playSound) {
    try {
      const audio = new Audio('/sounds/notification.mp3')
      audio.volume = 0.5
      audio.play().catch(() => {
        // Ignore autoplay errors or missing file errors
      })
    } catch (e) {
      // Audio not supported or other error
    }
  }

  // Always show toast
  toast(body, {
    description: title !== 'VIRE' ? title : undefined
  })

  // Show native notification if window is hidden or unfocused
  // Electron handles these as native OS notifications
  if (document.visibilityState === 'hidden' || !document.hasFocus()) {
    const notification = new Notification(title, {
      body,
      icon: icon || '/images/vire_logo.png'
    })

    if (onClick) {
      notification.onclick = onClick
    }
  }
}
