import Head from 'next/head'
import { useMemo, useState } from 'react'
import { useQuery } from 'react-query'
import Layout from '../components/Layout'
import CorrelationHeatmap from '../components/analytics/CorrelationHeatmap'
import { api } from '../lib/api'

export default function CorrelationsPage() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('15m')
  const [selectedSymbols] = useState<string[]>(['BTCUSDT','ETHUSDT','ADAUSDT','SOLUSDT'])
  const [mode, setMode] = useState<'historical'|'fast'>('historical')
  const [leader, setLeader] = useState('BTCUSDT')
  const [follower, setFollower] = useState('ETHUSDT')

  // Historical correlation
  const { data: histData, isLoading: histLoading } = useQuery(
    ['correlation-matrix-page', selectedSymbols, selectedTimeframe],
    () => api.getCorrelationMatrix({ symbols: selectedSymbols, interval: selectedTimeframe, window_size: 120 }),
    { refetchInterval: 60000 }
  )

  // Fast correlation (1-second resampling over small window)
  const { data: fastRaw, isLoading: fastLoading } = useQuery(
    ['fast-corr', selectedSymbols],
    () => fetch(`/api/v1/analytics/fast-correlation?symbols=${selectedSymbols.join(',')}&window_secs=300`).then(r=>r.json()),
    { refetchInterval: 5000 }
  )

  // Transform fast matrix to the same shape the heatmap expects
  const fastTransformed = useMemo(() => {
    if (!fastRaw || !Array.isArray(fastRaw.symbols) || !Array.isArray(fastRaw.matrix)) return null
    const syms: string[] = fastRaw.symbols
    const mat: number[][] = fastRaw.matrix
    const obj: any = { correlation_matrix: {} }
    for (let i=0;i<syms.length;i++) {
      const rowSym = syms[i]
      obj.correlation_matrix[rowSym] = {}
      for (let j=0;j<syms.length;j++) {
        obj.correlation_matrix[rowSym][syms[j]] = typeof mat[i]?.[j] === 'number' ? mat[i][j] : 0
      }
    }
    return { data: obj, symbols: syms }
  }, [fastRaw])

  const symbolsToShow = mode === 'fast' ? (fastTransformed?.symbols || selectedSymbols) : selectedSymbols
  const heatmapData = mode === 'fast' ? fastTransformed?.data : histData
  const isLoading = mode === 'fast' ? fastLoading : histLoading

  // Fast lead-lag mini panel
  const { data: fastLL } = useQuery(
    ['fast-ll', leader, follower],
    () => fetch(`/api/v1/analytics/fast-leadlag?symbol1=${leader}&symbol2=${follower}&window_secs=600&max_lag_secs=60`).then(r=>r.json()),
    { enabled: !!leader && !!follower, refetchInterval: 5000 }
  )

  return (
    <>
      <Head><title>Correlations - Crypto Lead-Lag Pattern Radar</title></Head>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h1 className="text-2xl font-semibold">Correlation Matrix</h1>
            <div className="flex items-center space-x-2">
              <div className="inline-flex rounded-md bg-gray-800 p-1 border border-gray-700">
                <button onClick={()=> setMode('historical')} className={`px-3 py-1 text-sm rounded ${mode==='historical'?'bg-primary-600 text-white':'text-gray-300'}`}>Historical</button>
                <button onClick={()=> setMode('fast')} className={`px-3 py-1 text-sm rounded ${mode==='fast'?'bg-primary-600 text-white':'text-gray-300'}`}>Fast</button>
              </div>
              {mode==='historical' && (
                <select value={selectedTimeframe} onChange={(e)=>setSelectedTimeframe(e.target.value)} className="input w-40">
                  {['5m','15m','1h','4h','1d'].map(tf => <option key={tf} value={tf}>{tf}</option>)}
                </select>
              )}
            </div>
          </div>

          <div className="card">
            <CorrelationHeatmap data={heatmapData} isLoading={!!isLoading} symbols={symbolsToShow} />
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Fast Lead-Lag (last 10 min)</h3>
              <div className="flex items-center space-x-2">
                <select className="input w-36" value={leader} onChange={(e)=> setLeader(e.target.value)}>
                  {symbolsToShow.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <span className="text-gray-400 text-sm">→</span>
                <select className="input w-36" value={follower} onChange={(e)=> setFollower(e.target.value)}>
                  {symbolsToShow.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            {fastLL?.best_corr !== undefined ? (
              <div className="text-sm text-gray-300">
                <div>
                  Best Corr: <span className={`font-semibold ${fastLL.best_corr>=0?'text-green-400':'text-red-400'}`}>{(fastLL.best_corr as number).toFixed(3)}</span>
                  <span className="ml-3">Lag: <span className="font-semibold text-gray-100">{fastLL.best_lag_secs}s</span></span>
                </div>
                <div className="mt-1 text-gray-400">
                  {leader} {fastLL.best_lag_secs>0 ? 'leads' : (fastLL.best_lag_secs<0 ? 'lags' : 'sync with')} {follower} by {Math.abs(fastLL.best_lag_secs)}s
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-400">Collecting data…</div>
            )}
          </div>
        </div>
      </Layout>
    </>
  )
}
