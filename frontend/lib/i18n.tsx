import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import en from '../locales/en.json'
import ar from '../locales/ar.json'

type Lang = 'en' | 'ar'
type Dict = Record<string, string>

const dictionaries: Record<Lang, Dict> = { en, ar }

type I18nCtx = {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: string, fallback?: string) => string
}

const Ctx = createContext<I18nCtx | null>(null)

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en')

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? (localStorage.getItem('lang') as Lang | null) : null
    if (saved === 'ar' || saved === 'en') setLangState(saved)
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lang', lang)
      const dir = lang === 'ar' ? 'rtl' : 'ltr'
      document.documentElement.setAttribute('dir', dir)
      document.documentElement.setAttribute('lang', lang)
    }
  }, [lang])

  const setLang = (l: Lang) => setLangState(l)

  const t = (key: string, fallback?: string) => {
    const dict = dictionaries[lang] || {}
    return dict[key] || fallback || key
  }

  const value = useMemo(() => ({ lang, setLang, t }), [lang])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useI18n() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useI18n must be used within LangProvider')
  return ctx
}

