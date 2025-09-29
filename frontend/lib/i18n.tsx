import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import en from '../locales/en.json'
import ar from '../locales/ar.json'

type Language = 'en' | 'ar'
type TranslationDictionary = typeof en

interface I18nContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, fallback?: string) => string
  dictionary: TranslationDictionary
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

const TRANSLATIONS: Record<Language, TranslationDictionary> = {
  en,
  ar
}

const resolveKey = (dictionary: TranslationDictionary, key: string): unknown => {
  return key.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part]
    }
    return undefined
  }, dictionary)
}

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en')

  useEffect(() => {
    const savedLang = (typeof window !== 'undefined' && (localStorage.getItem('language') as Language | null)) || null
    if (savedLang && (savedLang === 'en' || savedLang === 'ar')) {
      setLanguage(savedLang)
    }
  }, [])

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language === 'ar' ? 'ar' : 'en'
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
      document.body.classList.toggle('rtl', language === 'ar')
    }
  }, [language])

  const dictionary = TRANSLATIONS[language]

  const t = (key: string, fallback?: string) => {
    const value = resolveKey(dictionary, key)
    if (typeof value === 'string') {
      return value
    }
    return fallback ?? key
  }

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang)
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang)
    }
  }

  return (
    <I18nContext.Provider value={{ language, setLanguage: handleSetLanguage, t, dictionary }}>
      {children}
    </I18nContext.Provider>
  )
}

export const useI18n = () => {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}
