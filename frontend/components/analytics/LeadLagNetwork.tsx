import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowTrendingUpIcon, ClockIcon } from '@heroicons/react/24/outline'

interface LeadLagNetworkProps {
  data?: any[]
  isLoading: boolean
}

export default function LeadLagNetwork({ data, isLoading }: LeadLagNetworkProps) {
  const networkData = useMemo(() => {
    if (!data || data.length === 0) return { nodes: [], links: [] }
    
    const nodes = new Set<string>()
    const links: any[] = []
    
    data.forEach((relationship, index) => {
      const { leader_symbol, follower_symbol, lag_minutes, hit_rate, cross_correlation } = relationship
      
      nodes.add(leader_symbol)
      nodes.add(follower_symbol)
      
      links.push({
        id: `link-${index}`,
        source: leader_symbol,
        target: follower_symbol,
        lag_minutes,
        hit_rate,
        correlation: cross_correlation,
        strength: hit_rate * Math.abs(cross_correlation)
      })
    })
    
    return {
      nodes: Array.from(nodes).map(symbol => ({
        id: symbol,
        symbol: symbol.replace('USDT', ''),
        type: 'asset'
      })),
      links
    }
  }, [data])

  const getStrengthColor = (strength: number) => {
    if (strength > 0.7) return 'text-green-400'
    if (strength > 0.5) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getStrengthBg = (strength: number) => {
    if (strength > 0.7) return 'bg-green-400/20 border-green-400/30'
    if (strength > 0.5) return 'bg-yellow-400/20 border-yellow-400/30'
    return 'bg-red-400/20 border-red-400/30'
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-700 rounded animate-pulse"></div>
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-700 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8">
        <ArrowTrendingUpIcon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">No lead-lag relationships found</p>
        <p className="text-sm text-gray-500 mt-2">
          Try adjusting the time frame or correlation thresholds
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Network Legend */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">Lead-Lag Relationships</span>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <span className="text-gray-400">Strong</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <span className="text-gray-400">Medium</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
            <span className="text-gray-400">Weak</span>
          </div>
        </div>
      </div>

      {/* Relationship Cards */}
      <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
        {networkData.links.map((link, index) => (
          <motion.div
            key={link.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`
              p-4 rounded-lg border ${getStrengthBg(link.strength)}
              hover:scale-105 transition-transform cursor-pointer
            `}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-200">
                    {link.source.replace('USDT', '')}
                  </span>
                  <ArrowTrendingUpIcon className="h-4 w-4 text-primary-400" />
                  <span className="text-sm font-medium text-gray-200">
                    {link.target.replace('USDT', '')}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 text-xs">
                <div className="flex items-center space-x-1">
                  <ClockIcon className="h-3 w-3 text-gray-400" />
                  <span className="text-gray-300">{link.lag_minutes}m</span>
                </div>
                <div className={`font-medium ${getStrengthColor(link.strength)}`}>
                  {(link.hit_rate * 100).toFixed(0)}%
                </div>
              </div>
            </div>
            
            <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
              <span>Correlation: {link.correlation.toFixed(3)}</span>
              <span>Strength: {link.strength.toFixed(3)}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-700">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-100">{networkData.nodes.length}</div>
          <div className="text-xs text-gray-400">Assets</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-100">{networkData.links.length}</div>
          <div className="text-xs text-gray-400">Relationships</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-100">
            {data.length > 0 ? (data.reduce((sum, r) => sum + r.hit_rate, 0) / data.length * 100).toFixed(0) : 0}%
          </div>
          <div className="text-xs text-gray-400">Avg Hit Rate</div>
        </div>
      </div>
    </div>
  )
}
