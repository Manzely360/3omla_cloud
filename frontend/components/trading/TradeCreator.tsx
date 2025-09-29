import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { useFeatureGate } from '../../lib/featureGate'

export interface LeadLagPairSummary {
  leader_symbol: string
  follower_symbol: string
  interval?: string
  lag_seconds?: number
  lag_minutes?: number
  best_abs_corr?: number
  hit_rate?: number
  move_projection?: {
    leader_move: number
    expected_follower_move: number
    ratio: number
    r_squared: number
  }
  whale_alignment?: {
    leader_bias?: number
    follower_bias?: number
    score?: number
    events?: number
    same_direction?: boolean
  }
}

interface TradeCreatorProps {
  pair: LeadLagPairSummary | null
  onClose: () => void
}

export default function TradeCreator({ pair, onClose }: TradeCreatorProps) {
  const [quantity, setQuantity] = useState<number>(0.1)
  const [leverage, setLeverage] = useState<number>(3)
  const [mode, setMode] = useState<'paper' | 'live'>('paper')
  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ status: 'success' | 'error'; message: string } | null>(null)
  const [autoPilot, setAutoPilot] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showSignupCTA, setShowSignupCTA] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const readAuth = () => Boolean(window.localStorage.getItem('auth_token'))
    setIsAuthenticated(readAuth())
    const handler = () => setIsAuthenticated(readAuth())
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      setShowSignupCTA(false)
    }
  }, [isAuthenticated])

  const tradeGate = useFeatureGate('trade-pill-deck', { bypass: isAuthenticated })
  const autoGate = useFeatureGate('auto-pill', { bypass: isAuthenticated })

  const followerSymbol = pair?.follower_symbol ?? ''
  const expectedMovePct = useMemo(() => {
    const mv = pair?.move_projection?.expected_follower_move
    return typeof mv === 'number' ? mv * 100 : 0
  }, [pair])

  useEffect(() => {
    if (!pair) return
    setQuantity(0.1)
    setLeverage(3)
    setMode('paper')
    setFeedback(null)
    const defaultSide: 'buy' | 'sell' = (pair.move_projection?.expected_follower_move ?? 0) >= 0 ? 'buy' : 'sell'
    setSide(defaultSide)
    setAutoPilot(false)
  }, [pair])

  useEffect(() => {
    if (!pair) return
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [pair, onClose])

  const submitTrade = async () => {
    if (!pair || !followerSymbol) {
      setFeedback({ status: 'error', message: 'Follower symbol unavailable.' })
      return
    }
    if (!quantity || quantity <= 0) {
      setFeedback({ status: 'error', message: 'Enter a size greater than zero.' })
      return
    }
    if (tradeGate.locked) {
      setShowSignupCTA(true)
      setFeedback({ status: 'error', message: 'Create a 3omla account to unlock another pill execution.' })
      return
    }
    if (!tradeGate.consume()) {
      setShowSignupCTA(true)
      setFeedback({ status: 'error', message: 'Create a 3omla account to unlock another pill execution.' })
      return
    }
    setSubmitting(true)
    setFeedback(null)
    try {
      const payload = {
        symbol: followerSymbol,
        exchange: 'binance',
        order_type: 'market',
        side,
        quantity,
        mode,
        extra_metadata: {
          leverage,
          expected_move: pair.move_projection?.expected_follower_move,
          move_ratio: pair.move_projection?.ratio,
          leader_symbol: pair.leader_symbol,
          interval: pair.interval,
          lag_seconds: pair.lag_seconds,
          hit_rate: pair.hit_rate,
          correlation: pair.best_abs_corr,
          whale_score: pair.whale_alignment?.score,
          auto_pilot: autoPilot,
        },
      }
      const res = await fetch('/api/v1/trading/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        throw new Error(await res.text())
      }
      setFeedback({ status: 'success', message: 'Trade submitted successfully.' })
    } catch (error: any) {
      setFeedback({ status: 'error', message: error?.message || 'Trade submission failed.' })
    } finally {
      setSubmitting(false)
    }
  }

  const whaleScore = pair?.whale_alignment?.score ?? 0
  const whaleDirection = pair?.whale_alignment?.same_direction ?? false
  const lagLabel = useMemo(() => {
    if (!pair) return 'n/a'
    if (pair.lag_seconds && pair.lag_seconds < 120) {
      return `${Math.round(pair.lag_seconds)}s`
    }
    if (pair.lag_minutes) {
      return `${pair.lag_minutes}m`
    }
    return 'n/a'
  }, [pair])

  return (
    <AnimatePresence>
      {pair && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-xl rounded-2xl bg-gray-900/95 p-6 shadow-2xl"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 160, damping: 20 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm uppercase tracking-wide text-indigo-300/80">Animated Trade Creator</p>
                <h3 className="text-2xl font-semibold text-white">
                  {followerSymbol} <span className="text-gray-500">←</span> {pair.leader_symbol}
                </h3>
                <p className="mt-2 text-sm text-gray-400">
                  {pair.interval?.toUpperCase()} lead-lag · Delay {lagLabel}
                </p>
              </div>
              <button
                type="button"
                className="rounded-full bg-gray-800/80 p-2 text-gray-400 transition hover:bg-gray-700 hover:text-gray-200"
                onClick={onClose}
              >
                ✕
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 rounded-xl bg-gray-900/60 p-4 md:grid-cols-3">
              <StatCard
                label="Projected Follow"
                value={`${expectedMovePct >= 0 ? '+' : ''}${expectedMovePct.toFixed(2)}%`}
                accent={expectedMovePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}
              />
              <StatCard label="Hit Rate" value={`${Math.round((pair.hit_rate ?? 0) * 100)}%`} accent="text-indigo-300" />
              <StatCard
                label="Whale Sync"
                value={`${Math.round(whaleScore * 100)}%`}
                accent={whaleDirection ? 'text-emerald-300' : 'text-amber-300'}
              />
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <label className="mb-3 flex items-center justify-between text-sm font-semibold text-gray-200">
                  <span>Choose your pill</span>
                  <span className="text-xs text-gray-400">First hit is free. Create an account for repeat scripts.</span>
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSide('buy')}
                    className={`relative overflow-hidden rounded-full px-5 py-4 text-left shadow-lg transition focus:outline-none ${
                      side === 'buy'
                        ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 text-white shadow-emerald-500/40'
                        : 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-200 hover:border-emerald-400/70'
                    }`}
                  >
                    <span className="block text-xs uppercase tracking-[0.35em] opacity-80">Green Pill</span>
                    <span className="mt-2 block text-lg font-semibold">Go long with hope</span>
                    <span className="mt-1 block text-xs opacity-70">Follow the flow · {followerSymbol || 'pair'}</span>
                    <span className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/20 blur-3xl" />
                  </motion.button>

                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSide('sell')}
                    className={`relative overflow-hidden rounded-full px-5 py-4 text-left shadow-lg transition focus:outline-none ${
                      side === 'sell'
                        ? 'bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-rose-500/40'
                        : 'border border-rose-500/40 bg-rose-500/10 text-rose-200 hover:border-rose-400/70'
                    }`}
                  >
                    <span className="block text-xs uppercase tracking-[0.35em] opacity-80">Red Pill</span>
                    <span className="mt-2 block text-lg font-semibold">Fade the herd</span>
                    <span className="mt-1 block text-xs opacity-70">Counter-trend strike</span>
                    <span className="pointer-events-none absolute -left-6 bottom-0 h-20 w-20 rounded-full bg-white/10 blur-3xl" />
                  </motion.button>

                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (autoPilot) {
                        setFeedback({ status: 'success', message: 'Blue Pill automation already engaged for this session.' })
                        return
                      }
                      if (autoGate.locked) {
                        setShowSignupCTA(true)
                        setFeedback({ status: 'error', message: 'Create a 3omla account to keep Blue Pill automation unlocked.' })
                        return
                      }
                      if (!autoGate.consume()) {
                        setShowSignupCTA(true)
                        setFeedback({ status: 'error', message: 'Create a 3omla account to keep Blue Pill automation unlocked.' })
                        return
                      }
                      setAutoPilot(true)
                      setMode('live')
                      setFeedback({ status: 'success', message: 'Blue Pill auto-trading engaged. Stay signed in to keep it humming.' })
                    }}
                    className={`relative overflow-hidden rounded-full px-5 py-4 text-left shadow-lg transition focus:outline-none ${
                      autoPilot
                        ? 'bg-gradient-to-r from-sky-400 to-indigo-500 text-white shadow-sky-500/40'
                        : 'border border-sky-500/40 bg-sky-500/10 text-sky-200 hover:border-sky-400/70'
                    }`}
                  >
                    <span className="block text-xs uppercase tracking-[0.35em] opacity-80">Blue Pill</span>
                    <span className="mt-2 block text-lg font-semibold">Auto-trade mode</span>
                    <span className="mt-1 block text-xs opacity-70">3omla takes the wheel</span>
                    <span className="pointer-events-none absolute -right-10 top-1/2 h-24 w-24 -translate-y-1/2 bg-white/10 blur-3xl" />
                  </motion.button>
                </div>
                {showSignupCTA && !isAuthenticated && (
                  <div className="mt-4 rounded-xl border border-indigo-500/40 bg-indigo-500/10 p-4 text-sm text-indigo-100">
                    <p className="font-medium">Invite your 3omla.</p>
                    <p className="mt-1 opacity-80">Create a secure account to keep dosing Green, Red, or Blue pills without limits.</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link
                        href="/login"
                        className="rounded-full bg-gradient-to-r from-indigo-500 to-sky-500 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white shadow-lg shadow-indigo-500/40"
                      >
                        Create Account
                      </Link>
                      <button
                        type="button"
                        onClick={() => setShowSignupCTA(false)}
                        className="rounded-full border border-indigo-300/50 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-indigo-100 hover:bg-indigo-500/10"
                      >
                        Maybe Later
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-200">Position Size (Qty)</label>
                  <input
                    type="number"
                    min={0.001}
                    step={0.001}
                    value={quantity}
                    onChange={(event) => setQuantity(Number(event.target.value))}
                    className="w-full rounded-lg border border-gray-700 bg-gray-900/70 p-3 text-gray-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>
                <div>
                  <label className="mb-2 flex items-center justify-between text-sm font-semibold text-gray-200">
                    <span>Leverage</span>
                    <span className="text-xs text-gray-400">x{leverage.toFixed(1)}</span>
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={50}
                    step={0.5}
                    value={leverage}
                    onChange={(event) => setLeverage(Number(event.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-700"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-200">Mode</label>
                <div className="flex gap-3">
                  {(['paper', 'live'] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        if (autoPilot && option === 'paper') return
                        setMode(option)
                      }}
                      disabled={autoPilot && option === 'paper'}
                      className={`flex-1 rounded-lg border px-4 py-3 text-sm font-semibold transition ${
                        mode === option
                          ? 'border-indigo-500 bg-indigo-500/15 text-indigo-200 shadow-lg shadow-indigo-500/10'
                          : 'border-gray-700 bg-gray-800/60 text-gray-300 hover:border-indigo-500/40 hover:text-indigo-200'
                      } ${option === 'live' ? 'text-sky-300' : ''} ${autoPilot && option === 'paper' ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      {option === 'paper' ? 'Paper (simulated)' : 'Live execution'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {feedback && (
              <div
                className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
                  feedback.status === 'success'
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200'
                    : 'border-rose-500/50 bg-rose-500/10 text-rose-200'
                }`}
              >
                {feedback.message}
              </div>
            )}

            <motion.button
              type="button"
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 py-3 text-lg font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-indigo-400/60 disabled:cursor-not-allowed disabled:opacity-60"
              whileHover={{ scale: submitting ? 1 : 1.02 }}
              whileTap={{ scale: submitting ? 1 : 0.98 }}
              onClick={submitTrade}
              disabled={submitting}
            >
              {submitting ? 'Sending trade…' : `Launch ${mode === 'paper' ? 'Paper' : 'Live'} Trade`}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/70 p-3">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-1 text-xl font-semibold text-gray-100 ${accent ?? ''}`}>{value}</p>
    </div>
  )
}
