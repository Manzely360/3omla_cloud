import Head from 'next/head'
import { useMemo, useState } from 'react'
import { useQuery } from 'react-query'
import { motion } from 'framer-motion'
import Layout from '../components/Layout'
import CorrelationHeatmap from '../components/analytics/CorrelationHeatmap'
import { api } from '../lib/api'

export default function CorrelationsPage() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('15m')
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(['BTCUSDT','ETHUSDT','ADAUSDT','SOLUSDT'])
  const [q, setQ] = useState('')
  const [suggestions, setSuggestions] = useState<any[]>([])
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

  async function onSearchSymbols(text: string) {
    const t = text.toUpperCase()
    setQ(t)
    if (t.length < 2) { setSuggestions([]); return }
    try {
      const res = await fetch(`/api/v1/market/symbols/unified-search?q=${encodeURIComponent(t)}&limit=20`)
      const j = await res.json()
      setSuggestions(j || [])
    } catch { setSuggestions([]) }
  }

  function addSymbol(sym: string) {
    setSelectedSymbols(prev => prev.includes(sym) ? prev : [...prev, sym])
    setQ('')
    setSuggestions([])
  }

  function removeSymbol(sym: string) {
    setSelectedSymbols(prev => prev.filter(s => s !== sym))
  }

  // Fast lead-lag mini panel
  const { data: fastLL } = useQuery(
    ['fast-ll', leader, follower],
    () => fetch(`/api/v1/analytics/fast-leadlag?symbol1=${leader}&symbol2=${follower}&window_secs=600&max_lag_secs=60`).then(r=>r.json()),
    { enabled: !!leader && !!follower, refetchInterval: 5000 }
  )

  return (
    <>
      <Head><title>Correlations - 3OMLA Intelligence Hub</title></Head>
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

          <div className="glass-card p-6 mb-6">
            <div className="flex flex-wrap items-center gap-3">
              {selectedSymbols.map((s, index) => (
                <motion.span 
                  key={s}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 text-white text-sm inline-flex items-center gap-3 backdrop-blur-sm"
                >
                  <span className="font-semibold">{s}</span>
                  <button 
                    className="text-gray-300 hover:text-red-400 transition-colors w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-xs" 
                    onClick={()=> removeSymbol(s)}
                  >
                    ×
                  </button>
                </motion.span>
              ))}
              <div className="relative">
                <input 
                  value={q} 
                  onChange={(e)=> onSearchSymbols(e.target.value)} 
                  className="ultra-input w-64" 
                  placeholder="🔍 Add symbol (e.g., SOMIUSDT)" 
                />
                {suggestions.length>0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute z-20 mt-2 max-h-64 overflow-auto w-full glass-card border-0"
                  >
                    {suggestions.map((s:any, i:number) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="px-4 py-3 hover:bg-white/10 cursor-pointer text-sm text-gray-200 border-b border-white/5 last:border-b-0" 
                        onClick={()=> addSymbol(s.symbol)}
                      >
                        <span className="font-semibold text-white">{s.symbol}</span>
                        <span className="text-gray-400 ml-3 text-xs uppercase tracking-wide">{s.exchange}</span>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          <motion.div 
            className="glass-card p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <CorrelationHeatmap data={heatmapData} isLoading={!!isLoading} symbols={symbolsToShow} />
          </motion.div>

          <motion.div 
            className="glass-card p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold gradient-text">Fast Lead-Lag Analysis</h3>
              <div className="flex items-center space-x-3">
                <select className="ultra-input w-40" value={leader} onChange={(e)=> setLeader(e.target.value)}>
                  {symbolsToShow.map(s => <option key={s} value={s} className="bg-gray-800">{s}</option>)}
                </select>
                <span className="text-blue-400 text-lg font-bold">→</span>
                <select className="ultra-input w-40" value={follower} onChange={(e)=> setFollower(e.target.value)}>
                  {symbolsToShow.map(s => <option key={s} value={s} className="bg-gray-800">{s}</option>)}
                </select>
              </div>
            </div>
            {fastLL?.best_corr !== undefined ? (
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-xs uppercase tracking-wide text-gray-400 mb-2">Correlation</div>
                  <div className={`text-2xl font-bold ${fastLL.best_corr>=0?'success-gradient-text':'text-red-400'}`}>
                    {(fastLL.best_corr as number).toFixed(3)}
                  </div>
                </div>
                <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-xs uppercase tracking-wide text-gray-400 mb-2">Lag Time</div>
                  <div className="text-2xl font-bold text-yellow-400">{fastLL.best_lag_secs}s</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-xs uppercase tracking-wide text-gray-400 mb-2">Relationship</div>
                  <div className="text-sm font-semibold text-white">
                    {leader} {fastLL.best_lag_secs>0 ? 'leads' : (fastLL.best_lag_secs<0 ? 'lags' : 'sync with')} {follower}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="ultra-spinner mx-auto mb-4"></div>
                <div className="text-gray-400">Collecting real-time data…</div>
              </div>
            )}
          </motion.div>
        </div>
      </Layout>
    </>
  )
}
