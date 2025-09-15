import Head from 'next/head'
import { useEffect, useMemo, useState } from 'react'
import Layout from '../components/Layout'
import Candles from '../components/charts/Candles'
import CombinedOverlay from '../components/charts/CombinedOverlay'

function mapKlines(kl: any[]) {
  return kl.map((k: any) => ({ time: Math.floor(new Date(k.close_time).getTime() / 1000), open: k.open_price, high: k.high_price, low: k.low_price, close: k.close_price }))
}

export default function PairDrilldown() {
  const [leader, setLeader] = useState('BTCUSDT')
  const [follower, setFollower] = useState('ETHUSDT')
  const [interval, setInterval] = useState('15m')
  const [metrics, setMetrics] = useState<any>(null)
  const [klLeader, setKlLeader] = useState<any[]>([])
  const [klFollower, setKlFollower] = useState<any[]>([])
  const [overlay, setOverlay] = useState<any[]>([])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const u = new URL(window.location.href)
      setLeader(u.searchParams.get('leader') || 'BTCUSDT')
      setFollower(u.searchParams.get('follower') || 'ETHUSDT')
      setInterval(u.searchParams.get('interval') || '15m')
    }
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        const m = await fetch(`/api/v1/analytics/lead-lag-metrics?symbol1=${leader}&symbol2=${follower}&interval=${interval}&max_lag=20`).then(r=>r.json())
        setMetrics(m)
        const [a, b] = await Promise.all([
          fetch(`/api/v1/market/klines?symbol=${leader}&interval=${interval}&limit=300`).then(r=>r.json()),
          fetch(`/api/v1/market/klines?symbol=${follower}&interval=${interval}&limit=300`).then(r=>r.json()),
        ])
        setKlLeader(a)
        setKlFollower(b)
        // build overlay series (follower shifted by best_lag)
        const L = m?.best_lag ?? 0
        const intervalToSec: Record<string, number> = { '1m':60, '5m':300, '15m':900, '30m':1800, '1h':3600, '4h':14400, '1d':86400 }
        const sec = intervalToSec[interval] || 900
        const line = (b||[]).map((k:any)=>({ time: Math.floor(new Date(k.close_time).getTime()/1000) + (L*sec), value: k.close_price }))
        setOverlay(line)
      } catch {}
    }
    if (leader && follower) load()
  }, [leader, follower, interval])

  const lagText = useMemo(() => {
    if (!metrics || metrics.best_lag == null) return 'N/A'
    const L = metrics.best_lag
    if (L === 0) return 'Synchronous'
    if (L > 0) return `${leader} leads ${follower} by ${L} bars`
    return `${follower} leads ${leader} by ${Math.abs(L)} bars`
  }, [metrics, leader, follower])

  const trade = async (sym: string, side: 'buy'|'sell') => {
    await fetch('/api/v1/trading/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ symbol: sym, exchange: 'binance', order_type: 'market', side, quantity: 0.01, mode: 'paper' }) })
  }

  return (
    <>
      <Head><title>Pair Drilldown</title></Head>
      <Layout>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Pair Drilldown</h1>
              <div className="text-gray-400 text-sm">{leader} ↔ {follower} • Interval: {interval} • {lagText} • Strength: {metrics?.best_abs_corr ? Math.round((metrics.best_abs_corr||0)*100) : 0}%</div>
            </div>
            <div className="flex gap-2">
              <button className="btn-primary" onClick={()=>trade(leader, 'buy')}>Buy {leader}</button>
              <button className="btn-secondary" onClick={()=>trade(follower, 'sell')}>Sell {follower}</button>
            </div>
          </div>

          <div className="card">
            <div className="mb-2 text-sm text-gray-300">Overlay: {leader} candles with lag-adjusted {follower} line</div>
            <CombinedOverlay candles={mapKlines(klLeader)} overlay={overlay} overlayLabel={`${follower} (lag adj)`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card"><div className="mb-2 text-sm text-gray-300">{leader}</div><Candles data={mapKlines(klLeader)} patterns={[]} /></div>
            <div className="card"><div className="mb-2 text-sm text-gray-300">{follower}</div><Candles data={mapKlines(klFollower)} patterns={[]} /></div>
          </div>
        </div>
      </Layout>
    </>
  )
}
