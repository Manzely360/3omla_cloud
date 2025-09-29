import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import LanguageSwitcher from '../LanguageSwitcher'
import ThemeSwitcher from '../ThemeSwitcher'
import Logo3omla from '../Logo3omla'
import { useI18n } from '../../lib/i18n'
import {
  BellIcon,
  CogIcon,
  UserIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { getPoints, canPlayToday, msUntilNextPlay } from '../../lib/points'

export default function Header() {
  const { t, language } = useI18n()
  const [searchQuery, setSearchQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [timeZone, setTimeZone] = useState('UTC')
  const [showMenu, setShowMenu] = useState(false)
  const [points, setPoints] = useState(0)
  const [symbols, setSymbols] = useState<string[]>([])
  const [playable, setPlayable] = useState(true)
  const [cooldown, setCooldown] = useState(0)
  const router = useRouter()

  const filtered = useMemo(() => {
    const q = (searchQuery || '').trim().toUpperCase()
    if (!q) return []
    const split = q.includes('/') ? q.split('/') : null
    const pair = split && split.length === 2 && split[0] && split[1]
    const results: { type: 'pair' | 'symbol'; label: string }[] = []
    if (pair && symbols.includes(split![0]) && symbols.includes(split![1])) {
      results.push({ type: 'pair', label: `${split![0]}/${split![1]}` })
    }
    const starts = symbols.filter((s) => s.startsWith(q)).slice(0, 8)
    const contains = symbols.filter((s) => !s.startsWith(q) && s.includes(q)).slice(0, 4)
    return [...starts.map(label => ({ type: 'symbol', label })), ...contains.map(label => ({ type: 'symbol', label }))]
  }, [searchQuery, symbols])

  useEffect(() => {
    if (typeof Intl !== 'undefined') {
      setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const loadSymbols = async () => {
      try {
        const res = await fetch('/api/v1/market/symbols?limit=1000', { signal: controller.signal })
        if (!res.ok) return
        const data = await res.json()
        const list: string[] = Array.isArray(data)
          ? data.map((item: any) => (typeof item === 'string' ? item : item.symbol)).filter(Boolean)
          : []
        setSymbols(list)
      } catch (error) {
        if ((error as any)?.name === 'AbortError') return
      }
    }
    loadSymbols()
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const loadPoints = () => {
      setPoints(getPoints())
      const canPlay = canPlayToday()
      setPlayable(canPlay)
      setCooldown(canPlay ? 0 : msUntilNextPlay())
    }
    loadPoints()
    const handler = (event: Event) => {
      if ('detail' in event) {
        setPoints(Number((event as CustomEvent).detail) || 0)
      } else {
        setPoints(getPoints())
      }
      setPlayable(canPlayToday())
      setCooldown(canPlayToday() ? 0 : msUntilNextPlay())
    }
    window.addEventListener('3omla:points', handler)
    return () => window.removeEventListener('3omla:points', handler)
  }, [])

  useEffect(() => {
    if (!searchQuery) setShowResults(false)
    else setShowResults(true)
  }, [searchQuery])

  const handleSelect = (item: { type: 'pair' | 'symbol'; label: string }) => {
    setShowResults(false)
    setSearchQuery('')
    if (item.type === 'pair') {
      const [a, b] = item.label.split('/')
      router.push(`/pair?leader=${a}&follower=${b}`)
    } else {
      router.push(`/charts?symbol=${item.label}`)
    }
  }

  const formatCooldown = () => {
    if (cooldown <= 0) return language === 'ar' ? 'جاهز للعب' : 'Ready to play'
    const hours = Math.floor(cooldown / 1000 / 60 / 60)
    const minutes = Math.floor((cooldown / 1000 / 60) % 60)
    if (language === 'ar') {
      return `${hours} ساعة ${minutes} دقيقة`
    }
    return `${hours}h ${minutes}m`
  }

  return (
    <header className="bg-slate-900/90 backdrop-blur-xl border-b border-slate-700/50 px-4 sm:px-6 py-3 sm:py-4 shadow-sm shadow-slate-900/60">
      <div className="mx-auto w-full max-w-7xl flex items-center justify-between">
        {/* Left side - Brand and Live indicator */}
        <div className="flex items-center space-x-4 pl-14 sm:pl-16">
          <div className="flex items-center space-x-3">
            <Logo3omla variant="full" size="md" />
            <div className="hidden lg:flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-slate-400">LIVE</span>
            </div>
          </div>
        </div>

        {/* Center - Search Bar */}
        <div className="relative flex-1 max-w-2xl mx-8">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('header.search.placeholder', 'Search symbols, signals, or analytics...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-600 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-inner shadow-slate-700/70"
          />
          <motion.div
            initial={false}
            animate={{ opacity: showResults && filtered.length > 0 ? 1 : 0, y: showResults && filtered.length > 0 ? 0 : -8, pointerEvents: showResults && filtered.length > 0 ? 'auto' : 'none' }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute z-50 mt-2 w-full"
          >
            {showResults && filtered.length > 0 && (
              <div className="bg-slate-800 border border-slate-600 rounded-2xl shadow-xl shadow-slate-900/80 max-h-80 overflow-auto">
                {filtered.map((it, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelect(it)}
                    className="w-full text-left px-3 py-2 hover:bg-slate-700 rounded-xl text-sm flex items-center justify-between"
                  >
                    <span className="text-white">{it.label}</span>
                    <span className="text-xs text-green-400">{it.type === 'pair' ? 'Pair' : 'Symbol'}</span>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="flex items-center space-x-2">
            <div className="hidden sm:block text-xs text-slate-400 mr-2">{timeZone}</div>
            <LanguageSwitcher />
            <ThemeSwitcher />
          </div>

          <div className="relative">
            <button
              className="flex items-center space-x-2 p-2 text-slate-400 hover:text-sky-300 hover:bg-slate-800 rounded-lg transition-colors"
              onClick={() => setShowMenu(!showMenu)}
            >
              <UserIcon className="h-5 w-5" />
              <span className="hidden sm:block text-sm">{t('header.account', 'Account')}</span>
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-600 rounded-2xl shadow-2xl shadow-slate-900/70 z-[9999] p-4">
                <div className="mb-4 rounded-2xl border border-slate-600 bg-slate-900/60 p-4 flex items-center gap-3">
                  <Logo3omla variant="icon" size="sm" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{t('points.balance_label', 'Current 3OMLA points')}</p>
                    <p className="text-2xl font-bold text-white">{points.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}</p>
                  </div>
                </div>

                <div className="mb-3 text-sm text-slate-300">
                  <span className="font-medium text-sky-300">{playable ? t('games.play_button', 'Play now') : t('games.come_back', 'Thank you! Come back in 24 hours to win more 3OMLA points!')}</span>
                  {!playable && (
                    <span className="block text-xs text-slate-400 mt-1">{formatCooldown()}</span>
                  )}
                </div>

                <div className="border-t border-slate-700 pt-3 grid grid-cols-2 gap-2 text-sm">
                  <Link href="/games" className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:bg-slate-700 rounded-lg">
                    <span className="text-lg">🎮</span>
                    <span>{t('header.games', 'Games')}</span>
                  </Link>
                  <Link href="/rewards" className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:bg-slate-700 rounded-lg">
                    <span className="text-lg">🎁</span>
                    <span>{t('header.rewards', 'Rewards')}</span>
                  </Link>
                  <Link href="/settings" className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:bg-slate-700 rounded-lg">
                    <CogIcon className="h-4 w-4 text-gray-400" />
                    <span>{t('header.settings', 'Settings')}</span>
                  </Link>
                  <Link href="/alerts" className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:bg-slate-700 rounded-lg">
                    <BellIcon className="h-4 w-4 text-blue-400" />
                    <span>{t('header.alerts', 'Alerts')}</span>
                  </Link>
                  <Link href="/profile" className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:bg-slate-700 rounded-lg">
                    <UserIcon className="h-4 w-4 text-green-400" />
                    <span>{t('header.profile', 'Profile')}</span>
                  </Link>
                  <Link href="/contact" className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:bg-slate-700 rounded-lg">
                    <span className="text-lg">📞</span>
                    <span>{t('header.contact', 'Contact')}</span>
                  </Link>
                </div>

                <div className="border-t border-slate-700 pt-3 mt-3">
                  <Link
                    href="/signup"
                    className="block w-full text-center px-4 py-2 bg-gradient-to-r from-sky-500 to-cyan-500 text-white text-sm font-semibold rounded-lg hover:from-sky-600 hover:to-cyan-600 transition-all"
                  >
                    {t('auth.signup.cta', 'Create account')}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
