import { useMemo, useState } from 'react'
import { useQuery } from 'react-query'
import { motion } from 'framer-motion'
import { ArrowTrendingUpIcon, ArrowsRightLeftIcon, ClockIcon } from '@heroicons/react/24/outline'
import TradeCreator, { LeadLagPairSummary } from '../trading/TradeCreator'

interface LeadLagListProps {
  interval?: string
  limit?: number
  symbols?: string[]
  defaultIntervals?: string[]
  onFocusSymbol?: (symbol: string) => void
}

type LeadLagApiPair = LeadLagPairSummary & {
  symbol1?: string
  symbol2?: string
  best_lag?: number
  lag_bars?: number
  lag_minutes?: number
  lag_seconds?: number
  sample_size?: number
  best_abs_corr?: number
  cross_correlation?: number
  move_projection?: LeadLagPairSummary['move_projection']
  whale_alignment?: LeadLagPairSummary['whale_alignment'] & { error?: string }
  interval?: string
  hit_rate?: number
  shock_response?: number
}

const INTERVAL_OPTIONS = ['1m', '5m', '15m', '1h']

function uniqueUpper(values: string[] | undefined): string[] {
  if (!values || !values.length) return []
  const seen = new Set<string>()
  const result: string[] = []
  values.forEach((value) => {
    if (!value) return
    const upper = value.toUpperCase()
    if (seen.has(upper)) return
    seen.add(upper)
    result.push(upper)
  })
  return result
}

function formatPercent(value: number | undefined, digits = 1): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'n/a'
  const pct = value * 100
  const prefix = pct > 0 ? '+' : ''
  return `${prefix}${pct.toFixed(digits)}%`
}

function formatLag(pair: LeadLagApiPair): string {
  if (typeof pair.lag_seconds === 'number' && pair.lag_seconds < 120) {
    return `${Math.round(pair.lag_seconds)}s`
  }
  if (typeof pair.lag_minutes === 'number') {
    return `${pair.lag_minutes}m`
  }
  if (typeof pair.best_lag === 'number') {
    return `${Math.abs(pair.best_lag)} bars`
  }
  return 'n/a'
}

function scorePair(pair: LeadLagApiPair): number {
  const corr = pair.best_abs_corr ?? 0
  const hit = pair.hit_rate ?? 0
  const whale = pair.whale_alignment?.score ?? 0
  return corr * 0.5 + hit * 0.3 + whale * 0.2
}

