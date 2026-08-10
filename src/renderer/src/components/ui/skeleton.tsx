import * as React from 'react'
import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        'rounded-md bg-muted/40 backdrop-blur-sm border border-border/5 animate-shimmer',
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
