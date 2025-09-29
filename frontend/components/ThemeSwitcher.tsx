import { useEffect, useState } from 'react'

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<'dark'|'light'>(() => (typeof window!=='undefined' && (localStorage.getItem('theme') as any)) || 'dark')
  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem('theme', theme)
    const root = document.documentElement
    if (theme === 'light') {
      root.classList.add('theme-light')
    } else {
      root.classList.remove('theme-light')
    }
  }, [theme])
  return (
    <button
      className="px-3 py-1.5 rounded-lg bg-white/80 text-slate-600 border border-indigo-100 shadow-sm hover:bg-indigo-50 text-sm"
      onClick={()=> setTheme(theme==='dark'?'light':'dark')}
    >
      {theme==='dark' ? 'Light Mode' : 'Dark Mode'}
    </button>
  )
}
