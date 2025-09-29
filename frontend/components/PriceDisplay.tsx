import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface PriceDisplayProps {
  symbol: string
  price: number
  change24h?: number
  volume24h?: number
  className?: string
}

const PriceDisplay = ({ symbol, price, change24h = 0, volume24h = 0, className = '' }: PriceDisplayProps) => {
  const [displayPrice, setDisplayPrice] = useState(price)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (price !== displayPrice) {
      setIsUpdating(true)
      setDisplayPrice(price)
      setTimeout(() => setIsUpdating(false), 500)
    }
  }, [price, displayPrice])

  const formatPrice = (value: number) => {
    if (value >= 1000) {
      return value.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })
    } else if (value >= 1) {
      return value.toFixed(4)
    } else if (value >= 0.01) {
      return value.toFixed(6)
    } else {
      return value.toFixed(8)
    }
  }

  const formatVolume = (value: number) => {
    if (value >= 1e9) {
      return `${(value / 1e9).toFixed(1)}B`
    } else if (value >= 1e6) {
      return `${(value / 1e6).toFixed(1)}M`
    } else if (value >= 1e3) {
      return `${(value / 1e3).toFixed(1)}K`
    } else {
      return value.toFixed(0)
    }
  }

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-400'
    if (change < 0) return 'text-red-400'
    return 'text-slate-400'
  }

  const getChangeIcon = (change: number) => {
    if (change > 0) return '↗️'
    if (change < 0) return '↘️'
    return '➡️'
  }

  return (
    <motion.div
      className={`bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-xl border border-slate-700 hover:border-slate-600 transition-all ${className}`}
      whileHover={{ scale: 1.02 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-white text-lg">{symbol}</h3>
        <motion.div
          className={`text-sm ${getChangeColor(change24h)} flex items-center space-x-1`}
          animate={{ scale: isUpdating ? 1.1 : 1 }}
          transition={{ duration: 0.2 }}
        >
          <span>{getChangeIcon(change24h)}</span>
          <span>{change24h > 0 ? '+' : ''}{change24h.toFixed(2)}%</span>
        </motion.div>
      </div>
      
      <div className="space-y-2">
        <motion.div
          className="text-2xl font-bold text-white"
          animate={{ scale: isUpdating ? 1.05 : 1 }}
          transition={{ duration: 0.2 }}
        >
          ${formatPrice(displayPrice)}
        </motion.div>
        
        {volume24h > 0 && (
          <div className="text-sm text-slate-400">
            Vol: ${formatVolume(volume24h)}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// Multi-Exchange Price Comparison Component
export const MultiExchangePriceComparison = () => {
  const [prices, setPrices] = useState<Record<string, Record<string, number>>>({})
  const [loading, setLoading] = useState(true)

  const exchanges = ['binance', 'kucoin', 'bybit', 'coinbase', 'kraken', 'okx', 'gateio']
  const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'ADAUSDT', 'DOGEUSDT']

  useEffect(() => {
    // Simulate fetching prices from multiple exchanges
    const fetchPrices = () => {
      const newPrices: Record<string, Record<string, number>> = {}
      
      symbols.forEach(symbol => {
        newPrices[symbol] = {}
        exchanges.forEach(exchange => {
          // Simulate different prices across exchanges
          const basePrice = Math.random() * 100000 + 1000
          const variation = (Math.random() - 0.5) * 0.02 // ±1% variation
          newPrices[symbol][exchange] = basePrice * (1 + variation)
        })
      })
      
      setPrices(newPrices)
      setLoading(false)
    }

    fetchPrices()
    const interval = setInterval(fetchPrices, 5000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
        <p className="text-slate-400">Loading prices from exchanges...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">💰 Multi-Exchange Prices</h2>
        <p className="text-slate-300">Compare prices across 7 major exchanges</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {symbols.map(symbol => (
          <motion.div
            key={symbol}
            className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-xl font-bold text-white mb-4 text-center">{symbol}</h3>
            
            <div className="space-y-3">
              {exchanges.map(exchange => {
                const price = prices[symbol]?.[exchange] || 0
                const avgPrice = Object.values(prices[symbol] || {}).reduce((a, b) => a + b, 0) / Object.values(prices[symbol] || {}).length
                const deviation = ((price - avgPrice) / avgPrice) * 100
                
                return (
                  <div key={exchange} className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm capitalize">{exchange}</span>
                    <div className="text-right">
                      <div className="text-white font-bold">
                        ${price >= 1000 ? price.toFixed(2) : price.toFixed(6)}
                      </div>
                      <div className={`text-xs ${deviation > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {deviation > 0 ? '+' : ''}{deviation.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default PriceDisplay
