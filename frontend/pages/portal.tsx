import Head from 'next/head'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Layout from '../components/Layout'
import api from '../lib/api'

const TARGET_SYMBOL = 'PORTALUSDT'
const COMPARE_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT']
const POLL_INTERVAL_MS = 60000
const POSITION_POLL_MS = 30000
const PAPER_BUDGET_USDT = 1.5
const TARGET_MULTIPLIER = 10000

type LeadLagEntry = {
  symbol1: string
  symbol2: string
  best_lag: number | null
  best_abs_corr?: number | null
  lags?: number[]
  xcorr?: (number | null)[]
}

type ProcessedLeadLag = {
  otherSymbol: string
  corr: number | null
  absCorr: number
  bestLag: number | null
  description: string
  targetRole: 'leader' | 'follower' | 'synchronous' | 'unknown'
}

export default function PortalLiveAnalytics() {
  const [price, setPrice] = useState<number | null>(null)
  const [leadLagRaw, setLeadLagRaw] = useState<LeadLagEntry[]>([])
  const [patterns, setPatterns] = useState<{ type: string; time: string }[]>([])
  const [positions, setPositions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionStatus, setActionStatus] = useState<string | null>(null)

  const fetchSnapshots = useCallback(async () => {
    try {
      setError(null)
      const symbolList = [TARGET_SYMBOL, ...COMPARE_SYMBOLS]
      const [priceResp, leadLagResp, patternsResp] = await Promise.all([
        api.getCurrentPrice(TARGET_SYMBOL),
        api.getLiveLeadLag({ symbols: symbolList, interval: '5m', max_lag: 12, limit: 30 }),
        fetch(`/api/v1/analytics/patterns?symbol=${TARGET_SYMBOL}&interval=15m&limit=200`).then((r) => r.json()),
      ])
      const px = typeof priceResp?.price === 'number' ? priceResp.price : Number(priceResp?.price)
      if (!Number.isNaN(px)) {
        setPrice(px)
      }
      if (Array.isArray(leadLagResp)) {
        setLeadLagRaw(leadLagResp)
      }
      if (Array.isArray(patternsResp?.patterns)) {
        setPatterns(patternsResp.patterns)
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to refresh live analytics')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchPositions = useCallback(async () => {
    try {
      const pos = await api.getPositions({ mode: 'paper' })
      if (Array.isArray(pos)) {
        setPositions(pos.filter((p: any) => p.symbol === TARGET_SYMBOL))
      }
    } catch (err: any) {
      setActionStatus(err?.message || 'Failed to load paper positions')
    }
  }, [])

  useEffect(() => {
    let active = true
    const load = async () => {
      if (!active) return
      await fetchSnapshots()
    }
    load()
    const timer = setInterval(load, POLL_INTERVAL_MS)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [fetchSnapshots])

  useEffect(() => {
    fetchPositions()
    const timer = setInterval(fetchPositions, POSITION_POLL_MS)
    return () => clearInterval(timer)
  }, [fetchPositions])

  const processedLeadLag = useMemo<ProcessedLeadLag[]>(() => {
    return leadLagRaw
      .filter((entry) => entry.symbol1 === TARGET_SYMBOL || entry.symbol2 === TARGET_SYMBOL)
      .map((entry) => {
        const { symbol1, symbol2, best_lag, lags, xcorr } = entry
        const otherSymbol = symbol1 === TARGET_SYMBOL ? symbol2 : symbol1
        let corr: number | null = null
        if (Array.isArray(lags) && Array.isArray(xcorr) && best_lag !== null) {
          const idx = lags.findIndex((l) => l === best_lag)
          if (idx >= 0 && typeof xcorr[idx] === 'number') {
            corr = xcorr[idx] as number
          }
        }
        if (corr === null && typeof entry.best_abs_corr === 'number') {
          corr = entry.best_abs_corr
        }
        let description = 'Insufficient data'
        let targetRole: ProcessedLeadLag['targetRole'] = 'unknown'
        if (best_lag === null) {
          description = 'Insufficient data'
          targetRole = 'unknown'
        } else if (best_lag === 0) {
          description = 'Synchronous'
          targetRole = 'synchronous'
        } else if (best_lag > 0) {
          description = `${symbol1} leads ${symbol2} by ${best_lag} bars`
          targetRole = symbol1 === TARGET_SYMBOL ? 'leader' : 'follower'
        } else {
          description = `${symbol2} leads ${symbol1} by ${Math.abs(best_lag)} bars`
          targetRole = symbol2 === TARGET_SYMBOL ? 'leader' : 'follower'
        }
        return {
          otherSymbol,
          corr,
          absCorr: Math.abs(corr ?? 0),
          bestLag: best_lag,
          description,
          targetRole,
        }
      })
      .sort((a, b) => b.absCorr - a.absCorr)
  }, [leadLagRaw])

  const positivePairs = useMemo(() => processedLeadLag.filter((p) => (p.corr ?? 0) > 0).slice(0, 5), [processedLeadLag])
  const negativePairs = useMemo(() => processedLeadLag.filter((p) => (p.corr ?? 0) < 0).slice(0, 5), [processedLeadLag])

  const recentPatterns = useMemo(() => {
    return patterns.slice(-6).reverse()
  }, [patterns])

  const projectedGoal = useMemo(() => PAPER_BUDGET_USDT * TARGET_MULTIPLIER, [])

  const handlePaperTrade = useCallback(
    async (direction: 'long' | 'short') => {
      if (!price || price <= 0) {
        setActionStatus('Price unavailable; cannot size order')
        return
      }
      const baseQty = Number((PAPER_BUDGET_USDT / price).toFixed(2))
      setActionStatus('Placing paper order...')
      try {
        const payload = {
          symbol: TARGET_SYMBOL,
          exchange: 'bybit',
          order_type: 'market',
          side: direction === 'long' ? 'buy' : 'sell',
          quantity: baseQty,
          mode: 'paper',
        }
        const res = await fetch('/api/v1/trading/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const txt = await res.text()
          throw new Error(txt || 'Order rejected')
        }
        setActionStatus(`Paper ${direction === 'long' ? 'long' : 'short'} submitted @ ~${price.toFixed(5)} (qty ${baseQty})`)
        fetchPositions()
      } catch (err: any) {
        setActionStatus(err?.message || 'Paper order failed')
      }
    },
    [price, fetchPositions]
  )

  return (
    <>
      <Head>
        <title>PORTAL Lead-Lag Radar</title>
      </Head>
      <Layout>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gradient">PORTAL Lead-Lag Radar</h1>
              <p className="text-sm text-gray-400">
                Live correlation, lead/lag signals, and paper-trade scaffolding focused on {TARGET_SYMBOL}.
              </p>
            </div>
            <div className="flex flex-col items-start text-gray-100">
              <span className="text-xs uppercase tracking-wider text-gray-400">Live Price</span>
              <span className="text-2xl font-semibold">
                {price ? `${price.toFixed(5)} USDT` : loading ? 'Loading...' : 'Unavailable'}
              </span>
            </div>
          </div>

          {error && <div className="rounded border border-red-600 bg-red-900/20 p-3 text-sm text-red-200">{error}</div>}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-100">High-Confidence Followers</h2>
              <p className="text-xs text-gray-400">Positive correlation pairs where PORTAL trends with peers.</p>
              <div className="mt-3 space-y-3">
                {positivePairs.length === 0 && <div className="text-sm text-gray-500">No strong companions detected yet.</div>}
                {positivePairs.map((p) => (
                  <div key={p.otherSymbol} className="rounded bg-gray-900/40 p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-200">{p.otherSymbol}</span>
                      <span className="text-green-400">{p.corr?.toFixed(3) ?? 'n/a'}</span>
                    </div>
                    <div className="text-xs text-gray-400">{p.description}</div>
                    <div className="text-[11px] uppercase tracking-wide text-gray-500">Role: {p.targetRole}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h2 className="text-lg font-semibold text-gray-100">Opposite Movers</h2>
              <p className="text-xs text-gray-400">Negative correlation pairs likely to diverge from PORTAL.</p>
              <div className="mt-3 space-y-3">
                {negativePairs.length === 0 && <div className="text-sm text-gray-500">No reliable anti-correlations yet.</div>}
                {negativePairs.map((p) => (
                  <div key={p.otherSymbol} className="rounded bg-gray-900/40 p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-200">{p.otherSymbol}</span>
                      <span className="text-red-400">{p.corr?.toFixed(3) ?? 'n/a'}</span>
                    </div>
                    <div className="text-xs text-gray-400">{p.description}</div>
                    <div className="text-[11px] uppercase tracking-wide text-gray-500">Role: {p.targetRole}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h2 className="text-lg font-semibold text-gray-100">Pattern Radar (15m)</h2>
              <p className="text-xs text-gray-400">Recent candlestick structures flagged on PORTAL.</p>
              <div className="mt-3 space-y-2">
                {recentPatterns.length === 0 && <div className="text-sm text-gray-500">Awaiting pattern detections.</div>}
                {recentPatterns.map((pat, idx) => (
                  <div key={`${pat.type}-${idx}`} className="flex items-center justify-between rounded bg-gray-900/40 px-3 py-2 text-xs text-gray-300">
                    <span className="font-semibold text-gray-100">{pat.type.replace(/_/g, ' ')}</span>
                    <span>{new Date(pat.time).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-100">Paper Trade Toolkit</h2>
              <p className="text-xs text-gray-400">
                Simulate entries using a {PAPER_BUDGET_USDT.toFixed(2)} USDT budget (≈ goal {projectedGoal.toLocaleString()} USDT for {TARGET_MULTIPLIER}× growth).
              </p>
              <div className="mt-4 space-y-3">
                <button className="btn-primary w-full" onClick={() => handlePaperTrade('long')}>
                  Go Long (+)
                </button>
                <button className="btn-secondary w-full" onClick={() => handlePaperTrade('short')}>
                  Go Short (−)
                </button>
                <div className="rounded bg-gray-900/40 p-3 text-xs text-gray-300">
                  <div>Current target sizing base qty ≈ {price ? (PAPER_BUDGET_USDT / price).toFixed(2) : 'n/a'} PORTAL</div>
                  <div>Projected goal (10000×): {projectedGoal.toLocaleString()} USDT notional</div>
                </div>
                {actionStatus && <div className="text-xs text-gray-400">{actionStatus}</div>}
              </div>
            </div>

            <div className="card lg:col-span-2">
              <h2 className="text-lg font-semibold text-gray-100">Paper Positions ({positions.length})</h2>
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                      <th className="px-2 py-1">Side</th>
                      <th className="px-2 py-1">Quantity</th>
                      <th className="px-2 py-1">Entry</th>
                      <th className="px-2 py-1">Mark</th>
                      <th className="px-2 py-1">Unrealized</th>
                      <th className="px-2 py-1">Opened</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-2 py-3 text-center text-xs text-gray-500">
                          No active paper positions yet.
                        </td>
                      </tr>
                    )}
                    {positions.map((pos: any) => (
                      <tr key={pos.id} className="border-b border-gray-800/60">
                        <td className="px-2 py-2">{pos.side}</td>
                        <td className="px-2 py-2">{Number(pos.quantity).toFixed(2)}</td>
                        <td className="px-2 py-2">{Number(pos.entry_price).toFixed(5)}</td>
                        <td className="px-2 py-2">{pos.current_price ? Number(pos.current_price).toFixed(5) : '—'}</td>
                        <td className={`px-2 py-2 ${Number(pos.unrealized_pnl) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {Number(pos.unrealized_pnl).toFixed(4)}
                        </td>
                        <td className="px-2 py-2 text-xs text-gray-400">{pos.opened_at ? new Date(pos.opened_at).toLocaleString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-100">Execution Notes</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-gray-400">
              <li>Correlation metrics refresh every {POLL_INTERVAL_MS / 1000} seconds using 5m bars.</li>
              <li>Redis-backed ingestion must be running for real-time lead/lag to stabilise.</li>
              <li>Paper fills rely on public spot prices; confirm liquidity before live deployment.</li>
            </ul>
          </div>
        </div>
      </Layout>
    </>
  )
}
