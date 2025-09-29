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
  const [isLightMode, setIsLightMode] = useState(false)
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

  useEffect(() => {
    if (typeof window === 'undefined') return
    const html = document.documentElement
    const detectTheme = () => setIsLightMode(html.classList.contains('theme-light'))
    detectTheme()
    const observer = new MutationObserver(detectTheme)
    observer.observe(html, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

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

  const headerClass = isLightMode
    ? 'bg-white/90 border-slate-200 shadow-[0_12px_30px_rgba(148,163,184,0.25)]'
    : 'bg-slate-900/90 border-slate-700/50 shadow-slate-900/60'

  const searchInputClass = isLightMode
    ? 'w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent shadow-inner'
    : 'w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-600 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-inner shadow-slate-700/70'

  const menuButtonClass = isLightMode
    ? 'flex items-center space-x-2 p-2 text-slate-600 hover:text-slate-900 hover:bg-amber-100 rounded-lg transition-colors'
    : 'flex items-center space-x-2 p-2 text-slate-400 hover:text-sky-300 hover:bg-slate-800 rounded-lg transition-colors'

  const menuPanelClass = isLightMode
    ? 'absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-300/50 z-[120] p-4'
    : 'absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-600 rounded-2xl shadow-2xl shadow-slate-900/70 z-[120] p-4'

  const menuHeaderClass = isLightMode
    ? 'mb-4 rounded-2xl border border-slate-200 bg-amber-50/80 p-4 flex items-center gap-3'
    : 'mb-4 rounded-2xl border border-slate-600 bg-slate-900/60 p-4 flex items-center gap-3'

  const menuBalanceLabelClass = isLightMode ? 'text-xs uppercase tracking-[0.3em] text-slate-500' : 'text-xs uppercase tracking-[0.3em] text-slate-400'
  const menuBalanceValueClass = isLightMode ? 'text-2xl font-bold text-slate-900' : 'text-2xl font-bold text-white'
  const menuInfoClass = isLightMode ? 'mb-3 text-sm text-slate-600' : 'mb-3 text-sm text-slate-300'
  const menuInfoAccentClass = isLightMode ? 'font-medium text-amber-600' : 'font-medium text-sky-300'
  const menuCooldownClass = isLightMode ? 'block text-xs text-slate-500 mt-1' : 'block text-xs text-slate-400 mt-1'
  const menuLinkClass = isLightMode
    ? 'flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-amber-100 rounded-lg'
    : 'flex items-center gap-2 px-3 py-2 text-slate-300 hover:bg-slate-700 rounded-lg'

  return (
    <header
      className={`relative z-[80] px-4 sm:px-6 py-3 sm:py-4 backdrop-blur-xl border-b transition-colors ${headerClass}`}
    >
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
          <MagnifyingGlassIcon
            className={`absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform ${isLightMode ? 'text-slate-400' : 'text-gray-400'}`}
          />
          <input
            type="text"
            placeholder={t('header.search.placeholder', 'Search symbols, signals, or analytics...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={searchInputClass}
          />
          <motion.div
            initial={false}
            animate={{ opacity: showResults && filtered.length > 0 ? 1 : 0, y: showResults && filtered.length > 0 ? 0 : -8, pointerEvents: showResults && filtered.length > 0 ? 'auto' : 'none' }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute z-50 mt-2 w-full"
          >
            {showResults && filtered.length > 0 && (
              <div
                className={`max-h-80 overflow-auto rounded-2xl border shadow-xl ${
                  isLightMode
                    ? 'bg-white border-slate-200 shadow-slate-300/60'
                    : 'bg-slate-800 border-slate-600 shadow-slate-900/80'
                }`}
              >
                {filtered.map((it, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelect(it)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors ${
                      isLightMode
                        ? 'text-slate-700 hover:bg-amber-100'
                        : 'text-white hover:bg-slate-700'
                    }`}
                  >
                    <span className={isLightMode ? 'text-slate-900' : 'text-white'}>{it.label}</span>
                    <span className={isLightMode ? 'text-xs text-amber-600' : 'text-xs text-green-400'}>
                      {it.type === 'pair' ? 'Pair' : 'Symbol'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="flex items-center space-x-2">
            <div className={timeZoneClass}>{timeZone}</div>
            <LanguageSwitcher />
            <ThemeSwitcher />
          </div>

          <div className="relative">
            <button
              className={menuButtonClass}
              onClick={() => setShowMenu(!showMenu)}
            >
              <UserIcon className="h-5 w-5" />
              <span className="hidden sm:block text-sm">{t('header.account', 'Account')}</span>
            </button>

            {showMenu && (
              <div className={menuPanelClass}>
                <div className={menuHeaderClass}>
                  <Logo3omla variant="icon" size="sm" />
                  <div>
                    <p className={menuBalanceLabelClass}>{t('points.balance_label', 'Current 3OMLA points')}</p>
                    <p className={menuBalanceValueClass}>
                      {points.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}
                    </p>
                  </div>
                </div>

                <div className={menuInfoClass}>
                  <span className={menuInfoAccentClass}>
                    {playable
                      ? t('games.play_button', 'Play now')
                      : t('games.come_back', 'Thank you! Come back in 24 hours to win more 3OMLA points!')}
                  </span>
                  {!playable && (
                    <span className={menuCooldownClass}>{formatCooldown()}</span>
                  )}
                </div>

                <div
                  className={`grid grid-cols-2 gap-2 border-t pt-3 text-sm ${
                    isLightMode ? 'border-slate-200' : 'border-slate-700'
                  }`}
                >
                  <Link href="/games" className={menuLinkClass}>
                    <span className="text-lg">🎮</span>
                    <span>{t('header.games', 'Games')}</span>
                  </Link>
                  <Link href="/rewards" className={menuLinkClass}>
                    <span className="text-lg">🎁</span>
                    <span>{t('header.rewards', 'Rewards')}</span>
                  </Link>
                  <Link href="/settings" className={menuLinkClass}>
                    <CogIcon className={`h-4 w-4 ${isLightMode ? 'text-slate-500' : 'text-gray-400'}`} />
                    <span>{t('header.settings', 'Settings')}</span>
                  </Link>
                  <Link href="/alerts" className={menuLinkClass}>
                    <BellIcon className={`h-4 w-4 ${isLightMode ? 'text-sky-500' : 'text-blue-400'}`} />
                    <span>{t('header.alerts', 'Alerts')}</span>
                  </Link>
                  <Link href="/profile" className={menuLinkClass}>
                    <UserIcon className={`h-4 w-4 ${isLightMode ? 'text-emerald-500' : 'text-green-400'}`} />
                    <span>{t('header.profile', 'Profile')}</span>
                  </Link>
                  <Link href="/contact" className={menuLinkClass}>
                    <span className="text-lg">📞</span>
                    <span>{t('header.contact', 'Contact')}</span>
                  </Link>
                </div>

                <div className={`mt-3 border-t pt-3 ${isLightMode ? 'border-slate-200' : 'border-slate-700'}`}>
                  <Link
                    href="/signup"
                    className={`block w-full rounded-lg px-4 py-2 text-center text-sm font-semibold transition-all ${
                      isLightMode
                        ? 'bg-gradient-to-r from-amber-400 to-rose-400 text-slate-900 hover:from-amber-500 hover:to-rose-500'
                        : 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white hover:from-sky-600 hover:to-cyan-600'
                    }`}
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
  const timeZoneClass = isLightMode
    ? 'hidden sm:block text-xs text-slate-500 mr-2'
    : 'hidden sm:block text-xs text-slate-400 mr-2'
