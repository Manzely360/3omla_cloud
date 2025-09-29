import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useFeatureGate } from '../../lib/featureGate'

const SAMPLE_OPPORTUNITIES = [
  {
    pair: 'BTCUSDT',
    cheaperExchange: 'OKX',
    expensiveExchange: 'Binance',
    priceGap: '$112.40',
    catchUpEta: '≈ 4m 20s'
  },
  {
    pair: 'ETHUSDT',
    cheaperExchange: 'Kraken',
    expensiveExchange: 'Bybit',
    priceGap: '$14.08',
    catchUpEta: '≈ 6m 05s'
  },
  {
    pair: 'SOLUSDT',
    cheaperExchange: 'KuCoin',
    expensiveExchange: 'OKX',
    priceGap: '$2.37',
    catchUpEta: '≈ 2m 45s'
  }
]

export default function ProLabTeaser() {
  const [showSample, setShowSample] = useState(false)
  const gate = useFeatureGate('pro-lab-teaser')

  const handleReveal = () => {
    if (showSample) return
    if (!gate.consume()) {
      return false
    }
    setShowSample(true)
    return true
  }

  return (
    <div className="rounded-3xl border border-indigo-200/60 bg-white/80 p-6 shadow-xl shadow-indigo-100/60">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-500">Pro Lab Preview</p>
          <h2 className="text-2xl font-semibold text-slate-900">Coin Advisor + Lead-Lag Radar in one console</h2>
          <p className="text-sm text-slate-600">
            Spot the cheapest venue, the priciest exit, and the expected catch-up time before the crowd reacts.
            Unlock the full lab to stream 24/7 arbitrage, transfer fees, and network speed checks.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleReveal()}
            className="rounded-full bg-gradient-to-r from-indigo-500 to-sky-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/40 transition hover:shadow-indigo-500/60"
          >
            Peek at a live insight
          </button>
          <Link
            href="/pro-lab"
            className="rounded-full border border-indigo-300/70 px-5 py-2 text-sm font-semibold text-indigo-500 transition hover:bg-indigo-50"
          >
            Explore Pro Lab
          </Link>
        </div>
      </div>

      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: showSample ? 'auto' : 0, opacity: showSample ? 1 : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="overflow-hidden"
      >
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {SAMPLE_OPPORTUNITIES.map((item) => (
            <div
              key={item.pair}
              className="relative rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white to-slate-50 p-5 shadow-inner"
            >
              <div className="text-xs uppercase tracking-[0.3em] text-slate-400">{item.pair}</div>
              <div className="mt-2 text-lg font-semibold text-slate-900">
                {item.cheaperExchange} vs {item.expensiveExchange}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {item.cheaperExchange} currently has this coin cheaper by <span className="font-semibold text-emerald-500">{item.priceGap}</span>.
              </p>
              <div className="mt-4 flex items-center gap-3 text-sm">
                <span className="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-600">Catch-up in {item.catchUpEta}</span>
              </div>
              <div className="mt-4 text-xs text-slate-400">
                * Full fee breakdown, transfer network, and automation are Pro-only.
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {!showSample && gate.locked && (
        <div className="mt-4 rounded-2xl border border-rose-300/60 bg-rose-50/80 p-4 text-sm text-rose-600">
          Your preview token is spent. <Link href="/login" className="font-semibold underline">Create a free trial</Link> to stream the live board.
        </div>
      )}
    </div>
  )
}
