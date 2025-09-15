import Head from 'next/head'
import { useState } from 'react'
import { useQuery } from 'react-query'
import Layout from '../components/Layout'
import CorrelationHeatmap from '../components/analytics/CorrelationHeatmap'
import { api } from '../lib/api'

export default function CorrelationsPage() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('15m')
  const [selectedSymbols] = useState<string[]>(['BTCUSDT','ETHUSDT','ADAUSDT','SOLUSDT'])

  const { data, isLoading } = useQuery(
    ['correlation-matrix-page', selectedSymbols, selectedTimeframe],
    () => api.getCorrelationMatrix({ symbols: selectedSymbols, interval: selectedTimeframe, window_size: 120 }),
    { refetchInterval: 60000 }
  )

  return (
    <>
      <Head><title>Correlations - Crypto Lead-Lag Pattern Radar</title></Head>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Correlation Matrix</h1>
            <select value={selectedTimeframe} onChange={(e)=>setSelectedTimeframe(e.target.value)} className="input w-40">
              {['5m','15m','1h','4h','1d'].map(tf => <option key={tf} value={tf}>{tf}</option>)}
            </select>
          </div>
          <div className="card">
            <CorrelationHeatmap data={data} isLoading={isLoading} symbols={selectedSymbols} />
          </div>
        </div>
      </Layout>
    </>
  )
}

