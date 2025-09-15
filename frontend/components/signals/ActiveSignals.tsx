import { motion } from 'framer-motion'
import { 
  BoltIcon, 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface ActiveSignalsProps {
  signals?: any[]
  isLoading: boolean
  limit?: number
}

export default function ActiveSignals({ signals, isLoading, limit = 10 }: ActiveSignalsProps) {
  const getSignalIcon = (type: string) => {
    switch (type) {
      case 'lead_lag':
        return ArrowTrendingUpIcon
      case 'opposite_move':
        return ArrowTrendingDownIcon
      case 'breakout':
        return BoltIcon
      default:
        return BoltIcon
    }
  }

  const getSignalColor = (type: string, direction: string) => {
    if (direction === 'long') {
      return 'text-green-400 bg-green-400/20 border-green-400/30'
    } else if (direction === 'short') {
      return 'text-red-400 bg-red-400/20 border-red-400/30'
    }
    return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30'
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.8) return 'text-green-400'
    if (confidence > 0.6) return 'text-yellow-400'
    return 'text-red-400'
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString()
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className="h-16 bg-gray-700 rounded animate-pulse"></div>
        ))}
      </div>
    )
  }

  if (!signals || signals.length === 0) {
    return (
      <div className="text-center py-8">
        <BoltIcon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">No active signals</p>
        <p className="text-sm text-gray-500 mt-2">
          Signals will appear here when market conditions are met
        </p>
      </div>
    )
  }

  const displaySignals = signals.slice(0, limit)

  return (
    <div className="space-y-3">
      {displaySignals.map((signal, index) => {
        const Icon = getSignalIcon(signal.signal_type)
        const colorClass = getSignalColor(signal.signal_type, signal.direction)
        
        return (
          <motion.div
            key={signal.signal_id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`
              p-4 rounded-lg border ${colorClass}
              hover:scale-105 transition-transform cursor-pointer
            `}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-lg bg-gray-700/50">
                    <Icon className="h-4 w-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-200">
                        {signal.primary_symbol.replace('USDT', '')}
                      </span>
                    {signal.secondary_symbol && (
                      <>
                        <span className="text-gray-400">→</span>
                        <span className="text-sm font-medium text-gray-200">
                          {signal.secondary_symbol.replace('USDT', '')}
                        </span>
                      </>
                    )}
                  </div>
                  
                  <div className="mt-1 flex items-center space-x-4 text-xs">
                    <span className="text-gray-400 capitalize">
                      {signal.signal_type.replace('_', ' ')}
                    </span>
                    <span className="text-gray-400">
                      ${signal.trigger_price.toFixed(4)}
                    </span>
                    <span className="text-gray-400">
                      {formatTime(signal.trigger_time)}
                    </span>
                  </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end space-y-1">
                  <div className={`text-sm font-medium ${getConfidenceColor(signal.confidence)}`}>
                    {(signal.confidence * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-gray-400">
                    {(signal.historical_hit_rate * 100).toFixed(0)}% hit rate
                  </div>
                  <button
                    className="text-xs text-primary-400 hover:text-primary-300"
                    onClick={() => alert(`Why: corr=${signal?.metadata?.correlation?.toFixed?.(2) ?? 'n/a'}; regime=${signal?.regime_context ?? 'n/a'}; ob_guard=${signal?.metadata?.orderbook_guard ?? 'n/a'}`)}
                  >Explain</button>
                </div>
              </div>
            
            {/* Signal Details */}
            <div className="mt-3 pt-3 border-t border-gray-600/50">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-4">
                  <span className="text-gray-400">
                    Strength: <span className="text-gray-200">{(signal.strength * 100).toFixed(0)}%</span>
                  </span>
                  {signal.expected_duration && (
                    <span className="text-gray-400">
                      Duration: <span className="text-gray-200">{signal.expected_duration}m</span>
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  {signal.regime_context && (
                    <span className="px-2 py-1 bg-gray-700 rounded text-gray-300">
                      {signal.regime_context}
                    </span>
                  )}
                  <span className={`
                    px-2 py-1 rounded text-xs font-medium
                    ${signal.direction === 'long' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}
                  `}>
                    {signal.direction.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )
      })}
      
      {signals.length > limit && (
        <div className="text-center pt-4">
          <button className="text-sm text-primary-400 hover:text-primary-300 transition-colors">
            View all {signals.length} signals →
          </button>
        </div>
      )}
    </div>
  )
}
