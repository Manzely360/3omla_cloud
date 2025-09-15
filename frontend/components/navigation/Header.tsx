import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import LanguageSwitcher from '../LanguageSwitcher'
import ThemeSwitcher from '../ThemeSwitcher'
import { useI18n } from '../../lib/i18n'
import {
  BellIcon,
  CogIcon,
  UserIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  BoltIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useQuery } from 'react-query'
import { useRouter } from 'next/router'

export default function Header() {
  const { t } = useI18n()
  const [searchQuery, setSearchQuery] = useState('')
  const [showNotif, setShowNotif] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const router = useRouter()

  // Live stats (no placeholders)
  const { data: activeSignals } = useQuery(['header-active-signals'], () => fetch('/api/v1/signals/active?limit=20').then(r=>r.json()), { refetchInterval: 10000 })
  const activeCount = Array.isArray(activeSignals) ? activeSignals.length : 0
  const avgHit = Array.isArray(activeSignals) && activeSignals.length>0 ? Math.round(activeSignals.filter((s:any)=> typeof s.historical_hit_rate==='number').reduce((a:number,s:any)=>a+s.historical_hit_rate,0)/activeSignals.length*100) : 0
  const timeZone = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC'

  // Fetch symbols once for typeahead
  const { data: symbols } = useQuery(
    ['header-symbols'],
    () => fetch('/api/v1/market/symbols?limit=1000').then(r=>r.json()),
    { staleTime: 60_000 }
  )

  const filtered = useMemo(() => {
    const q = (searchQuery || '').trim().toUpperCase()
    if (!q) return []
    // Pair input like BTCUSDT/ETHUSDT goes first
    const pair = q.includes('/') ? q.split('/') : null
    const list = (Array.isArray(symbols) ? symbols : []).map((s:any)=> s.symbol)
    const out: { type: 'pair'|'symbol'; label: string }[] = []
    if (pair && pair[0] && pair[1] && list.includes(pair[0]) && list.includes(pair[1])) {
      out.push({ type: 'pair', label: `${pair[0]}/${pair[1]}` })
    }
    // Basic startswith + contains ranking
    const starts = list.filter((s:string)=> s.startsWith(q))
    const contains = list.filter((s:string)=> !s.startsWith(q) && s.includes(q))
    starts.slice(0, 10).forEach((s:string)=> out.push({ type: 'symbol', label: s }))
    contains.slice(0, 10 - starts.length).forEach((s:string)=> out.push({ type: 'symbol', label: s }))
    return out
  }, [searchQuery, symbols])

  useEffect(() => {
    if (!searchQuery) setShowResults(false)
    else setShowResults(true)
  }, [searchQuery])

  const handleSelect = (item: { type: 'pair'|'symbol'; label: string }) => {
    setShowResults(false)
    setSearchQuery('')
    if (item.type === 'pair') {
      const [a, b] = item.label.split('/')
      router.push(`/pair?leader=${a}&follower=${b}`)
    } else {
      router.push(`/charts?symbol=${item.label}`)
    }
  }

  return (
    <header className="bg-gray-800 border-b border-gray-700 px-4 sm:px-6 py-3 sm:py-4">
      <div className="mx-auto w-full max-w-7xl flex items-center justify-between">
        {/* Search */}
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('header.search.placeholder','Search symbols, signals, or analytics...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {showResults && filtered.length > 0 && (
              <div className="absolute z-50 mt-2 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-80 overflow-auto">
                {filtered.map((it, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelect(it)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-700 text-sm flex items-center justify-between"
                  >
                    <span className="text-gray-100">{it.label}</span>
                    <span className="text-xs text-gray-400">{it.type === 'pair' ? 'Pair' : 'Symbol'}</span>
                  </button>
                ))}
                {filtered.length === 0 && (
                  <div className="px-3 py-2 text-sm text-gray-400">No results</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Quick Stats */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/signals" className="flex items-center space-x-2 text-sm hover:underline">
              <BoltIcon className="h-4 w-4 text-yellow-400" />
              <span className="text-gray-300">{activeCount} Active</span>
            </Link>
            <Link href="/analytics" className="flex items-center space-x-2 text-sm hover:underline">
              <ChartBarIcon className="h-4 w-4 text-green-400" />
              <span className="text-gray-300">{avgHit}% Hit Rate</span>
            </Link>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors" onClick={()=> setShowNotif(!showNotif)}>
              <BellIcon className="h-5 w-5" />
              {activeCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {activeCount}
                </span>
              )}
            </button>
            {showNotif && (
              <div className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 p-2 max-h-80 overflow-auto">
                <div className="text-sm text-gray-300 px-2 py-1">Recent Signals</div>
                {Array.isArray(activeSignals) && activeSignals.length>0 ? activeSignals.slice(0,10).map((s:any)=> (
                  <a key={s.signal_id} href={`/charts?symbol=${s.primary_symbol}`} className="block px-2 py-2 hover:bg-gray-700 rounded">
                    <div className="flex items-center justify-between">
                      <div className="text-gray-100 text-sm">{s.primary_symbol} • {s.signal_type}</div>
                      <div className={`text-xs ${s.direction==='long'?'text-green-400':'text-red-400'}`}>{s.direction?.toUpperCase?.()}</div>
                    </div>
                    <div className="text-xs text-gray-400">{new Date(s.trigger_time).toLocaleString()}</div>
                  </a>
                )) : <div className="text-xs text-gray-400 px-2 py-2">No recent signals</div>}
              </div>
            )}
          </div>

          {/* Settings */}
          <Link href="/settings" className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
            <CogIcon className="h-5 w-5" />
          </Link>

          {/* Language + Login */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:block text-xs text-gray-400 mr-2">{timeZone}</div>
            <LanguageSwitcher />
            <ThemeSwitcher />
            <Link href="/login" className="btn-secondary text-sm">{t('header.login','Login')}</Link>
            <Link href="/profile" className="btn-secondary text-sm">Profile</Link>
          </div>
        </div>
      </div>
    </header>
  )
}
