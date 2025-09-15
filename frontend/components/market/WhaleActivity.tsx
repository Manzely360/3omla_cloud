import { useState } from 'react'
import { useQuery } from 'react-query'

type Whale = {
  symbol: string
  exchange: string
  price: number
  quantity: number
  usd_notional: number
  side: 'buy' | 'sell'
  trade_id: string
  timestamp: string
}

export default function WhaleActivity({ defaultMin = 100000 }: { defaultMin?: number }) {
  const [minSize, setMinSize] = useState<number>(defaultMin)
  const { data, isLoading, refetch, isFetching } = useQuery<Whale[]>(
    ['whales', minSize],
    () => fetch(`/api/v1/market/whale-activity?min_trade_size=${minSize}&limit=50`).then(r => r.json()),
    { refetchInterval: 15000, keepPreviousData: true }
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-100">Whale Activity</h2>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            className="input w-36"
            value={minSize}
            min={10000}
            step={10000}
            onChange={(e) => setMinSize(Number(e.target.value))}
          />
          <button className="btn-secondary" onClick={() => refetch()} disabled={isFetching}>Refresh</button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-800">
          <thead className="bg-gray-800/40">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Time</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Symbol</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Side</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Price</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Quantity</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Notional</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {isLoading && (
              <tr><td className="px-4 py-3 text-sm text-gray-400" colSpan={6}>Loading...</td></tr>
            )}
            {data?.map((w) => (
              <tr key={`${w.symbol}-${w.trade_id}`} className="hover:bg-gray-800/30">
                <td className="px-4 py-2 text-sm text-gray-300">{new Date(w.timestamp).toLocaleTimeString()}</td>
                <td className="px-4 py-2 text-sm text-gray-200">{w.symbol}</td>
                <td className="px-4 py-2 text-xs">
                  <span className={`inline-flex px-2 py-1 rounded-full ${w.side === 'buy' ? 'bg-green-900/40 text-green-300' : 'bg-red-900/40 text-red-300'}`}>{w.side.toUpperCase()}</span>
                </td>
                <td className="px-4 py-2 text-sm text-gray-200">{w.price.toLocaleString()}</td>
                <td className="px-4 py-2 text-sm text-gray-200">{w.quantity.toLocaleString()}</td>
                <td className="px-4 py-2 text-sm font-semibold text-gray-100">${w.usd_notional.toLocaleString()}</td>
              </tr>
            ))}
            {data?.length === 0 && !isLoading && (
              <tr><td className="px-4 py-3 text-sm text-gray-400" colSpan={6}>No whale trades at this threshold.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

