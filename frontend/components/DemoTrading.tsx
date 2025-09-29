import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Trade {
  id: string
  symbol: string
  type: 'buy' | 'sell'
  amount: number
  price: number
  timestamp: Date
  pnl: number
}

interface Position {
  symbol: string
  amount: number
  avgPrice: number
  currentPrice: number
  pnl: number
  pnlPercentage: number
}

const DemoTrading = () => {
  const [balance, setBalance] = useState(10000) // Starting with $10,000
  const [trades, setTrades] = useState<Trade[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT')
  const [tradeAmount, setTradeAmount] = useState(100)
  const [isTrading, setIsTrading] = useState(false)
  const [showDemoModal, setShowDemoModal] = useState(true)

  const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'ADAUSDT', 'DOGEUSDT', 'AVAXUSDT']
  const prices = {
    'BTCUSDT': 45000 + Math.random() * 10000,
    'ETHUSDT': 3000 + Math.random() * 1000,
    'SOLUSDT': 100 + Math.random() * 50,
    'ADAUSDT': 0.5 + Math.random() * 0.3,
    'DOGEUSDT': 0.08 + Math.random() * 0.02,
    'AVAXUSDT': 25 + Math.random() * 10
  }

  const [currentPrices, setCurrentPrices] = useState(prices)

  useEffect(() => {
    // Update prices every 5 seconds
    const interval = setInterval(() => {
      setCurrentPrices(prev => {
        const newPrices = { ...prev }
        Object.keys(newPrices).forEach(symbol => {
          const change = (Math.random() - 0.5) * 0.02 // ±1% change
          newPrices[symbol] = newPrices[symbol] * (1 + change)
        })
        return newPrices
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Update positions PnL when prices change
    setPositions(prev => prev.map(pos => {
      const currentPrice = currentPrices[pos.symbol] || pos.currentPrice
      const pnl = (currentPrice - pos.avgPrice) * pos.amount
      const pnlPercentage = ((currentPrice - pos.avgPrice) / pos.avgPrice) * 100
      
      return {
        ...pos,
        currentPrice,
        pnl,
        pnlPercentage
      }
    }))
  }, [currentPrices])

  const executeTrade = async (type: 'buy' | 'sell') => {
    if (isTrading) return
    
    setIsTrading(true)
    const currentPrice = currentPrices[selectedSymbol]
    const cost = tradeAmount * currentPrice
    
    if (type === 'buy' && cost > balance) {
      alert('Insufficient balance!')
      setIsTrading(false)
      return
    }
    
    if (type === 'sell') {
      const position = positions.find(p => p.symbol === selectedSymbol)
      if (!position || position.amount < tradeAmount) {
        alert('Insufficient position!')
        setIsTrading(false)
        return
      }
    }

    // Simulate trade execution delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    const trade: Trade = {
      id: Date.now().toString(),
      symbol: selectedSymbol,
      type,
      amount: tradeAmount,
      price: currentPrice,
      timestamp: new Date(),
      pnl: 0
    }

    setTrades(prev => [trade, ...prev])

    if (type === 'buy') {
      setBalance(prev => prev - cost)
      
      // Update or create position
      setPositions(prev => {
        const existing = prev.find(p => p.symbol === selectedSymbol)
        if (existing) {
          const newAmount = existing.amount + tradeAmount
          const newAvgPrice = ((existing.avgPrice * existing.amount) + (currentPrice * tradeAmount)) / newAmount
          return prev.map(p => 
            p.symbol === selectedSymbol 
              ? { ...p, amount: newAmount, avgPrice: newAvgPrice }
              : p
          )
        } else {
          return [...prev, {
            symbol: selectedSymbol,
            amount: tradeAmount,
            avgPrice: currentPrice,
            currentPrice,
            pnl: 0,
            pnlPercentage: 0
          }]
        }
      })
    } else {
      setBalance(prev => prev + cost)
      
      // Update position
      setPositions(prev => prev.map(p => 
        p.symbol === selectedSymbol 
          ? { ...p, amount: p.amount - tradeAmount }
          : p
      ).filter(p => p.amount > 0))
    }

    setIsTrading(false)
  }

  const totalPnL = positions.reduce((sum, pos) => sum + pos.pnl, 0)
  const totalValue = balance + positions.reduce((sum, pos) => sum + (pos.currentPrice * pos.amount), 0)

  if (showDemoModal) {
    return (
      <motion.div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-3xl border border-slate-700 max-w-md mx-4"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <div className="text-center">
            <div className="text-6xl mb-4">💰</div>
            <h2 className="text-3xl font-bold text-white mb-4">Demo Trading</h2>
            <p className="text-slate-300 mb-6">
              Start with $10,000 virtual cash and practice trading with real market data!
            </p>
            <button
              onClick={() => setShowDemoModal(false)}
              className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold rounded-xl hover:from-yellow-400 hover:to-amber-400 transition-all"
            >
              Start Demo Trading
            </button>
          </div>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <motion.div
        className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-bold text-white mb-4">💰 Demo Portfolio</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-slate-400 text-sm">Cash Balance</p>
            <p className="text-3xl font-bold text-white">${balance.toFixed(2)}</p>
          </div>
          <div className="text-center">
            <p className="text-slate-400 text-sm">Total Value</p>
            <p className="text-3xl font-bold text-white">${totalValue.toFixed(2)}</p>
          </div>
          <div className="text-center">
            <p className="text-slate-400 text-sm">Total P&L</p>
            <p className={`text-3xl font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trading Interface */}
        <motion.div
          className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h3 className="text-xl font-bold text-white mb-4">📈 Place Trade</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Symbol</label>
              <select
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
              >
                {symbols.map(symbol => (
                  <option key={symbol} value={symbol}>{symbol}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-slate-400 mb-2">Amount</label>
              <input
                type="number"
                value={tradeAmount}
                onChange={(e) => setTradeAmount(Number(e.target.value))}
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
                min="1"
              />
            </div>
            
            <div className="bg-slate-700/50 p-4 rounded-lg">
              <p className="text-slate-400 text-sm">Current Price</p>
              <p className="text-2xl font-bold text-white">
                ${currentPrices[selectedSymbol]?.toFixed(2) || '0.00'}
              </p>
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={() => executeTrade('buy')}
                disabled={isTrading}
                className="flex-1 py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isTrading ? 'Executing...' : 'BUY'}
              </button>
              <button
                onClick={() => executeTrade('sell')}
                disabled={isTrading}
                className="flex-1 py-3 bg-red-500 text-white font-bold rounded-lg hover:bg-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isTrading ? 'Executing...' : 'SELL'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Positions */}
        <motion.div
          className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h3 className="text-xl font-bold text-white mb-4">📊 Positions</h3>
          
          {positions.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No open positions</p>
          ) : (
            <div className="space-y-3">
              {positions.map((position, index) => (
                <motion.div
                  key={position.symbol}
                  className="bg-slate-700/50 p-4 rounded-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-white">{position.symbol}</p>
                      <p className="text-sm text-slate-400">
                        {position.amount.toFixed(4)} @ ${position.avgPrice.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">
                        ${(position.currentPrice * position.amount).toFixed(2)}
                      </p>
                      <p className={`text-sm ${position.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(2)} ({position.pnlPercentage >= 0 ? '+' : ''}{position.pnlPercentage.toFixed(2)}%)
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent Trades */}
      <motion.div
        className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h3 className="text-xl font-bold text-white mb-4">📋 Recent Trades</h3>
        
        {trades.length === 0 ? (
          <p className="text-slate-400 text-center py-8">No trades yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left text-slate-400 py-2">Symbol</th>
                  <th className="text-left text-slate-400 py-2">Type</th>
                  <th className="text-left text-slate-400 py-2">Amount</th>
                  <th className="text-left text-slate-400 py-2">Price</th>
                  <th className="text-left text-slate-400 py-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {trades.slice(0, 10).map((trade) => (
                  <tr key={trade.id} className="border-b border-slate-700/50">
                    <td className="py-2 text-white">{trade.symbol}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        trade.type === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {trade.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2 text-white">{trade.amount.toFixed(4)}</td>
                    <td className="py-2 text-white">${trade.price.toFixed(2)}</td>
                    <td className="py-2 text-slate-400 text-sm">
                      {trade.timestamp.toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default DemoTrading
