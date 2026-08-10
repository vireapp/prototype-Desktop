'use client'

import { Dialog, DialogContent, DialogOverlay, DialogTitle } from '@/components/ui/dialog'
import { useNavigate } from 'react-router-dom'

export function Modal({
  children,
  title = 'Modal'
}: {
  children: React.ReactNode
  title?: string
}) {
  const navigate = useNavigate()

  function onDismiss() {
    navigate(-1)
  }

  return (
    <Dialog defaultOpen={true} open={true} onOpenChange={onDismiss}>
      <DialogOverlay className="bg-black/80 backdrop-blur-sm" />
      <DialogContent className="sm:max-w-[425px] overflow-visible">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        {children}
      </DialogContent>
    </Dialog>
  )
}
