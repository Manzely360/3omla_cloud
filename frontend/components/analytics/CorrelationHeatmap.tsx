import { useMemo } from 'react'
import { motion } from 'framer-motion'

interface CorrelationHeatmapProps {
  data?: any
  isLoading: boolean
  symbols: string[]
}

export default function CorrelationHeatmap({ data, isLoading, symbols }: CorrelationHeatmapProps) {
  const heatmapData = useMemo(() => {
    if (!data?.correlation_matrix) return []
    
    const matrix = data.correlation_matrix
    const result = []
    
    for (let i = 0; i < symbols.length; i++) {
      for (let j = 0; j < symbols.length; j++) {
        const value = matrix[symbols[i]]?.[symbols[j]] || 0
        result.push({
          x: j,
          y: i,
          value: value,
          symbol1: symbols[i],
          symbol2: symbols[j]
        })
      }
    }
    
    return result
  }, [data, symbols])

  const getColorIntensity = (value: number) => {
    const absValue = Math.abs(value)
    if (absValue < 0.3) return 'bg-gradient-to-br from-gray-800 to-gray-700'
    if (absValue < 0.5) return 'bg-gradient-to-br from-blue-600 to-blue-500'
    if (absValue < 0.7) return 'bg-gradient-to-br from-yellow-600 to-yellow-500'
    if (absValue < 0.9) return 'bg-gradient-to-br from-orange-600 to-orange-500'
    return 'bg-gradient-to-br from-red-600 to-red-500 neon-glow'
  }

  const getTextColor = (value: number) => {
    const absValue = Math.abs(value)
    return absValue > 0.5 ? 'text-white' : 'text-gray-300'
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-700 rounded animate-pulse"></div>
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 25 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-700 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">Correlation Strength</span>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-700 rounded"></div>
          <span className="text-gray-400">Low</span>
          <div className="w-4 h-4 bg-yellow-600 rounded"></div>
          <span className="text-gray-400">Medium</span>
          <div className="w-4 h-4 bg-red-600 rounded"></div>
          <span className="text-gray-400">High</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="grid grid-cols-6 gap-1">
        {/* Header row */}
        <div></div>
        {symbols.map((symbol) => (
          <div key={symbol} className="text-xs text-gray-400 text-center p-2">
            {symbol.replace('USDT', '')}
          </div>
        ))}
        
        {/* Data rows */}
        {symbols.map((symbol, rowIndex) => (
          <div key={symbol} className="contents">
            {/* Row label */}
            <div className="text-xs text-gray-400 p-2 flex items-center">
              {symbol.replace('USDT', '')}
            </div>
            
            {/* Correlation values */}
            {symbols.map((_, colIndex) => {
              const cellData = heatmapData.find(
                d => d.x === colIndex && d.y === rowIndex
              )
              const value = cellData?.value || 0
              
              return (
                <motion.div
                  key={`${rowIndex}-${colIndex}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: (rowIndex + colIndex) * 0.05 }}
                  className={`
                    ${getColorIntensity(value)} 
                    ${getTextColor(value)}
                    correlation-cell text-xs p-3 flex items-center justify-center
                    hover:scale-110 transition-all duration-300 cursor-pointer font-semibold
                    ${rowIndex === colIndex ? 'ring-2 ring-blue-400 ring-opacity-60' : ''}
                    backdrop-blur-sm
                  `}
                  title={`${symbols[rowIndex]} vs ${symbols[colIndex]}: ${value.toFixed(3)}`}
                >
                  {rowIndex === colIndex ? '1.00' : value.toFixed(2)}
                </motion.div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      {data?.correlation_pairs && data.correlation_pairs.length > 0 && (
        <div className="mt-4 p-4 bg-gray-700 rounded-lg">
          <h4 className="text-sm font-medium text-gray-200 mb-2">High Correlations</h4>
          <div className="space-y-1">
            {data.correlation_pairs.slice(0, 3).map((pair: any, index: number) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <span className="text-gray-300">
                  {pair.symbol1.replace('USDT', '')} ↔ {pair.symbol2.replace('USDT', '')}
                </span>
                <span className={`font-medium ${
                  pair.type === 'positive' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {pair.correlation.toFixed(3)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
