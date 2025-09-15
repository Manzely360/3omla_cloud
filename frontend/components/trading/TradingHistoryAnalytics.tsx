import { useEffect, useState } from 'react'
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function TradingHistoryAnalytics() {
  const [summary, setSummary] = useState<any | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch('/api/v1/trading/history/summary')
        const d = await r.json()
        setSummary(d)
      } catch (e) {
        setSummary(null)
      }
    }
    load()
  }, [])

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">History Analytics</h2>
        {summary && (
          <div className="text-sm text-gray-600 space-x-4">
            <span>Trades: {summary.trades}</span>
            <span>Win rate: {Math.round((summary.win_rate||0)*100)}%</span>
            <span>Total PnL: {Number(summary.total_realized_pnl||0).toFixed(2)}</span>
            <span>Max DD: {Number(summary.max_drawdown||0).toFixed(2)}</span>
          </div>
        )}
      </div>
      <div className="p-4" style={{height: 260}}>
        {summary && Array.isArray(summary.equity_curve) && summary.equity_curve.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={summary.equity_curve} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#eee" strokeDasharray="4 4" />
              <XAxis dataKey="t" hide tick={false} />
              <YAxis domain={['auto','auto']} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v)=>Array.isArray(v)?v[0]:v} labelFormatter={(l)=>new Date(l).toLocaleString()} />
              <Line type="monotone" dataKey="equity" stroke="#7c3aed" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-sm text-gray-500">No closed positions yet.</div>
        )}
      </div>
    </div>
  )
}

