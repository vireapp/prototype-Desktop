import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface UserSettings {
  font_family?: string
  border_radius?: string
  high_contrast?: boolean
  primary_accent?: string
  layout_density?: string
  glass_blur_intensity?: string
  reduced_motion?: boolean
  colorblind_mode?: string
  language?: string
  tray_notifications?: boolean
}

interface SettingsContextType {
  settings: UserSettings | null
  loading: boolean
}

const SettingsContext = createContext<SettingsContextType>({ settings: null, loading: true })

export function useGlobalSettings() {
  return useContext(SettingsContext)
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchSettings() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', session.user.id)
        .single()
      
      if (data) setSettings(data)
      setLoading(false)
    }

    fetchSettings()

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'user_settings' },
        (payload) => {
          setSettings(payload.new as UserSettings)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  useEffect(() => {
    if (!settings) return

    // Apply Fonts
    const fontMap: Record<string, string> = {
      inter: "'Inter', sans-serif",
      orbitron: "'Orbitron', sans-serif",
      serif: "'Playfair Display', serif",
      mono: "'JetBrains Mono', monospace",
      poppins: "'Poppins', sans-serif",
      sora: "'Sora', sans-serif",
    }
    const selectedFont = fontMap[settings.font_family || "inter"] || fontMap["inter"];
    document.body.style.setProperty("--font-body", selectedFont);
    document.body.style.setProperty("--font-heading", selectedFont);

    // Apply Border Radius
    document.body.style.setProperty("--radius", settings.border_radius || "0.5rem")

    // High Contrast
    if (settings.high_contrast) {
      document.body.classList.add("high-contrast")
    } else {
      document.body.classList.remove("high-contrast")
    }

    // Colorblind Mode
    const colorblindModes = ["protanopia", "deuteranopia", "tritanopia"]
    document.body.classList.remove(...colorblindModes)
    if (settings.colorblind_mode && settings.colorblind_mode !== "off") {
      document.body.classList.add(`colorblind-${settings.colorblind_mode}`)
    }

    // Reduced Motion
    if (settings.reduced_motion) {
      document.body.classList.add("reduced-motion")
    } else {
      document.body.classList.remove("reduced-motion")
    }

    // Accent Color
    const themes = [
      "theme-neon_cyan",
      "theme-sunset_orange",
      "theme-acid_green",
      "theme-purple_haze",
      "theme-rose_gold",
      "theme-crimson_red",
      "theme-electric_blue",
    ]
    document.body.classList.remove(...themes)
    if (settings.primary_accent && settings.primary_accent !== "default") {
      document.body.classList.add(`theme-${settings.primary_accent}`)
    }

    // Layout Density
    const densities = ["density-compact", "density-standard", "density-relaxed"]
    document.documentElement.classList.remove(...densities)
    if (settings.layout_density) {
      document.documentElement.classList.add(`density-${settings.layout_density}`)
    }

    // Glass Blur
    const blurMap: Record<string, string> = {
      sm: "4px",
      md: "12px",
      lg: "24px",
      xl: "32px",
    }
    const selectedBlur = blurMap[settings.glass_blur_intensity || "md"] || "12px"
    document.body.style.setProperty("--glass-blur", selectedBlur)

  }, [settings])

  return (
    <SettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SettingsContext.Provider>
  )
}
