'use client'

import React, { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import {
  LucideIcon,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]

interface DatePickerFieldProps {
  label: string
  name: string
  icon?: LucideIcon
  required?: boolean
  value?: string // "YYYY-MM-DD" format
  onChange?: (dateStr: string) => void
  className?: string
  minDate?: Date
  maxDate?: Date
  defaultMonth?: Date
}

export function DatePickerField({
  label,
  name,
  icon: Icon = CalendarIcon,
  required,
  value,
  onChange,
  className,
  minDate = new Date('1900-01-01'),
  maxDate = new Date(),
  defaultMonth
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false)
  const selectedDate = value ? new Date(value) : undefined

  // Controlled month for the calendar view
  const [displayMonth, setDisplayMonth] = useState<Date>(
    selectedDate || defaultMonth || new Date(2000, 0)
  )

  // Editable inputs state
  const [monthInput, setMonthInput] = useState(String(displayMonth.getMonth() + 1))
  const [yearInput, setYearInput] = useState(String(displayMonth.getFullYear()))

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      const formatted = format(date, 'yyyy-MM-dd')
      onChange?.(formatted)
      setOpen(false)
    }
  }

  // Navigate via arrows
  const goToPrevMonth = useCallback(() => {
    setDisplayMonth((prev) => {
      const d = new Date(prev)
      d.setMonth(d.getMonth() - 1)
      setMonthInput(String(d.getMonth() + 1))
      setYearInput(String(d.getFullYear()))
      return d
    })
  }, [])

  const goToNextMonth = useCallback(() => {
    setDisplayMonth((prev) => {
      const d = new Date(prev)
      d.setMonth(d.getMonth() + 1)
      setMonthInput(String(d.getMonth() + 1))
      setYearInput(String(d.getFullYear()))
      return d
    })
  }, [])

  // Apply typed month
  const applyMonthInput = useCallback(() => {
    const m = parseInt(monthInput, 10)
    if (!isNaN(m) && m >= 1 && m <= 12) {
      setDisplayMonth((prev) => {
        const d = new Date(prev)
        d.setMonth(m - 1)
        return d
      })
      setMonthInput(String(m))
    } else {
      // Reset to current display
      setMonthInput(String(displayMonth.getMonth() + 1))
    }
  }, [monthInput, displayMonth])

  // Apply typed year
  const applyYearInput = useCallback(() => {
    const y = parseInt(yearInput, 10)
    const minY = minDate.getFullYear()
    const maxY = maxDate.getFullYear()
    if (!isNaN(y) && y >= minY && y <= maxY) {
      setDisplayMonth((prev) => {
        const d = new Date(prev)
        d.setFullYear(y)
        return d
      })
      setYearInput(String(y))
    } else {
      setYearInput(String(displayMonth.getFullYear()))
    }
  }, [yearInput, displayMonth, minDate, maxDate])

  // Sync display month when popover opens
  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        const m = selectedDate || defaultMonth || new Date(2000, 0)
        setDisplayMonth(m)
        setMonthInput(String(m.getMonth() + 1))
        setYearInput(String(m.getFullYear()))
      }
      setOpen(nextOpen)
    },
    [selectedDate, defaultMonth]
  )

  const hasValue = !!value
  const isActive = open || hasValue

  const currentMonthName = MONTH_NAMES[displayMonth.getMonth()]

  return (
    <div className="relative group">
      {/* Animated Label */}
      <motion.div
        initial={false}
        animate={
          isActive
            ? { y: -8, x: -4, scale: 0.75, color: '#a78bfa' }
            : { y: 4, x: 0, scale: 1, color: '#a1a1aa' }
        }
        className="absolute left-3 top-2 origin-left pointer-events-none flex items-center gap-2 will-change-transform z-10"
      >
        {Icon && (
          <Icon
            className={cn(
              'w-4 h-4 transition-colors duration-300',
              isActive ? 'text-violet-400' : 'text-zinc-400'
            )}
          />
        )}
        <span
          className={cn(
            'transition-colors duration-300',
            isActive ? 'text-violet-400' : 'text-zinc-400'
          )}
        >
          {label}
        </span>
      </motion.div>

      <input type="hidden" name={name} value={value || ''} required={required} />

      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className={cn(
              'w-full h-14 pt-6 pb-2 px-3 text-left justify-between font-normal',
              'bg-white/5 border border-white/10 rounded-md',
              'hover:bg-white/[0.06] hover:border-violet-500/30',
              'transition-all duration-300 backdrop-blur-sm',
              open && 'border-violet-500/50 bg-white/[0.06] ring-1 ring-violet-500/20',
              className
            )}
          >
            <span className={cn('text-sm', hasValue ? 'text-white' : 'text-transparent')}>
              {hasValue ? format(selectedDate!, 'MMMM d, yyyy') : 'Pick a date'}
            </span>
            <ChevronDown
              className={cn(
                'h-4 w-4 text-zinc-500 transition-transform duration-200',
                open && 'rotate-180 text-violet-400'
              )}
            />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-auto p-0 bg-[#0a0a0f] border border-white/[0.08] shadow-[0_16px_70px_-12px_rgba(139,92,246,0.25)] backdrop-blur-xl rounded-xl"
          align="start"
          sideOffset={8}
        >
          {/* ---- Custom header with editable month/year ---- */}
          <div className="px-4 pt-3 pb-1">
            <p className="text-[10px] uppercase tracking-[0.2em] text-violet-400/60 font-medium">
              Select Date
            </p>
          </div>

          <div className="flex items-center justify-between gap-2 px-4 pb-2">
            {/* Prev arrow */}
            <button
              type="button"
              onClick={goToPrevMonth}
              className="h-8 w-8 flex items-center justify-center rounded-lg bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors shrink-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Month input */}
            <div className="flex items-center gap-1.5 flex-1 justify-center">
              <div className="flex flex-col items-center">
                <label className="text-[9px] text-zinc-600 uppercase tracking-widest mb-0.5">
                  Month
                </label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={monthInput}
                  onChange={(e) => setMonthInput(e.target.value)}
                  onBlur={applyMonthInput}
                  onKeyDown={(e) => e.key === 'Enter' && applyMonthInput()}
                  className="w-12 h-7 text-center text-sm font-medium text-white bg-white/[0.06] border border-white/[0.1] rounded-lg outline-none focus:border-violet-500/50 focus:bg-white/[0.08] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              {/* Month name display */}
              <span className="text-sm text-zinc-400 font-medium min-w-[5rem] text-center">
                {currentMonthName}
              </span>

              {/* Year input */}
              <div className="flex flex-col items-center">
                <label className="text-[9px] text-zinc-600 uppercase tracking-widest mb-0.5">
                  Year
                </label>
                <input
                  type="number"
                  min={minDate.getFullYear()}
                  max={maxDate.getFullYear()}
                  value={yearInput}
                  onChange={(e) => setYearInput(e.target.value)}
                  onBlur={applyYearInput}
                  onKeyDown={(e) => e.key === 'Enter' && applyYearInput()}
                  className="w-16 h-7 text-center text-sm font-medium text-white bg-white/[0.06] border border-white/[0.1] rounded-lg outline-none focus:border-violet-500/50 focus:bg-white/[0.08] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>

            {/* Next arrow */}
            <button
              type="button"
              onClick={goToNextMonth}
              className="h-8 w-8 flex items-center justify-center rounded-lg bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors shrink-0"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Divider */}
          <div className="mx-4 h-px bg-white/[0.06] mb-1" />

          {/* Calendar grid — hide its built-in nav since we have our own */}
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            month={displayMonth}
            onMonthChange={(m) => {
              setDisplayMonth(m)
              setMonthInput(String(m.getMonth() + 1))
              setYearInput(String(m.getFullYear()))
            }}
            disabled={(date) => date > maxDate || date < minDate}
            classNames={{
              month_caption: 'hidden',
              nav: 'hidden'
            }}
          />

          {/* Footer */}
          {hasValue && (
            <div className="px-4 pb-3 pt-1 border-t border-white/[0.04]">
              <p className="text-[11px] text-zinc-500 text-center">
                {format(selectedDate!, 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Active border line */}
      <motion.div
        className={cn(
          'absolute bottom-0 left-0 h-[1px] bg-gradient-to-r from-violet-500 to-cyan-500 transition-all duration-500 ease-out',
          open ? 'w-full' : 'w-0'
        )}
      />
    </div>
  )
}
