import Head from 'next/head'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from 'react-query'
import Layout from '../components/Layout'

interface UltraPrice {
  symbol: string
  ultra_price: number
  simple_average: number
  median_price: number
  min_price: number
  max_price: number
  spread_pct: number
  confidence_score: number
  momentum_score: number
  volatility_score: number
  exchange_count: number
  exchanges: Array<{
    name: string
    price: number
    volume_24h: number
    spread_pct: number
  }>
}

interface Movement {
  symbol: string
  momentum_score: number
  volatility_score: number
  price: number
  exchange_count: number
}

interface ArbitrageOpp {
  symbol: string
  spread_pct: number
  profit_potential: number
  buy_exchange: string
  buy_price: number
  sell_exchange: string
  sell_price: number
}

export default function UltraOraclePage() {
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT')

  // Ultra price data
  const { data: ultraPrice, isLoading: priceLoading } = useQuery<UltraPrice>(
    ['ultra-price', selectedSymbol],
    () => fetch(`/api/v1/market/ultra/price/${selectedSymbol}`).then(r => r.json()),
    { refetchInterval: 1000, enabled: !!selectedSymbol }
  )

  // Price movements
  const { data: movements } = useQuery<{movements: Movement[]}>(
    ['ultra-movements'],
    () => fetch('/api/v1/market/ultra/movements?threshold_pct=0.05').then(r => r.json()),
    { refetchInterval: 2000 }
  )

  // Arbitrage opportunities
  const { data: arbitrage } = useQuery<{opportunities: ArbitrageOpp[]}>(
    ['ultra-arbitrage'],
    () => fetch('/api/v1/market/ultra/arbitrage?min_spread_pct=0.03').then(r => r.json()),
    { refetchInterval: 3000 }
  )

  // Available symbols
  const { data: symbolsData } = useQuery<{symbols: string[]}>(
    ['ultra-symbols'],
    () => fetch('/api/v1/market/ultra/symbols').then(r => r.json()),
    { refetchInterval: 30000 }
  )

  const getMomentumColor = (score: number) => {
    if (score > 0.5) return 'success-gradient-text'
    if (score < -0.5) return 'text-red-400'
    return 'text-gray-300'
  }

  const getConfidenceColor = (score: number) => {
    if (score > 80) return 'text-green-400'
    if (score > 60) return 'text-yellow-400'
    return 'text-orange-400'
  }

  return (
    <>
      <Head><title>Ultra Price Oracle - 10x Better Than Binance</title></Head>
      <Layout>
        <div className="space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-5xl font-bold gradient-text mb-4">Ultra Price Oracle</h1>
            <p className="text-xl text-gray-300 mb-6">10x Better Than Binance Oracle • Real-time Multi-Exchange Aggregation</p>
            
            {/* Symbol Selector */}
            <div className="flex justify-center">
              <select 
                className="ultra-input w-64 text-center text-lg font-semibold"
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
              >
                {symbolsData?.symbols?.map(symbol => (
                  <option key={symbol} value={symbol} className="bg-gray-800">{symbol}</option>
                )) || ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'].map(symbol => (
                  <option key={symbol} value={symbol} className="bg-gray-800">{symbol}</option>
                ))}
              </select>
            </div>
          </motion.div>

          {/* Ultra Price Display */}
          {ultraPrice && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="glass-card p-8 neon-glow"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Price */}
                <div className="lg:col-span-1 text-center">
                  <div className="text-sm uppercase tracking-wide text-gray-400 mb-2">Ultra Price</div>
                  <div className="text-6xl font-bold gradient-text mb-4">
                    ${ultraPrice.ultra_price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 8})}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-400">Confidence</div>
                      <div className={`font-bold ${getConfidenceColor(ultraPrice.confidence_score)}`}>
                        {ultraPrice.confidence_score.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400">Exchanges</div>
                      <div className="text-blue-400 font-bold">{ultraPrice.exchange_count}</div>
                    </div>
                  </div>
                </div>

                {/* Price Metrics */}
                <div className="lg:col-span-1 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 rounded-xl bg-white/5">
                      <div className="text-xs text-gray-400 mb-1">Min Price</div>
                      <div className="text-green-400 font-bold">${ultraPrice.min_price.toFixed(8)}</div>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-white/5">
                      <div className="text-xs text-gray-400 mb-1">Max Price</div>
                      <div className="text-red-400 font-bold">${ultraPrice.max_price.toFixed(8)}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 rounded-xl bg-white/5">
                      <div className="text-xs text-gray-400 mb-1">Spread</div>
                      <div className="text-yellow-400 font-bold">{ultraPrice.spread_pct.toFixed(3)}%</div>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-white/5">
                      <div className="text-xs text-gray-400 mb-1">Median</div>
                      <div className="text-blue-400 font-bold">${ultraPrice.median_price.toFixed(8)}</div>
                    </div>
                  </div>
                </div>

                {/* Momentum & Volatility */}
                <div className="lg:col-span-1 space-y-4">
                  <div className="text-center p-6 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-xs text-gray-400 mb-2">Momentum Score</div>
                    <div className={`text-3xl font-bold ${getMomentumColor(ultraPrice.momentum_score)}`}>
                      {ultraPrice.momentum_score > 0 ? '+' : ''}{ultraPrice.momentum_score.toFixed(2)}%
                    </div>
                  </div>
                  <div className="text-center p-6 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-xs text-gray-400 mb-2">Volatility</div>
                    <div className="text-purple-400 text-2xl font-bold">
                      {ultraPrice.volatility_score.toFixed(2)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Exchange Breakdown */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4 gradient-text">Exchange Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {ultraPrice.exchanges.map((exchange, i) => (
                    <motion.div
                      key={exchange.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-blue-400/50 transition-colors"
                    >
                      <div className="text-sm font-semibold text-white mb-2 uppercase tracking-wide">
                        {exchange.name}
                      </div>
                      <div className="text-lg font-bold text-blue-400 mb-1">
                        ${exchange.price.toFixed(8)}
                      </div>
                      <div className="text-xs text-gray-400">
                        Vol: ${(exchange.volume_24h / 1000000).toFixed(1)}M
                      </div>
                      <div className="text-xs text-gray-400">
                        Spread: {exchange.spread_pct.toFixed(3)}%
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Live Movements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="glass-card p-6"
          >
            <h2 className="text-2xl font-bold gradient-text mb-6">🔥 Live Price Movements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {movements?.movements?.slice(0, 9).map((movement, i) => (
                <motion.div
                  key={movement.symbol}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-blue-400/50 transition-all cursor-pointer"
                  onClick={() => setSelectedSymbol(movement.symbol)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-white">{movement.symbol}</span>
                    <span className="text-xs text-gray-400">{movement.exchange_count} exchanges</span>
                  </div>
                  <div className={`text-xl font-bold ${getMomentumColor(movement.momentum_score)}`}>
                    {movement.momentum_score > 0 ? '+' : ''}{movement.momentum_score.toFixed(2)}%
                  </div>
                  <div className="text-sm text-gray-400">
                    ${movement.price.toLocaleString()} • Vol: {movement.volatility_score.toFixed(1)}%
                  </div>
                </motion.div>
              )) || (
                <div className="col-span-3 text-center py-8">
                  <div className="ultra-spinner mx-auto mb-4"></div>
                  <div className="text-gray-400">Collecting real-time movements...</div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Arbitrage Opportunities */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="glass-card p-6"
          >
            <h2 className="text-2xl font-bold gradient-text mb-6">💰 Arbitrage Opportunities</h2>
            <div className="space-y-4">
              {arbitrage?.opportunities?.slice(0, 10).map((opp, i) => (
                <motion.div
                  key={`${opp.symbol}-${i}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-green-400/50 transition-all"
                >
                  <div className="flex items-center gap-6">
                    <div>
                      <div className="font-semibold text-white text-lg">{opp.symbol}</div>
                      <div className="text-sm text-gray-400">
                        Buy: {opp.buy_exchange} • Sell: {opp.sell_exchange}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-400">Spread</div>
                      <div className="text-yellow-400 font-bold">{opp.spread_pct.toFixed(3)}%</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Profit Potential</div>
                    <div className="success-gradient-text text-xl font-bold">
                      +{opp.profit_potential.toFixed(2)}%
                    </div>
                  </div>
                </motion.div>
              )) || (
                <div className="text-center py-8">
                  <div className="ultra-spinner mx-auto mb-4"></div>
                  <div className="text-gray-400">Scanning for arbitrage opportunities...</div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </Layout>
    </>
  )
}
