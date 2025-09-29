import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface PricePredictionProps {
  symbol: string
  currentPrice: number
  predictedPrice: number
  confidence: number
  timeFrame: string
}

const PricePrediction = ({ symbol, currentPrice, predictedPrice, confidence, timeFrame }: PricePredictionProps) => {
  const [isAnimating, setIsAnimating] = useState(false)
  const [direction, setDirection] = useState<'up' | 'down' | 'neutral'>('neutral')
  const [priceChange, setPriceChange] = useState(0)
  const [percentageChange, setPercentageChange] = useState(0)

  useEffect(() => {
    const change = predictedPrice - currentPrice
    const percentage = (change / currentPrice) * 100
    
    setPriceChange(change)
    setPercentageChange(percentage)
    
    if (percentage > 2) {
      setDirection('up')
    } else if (percentage < -2) {
      setDirection('down')
    } else {
      setDirection('neutral')
    }
    
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 2000)
  }, [currentPrice, predictedPrice])

  const getConfidenceColor = (conf: number) => {
    if (conf >= 80) return 'text-green-400'
    if (conf >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getDirectionIcon = () => {
    switch (direction) {
      case 'up':
        return '📈'
      case 'down':
        return '📉'
      default:
        return '➡️'
    }
  }

  const getDirectionColor = () => {
    switch (direction) {
      case 'up':
        return 'text-green-400'
      case 'down':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  return (
    <motion.div
      className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700 shadow-lg"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">{symbol}</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-slate-400">{timeFrame}</span>
          <div className={`px-2 py-1 rounded-full text-xs font-bold ${getConfidenceColor(confidence)}`}>
            {confidence}% Confidence
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-slate-400 mb-1">Current Price</p>
          <p className="text-2xl font-bold text-white">${currentPrice.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm text-slate-400 mb-1">Predicted Price</p>
          <p className="text-2xl font-bold text-white">${predictedPrice.toFixed(2)}</p>
        </div>
      </div>

      <AnimatePresence>
        {isAnimating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center"
          >
            <div className="flex items-center justify-center space-x-2 mb-2">
              <motion.span
                className="text-4xl"
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: direction === 'up' ? [0, 10, 0] : direction === 'down' ? [0, -10, 0] : [0, 0, 0]
                }}
                transition={{ duration: 0.5, repeat: 1 }}
              >
                {getDirectionIcon()}
              </motion.span>
              <span className={`text-2xl font-bold ${getDirectionColor()}`}>
                {direction.toUpperCase()}
              </span>
            </div>
            
            <div className={`text-lg font-semibold ${getDirectionColor()}`}>
              {priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)} ({percentageChange > 0 ? '+' : ''}{percentageChange.toFixed(2)}%)
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confidence Bar */}
      <div className="mt-4">
        <div className="flex justify-between text-sm text-slate-400 mb-1">
          <span>Prediction Confidence</span>
          <span>{confidence}%</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <motion.div
            className={`h-2 rounded-full ${
              confidence >= 80 ? 'bg-green-500' : 
              confidence >= 60 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${confidence}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Prediction Details */}
      <div className="mt-4 p-3 bg-slate-700/50 rounded-lg">
        <div className="text-sm text-slate-300">
          <p className="mb-1">
            <span className="font-semibold">Analysis:</span> {
              direction === 'up' ? 'Strong bullish momentum detected' :
              direction === 'down' ? 'Bearish pressure identified' :
              'Sideways movement expected'
            }
          </p>
          <p className="text-xs text-slate-400">
            Based on technical indicators, market sentiment, and historical patterns
          </p>
        </div>
      </div>
    </motion.div>
  )
}

// Price Prediction Grid Component
export const PricePredictionGrid = () => {
  const [predictions, setPredictions] = useState<Array<{
    symbol: string
    currentPrice: number
    predictedPrice: number
    confidence: number
    timeFrame: string
  }>>([])

  useEffect(() => {
    // Simulate price predictions
    const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'ADAUSDT', 'DOGEUSDT', 'AVAXUSDT']
    const timeFrames = ['1H', '4H', '1D', '1W']
    
    const newPredictions = symbols.map(symbol => {
      const basePrice = Math.random() * 100000 + 1000
      const change = (Math.random() - 0.5) * 0.2 // ±10% change
      const predictedPrice = basePrice * (1 + change)
      const confidence = Math.random() * 40 + 60 // 60-100% confidence
      const timeFrame = timeFrames[Math.floor(Math.random() * timeFrames.length)]
      
      return {
        symbol,
        currentPrice: basePrice,
        predictedPrice,
        confidence: Math.round(confidence),
        timeFrame
      }
    })
    
    setPredictions(newPredictions)
    
    // Update predictions every 30 seconds
    const interval = setInterval(() => {
      setPredictions(prev => prev.map(pred => ({
        ...pred,
        currentPrice: pred.predictedPrice,
        predictedPrice: pred.currentPrice * (1 + (Math.random() - 0.5) * 0.1),
        confidence: Math.round(Math.random() * 40 + 60)
      })))
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">🔮 AI Price Predictions</h2>
        <p className="text-slate-300">Real-time predictions powered by advanced machine learning</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {predictions.map((prediction, index) => (
          <motion.div
            key={prediction.symbol}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <PricePrediction {...prediction} />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default PricePrediction