export default function LeadLagList({
  interval = '15m',
  limit = 15,
  symbols = [],
  defaultIntervals,
  onFocusSymbol,
}: LeadLagListProps) {
  const initialIntervals = useMemo(() => {
    const base = defaultIntervals && defaultIntervals.length ? defaultIntervals : ['1m', '5m', interval]
    return uniqueUpper(base)
  }, [defaultIntervals, interval])

  const [selectedIntervals, setSelectedIntervals] = useState<string[]>(initialIntervals)
  const [activeTradePair, setActiveTradePair] = useState<LeadLagPairSummary | null>(null)

  const watchSymbols = useMemo(() => {
    const cleaned = uniqueUpper(symbols)
    return cleaned.length ? cleaned : []
  }, [symbols])

  const querySymbols = useMemo(() => {
    return watchSymbols.length ? watchSymbols : ['auto']
  }, [watchSymbols])

  const queryKey = ['lead-lag-summary', querySymbols.join(','), selectedIntervals.join(','), limit]

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    params.set('limit', String(limit))
    params.set('max_lag', '12')
    params.set('intervals', selectedIntervals.join(','))
    querySymbols.forEach((symbol) => params.append('symbols', symbol))
    return `/api/v1/analytics/live-leadlag?${params.toString()}`
  }, [limit, selectedIntervals, querySymbols])

  const { data, isLoading, isFetching, refetch } = useQuery<LeadLagApiPair[]>(
    queryKey,
    async () => {
      const res = await fetch(queryString)
      if (!res.ok) {
        throw new Error(`Lead-lag request failed (${res.status})`)
      }
      return res.json()
    },
    { refetchInterval: 60000, keepPreviousData: true }
  )

  const groupedByInterval = useMemo(() => {
    const groups: Record<string, LeadLagApiPair[]> = {}
    if (!Array.isArray(data)) return groups
    data.forEach((pair) => {
      if (!pair || !pair.leader_symbol || !pair.follower_symbol) return
      const bucket = pair.interval ?? interval
      if (!groups[bucket]) {
        groups[bucket] = []
      }
      groups[bucket].push(pair)
    })
    Object.values(groups).forEach((pairs) => pairs.sort((a, b) => scorePair(b) - scorePair(a)))
    return groups
  }, [data, interval])

  const topPair = useMemo(() => {
    if (!Array.isArray(data) || !data.length) return null
    return [...data].sort((a, b) => scorePair(b) - scorePair(a))[0]
  }, [data])

  const toggleInterval = (value: string) => {
    setSelectedIntervals((prev) => {
      const exists = prev.includes(value)
      if (exists) {
        const filtered = prev.filter((item) => item !== value)
        return filtered.length ? filtered : [value]
      }
      return [...prev, value]
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-gray-100">Lead-Lag Radar</h2>
          <p className="text-sm text-gray-400">Auto-detect which coins shadow others across the 1m/5m/15m tape and surface coordinated whale rotations.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {INTERVAL_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => toggleInterval(opt)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                selectedIntervals.includes(opt)
                  ? 'border-indigo-500 bg-indigo-500/20 text-indigo-200'
                  : 'border-gray-700 bg-gray-900/60 text-gray-400 hover:border-indigo-500/40 hover:text-indigo-200'
              }`}
            >
              {opt.toUpperCase()}
            </button>
          ))}
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-full border border-gray-700 px-3 py-1 text-xs text-gray-400 transition hover:border-indigo-500/40 hover:text-indigo-200"
          >
            Refresh
          </button>
        </div>
      </div>

      {watchSymbols.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {watchSymbols.map((symbol) => (
            <motion.span
              key={symbol}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-full border border-gray-700/60 bg-gray-900/70 px-3 py-1 text-xs text-gray-300"
            >
              {symbol}
            </motion.span>
          ))}
        </div>
      )}

      {topPair && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 gap-4 rounded-2xl border border-gray-800/60 bg-gradient-to-br from-indigo-500/15 via-transparent to-purple-500/10 p-4 md:grid-cols-3"
        >
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Top Relationship</p>
            <p className="mt-1 text-lg font-semibold text-gray-100">
              {topPair.leader_symbol} → {topPair.follower_symbol}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Delay</p>
            <p className="mt-1 text-lg font-semibold text-gray-100">{formatLag(topPair)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Projected Follow Move</p>
            <p className={`mt-1 text-lg font-semibold ${
              (topPair.move_projection?.expected_follower_move ?? 0) >= 0 ? 'text-emerald-300' : 'text-rose-300'
            }`}>
              {formatPercent(topPair.move_projection?.expected_follower_move, 2)}
            </p>
          </div>
        </motion.div>
      )}

      <div className="space-y-6">
        {selectedIntervals.map((bucket) => {
          const rows = groupedByInterval[bucket] || []
          return (
            <div key={bucket} className="rounded-2xl border border-gray-800/60 bg-gray-900/70 shadow-lg shadow-black/20">
              <div className="flex items-center justify-between border-b border-gray-800/60 px-4 py-3">
                <div className="flex items-center gap-2 text-gray-200">
                  <ArrowTrendingUpIcon className="h-5 w-5 text-indigo-400" />
                  <span className="text-sm font-semibold">{bucket.toUpperCase()} window</span>
                  <span className="text-xs text-gray-500">pairs: {rows.length}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  {isFetching && <span>Updating…</span>}
                  <span className="hidden md:inline">Score blends correlation, hit-rate, and whale sync.</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-800">
                  <thead className="bg-gray-900/80 text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-4 py-3 text-left">Pair</th>
                      <th className="px-4 py-3 text-left">Delay</th>
                      <th className="px-4 py-3 text-left">Strength</th>
                      <th className="px-4 py-3 text-left">Hit</th>
                      <th className="px-4 py-3 text-left">Projected</th>
                      <th className="px-4 py-3 text-left">Whales</th>
                      <th className="px-4 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {isLoading && (
                      <tr>
                        <td className="px-4 py-4 text-sm text-gray-400" colSpan={7}>
                          Loading lead-lag analytics…
                        </td>
                      </tr>
                    )}
                    {!isLoading && rows.length === 0 && (
                      <tr>
                        <td className="px-4 py-4 text-sm text-gray-400" colSpan={7}>
                          No qualifying relationships detected for this interval.
                        </td>
                      </tr>
                    )}
                    {rows.map((pair) => {
                      const strength = scorePair(pair)
                      const projected = pair.move_projection?.expected_follower_move ?? 0
                      const whaleScore = pair.whale_alignment?.score ?? 0
                      return (
                        <motion.tr
                          key={`${pair.leader_symbol}-${pair.follower_symbol}-${pair.interval}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ backgroundColor: 'rgba(30,41,59,0.75)' }}
                          transition={{ duration: 0.25, ease: 'easeOut' }}
                          className="hover:bg-gray-900/70"
                        >
                          <td className="px-4 py-3 text-sm text-gray-200">
                            <div className="flex items-center gap-2">
                              <ArrowsRightLeftIcon className="h-4 w-4 text-indigo-400" />
                              <span className="font-semibold text-gray-100">{pair.leader_symbol}</span>
                              <span className="text-xs text-gray-500">leads</span>
                              <span className="font-semibold text-gray-100">{pair.follower_symbol}</span>
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                              <ClockIcon className="h-3.5 w-3.5" />
                              <span>{pair.sample_size ?? 0} samples</span>
                              <span>corr {formatPercent(pair.best_abs_corr, 1)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-200">{formatLag(pair)}</td>
                          <td className="px-4 py-3 text-sm text-gray-200">
                            <div className="w-32 rounded-full bg-gray-800">
                              <div
                                className="h-2 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                                style={{ width: `${Math.min(100, Math.round(strength * 100))}%` }}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-200">{formatPercent(pair.hit_rate, 0)}</td>
                          <td className={`px-4 py-3 text-sm ${projected >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                            {formatPercent(projected, 2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-200">
                            <div className="w-28 rounded-full bg-gray-800">
                              <div
                                className={`h-2 rounded-full ${whaleScore >= 0.5 ? 'bg-emerald-400' : 'bg-amber-400'}`}
                                style={{ width: `${Math.min(100, Math.round(whaleScore * 100))}%` }}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-200">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                className="btn-secondary px-3 py-1"
                                onClick={() => onFocusSymbol?.(pair.follower_symbol)}
                              >
                                Focus Chart
                              </button>
                              <button
                                type="button"
                                className="btn-primary px-3 py-1"
                                onClick={() => setActiveTradePair(pair)}
                              >
                                Plan Trade
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}
      </div>

      <TradeCreator pair={activeTradePair} onClose={() => setActiveTradePair(null)} />
    </div>
  )
}
