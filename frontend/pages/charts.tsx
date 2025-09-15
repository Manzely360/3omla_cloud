import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import Layout from '../components/Layout'
import Candles from '../components/charts/Candles'
import QuickTrade from '../components/trading/QuickTrade'

function mapKlines(kl: any[]) {
  return kl.map((k: any) => ({ time: Math.floor(new Date(k.close_time).getTime() / 1000), open: k.open_price, high: k.high_price, low: k.low_price, close: k.close_price }))
}

export default function ChartsPage() {
  const [symbol, setSymbol] = useState('BTCUSDT')
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const u = new URL(window.location.href)
      const s = u.searchParams.get('symbol')
      if (s) setSymbol(s.toUpperCase())
    }
  }, [])
  const [interval, setInterval] = useState('15m')
  const { data: klines } = useQuery(['kl', symbol, interval], () => fetch(`/api/v1/market/klines?symbol=${symbol}&interval=${interval}&limit=200`).then(r=>r.json()))
  const { data: patterns } = useQuery(['pat', symbol, interval], () => fetch(`/api/v1/analytics/patterns?symbol=${symbol}&interval=${interval}&limit=200`).then(r=>r.json()))
  const [risk, setRisk] = useState<'low'|'default'|'high'>('default')
  const [budget, setBudget] = useState<number>(100)
  const [suggestion, setSuggestion] = useState<any>(null)
  const analyze = async () => {
    const url = `/api/v1/analytics/entry-suggestion?symbol=${symbol}&interval=${interval}&risk=${risk}&budget=${budget}`
    const res = await fetch(url)
    setSuggestion(await res.json())
  }

  return (
    <>
      <Head><title>Charts & Patterns</title></Head>
      <Layout>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <input className="input w-40" value={symbol} onChange={(e)=>setSymbol(e.target.value.toUpperCase())} />
            <select className="input w-32" value={interval} onChange={(e)=>setInterval(e.target.value)}>
              {['1m','5m','15m','1h','4h','1d'].map(tf=> <option key={tf} value={tf}>{tf}</option>)}
            </select>
          </div>
          <div className="card">
            <Candles data={mapKlines(klines || [])} patterns={patterns?.patterns || []} />
          </div>
          <div className="card">
            <h2 className="text-lg font-semibold mb-2">Quick Trade (Paper)</h2>
            <QuickTrade defaultSymbol={symbol} />
          </div>
          <div className="card">
            <div className="flex items-center space-x-3">
              <select className="input w-28" value={risk} onChange={(e)=> setRisk(e.target.value as any)}>
                <option value="low">Low risk</option>
                <option value="default">Default</option>
                <option value="high">High risk</option>
              </select>
              <input className="input w-32" type="number" min={10} value={budget} onChange={(e)=> setBudget(Number(e.target.value))} placeholder="Budget (USD)" />
              <button className="btn-primary" onClick={analyze}>Analyze</button>
            </div>
            {suggestion && (
              <div className="mt-3">
                {suggestion.status === 'ok' ? (
                  <div className="space-y-1 text-sm">
                    <div className="text-gray-100">Suggestion: <span className={`font-semibold ${suggestion.direction==='long'?'text-green-400':'text-red-400'}`}>{suggestion.direction.toUpperCase()}</span> {symbol} • p={Math.round((suggestion.probability||0)*100)}%</div>
                    <div>SL: {(suggestion.stop_loss_pct*100).toFixed(1)}% • TP: {(suggestion.take_profit_pct*100).toFixed(1)}% • Timeframe: {suggestion.timeframe_minutes}m</div>
                    {suggestion.budget !== undefined && (
                      <div>Budget: ${suggestion.budget} • Expected PnL: ${suggestion.expected_pnl}</div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-400">Position unavailable (confidence {Math.round((suggestion.probability||0)*100)}%)</div>
                )}
              </div>
            )}
          </div>
        </div>
      </Layout>
    </>
  )
}
