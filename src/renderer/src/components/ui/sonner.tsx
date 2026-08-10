'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner, type ToasterProps } from 'sonner'
import {
  CheckCircle2,
  Info,
  AlertTriangle,
  XCircle,
  Loader2,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Bell
} from 'lucide-react'

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      richColors={false}
      expand={true}
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background/60 group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-foreground group-[.toaster]:border-border/50 group-[.toaster]:shadow-2xl group-[.toaster]:rounded-2xl group-[.toaster]:p-4 group-[.toaster]:items-start',
          description: 'group-[.toast]:text-muted-foreground group-[.toast]:font-medium',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:font-semibold group-[.toast]:rounded-xl group-[.toast]:px-4',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:font-medium group-[.toast]:rounded-xl',
          title: 'group-[.toast]:font-bold group-[.toast]:text-base group-[.toast]:tracking-tight',
          icon: 'group-[.toast]:mr-3 group-[.toast]:mt-0.5',
          error: 'group-[.toaster]:border-red-500/20 group-[.toaster]:bg-red-500/10',
          success: 'group-[.toaster]:border-green-500/20 group-[.toaster]:bg-green-500/10',
          warning: 'group-[.toaster]:border-amber-500/20 group-[.toaster]:bg-amber-500/10',
          info: 'group-[.toaster]:border-blue-500/20 group-[.toaster]:bg-blue-500/10'
        }
      }}
      icons={{
        success: (
          <CheckCircle2 className="size-5 text-green-500 animate-in zoom-in-50 duration-300" />
        ),
        info: <Info className="size-5 text-blue-500 animate-in zoom-in-50 duration-300" />,
        warning: (
          <AlertTriangle className="size-5 text-amber-500 animate-in zoom-in-50 duration-300" />
        ),
        error: <XCircle className="size-5 text-red-500 animate-in zoom-in-50 duration-300" />,
        loading: <Loader2 className="size-5 animate-spin text-muted-foreground" />
      }}
      {...props}
    />
  )
}

export { Toaster }
