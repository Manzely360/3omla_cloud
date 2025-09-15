import { useEffect, useState } from 'react'

export default function TradingHistory() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<any>({})

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/v1/trading/orders?limit=200')
        const data = await res.json()
        setOrders(Array.isArray(data) ? data : [])
        // simple stats
        const filled = data.filter((o:any)=>o.status==='filled')
        const buys = filled.filter((o:any)=>o.side==='buy').length
        const sells = filled.filter((o:any)=>o.side==='sell').length
        setSummary({ total: data.length, filled: filled.length, buys, sells })
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Trading History</h2>
        <div className="text-sm text-gray-500">Total: {summary.total || 0} • Filled: {summary.filled || 0} • Buys: {summary.buys || 0} • Sells: {summary.sells || 0}</div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Time</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Symbol</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Side</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Qty</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Avg Price</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading && (<tr><td className="px-4 py-2 text-sm text-gray-500" colSpan={6}>Loading...</td></tr>)}
            {!loading && orders.map((o:any)=>(
              <tr key={o.id}>
                <td className="px-4 py-2 text-sm text-gray-900">{o.created_at?.replace('T',' ').substring(0,19)}</td>
                <td className="px-4 py-2 text-sm text-gray-900">{o.symbol}</td>
                <td className="px-4 py-2 text-sm text-gray-900">{o.side}</td>
                <td className="px-4 py-2 text-sm text-gray-900">{o.quantity}</td>
                <td className="px-4 py-2 text-sm text-gray-900">{o.average_price ?? '-'}</td>
                <td className="px-4 py-2 text-sm text-gray-900">{o.status}</td>
              </tr>
            ))}
            {!loading && orders.length === 0 && (<tr><td className="px-4 py-2 text-sm text-gray-500" colSpan={6}>No orders yet.</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  )
}

