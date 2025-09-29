import { useState, useEffect } from 'react'
import Head from 'next/head'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '../components/Layout'

// Pill components
const GreenPill = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-sm shadow-lg shadow-green-500/30 ${className}`}>
    <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
    {children}
  </div>
)

const RedPill = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold text-sm shadow-lg shadow-red-500/30 ${className}`}>
    <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
    {children}
  </div>
)

const BluePill = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold text-sm shadow-lg shadow-blue-500/30 ${className}`}>
    <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
    {children}
  </div>
)

export default function DashboardPage() {
  const [portfolioValue, setPortfolioValue] = useState(10000)
  const [dailyProfit, setDailyProfit] = useState(0)
  const [totalProfit, setTotalProfit] = useState(0)
  const [activeSignals, setActiveSignals] = useState(0)
  const [isLive, setIsLive] = useState(true)

  // Simulate live data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setPortfolioValue(prev => prev + (Math.random() - 0.5) * 100)
      setDailyProfit(prev => prev + (Math.random() - 0.3) * 50)
      setTotalProfit(prev => prev + (Math.random() - 0.2) * 25)
      setActiveSignals(prev => Math.max(0, prev + (Math.random() > 0.7 ? 1 : 0)))
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const signals = [
    { symbol: 'BTCUSDT', type: 'BUY', strength: 85, profit: 1250, time: '2m ago' },
    { symbol: 'ETHUSDT', type: 'SELL', strength: 72, profit: 890, time: '5m ago' },
    { symbol: 'ADAUSDT', type: 'BUY', strength: 91, profit: 2100, time: '8m ago' },
    { symbol: 'SOLUSDT', type: 'AUTO', strength: 78, profit: 1560, time: '12m ago' }
  ]

  return (
    <>
      <Head>
        <title>Dashboard - 3omla</title>
        <meta name="description" content="Your personal crypto trading dashboard with live signals and profit tracking" />
      </Head>

      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-black text-white mb-2">DASHBOARD</h1>
                  <p className="text-slate-300">Welcome back! Here's your trading overview</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                  <span className="text-slate-300 text-sm">{isLive ? 'LIVE' : 'OFFLINE'}</span>
                </div>
              </div>
            </motion.div>

            {/* Stats Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
            >
              <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl p-6 border border-slate-700">
                <div className="text-2xl font-bold text-white mb-2">
                  ${portfolioValue.toLocaleString()}
                </div>
                <div className="text-slate-400 text-sm">Portfolio Value</div>
                <div className="text-green-400 text-xs mt-1">+2.5% today</div>
              </div>

              <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl p-6 border border-slate-700">
                <div className="text-2xl font-bold text-green-400 mb-2">
                  +${dailyProfit.toLocaleString()}
                </div>
                <div className="text-slate-400 text-sm">Daily Profit</div>
                <div className="text-green-400 text-xs mt-1">+15.2% vs yesterday</div>
              </div>

              <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl p-6 border border-slate-700">
                <div className="text-2xl font-bold text-blue-400 mb-2">
                  +${totalProfit.toLocaleString()}
                </div>
                <div className="text-slate-400 text-sm">Total Profit</div>
                <div className="text-blue-400 text-xs mt-1">+8.7% this week</div>
              </div>

              <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl p-6 border border-slate-700">
                <div className="text-2xl font-bold text-amber-400 mb-2">
                  {activeSignals}
                </div>
                <div className="text-slate-400 text-sm">Active Signals</div>
                <div className="text-amber-400 text-xs mt-1">3 new in last hour</div>
              </div>
            </motion.div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Live Signals */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="lg:col-span-2"
              >
                <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl p-6 border border-slate-700">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Live Trading Signals</h2>
                    <div className="flex space-x-2">
                      <GreenPill>BUY</GreenPill>
                      <RedPill>SELL</RedPill>
                      <BluePill>AUTO</BluePill>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {signals.map((signal, index) => (
                      <motion.div
                        key={signal.symbol}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        className="bg-slate-700/50 rounded-xl p-4 border border-slate-600 hover:border-green-500/50 transition-all duration-300"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="text-2xl font-bold text-white">{signal.symbol}</div>
                            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                              signal.type === 'BUY' ? 'bg-green-500/20 text-green-400' :
                              signal.type === 'SELL' ? 'bg-red-500/20 text-red-400' :
                              'bg-blue-500/20 text-blue-400'
                            }`}>
                              {signal.type}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-400">+${signal.profit}</div>
                            <div className="text-xs text-slate-400">{signal.time}</div>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="text-sm text-slate-300">Strength: {signal.strength}%</div>
                          <div className="w-24 bg-slate-600 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${signal.strength}%` }}
                            ></div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="space-y-6"
              >
                {/* Profit Calculator */}
                <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl p-6 border border-slate-700">
                  <h3 className="text-xl font-bold text-white mb-4">Quick Calculator</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-slate-300 mb-2">Investment Amount</label>
                      <input
                        type="number"
                        placeholder="$1,000"
                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-300 mb-2">Expected Return</label>
                      <select className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500">
                        <option>Conservative (5-10%)</option>
                        <option>Moderate (10-20%)</option>
                        <option>Aggressive (20-50%)</option>
                      </select>
                    </div>
                    <button className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-green-500/30 transition-all duration-300">
                      Calculate Profit
                    </button>
                  </div>
                </div>

                {/* Market Status */}
                <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl p-6 border border-slate-700">
                  <h3 className="text-xl font-bold text-white mb-4">Market Status</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">BTC/USDT</span>
                      <span className="text-green-400 font-bold">+2.4%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">ETH/USDT</span>
                      <span className="text-red-400 font-bold">-1.2%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">ADA/USDT</span>
                      <span className="text-green-400 font-bold">+5.7%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">SOL/USDT</span>
                      <span className="text-green-400 font-bold">+3.1%</span>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl p-6 border border-slate-700">
                  <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    <div className="text-sm text-slate-300">
                      <div className="text-green-400 font-semibold">Signal Executed</div>
                      <div>BTCUSDT BUY at $42,350</div>
                      <div className="text-xs text-slate-400">2 minutes ago</div>
                    </div>
                    <div className="text-sm text-slate-300">
                      <div className="text-blue-400 font-semibold">Auto Trade</div>
                      <div>ETHUSDT position closed</div>
                      <div className="text-xs text-slate-400">15 minutes ago</div>
                    </div>
                    <div className="text-sm text-slate-300">
                      <div className="text-amber-400 font-semibold">Alert</div>
                      <div>High volatility detected</div>
                      <div className="text-xs text-slate-400">1 hour ago</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  )
}
