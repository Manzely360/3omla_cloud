import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useI18n } from '../lib/i18n'
import { motion } from 'framer-motion'
import { 
  ChartBarIcon, 
  BoltIcon, 
  EyeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import Layout from '../components/Layout'
import CorrelationHeatmap from '../components/analytics/CorrelationHeatmap'
import LeadLagNetwork from '../components/analytics/LeadLagNetwork'
import ActiveSignals from '../components/signals/ActiveSignals'
import MarketOverview from '../components/market/MarketOverview'
import WhaleActivity from '../components/market/WhaleActivity'
import LeadLagList from '../components/analytics/LeadLagList'
import { useQuery } from 'react-query'
import { api } from '../lib/api'
import Sparkline from '../components/charts/Sparkline'

export default function Dashboard() {
  const { t } = useI18n()
  const [selectedTimeframe, setSelectedTimeframe] = useState('15m')
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(['BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'SOLUSDT'])

  // Fetch market overview
  const { data: marketOverview, isLoading: marketLoading } = useQuery(
    ['market-overview', selectedTimeframe],
    () => api.getMarketOverview(),
    { refetchInterval: 30000 }
  )

  // Fetch active signals
  const { data: activeSignals, isLoading: signalsLoading } = useQuery(
    ['active-signals', selectedTimeframe],
    () => api.getActiveSignals({ min_strength: 0.6, min_confidence: 0.7 }),
    { refetchInterval: 10000 }
  )

  // Fetch correlation matrix
  const { data: correlationData, isLoading: correlationLoading } = useQuery(
    ['correlation-matrix', selectedSymbols, selectedTimeframe],
    () => api.getCorrelationMatrix({
      symbols: selectedSymbols,
      interval: selectedTimeframe,
      window_size: 100
    }),
    { refetchInterval: 60000 }
  )

  // Fetch lead-lag relationships
  const { data: leadLagData, isLoading: leadLagLoading } = useQuery(
    ['lead-lag', selectedTimeframe],
    () => api.getLeadLagRelationships({
      min_hit_rate: 0.6,
      min_correlation: 0.3,
      interval: selectedTimeframe,
      limit: 20
    }),
    { refetchInterval: 120000 }
  )

  // Screener
  const { data: screener } = useQuery(['screener', selectedTimeframe], () => fetch(`/api/v1/analytics/screener?interval=${selectedTimeframe}&limit=8`).then(r=>r.json()), { refetchInterval: 60000 })

  // Equity curve mini
  const { data: histSummary } = useQuery(['history-summary'], () => fetch('/api/v1/trading/history/summary').then(r=>r.json()), { refetchInterval: 60000 })

  const timeframes = [
    { value: '5m', label: '5 Minutes' },
    { value: '15m', label: '15 Minutes' },
    { value: '1h', label: '1 Hour' },
    { value: '4h', label: '4 Hours' },
    { value: '1d', label: '1 Day' }
  ]

  const stats = [
    {
      name: 'Active Signals',
      value: activeSignals?.length || 0,
      icon: BoltIcon,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10'
    },
    {
      name: 'Lead-Lag Pairs',
      value: leadLagData?.length || 0,
      icon: ArrowTrendingUpIcon,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10'
    },
    {
      name: 'High Correlation',
      value: correlationData?.high_correlations || 0,
      icon: ChartBarIcon,
      color: 'text-green-400',
      bgColor: 'bg-green-400/10'
    },
    {
      name: 'Market Regime',
      value: marketOverview?.regime || 'Unknown',
      icon: ArrowTrendingUpIcon,
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10'
    }
  ]

  return (
    <>
      <Head>
        <title>Crypto Lead-Lag Pattern Radar</title>
        <meta name="description" content="Real-time cryptocurrency lead-lag relationship detection and trading signals" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Layout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gradient">{t('dashboard.title','Crypto Lead-Lag Pattern Radar')}</h1>
              <p className="mt-2 text-gray-400">{t('dashboard.subtitle','Real-time cryptocurrency relationship detection and trading signals')}</p>
            </div>
            
            <div className="mt-4 sm:mt-0">
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="input w-full sm:w-auto"
              >
                {timeframes.map((tf) => (
                  <option key={tf.value} value={tf.value}>
                    {tf.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card"
              >
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-400">{stat.name}</p>
                    <p className="text-2xl font-bold text-gray-100">{stat.value}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* PnL Mini */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400">Equity (realized PnL)</div>
                <div className="text-2xl font-bold text-gray-100">{Number(histSummary?.total_realized_pnl||0).toFixed(2)}</div>
              </div>
              <div>
                <Sparkline data={histSummary?.equity_curve || []} width={200} height={48} stroke="#7c3aed" />
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Signals */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="card"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-100">{t('section.activeSignals','Active Signals')}</h2>
                <BoltIcon className="h-5 w-5 text-yellow-400" />
              </div>
              <ActiveSignals 
                signals={activeSignals} 
                isLoading={signalsLoading}
                limit={5}
              />
            </motion.div>

            {/* Market Overview */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="card"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-100">{t('section.marketOverview','Market Overview')}</h2>
                <EyeIcon className="h-5 w-5 text-blue-400" />
              </div>
              <MarketOverview 
                data={marketOverview} 
                isLoading={marketLoading}
              />
            </motion.div>
          </div>

          {/* Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Correlation Heatmap */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="card"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-100">{t('section.correlationMatrix','Correlation Matrix')}</h2>
                <ChartBarIcon className="h-5 w-5 text-green-400" />
              </div>
              <CorrelationHeatmap 
                data={correlationData} 
                isLoading={correlationLoading}
                symbols={selectedSymbols}
              />
            </motion.div>

            {/* Lead-Lag Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="card"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-100">Lead-Lag Summary</h2>
                <ArrowTrendingUpIcon className="h-5 w-5 text-purple-400" />
              </div>
              <LeadLagList interval={selectedTimeframe} limit={12} />
            </motion.div>
          </div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="card"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-100 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <a className="btn-primary flex items-center justify-center space-x-2" href="/alerts">
                    <BoltIcon className="h-4 w-4" />
                    <span>Create Alert</span>
                  </a>
                  <a className="btn-secondary flex items-center justify-center space-x-2" href="/backtesting">
                    <ChartBarIcon className="h-4 w-4" />
                    <span>Run Backtest</span>
                  </a>
                  <a className="btn-secondary flex items-center justify-center space-x-2" href="/analytics">
                    <ArrowTrendingUpIcon className="h-4 w-4" />
                    <span>View Analytics</span>
                  </a>
                  <a className="btn-secondary flex items-center justify-center space-x-2" href="/signals">
                    <ClockIcon className="h-4 w-4" />
                    <span>Signal History</span>
                  </a>
                </div>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-100 mb-4">Whales (last 15s)</h2>
                <WhaleActivity defaultMin={150000} />
              </div>
            </div>
          </motion.div>

          {/* Screener */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="card"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold text-gray-100">Screener</h2>
              <span className="text-xs text-gray-400">Interval: {selectedTimeframe}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-800">
                <thead className="bg-gray-800/40">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Symbol</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Dir</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Conf</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">RSI</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Mom</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Whales</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {Array.isArray(screener) && screener.map((s:any)=>(
                    <tr key={s.symbol}>
                      <td className="px-4 py-2 text-sm text-gray-200">{s.symbol || s.pair}</td>
                      <td className="px-4 py-2 text-sm text-gray-200">{s.direction || s.type}</td>
                      <td className="px-4 py-2 text-sm text-gray-200">{s.confidence ? Math.round((s.confidence||0)*100)+'%' : (s.z_score ? ('z='+Number(s.z_score).toFixed(2)) : '-') }</td>
                      <td className="px-4 py-2 text-sm text-gray-200">{s.rsi ? Math.round(s.rsi) : '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-200">{s.momentum ? (s.momentum||0).toFixed(3) : '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-200">{s.whale_bias ? Math.round((s.whale_bias||0)/1000)+'k' : '-'}</td>
                      <td className="px-4 py-2 text-xs">
                        <div className="flex gap-2">
                          {s.symbol && (
                            <>
                              <a className="btn-secondary px-2 py-1" href={`/charts?symbol=${encodeURIComponent(s.symbol)}`}>View</a>
                              <button className="btn-primary px-2 py-1" onClick={()=>{
                                const qty = s.qty_est || 0.01
                                fetch('/api/v1/trading/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ symbol: s.symbol, exchange: 'binance', order_type: 'market', side: s.direction==='long'?'buy':'sell', quantity: qty, mode: 'paper' }) })
                              }}>Trade{ s.qty_est ? ` (${s.qty_est})` : '' }</button>
                            </>
                          )}
                          {s.pair && Array.isArray(s.legs) && (
                            <button className="btn-primary px-2 py-1" onClick={async ()=>{
                              for (const leg of s.legs) {
                                await fetch('/api/v1/trading/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ symbol: leg.symbol, exchange: 'binance', order_type: 'market', side: leg.side, quantity: 0.01, mode: 'paper' }) })
                              }
                            }}>Pair Trade</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!screener && (
                    <tr><td className="px-4 py-2 text-sm text-gray-400" colSpan={7}>Loading...</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </Layout>
    </>
  )
}
