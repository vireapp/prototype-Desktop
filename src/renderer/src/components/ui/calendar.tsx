'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker } from 'react-day-picker'

import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        // Layout
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-3 w-full',
        month_grid: 'border-collapse w-full',
        month_caption: 'flex items-center justify-between mb-2 px-1',

        // Caption / Navigation — arrows in the flex flow, not absolute
        caption_label: 'text-sm font-medium text-white',
        nav: 'flex items-center gap-1',
        button_previous: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-8 w-8 bg-white/[0.04] p-0 text-zinc-400 hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors shrink-0'
        ),
        button_next: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-8 w-8 bg-white/[0.04] p-0 text-zinc-400 hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors shrink-0'
        ),

        // Weekday headers (v9 keys)
        weekdays: '',
        weekday:
          'text-zinc-500 font-normal text-[0.75rem] text-center w-10 pb-2 uppercase tracking-wider',

        // Week rows & day cells (v9 keys)
        weeks: '',
        week: '',
        day: 'h-10 w-10 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-violet-500/15 focus-within:relative focus-within:z-20',
        day_button: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-10 w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-white/10 hover:text-white rounded-lg transition-colors'
        ),

        // Day states (v9 keys)
        selected:
          'bg-violet-500 text-white hover:bg-violet-600 hover:text-white focus:bg-violet-500 focus:text-white rounded-lg shadow-[0_0_12px_rgba(139,92,246,0.4)]',
        today: 'bg-white/[0.06] text-white shadow-sm border border-violet-500/30 rounded-lg',
        outside:
          'text-white/20 opacity-50 aria-selected:bg-violet-500/10 aria-selected:text-white/30 aria-selected:opacity-30',
        disabled: 'text-white/10 opacity-50',
        hidden: 'invisible',
        range_end: 'day-range-end',
        range_middle: 'aria-selected:bg-violet-500/10 aria-selected:text-white',

        // Dropdown (kept for backward compat, but we won't use dropdown mode)
        dropdown: 'rdp-dropdown',
        dropdown_root: 'relative inline-flex items-center',
        dropdowns: 'flex items-center justify-center gap-2',
        ...classNames
      }}
      components={{
        Chevron: ({ orientation }) => {
          const Icon = orientation === 'left' ? ChevronLeft : ChevronRight
          return <Icon className="h-4 w-4" />
        }
      }}
      {...props}
    />
  )
}
Calendar.displayName = 'Calendar'

export { Calendar }
