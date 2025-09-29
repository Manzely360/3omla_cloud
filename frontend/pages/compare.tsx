import Head from 'next/head'
import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import Layout from '../components/Layout'
import TradingViewAdvancedChart from '../components/charts/TradingViewAdvancedChart'

interface ExchangeRow { name: string; price: number }
interface Extremum { exchange: string; price: number }

export default function CompareExchangesPage() {
  const [pair, setPair] = useState('BTCUSDT')
  const [interval, setInterval] = useState('15')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [exchanges, setExchanges] = useState<ExchangeRow[]>([])
  const [cheapest, setCheapest] = useState<Extremum | null>(null)
  const [highest, setHighest] = useState<Extremum | null>(null)

  // Autocomplete search
  const onSearch = async (q: string) => {
    try {
      const r = await fetch(`/api/v1/market/symbols/unified-search?q=${encodeURIComponent(q)}&limit=20`)
      const j = await r.json()
      setSuggestions(j || [])
    } catch {
      setSuggestions([])
    }
  }

  // Compare across exchanges
  const loadCompare = async () => {
    setLoading(true)
    try {
      const r = await fetch(`/api/v1/market/aggregate/compare?symbol=${encodeURIComponent(pair)}`)
      const j = await r.json()
      const list = (j?.exchanges || []).map((e: any) => ({ name: e.name, price: e.price }))
      setExchanges(list)
      setCheapest(j?.cheapest || null)
      setHighest(j?.highest || null)
    } catch {
      setExchanges([])
      setCheapest(null)
      setHighest(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCompare()
  }, [pair])

  const tvSymbols = useMemo(() => {
    // Map to preferred vendors if present
    return [
      `BINANCE:${pair}`,
      `BYBIT:${pair}`,
      `KUCOIN:${pair.replace('USDT','-USDT')}`,
      `OKX:${pair.replace('USDT','-USDT')}`,
    ]
  }, [pair])

  return (
    <>
      <Head><title>Compare Exchanges</title></Head>
      <Layout>
        <div className="space-y-4">
          <motion.div 
            className="flex items-center justify-between mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-2">Compare Exchanges</h1>
              <p className="text-gray-400">Real-time price comparison across major crypto exchanges</p>
            </div>
            <div className="flex gap-4 items-center">
              <div className="relative">
                <input
                  className="ultra-input w-64"
                  placeholder="🔍 Search pair (e.g. BTCUSDT)"
                  value={pair}
                  onChange={(e)=>{
                    const q = e.target.value.toUpperCase()
                    setPair(q)
                    if (q.length >= 2) onSearch(q)
                  }}
                  onFocus={()=>{ if (pair.length>=2) onSearch(pair) }}
                />
                {suggestions.length>0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute z-20 mt-2 max-h-64 overflow-auto w-full glass-card border-0"
                  >
                    {suggestions.map((s, i)=> (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="px-4 py-3 hover:bg-white/10 cursor-pointer text-sm text-gray-200 border-b border-white/5 last:border-b-0" 
                        onClick={()=>{ setPair(s.symbol); setSuggestions([]) }}
                      >
                        <span className="font-semibold text-white">{s.symbol}</span>
                        <span className="text-gray-400 ml-3 text-xs uppercase tracking-wide">{s.exchange}</span>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>
              <select className="ultra-input w-20 text-center" value={interval} onChange={(e)=> setInterval(e.target.value)}>
                {['1','5','15','60','240','D'].map(tf=> <option key={tf} value={tf} className="bg-gray-800">{tf}</option>)}
              </select>
              <button 
                className="btn-ultra px-6 py-3" 
                onClick={loadCompare} 
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="ultra-spinner w-4 h-4"></div>
                    Loading
                  </div>
                ) : (
                  '⚡ Compare'
                )}
              </button>
            </div>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Price Comparison Header */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-xs uppercase tracking-wide text-gray-400 mb-1">Cheapest</div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500 neon-glow"></div>
                      <span className="success-gradient-text font-bold text-lg">
                        {cheapest ? `${cheapest.exchange} @ $${Number(cheapest.price).toLocaleString()}` : '—'}
                      </span>
                    </div>
                  </div>
                  <div className="w-px h-12 bg-white/20"></div>
                  <div className="text-center">
                    <div className="text-xs uppercase tracking-wide text-gray-400 mb-1">Highest</div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                      <span className="text-red-400 font-bold text-lg">
                        {highest ? `${highest.exchange} @ $${Number(highest.price).toLocaleString()}` : '—'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase tracking-wide text-gray-400 mb-1">Spread</div>
                  <div className="text-yellow-400 font-bold text-lg">
                    {cheapest && highest ? 
                      `$${(Number(highest.price) - Number(cheapest.price)).toFixed(2)}` : 
                      '—'
                    }
                  </div>
                </div>
              </div>
              
              {/* Exchange Status Indicators */}
              <div className="grid grid-cols-4 gap-4">
                {['Binance', 'Bybit', 'KuCoin', 'OKX'].map((exchange, i) => (
                  <motion.div 
                    key={exchange}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="text-center p-3 rounded-xl bg-white/5 border border-white/10"
                  >
                    <div className="text-xs uppercase tracking-wide text-gray-400 mb-1">{exchange}</div>
                    <div className="status-online text-sm font-semibold">Live</div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 gap-6">
              {tvSymbols.map((symbol, i) => (
                <motion.div 
                  key={symbol}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 + 0.3 }}
                  className="chart-container h-80"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">
                      {['Binance', 'Bybit', 'KuCoin', 'OKX'][i]} • {pair}
                    </h3>
                    <div className="text-xs text-gray-400 uppercase tracking-wide">
                      {interval}min Timeframe
                    </div>
                  </div>
                  <div className="h-64 rounded-lg overflow-hidden">
                    <TradingViewAdvancedChart symbol={symbol} interval={interval} />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </Layout>
    </>
  )
}


