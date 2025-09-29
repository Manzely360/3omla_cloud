import { useMemo } from 'react'
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, BoltIcon } from '@heroicons/react/24/outline'
import { useQuery } from 'react-query'
import { api } from '../../lib/api'

interface CoinBreakdownCardProps {
  symbol: string
  interval: string
  leadLagRelationships?: any[]
}

const formatPercent = (value: number | undefined | null, digits = 2) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'N/A'
  const percentage = value * 100
  const sign = percentage > 0 ? '+' : ''
  return `${sign}${percentage.toFixed(digits)}%`
}

const formatNumber = (value: number | undefined | null, options: Intl.NumberFormatOptions = {}) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'N/A'
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    ...options,
  }).format(value)
}

export default function CoinBreakdownCard({ symbol, interval, leadLagRelationships = [] }: CoinBreakdownCardProps) {
  const { data, isLoading } = useQuery(['coin-breakdown', symbol, interval], () =>
    api.getMarketMetrics({ symbols: [symbol], interval, limit: 1 })
  , {
    enabled: Boolean(symbol),
    staleTime: 30000,
    refetchInterval: 30000,
  })

  const metrics = data?.[0]

  const relatedPairs = useMemo(() => {
    if (!Array.isArray(leadLagRelationships) || !symbol) return []
    return leadLagRelationships
      .filter((item: any) => item?.leader_symbol === symbol || item?.lagging_symbol === symbol)
      .slice(0, 3)
  }, [leadLagRelationships, symbol])

  if (!symbol) {
    return <div className="text-gray-400">Select a symbol to view details.</div>
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-6 bg-gray-700/60 rounded animate-pulse" />
        <div className="h-12 bg-gray-700/60 rounded animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-16 bg-gray-700/40 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="text-sm text-gray-400">
        No analytics available for <span className="font-semibold text-gray-200">{symbol}</span> on the selected timeframe.
      </div>
    )
  }

  const returns = metrics.returns as number | undefined
  const returnsPositive = typeof returns === 'number' ? returns >= 0 : null

  const stats = [
    { label: 'Volatility', value: formatPercent(metrics.volatility) },
    { label: 'Volume Ratio', value: formatNumber(metrics.volume_ratio) },
    { label: 'Bid/Ask Spread', value: formatPercent(metrics.bid_ask_spread) },
    { label: 'Orderbook Imbalance', value: formatPercent(metrics.order_book_imbalance) },
  ]

  const indicators = [
    { label: 'RSI', value: metrics.rsi ? metrics.rsi.toFixed(1) : 'N/A' },
    { label: 'MACD', value: metrics.macd ? metrics.macd.toFixed(3) : 'N/A' },
    { label: 'Bollinger Upper', value: metrics.bollinger_upper ? formatNumber(metrics.bollinger_upper) : 'N/A' },
    { label: 'Bollinger Lower', value: metrics.bollinger_lower ? formatNumber(metrics.bollinger_lower) : 'N/A' },
  ]

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-700/60 bg-gradient-to-br from-indigo-500/15 via-transparent to-purple-500/10 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-200/80">{interval} snapshot</p>
        <div className="mt-2 flex flex-wrap items-baseline gap-3">
          <h3 className="text-3xl font-bold text-gray-50">{symbol}</h3>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
              returnsPositive === null
                ? 'bg-gray-800/80 text-gray-300'
                : returnsPositive
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'bg-rose-500/20 text-rose-300'
            }`}
          >
            {returnsPositive === null ? 'N/A' : formatPercent(returns)}
            {returnsPositive === null ? null : returnsPositive ? (
              <ArrowTrendingUpIcon className="h-4 w-4" />
            ) : (
              <ArrowTrendingDownIcon className="h-4 w-4" />
            )}
          </span>
        </div>
        <p className="mt-3 text-2xl font-semibold text-gray-100">${metrics.price ? metrics.price.toFixed(4) : 'N/A'}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map((item) => (
          <div key={item.label} className="rounded-xl border border-gray-700/50 bg-gray-900/60 p-3 shadow-inner shadow-black/20">
            <p className="text-[11px] uppercase tracking-wide text-gray-500">{item.label}</p>
            <p className="mt-1 text-lg font-semibold text-gray-50">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-700/60 bg-gray-900/60 p-4">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">Momentum Profile</h4>
          <BoltIcon className="h-4 w-4 text-yellow-400" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {indicators.map((indicator) => (
            <div key={indicator.label} className="rounded-lg bg-gradient-to-br from-gray-800/70 to-gray-900/70 p-3">
              <p className="text-[11px] uppercase tracking-wide text-gray-500">{indicator.label}</p>
              <p className="mt-1 text-sm font-medium text-gray-100">{indicator.value}</p>
            </div>
          ))}
        </div>
      </div>

      {relatedPairs.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-300">Lead/Lag Highlights</p>
          <div className="space-y-2">
            {relatedPairs.map((pair: any, index: number) => {
              const role = pair.leader_symbol === symbol ? 'Leads' : 'Lags'
              const partner = pair.leader_symbol === symbol ? pair.lagging_symbol : pair.leader_symbol
              const confidence = pair.confidence ?? pair.hit_rate
              return (
                <div
                  key={`${pair.leader_symbol}-${pair.lagging_symbol}-${index}`}
                  className="flex items-center justify-between rounded-xl border border-gray-700/50 bg-gradient-to-r from-indigo-500/15 via-transparent to-gray-900/80 p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-100">
                      {role} <span className="text-indigo-300">{partner}</span>
                    </p>
                    <p className="text-xs text-gray-400">Lag: {pair.lag ?? pair.lag_seconds ?? 'n/a'}s</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-100">
                      {confidence ? `${(confidence * 100).toFixed(1)}%` : 'N/A'}
                    </p>
                    <p className="text-[10px] uppercase tracking-wide text-gray-500">Confidence</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
