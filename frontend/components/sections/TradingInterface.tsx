import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpIcon, ArrowDownIcon, CalculatorIcon } from '@heroicons/react/24/outline';

const TradingInterface = () => {
  const [investmentAmount, setInvestmentAmount] = useState(1000);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h');
  const [estimatedProfit, setEstimatedProfit] = useState(0);

  const timeframes = ['1h', '4h', '1d', '1w', '1m'];
  
  const signals = [
    { symbol: 'BTC/USDT', action: 'BUY', confidence: 95, price: '$43,250', change: '+2.45%' },
    { symbol: 'ETH/USDT', action: 'BUY', confidence: 87, price: '$2,650', change: '+1.23%' },
    { symbol: 'ADA/USDT', action: 'SELL', confidence: 78, price: '$0.4850', change: '-0.85%' },
    { symbol: 'SOL/USDT', action: 'BUY', confidence: 92, price: '$98.50', change: '+3.12%' },
  ];

  useEffect(() => {
    // Simulate profit calculation
    const baseProfit = investmentAmount * 0.15; // 15% base profit
    const timeframeMultiplier = {
      '1h': 0.1,
      '4h': 0.3,
      '1d': 0.8,
      '1w': 1.5,
      '1m': 2.0
    };
    setEstimatedProfit(baseProfit * timeframeMultiplier[selectedTimeframe as keyof typeof timeframeMultiplier]);
  }, [investmentAmount, selectedTimeframe]);

  return (
    <section className="py-20 bg-gradient-to-b from-black to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Start Trading with <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">AI Signals</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Get real-time buy & sell signals powered by advanced AI algorithms
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Investment Calculator */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10"
          >
            <div className="flex items-center space-x-2 mb-6">
              <CalculatorIcon className="w-6 h-6 text-blue-400" />
              <h3 className="text-2xl font-bold text-white">Investment Calculator</h3>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Investment Budget (USD)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter amount"
                  />
                  <span className="absolute right-4 top-3 text-gray-400">USD</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Timeframe
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {timeframes.map((timeframe) => (
                    <button
                      key={timeframe}
                      onClick={() => setSelectedTimeframe(timeframe)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedTimeframe === timeframe
                          ? 'bg-blue-500 text-white'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      {timeframe}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg p-6 border border-green-500/30">
                <div className="text-center">
                  <p className="text-gray-300 text-sm mb-2">Estimated Profit</p>
                  <p className="text-3xl font-bold text-green-400">
                    ${estimatedProfit.toFixed(2)}
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    {((estimatedProfit / investmentAmount) * 100).toFixed(1)}% return
                  </p>
                </div>
              </div>

              <button className="w-full py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                Start Trading Now
              </button>
            </div>
          </motion.div>

          {/* Live Signals */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-white">Live Trading Signals</h3>
              <div className="flex items-center space-x-2 text-green-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-sm font-medium">LIVE</span>
              </div>
            </div>

            <div className="space-y-4">
              {signals.map((signal, index) => (
                <motion.div
                  key={signal.symbol}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={`p-4 rounded-lg border ${
                    signal.action === 'BUY' 
                      ? 'bg-green-500/10 border-green-500/30' 
                      : 'bg-red-500/10 border-red-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-white text-lg">{signal.symbol}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        signal.action === 'BUY' 
                          ? 'bg-green-500 text-white' 
                          : 'bg-red-500 text-white'
                      }`}>
                        {signal.action}
                      </span>
                    </div>
                    {signal.action === 'BUY' ? (
                      <ArrowUpIcon className="w-5 h-5 text-green-400" />
                    ) : (
                      <ArrowDownIcon className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-white">{signal.price}</p>
                      <p className={`text-sm font-medium ${
                        signal.action === 'BUY' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {signal.change}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Confidence</p>
                      <p className="text-lg font-bold text-white">{signal.confidence}%</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-blue-300 text-sm text-center">
                💡 <strong>Pro Tip:</strong> Our AI analyzes 1000+ market indicators to generate these signals with 95%+ accuracy
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default TradingInterface;



