import { useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

const THEME_KEY = 'theme'

const isBrowser = () => typeof window !== 'undefined'

const getStoredTheme = (): Theme | null => {
  if (!isBrowser()) return null
  const value = window.localStorage.getItem(THEME_KEY)
  return value === 'light' || value === 'dark' ? value : null
}

const detectPreferredTheme = (): Theme => {
  if (!isBrowser()) return 'dark'
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

const applyThemeClasses = (theme: Theme) => {
  if (!isBrowser()) return
  const root = document.documentElement
  const body = document.body

  window.localStorage.setItem(THEME_KEY, theme)
  const enableLight = theme === 'light'

  root.classList.toggle('theme-light', enableLight)
  root.classList.toggle('light-mode', enableLight)
  body.classList.toggle('theme-light', enableLight)
  body.classList.toggle('light-mode', enableLight)
}

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const initialTheme = getStoredTheme() ?? detectPreferredTheme()
    setTheme(initialTheme)
  }, [])

  useEffect(() => {
    applyThemeClasses(theme)
  }, [theme])

  return (
    <button
      className="px-3 py-1.5 rounded-lg bg-white/80 text-slate-600 border border-indigo-100 shadow-sm hover:bg-indigo-50 text-sm"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
    </button>
  )
}
