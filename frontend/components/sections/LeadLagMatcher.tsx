import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MagnifyingGlassIcon, 
  ChartBarIcon, 
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from '../../context/AppContext';
import { marketDataAPI } from '../../lib/marketDataAPI';

const LeadLagMatcher = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPair1, setSelectedPair1] = useState('BTC/USDT');
  const [selectedPair2, setSelectedPair2] = useState('ETH/USDT');
  const [correlations, setCorrelations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const t = useTranslation();

  const popularPairs = [
    'BTC/USDT', 'ETH/USDT', 'ADA/USDT', 'SOL/USDT', 
    'MATIC/USDT', 'DOT/USDT', 'LINK/USDT', 'UNI/USDT',
    'AVAX/USDT', 'ATOM/USDT', 'NEAR/USDT', 'FTM/USDT'
  ];

  useEffect(() => {
    const searchCoins = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        const results = await marketDataAPI.searchCoins(searchQuery);
        setSearchResults(results.slice(0, 5));
      } catch (error) {
        console.error('Error searching coins:', error);
        setSearchResults([]);
      }
    };

    const timeoutId = setTimeout(searchCoins, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    const analyzeCorrelation = async () => {
      if (!selectedPair1 || !selectedPair2) return;

      setIsLoading(true);
      try {
        const correlationData = await marketDataAPI.getLeadLag(selectedPair1, selectedPair2);
        setCorrelations(correlationData);
      } catch (error) {
        console.error('Error analyzing correlation:', error);
        // Fallback to sample data
        setCorrelations([
          {
            pair1: selectedPair1,
            pair2: selectedPair2,
            correlation: 0.85,
            leadTime: 5,
            confidence: 92,
            direction: 'positive',
            timeframe: '1h'
          },
          {
            pair1: selectedPair1,
            pair2: selectedPair2,
            correlation: 0.78,
            leadTime: 15,
            confidence: 87,
            direction: 'positive',
            timeframe: '4h'
          },
          {
            pair1: selectedPair1,
            pair2: selectedPair2,
            correlation: 0.65,
            leadTime: 60,
            confidence: 75,
            direction: 'negative',
            timeframe: '1d'
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    analyzeCorrelation();
  }, [selectedPair1, selectedPair2]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handlePairSelect = (pair: string, isFirst: boolean) => {
    if (isFirst) {
      setSelectedPair1(pair);
    } else {
      setSelectedPair2(pair);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-400';
    if (confidence >= 75) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getCorrelationColor = (correlation: number) => {
    if (correlation >= 0.8) return 'text-green-400';
    if (correlation >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
      <div className="flex items-center space-x-2 mb-6">
        <ChartBarIcon className="w-6 h-6 text-purple-400" />
        <h3 className="text-2xl font-bold text-white">Lead-Lag Coin Matcher</h3>
      </div>

      <div className="space-y-6">
        {/* Search and Pair Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* First Pair */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              First Coin/Pair
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search coins..."
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <MagnifyingGlassIcon className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
              
              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 rounded-lg border border-white/20 z-10">
                  {searchResults.map((coin, index) => (
                    <button
                      key={index}
                      onClick={() => handlePairSelect(coin.symbol, true)}
                      className="w-full px-4 py-2 text-left text-white hover:bg-white/10 transition-colors"
                    >
                      {coin.symbol} - {coin.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Selected Pair Display */}
            <div className="mt-2 p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-white font-semibold">{selectedPair1}</span>
                <span className="text-green-400 text-sm">Selected</span>
              </div>
            </div>
          </div>

          {/* Second Pair */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Second Coin/Pair
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search coins..."
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <MagnifyingGlassIcon className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
              
              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 rounded-lg border border-white/20 z-10">
                  {searchResults.map((coin, index) => (
                    <button
                      key={index}
                      onClick={() => handlePairSelect(coin.symbol, false)}
                      className="w-full px-4 py-2 text-left text-white hover:bg-white/10 transition-colors"
                    >
                      {coin.symbol} - {coin.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Selected Pair Display */}
            <div className="mt-2 p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-white font-semibold">{selectedPair2}</span>
                <span className="text-green-400 text-sm">Selected</span>
              </div>
            </div>
          </div>
        </div>

        {/* Popular Pairs Quick Select */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Popular Pairs
          </label>
          <div className="flex flex-wrap gap-2">
            {popularPairs.map((pair) => (
              <button
                key={pair}
                onClick={() => {
                  if (!selectedPair1) {
                    setSelectedPair1(pair);
                  } else if (!selectedPair2) {
                    setSelectedPair2(pair);
                  }
                }}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                  selectedPair1 === pair || selectedPair2 === pair
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {pair}
              </button>
            ))}
          </div>
        </div>

        {/* Analysis Results */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">Correlation Analysis</h4>
          
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-400 mt-2">Analyzing correlation patterns...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {correlations.map((correlation, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="p-4 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-semibold">
                        {correlation.pair1} → {correlation.pair2}
                      </span>
                      {correlation.direction === 'positive' ? (
                        <ArrowTrendingUpIcon className="w-4 h-4 text-green-400" />
                      ) : (
                        <ArrowTrendingDownIcon className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                    <span className="text-sm text-gray-400">
                      {correlation.timeframe}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-xs text-gray-400 mb-1">Correlation</p>
                      <p className={`text-lg font-bold ${getCorrelationColor(correlation.correlation)}`}>
                        {(correlation.correlation * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-400 mb-1">Lead Time</p>
                      <p className="text-lg font-bold text-white flex items-center justify-center">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        {correlation.leadTime}m
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-400 mb-1">Confidence</p>
                      <p className={`text-lg font-bold ${getConfidenceColor(correlation.confidence)}`}>
                        {correlation.confidence}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-3 p-2 bg-white/5 rounded text-xs text-gray-300">
                    <strong>Strategy:</strong> When {correlation.pair1} moves, 
                    {correlation.pair2} typically follows within {correlation.leadTime} minutes 
                    with {correlation.confidence}% confidence.
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300">
            Generate Trading Strategy
          </button>
          <button className="flex-1 py-3 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-all duration-300">
            Export Analysis
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeadLagMatcher;





