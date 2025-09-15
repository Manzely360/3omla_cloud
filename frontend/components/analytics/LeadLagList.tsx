import { useQuery } from 'react-query'

type Pair = {
  leader_symbol: string
  follower_symbol: string
  best_lag: number
  best_abs_corr: number
  hit_rate: number
}

export default function LeadLagList({ interval = '15m', limit = 15, symbols = ['BTCUSDT','ETHUSDT','BNBUSDT','SOLUSDT','XRPUSDT','ADAUSDT'] }: { interval?: string; limit?: number; symbols?: string[] }) {
  const qs = symbols.map(s=>`symbols=${encodeURIComponent(s)}`).join('&')
  const { data, isLoading } = useQuery<Pair[]>(
    ['leadlag-list', interval, limit, symbols.join(',')],
    () => fetch(`/api/v1/analytics/live-leadlag?${qs}&interval=${interval}&max_lag=10&limit=${limit}`).then(r=>r.json()),
    { refetchInterval: 120000, keepPreviousData: true }
  )

  const quickTrade = async (symbol: string, side: 'buy'|'sell', qty = 0.01) => {
    await fetch('/api/v1/trading/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ symbol, exchange: 'binance', order_type: 'market', side, quantity: qty, mode: 'paper' }) })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-100">Lead-Lag Summary</h2>
        <span className="text-xs text-gray-400">Interval: {interval}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-800">
          <thead className="bg-gray-800/40">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Leader → Follower</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Lag (bars)</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Strength</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Hit Rate</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Trade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {isLoading && (<tr><td className="px-4 py-3 text-sm text-gray-400" colSpan={4}>Loading...</td></tr>)}
            {data?.map((p, idx) => (
              <tr key={idx} className="hover:bg-gray-800/30">
                <td className="px-4 py-2 text-sm text-gray-200">
                  <a className="text-blue-300 underline" href={`/pair?leader=${encodeURIComponent(p.leader_symbol as any)}&follower=${encodeURIComponent(p.follower_symbol as any)}&interval=${encodeURIComponent(interval)}`}>{p.leader_symbol} → {p.follower_symbol}</a>
                </td>
                <td className="px-4 py-2 text-sm text-gray-200">{p.best_lag ?? '-'} </td>
                <td className="px-4 py-2 text-sm">
                  <div className="w-28 h-2 bg-gray-700 rounded">
                    <div className="h-2 bg-purple-500 rounded" style={{ width: `${Math.min(100, Math.round((p.best_abs_corr||0)*100))}%` }} />
                  </div>
                </td>
                <td className="px-4 py-2 text-sm text-gray-200">{Math.round((p.hit_rate||0)*100)}%</td>
                <td className="px-4 py-2 text-xs text-gray-200">
                  <div className="flex gap-2">
                    <button className="btn-secondary px-2 py-1" onClick={()=>quickTrade(p.leader_symbol as any, 'buy')}>Buy {p.leader_symbol}</button>
                    <button className="btn-secondary px-2 py-1" onClick={()=>quickTrade(p.follower_symbol as any, 'sell')}>Sell {p.follower_symbol}</button>
                  </div>
                </td>
              </tr>
            ))}
            {data?.length === 0 && !isLoading && (
              <tr><td className="px-4 py-3 text-sm text-gray-400" colSpan={4}>No pairs found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 mt-2">Leader tends to move first by the shown number of bars on average.</p>
    </div>
  )
}
