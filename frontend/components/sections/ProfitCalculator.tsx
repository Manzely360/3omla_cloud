import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CalculatorIcon, TrendingUpIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '../../context/AppContext';
import { marketDataAPI } from '../../lib/marketDataAPI';

const ProfitCalculator = () => {
  const [investment, setInvestment] = useState(1000);
  const [timeframe, setTimeframe] = useState('1h');
  const [selectedPair, setSelectedPair] = useState('BTC/USDT');
  const [estimatedProfit, setEstimatedProfit] = useState(0);
  const [profitPercentage, setProfitPercentage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [marketData, setMarketData] = useState(null);
  const t = useTranslation();

  const timeframes = [
    { value: '1h', label: '1 Hour', multiplier: 1 },
    { value: '4h', label: '4 Hours', multiplier: 4 },
    { value: '1d', label: '1 Day', multiplier: 24 },
    { value: '1w', label: '1 Week', multiplier: 168 },
    { value: '1m', label: '1 Month', multiplier: 720 },
  ];

  const tradingPairs = [
    'BTC/USDT', 'ETH/USDT', 'ADA/USDT', 'SOL/USDT', 
    'MATIC/USDT', 'DOT/USDT', 'LINK/USDT', 'UNI/USDT'
  ];

  useEffect(() => {
    const calculateProfit = async () => {
      if (!investment || !selectedPair) return;

      setIsLoading(true);
      try {
        // Get real market data for the selected pair
        const pairData = await marketDataAPI.getPair(selectedPair);
        setMarketData(pairData);

        // Get arbitrage opportunities
        const arbitrageData = await marketDataAPI.getArbitrage();
        const relevantArbitrage = arbitrageData.find(arb => 
          arb.symbol === selectedPair || 
          arb.symbol.includes(selectedPair.split('/')[0])
        );

        if (relevantArbitrage) {
          // Calculate profit based on arbitrage opportunity
          const profitAmount = (investment * relevantArbitrage.profit_percentage) / 100;
          const timeMultiplier = timeframes.find(tf => tf.value === timeframe)?.multiplier || 1;
          const adjustedProfit = profitAmount * (timeMultiplier / 24); // Adjust for timeframe
          
          setEstimatedProfit(adjustedProfit);
          setProfitPercentage((adjustedProfit / investment) * 100);
        } else {
          // Fallback calculation based on historical volatility
          const volatility = pairData?.volatility || 0.02; // 2% default volatility
          const timeMultiplier = timeframes.find(tf => tf.value === timeframe)?.multiplier || 1;
          const expectedReturn = volatility * Math.sqrt(timeMultiplier / 24) * 0.7; // 70% of volatility
          
          const profitAmount = investment * expectedReturn;
          setEstimatedProfit(profitAmount);
          setProfitPercentage(expectedReturn * 100);
        }
      } catch (error) {
        console.error('Error calculating profit:', error);
        // Fallback to conservative estimate
        const conservativeReturn = 0.001; // 0.1% per hour
        const timeMultiplier = timeframes.find(tf => tf.value === timeframe)?.multiplier || 1;
        const profitAmount = investment * conservativeReturn * (timeMultiplier / 1);
        
        setEstimatedProfit(profitAmount);
        setProfitPercentage(conservativeReturn * (timeMultiplier / 1) * 100);
      } finally {
        setIsLoading(false);
      }
    };

    calculateProfit();
  }, [investment, timeframe, selectedPair]);

  const handleInvestmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setInvestment(value);
  };

  const handleTimeframeChange = (tf: string) => {
    setTimeframe(tf);
  };

  const handlePairChange = (pair: string) => {
    setSelectedPair(pair);
  };

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
      <div className="flex items-center space-x-2 mb-6">
        <CalculatorIcon className="w-6 h-6 text-blue-400" />
        <h3 className="text-2xl font-bold text-white">{t.investmentCalculator}</h3>
      </div>

      <div className="space-y-6">
        {/* Investment Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t.investmentBudget}
          </label>
          <div className="relative">
            <input
              type="number"
              value={investment}
              onChange={handleInvestmentChange}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter amount"
              min="1"
              step="0.01"
            />
            <span className="absolute right-4 top-3 text-gray-400">USD</span>
          </div>
        </div>

        {/* Trading Pair Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Trading Pair
          </label>
          <select
            value={selectedPair}
            onChange={(e) => handlePairChange(e.target.value)}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {tradingPairs.map((pair) => (
              <option key={pair} value={pair} className="bg-gray-800">
                {pair}
              </option>
            ))}
          </select>
        </div>

        {/* Timeframe Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t.timeframe}
          </label>
          <div className="grid grid-cols-5 gap-2">
            {timeframes.map((tf) => (
              <button
                key={tf.value}
                onClick={() => handleTimeframeChange(tf.value)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  timeframe === tf.value
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        {/* Market Data Display */}
        {marketData && (
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Current Price</span>
              <span className="text-white font-semibold">
                ${parseFloat(marketData.price).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">24h Change</span>
              <span className={`text-sm font-medium ${
                marketData.change > 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {marketData.change > 0 ? '+' : ''}{marketData.change.toFixed(2)}%
              </span>
            </div>
          </div>
        )}

        {/* Profit Calculation Result */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg p-6 border border-green-500/30"
        >
          <div className="text-center">
            <p className="text-gray-300 text-sm mb-2">{t.estimatedProfit}</p>
            <motion.p
              key={estimatedProfit}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              className="text-3xl font-bold text-green-400"
            >
              ${isLoading ? '...' : estimatedProfit.toFixed(2)}
            </motion.p>
            <p className="text-gray-400 text-sm mt-1">
              {profitPercentage.toFixed(2)}% {t.return}
            </p>
          </div>
        </motion.div>

        {/* Action Button */}
        <button className="w-full py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2">
          <TrendingUpIcon className="w-5 h-5" />
          <span>{t.startTradingNow}</span>
        </button>

        {/* Disclaimer */}
        <div className="text-xs text-gray-500 text-center">
          * Estimates are based on historical data and market analysis. Past performance does not guarantee future results.
        </div>
      </div>
    </div>
  );
};

export default ProfitCalculator;





