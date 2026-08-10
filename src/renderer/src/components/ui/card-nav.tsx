'use client'

import React, { useLayoutEffect, useRef, useState, useEffect } from 'react'
import { gsap } from 'gsap'
import { GoArrowUpRight, GoChevronLeft } from 'react-icons/go'

import { cn } from '@/lib/utils'

type CardNavLink = {
  label: string
  href: string
  ariaLabel: string
}

export type CardNavItem = {
  label: string
  bgColor: string
  textColor: string
  links: CardNavLink[]
}

export interface CardNavProps {
  logo: string
  logoAlt?: string
  items: CardNavItem[]
  className?: string
  ease?: string
  baseColor?: string
  menuColor?: string
  buttonBgColor?: string
  buttonTextColor?: string
}

const CardNav: React.FC<CardNavProps> = ({
  logo,
  logoAlt = 'Logo',
  items,
  className = '',
  ease = 'power3.out',
  baseColor = '#fff',
  menuColor,
  buttonBgColor,
  buttonTextColor
}) => {
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<number | null>(null)

  const navRef = useRef<HTMLDivElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)

  // Reset tab when menu closes
  useEffect(() => {
    if (!isExpanded) {
      const timer = setTimeout(() => setActiveTab(null), 300) // Delay reset to allow close animation
      return () => clearTimeout(timer)
    }
  }, [isExpanded])

  // Calculate height based on content
  const updateHeight = React.useCallback((): void => {
    const navEl = navRef.current
    const contentEl = contentRef.current
    if (!navEl || !contentEl) return

    // We need to measure the content height.
    // Since we are using conditional rendering or switching content, we might need a tick to let React render.
    // However, for GSAP height animation to work smoothly with dynamic content,
    // we often need to animate TO 'auto'.

    // For this specific interaction:
    // 1. Expanded (Tabs view) -> Height A
    // 2. Expanded (Links view) -> Height B

    if (isExpanded) {
      const contentHeight = contentEl.scrollHeight
      const topBarHeight = 60 // Approximate header height
      const padding = 24 // Padding bottom

      gsap.to(navEl, {
        height: topBarHeight + contentHeight + padding,
        duration: 0.4,
        ease: ease
      })

      gsap.to(contentEl, {
        opacity: 1,
        y: 0,
        duration: 0.3,
        delay: 0.1
      })
    } else {
      gsap.to(navEl, {
        height: 60, // Collapsed height
        duration: 0.4,
        ease: ease
      })

      gsap.to(contentEl, {
        opacity: 0,
        y: 20,
        duration: 0.2
      })
    }
  }, [ease, isExpanded])

  useLayoutEffect(() => {
    updateHeight()
  }, [isExpanded, activeTab, updateHeight])

  const toggleMenu = (): void => {
    if (!isExpanded) {
      setIsHamburgerOpen(true)
      setIsExpanded(true)
    } else {
      setIsHamburgerOpen(false)
      setIsExpanded(false)
    }
  }

  const handleMouseEnter = (): void => {
    if (!window.matchMedia('(max-width: 768px)').matches) {
      setIsHamburgerOpen(true)
      setIsExpanded(true)
    }
  }

  const handleMouseLeave = (): void => {
    if (!window.matchMedia('(max-width: 768px)').matches) {
      setIsHamburgerOpen(false)
      setIsExpanded(false)
    }
  }

  const activeItem = activeTab !== null ? items[activeTab] : null

  return (
    <div
      className={cn(
        'absolute top-8 left-1/2 -translate-x-1/2 w-[90%] max-w-[800px] z-50 box-border',
        className
      )}
    >
      <nav
        ref={navRef}
        className={cn(
          'block relative overflow-hidden rounded-xl shadow-lg border border-white/10 transition-colors duration-300',
          'bg-white'
        )}
        style={{ backgroundColor: baseColor, height: 60 }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 h-[60px] flex items-center justify-between px-5 pt-2 pb-2.5 z-20">
          {/* Hamburger */}
          <div
            className="h-full flex flex-col items-center justify-center cursor-pointer gap-[6px] group w-8"
            onClick={toggleMenu}
            role="button"
            aria-label={isExpanded ? 'Close menu' : 'Open menu'}
            tabIndex={0}
            style={{ color: menuColor || '#000' }}
          >
            <div
              className={cn(
                'w-[30px] h-[2px] bg-current transition-all duration-300 origin-center',
                isHamburgerOpen ? 'translate-y-[4px] rotate-45' : ''
              )}
            />
            <div
              className={cn(
                'w-[30px] h-[2px] bg-current transition-all duration-300 origin-center',
                isHamburgerOpen ? '-translate-y-[4px] -rotate-45' : ''
              )}
            />
          </div>

          {/* Logo */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center">
            <img src={logo} alt={logoAlt} className="h-7" />
          </div>

          {/* CTA */}
          <a
            href="/register"
            className="flex items-center px-4 h-full rounded-lg text-sm font-medium transition-colors duration-300"
            style={{ backgroundColor: buttonBgColor, color: buttonTextColor }}
          >
            Get Started
          </a>
        </div>

        {/* Content Area */}
        <div
          ref={contentRef}
          className="absolute left-0 right-0 top-[60px] p-2 opacity-0 translate-y-4"
        >
          {!activeItem ? (
            // Category Tabs View
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 h-full">
              {items.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveTab(idx)}
                  className="flex flex-col items-start justify-between min-h-[120px] p-4 text-left rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-95 group"
                  style={{ backgroundColor: item.bgColor, color: item.textColor }}
                >
                  <span className="text-xl font-light tracking-tight">{item.label}</span>
                  <div className="mt-auto flex items-center gap-2 text-sm opacity-60 group-hover:opacity-100 transition-opacity">
                    <span>View Links</span>
                    <GoArrowUpRight />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            // Links View
            <div
              className="flex flex-col h-full rounded-xl overflow-hidden"
              style={{ backgroundColor: activeItem.bgColor, color: activeItem.textColor }}
            >
              <div className="flex items-center gap-2 p-4 border-b border-white/10">
                <button
                  onClick={() => setActiveTab(null)}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <GoChevronLeft />
                </button>
                <span className="text-lg font-medium">{activeItem.label}</span>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeItem.links.map((link, i) => (
                  <a
                    key={i}
                    href={link.href}
                    aria-label={link.ariaLabel}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
                  >
                    <span className="font-medium">{link.label}</span>
                    <GoArrowUpRight className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>
    </div>
  )
}

export default CardNav
