import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  ArrowTrendingUpIcon, 
  ArrowUpIcon, 
  ArrowDownIcon,
  EyeIcon,
  CogIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { useApp, useTranslation } from '../context/AppContext';
import { marketDataAPI } from '../lib/marketDataAPI';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('trading');
  const [marketData, setMarketData] = useState([]);
  const [signals, setSignals] = useState([]);
  const [arbitrage, setArbitrage] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthenticated } = useApp();
  const t = useTranslation();

  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const [marketDataRes, signalsRes, arbitrageRes] = await Promise.all([
          marketDataAPI.getLatest(),
          marketDataAPI.getSignals(),
          marketDataAPI.getArbitrage()
        ]);
        
        setMarketData(marketDataRes);
        setSignals(signalsRes);
        setArbitrage(arbitrageRes);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();

    // Set up real-time updates
    const ws = marketDataAPI.subscribeToPrices(['BTC/USDT', 'ETH/USDT', 'ADA/USDT', 'SOL/USDT'], (data) => {
      if (data.type === 'price_update') {
        setMarketData(prev => prev.map(item => 
          item.symbol === data.symbol ? { ...item, ...data } : item
        ));
      }
    });

    return () => {
      if (ws) ws.close();
    };
  }, [isAuthenticated]);

  const tabs = [
    { id: 'trading', name: 'Trading', icon: ChartBarIcon },
    { id: 'arbitrage', name: 'AUTO-ARBITRAGE', icon: ArrowTrendingUpIcon },
    { id: 'analytics', name: 'Analytics', icon: EyeIcon },
    { id: 'settings', name: 'Settings', icon: CogIcon },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-white mt-4 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-white">Dashboard</h1>
              <div className="flex items-center space-x-2 text-green-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-sm font-medium">LIVE</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                <BellIcon className="w-5 h-5 text-white" />
              </button>
              <div className="text-white">
                Welcome, {user?.full_name || 'Trader'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Trading Tab */}
        {activeTab === 'trading' && (
          <div className="space-y-8">
            {/* Market Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {marketData.slice(0, 4).map((coin, index) => (
                <motion.div
                  key={coin.symbol}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {coin.symbol.split('/')[0].slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{coin.symbol}</h3>
                        <p className="text-gray-400 text-sm">24h change</p>
                      </div>
                    </div>
                    {coin.change > 0 ? (
                      <ArrowUpIcon className="w-5 h-5 text-green-400" />
                    ) : (
                      <ArrowDownIcon className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                  <div className="text-2xl font-bold text-white mb-2">
                    ${parseFloat(coin.price).toLocaleString()}
                  </div>
                  <div className={`text-sm font-medium ${
                    coin.change > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {coin.change > 0 ? '+' : ''}{coin.change.toFixed(2)}%
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Live Trading Signals */}
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
              <h2 className="text-xl font-bold text-white mb-6">Live Trading Signals</h2>
              <div className="space-y-4">
                {signals.slice(0, 5).map((signal, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        signal.signal_type === 'buy' ? 'bg-green-400' : 'bg-red-400'
                      }`} />
                      <div>
                        <div className="text-white font-semibold">{signal.symbol}</div>
                        <div className="text-gray-400 text-sm">
                          Confidence: {signal.confidence}%
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-semibold">
                        ${parseFloat(signal.price).toLocaleString()}
                      </div>
                      <div className={`text-sm ${
                        signal.change > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {signal.change > 0 ? '+' : ''}{signal.change.toFixed(2)}%
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                      {signal.signal_type === 'buy' ? 'Buy' : 'Sell'}
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Arbitrage Tab */}
        {activeTab === 'arbitrage' && (
          <div className="space-y-8">
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
              <h2 className="text-xl font-bold text-white mb-6">Arbitrage Opportunities</h2>
              <div className="space-y-4">
                {arbitrage.slice(0, 5).map((opp, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                        <CurrencyDollarIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-white font-semibold">{opp.symbol}</div>
                        <div className="text-gray-400 text-sm">
                          {opp.exchange1} → {opp.exchange2}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-semibold">
                        +{opp.profit_percentage.toFixed(2)}%
                      </div>
                      <div className="text-gray-400 text-sm">
                        ${opp.profit_amount.toFixed(2)}
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                      Execute
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
              <h2 className="text-xl font-bold text-white mb-6">Portfolio Analytics</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400 mb-2">+12.5%</div>
                  <div className="text-gray-400">Total Return</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400 mb-2">$2,450</div>
                  <div className="text-gray-400">Total Profit</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400 mb-2">95.2%</div>
                  <div className="text-gray-400">Win Rate</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-8">
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
              <h2 className="text-xl font-bold text-white mb-6">Account Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Notifications
                  </label>
                  <input type="checkbox" className="rounded" defaultChecked />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Risk Level
                  </label>
                  <select className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white">
                    <option>Conservative</option>
                    <option>Moderate</option>
                    <option>Aggressive</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;





