import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpIcon, ArrowDownIcon, PlayIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '../../context/AppContext';
import { marketDataAPI } from '../../lib/marketDataAPI';

const HeroSection = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [signals, setSignals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const t = useTranslation();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch real market data
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        setIsLoading(true);
        const [signalsData, arbitrageData] = await Promise.all([
          marketDataAPI.getSignals(),
          marketDataAPI.getArbitrage()
        ]);
        
        // Process signals data
        const processedSignals = signalsData.slice(0, 3).map((signal: any) => ({
          symbol: signal.symbol,
          price: `$${parseFloat(signal.price).toLocaleString()}`,
          change: `${signal.change > 0 ? '+' : ''}${signal.change.toFixed(2)}%`,
          type: signal.signal_type || (signal.change > 0 ? 'buy' : 'sell'),
          time: signal.timestamp ? new Date(signal.timestamp).toLocaleTimeString() : 'Just now',
          confidence: signal.confidence || 85
        }));
        
        setSignals(processedSignals);
      } catch (error) {
        console.error('Error fetching market data:', error);
        // Fallback to sample data
        setSignals([
          { symbol: 'BTC/USDT', price: '$43,250.00', change: '+2.45%', type: 'buy', time: '2m ago', confidence: 95 },
          { symbol: 'ETH/USDT', price: '$2,650.00', change: '+1.23%', type: 'buy', time: '5m ago', confidence: 88 },
          { symbol: 'ADA/USDT', price: '$0.4850', change: '-0.85%', type: 'sell', time: '8m ago', confidence: 82 },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMarketData();
    
    // Set up real-time updates
    const ws = marketDataAPI.subscribeToPrices(['BTC/USDT', 'ETH/USDT', 'ADA/USDT'], (data) => {
      if (data.type === 'price_update') {
        setSignals(prev => prev.map(signal => {
          if (signal.symbol === data.symbol) {
            return {
              ...signal,
              price: `$${parseFloat(data.price).toLocaleString()}`,
              change: `${data.change > 0 ? '+' : ''}${data.change.toFixed(2)}%`,
              type: data.change > 0 ? 'buy' : 'sell'
            };
          }
          return signal;
        }));
      }
    });

    return () => {
      if (ws) ws.close();
    };
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      timeZone: 'UTC',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Trial Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-full text-white font-semibold text-lg shadow-lg">
            🎉 48-HOUR FREE TRIAL - NO CREDIT CARD REQUIRED! {t.startFreeTrial}! 🎉
          </div>
        </motion.div>

        {/* Trusted By Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12"
        >
          <p className="text-gray-400 text-lg mb-6">{t.trustedBy}</p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            {['Binance', 'KuCoin', 'Bybit', 'Coinbase', 'Kraken', 'OKX', 'Gate.io'].map((exchange) => (
              <div key={exchange} className="text-gray-500 font-semibold text-lg">
                {exchange}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Main Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-6xl md:text-8xl font-bold mb-6">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              {t.heroTitle}
            </span>
            <br />
            <span className="text-white">{t.heroSubtitle}</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            {t.heroDescription}
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
        >
          <button className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <span className="flex items-center space-x-2">
              <PlayIcon className="w-5 h-5" />
              <span>{t.startFreeTrial}</span>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
          
          <button className="px-8 py-4 border-2 border-white/20 text-white font-semibold rounded-xl hover:bg-white/10 transition-all duration-300">
            {t.viewLiveDemo}
          </button>
        </motion.div>

        {/* Live Signals */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 max-w-4xl mx-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white">{t.liveTradingSignals}</h3>
            <div className="flex items-center space-x-2 text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium">{t.live}</span>
              <span className="text-gray-400 text-sm">{formatTime(currentTime)} UTC</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {signals.map((signal, index) => (
              <motion.div
                key={signal.symbol}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 1 + index * 0.1 }}
                className={`p-4 rounded-lg border ${
                  signal.type === 'buy' 
                    ? 'bg-green-500/10 border-green-500/30' 
                    : 'bg-red-500/10 border-red-500/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-white">{signal.symbol}</span>
                  {signal.type === 'buy' ? (
                    <ArrowUpIcon className="w-5 h-5 text-green-400" />
                  ) : (
                    <ArrowDownIcon className="w-5 h-5 text-red-400" />
                  )}
                </div>
                <div className="text-2xl font-bold text-white mb-1">{signal.price}</div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${
                    signal.type === 'buy' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {signal.change}
                  </span>
                  <span className="text-xs text-gray-400">{signal.time}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
