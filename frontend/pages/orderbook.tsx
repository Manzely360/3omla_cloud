import Head from 'next/head'
import { useState } from 'react'
import { useQuery } from 'react-query'
import Layout from '../components/Layout'
import { api } from '../lib/api'

export default function OrderbookPage() {
  const [symbol, setSymbol] = useState('BTCUSDT')
  const { data, isLoading, refetch } = useQuery(['ob-imb', symbol], () => apiClient(symbol), { keepPreviousData: true })

  function apiClient(sym: string) {
    return fetch(`/api/v1/market/orderbook/imbalance-detail?symbol=${encodeURIComponent(sym)}&exchange=binance&bands=0.001,0.005,0.01`).then((r) => r.json())
  }

  return (
    <>
      <Head><title>Order Book Analytics</title></Head>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <input className="input w-48" value={symbol} onChange={(e)=>setSymbol(e.target.value)} />
            <button className="btn-primary" onClick={()=>refetch()}>Analyze</button>
          </div>
          <div className="card">
            <h2 className="text-lg font-medium mb-3">Depth Imbalance</h2>
            {isLoading ? (<p className="text-gray-400">Loading…</p>) : (
              <div className="space-y-2">
                {(data?.bands || []).map((b: any) => (
                  <div key={b.band} className="flex items-center justify-between bg-gray-700/40 rounded p-2">
                    <div className="text-sm text-gray-300">Band ±{(b.band*100).toFixed(2)}%</div>
                    <div className="text-sm">Imbalance: <span className={`font-semibold ${b.imbalance>0?'text-green-400':'text-red-400'}`}>{(b.imbalance*100).toFixed(1)}%</span></div>
                    {b.delta !== null && <div className="text-xs text-gray-400">Δ {(b.delta*100).toFixed(1)}%</div>}
                  </div>
                ))}
                {data?.spoof_flags?.length>0 && (
                  <div className="text-sm text-yellow-400">Spoof flags: {data.spoof_flags.map((s:any)=>`±${(s.band*100).toFixed(2)}%`).join(', ')}</div>
                )}
              </div>
            )}
          </div>
        </div>
      </Layout>
    </>
  )
}

