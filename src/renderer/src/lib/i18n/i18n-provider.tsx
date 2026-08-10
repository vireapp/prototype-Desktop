import React, { createContext, useContext, useMemo } from 'react'
import translations from './translations.json'
import { useGlobalSettings } from '@/components/providers/settings-provider'

type Translations = typeof translations
type Locale = keyof Translations
type TranslationKeys = {
  [K in keyof Translations['en']]: keyof Translations['en'][K]
}

interface I18nContextType {
  locale: Locale
  t: (category: keyof Translations['en'], key: string) => string
}

const I18nContext = createContext<I18nContextType>({
  locale: 'en',
  t: () => ''
})

export function useTranslation() {
  return useContext(I18nContext)
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { settings, loading } = useGlobalSettings()

  const locale = useMemo(() => {
    if (!settings || !settings.language) return 'en'
    if (settings.language in translations) {
      return settings.language as Locale
    }
    return 'en'
  }, [settings])

  const t = (category: keyof Translations['en'], key: string) => {
    try {
      const dict = translations[locale] as any
      if (dict && dict[category] && dict[category][key]) {
        return dict[category][key]
      }
      // fallback to english
      const fallback = translations['en'] as any
      return fallback[category]?.[key] || key
    } catch (e) {
      return key
    }
  }

  if (loading) {
    return null // or a loader
  }

  return (
    <I18nContext.Provider value={{ locale, t }}>
      {children}
    </I18nContext.Provider>
  )
}
