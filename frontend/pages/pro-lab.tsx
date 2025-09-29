import { useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { motion } from 'framer-motion'
import Layout from '../components/Layout'
import { useFeatureGate } from '../lib/featureGate'

const SAMPLE_QUOTES = [
  { exchange: 'OKX', price: 109602.3, label: 'Cheapest' },
  { exchange: 'Kraken', price: 109640.8, label: 'Runner up' },
  { exchange: 'Binance', price: 109712.5, label: 'Most expensive' }
]

const SAMPLE_INSIGHTS = [
  {
    pair: 'BTCUSDT',
    cheaper: 'OKX',
    expensive: 'Binance',
    spread: '$110.20 after fees',
    transfer: 'BTC via Lightning ≈ 2m',
    catchUp: 5
  },
  {
    pair: 'ETHUSDT',
    cheaper: 'Kraken',
    expensive: 'Bybit',
    spread: '$13.75 after fees',
    transfer: 'ETH via Arbitrum ≈ 3m',
    catchUp: 7
  },
  {
    pair: 'SOLUSDT',
    cheaper: 'KuCoin',
    expensive: 'OKX',
    spread: '$2.11 after fees',
    transfer: 'SOL mainnet ≈ 90s',
    catchUp: 4
  }
]

export default function ProLabPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const previewGate = useFeatureGate('pro-lab-preview', { bypass: isAuthenticated })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const readAuth = () => Boolean(window.localStorage.getItem('auth_token'))
    const update = () => setIsAuthenticated(readAuth())
    update()
    window.addEventListener('storage', update)
    return () => window.removeEventListener('storage', update)
  }, [])

  const limitedInsights = useMemo(() => {
    if (previewGate.locked) return SAMPLE_INSIGHTS.slice(0, 1)
    return SAMPLE_INSIGHTS.slice(0, 3)
  }, [previewGate.locked])

  return (
    <>
      <Head>
        <title>Pro Lab • Coin Advisor + Lead-Lag Cockpit</title>
      </Head>
      <Layout>
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 pb-16">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="rounded-3xl border border-indigo-200/70 bg-white/90 p-8 shadow-2xl shadow-indigo-200/60"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.45em] text-indigo-500">Pro Lab</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900">All the signals in one mission control.</h1>
            <p className="mt-4 max-w-3xl text-sm text-slate-600">
              Compare up to 10 exchanges, including transfer fees, withdrawal networks, and the catch-up timer that shows how long the
              cheaper venue usually takes to align with the premium one. Automate hedges or mirror trades once you unlock your 7-day
              free trial. After the trial, Pro membership is $250/month (or yearly with two months free).
            </p>

            {!isAuthenticated && (
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href="/login"
                  className="rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-sky-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/40"
                >
                  Unlock free trial
                </Link>
                <button
                  type="button"
                  onClick={() => previewGate.consume()}
                  className="rounded-full border border-indigo-300 px-5 py-2 text-sm font-semibold text-indigo-500 hover:bg-indigo-50"
                >
                  Peek again
                </button>
                <span className="text-xs uppercase tracking-[0.35em] text-indigo-400">No credit card required</span>
              </div>
            )}
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: 0.05 }}
            className="rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-xl shadow-slate-200/70"
          >
            <h2 className="text-xl font-semibold text-slate-900">Live spread board (preview)</h2>
            <p className="mt-1 text-xs text-slate-500">
              We sample every 4 seconds. Full board shows 7–10 exchanges, withdrawal networks, and automation toggles.
            </p>
            <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-3">
                {SAMPLE_QUOTES.map((quote) => (
                  <div
                    key={quote.exchange}
                    className={`rounded-2xl border px-4 py-3 text-sm font-semibold shadow-inner ${
                      quote.label === 'Cheapest'
                        ? 'border-emerald-300/70 bg-emerald-50 text-emerald-600'
                        : quote.label === 'Most expensive'
                        ? 'border-rose-300/70 bg-rose-50 text-rose-500'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span className="block text-xs uppercase tracking-[0.3em] opacity-75">{quote.label}</span>
                    <span className="mt-1 block">{quote.exchange}</span>
                    <span className="text-xs font-normal text-slate-500">{quote.price.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</span>
                  </div>
                ))}
              </div>
              <div className="w-full max-w-xs rounded-2xl border border-indigo-200/60 bg-indigo-50/80 p-4 text-sm text-indigo-700">
                Transfer fee baseline: BTC via Lightning ≈ $1.20 · 2 minutes. We auto-suggest the cheapest network per venue.
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {limitedInsights.map((item) => (
                <div key={item.pair} className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-inner">
                  <div className="text-xs uppercase tracking-[0.35em] text-slate-400">{item.pair}</div>
                  <h3 className="mt-2 text-lg font-semibold text-slate-900">
                    {item.cheaper} → {item.expensive}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">Spread after fees: <span className="font-semibold text-emerald-500">{item.spread}</span></p>
                  <p className="text-xs text-slate-500">Preferred transfer: {item.transfer}</p>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Catch-up now</span>
                      <span>{item.catchUp} min</span>
                    </div>
                    <div className="mt-2 h-2 w-full rounded-full bg-slate-200">
                      <div className="h-2 rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-400" style={{ width: `${Math.min(item.catchUp * 12, 100)}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {previewGate.locked && !isAuthenticated && (
              <div className="mt-6 rounded-2xl border border-rose-300/60 bg-rose-50/80 p-4 text-sm text-rose-600">
                Preview limit reached. <Link href="/login" className="font-semibold underline">Activate your free 7-day Pro trial</Link> to unlock automation, fees, and up to 10 exchanges per pair.
              </div>
            )}
          </motion.section>

          {isAuthenticated && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut', delay: 0.1 }}
              className="rounded-3xl border border-emerald-300/70 bg-emerald-50/90 p-6 text-emerald-900 shadow-xl shadow-emerald-200/60"
            >
              <h2 className="text-xl font-semibold">PRO mode active</h2>
              <p className="mt-2 text-sm">
                Welcome back, CEO. Full advisor, lead-lag matrices, automation toggles, and transfer optimisers are ready on the left navigation.
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.35em] text-emerald-600">CEO ACCESS</p>
            </motion.section>
          )}
        </div>
      </Layout>
    </>
  )
}
