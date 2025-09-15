import { motion } from 'framer-motion'
import { 
	ArrowTrendingUpIcon, 
	ArrowTrendingDownIcon,
	ArrowUpIcon,
	ArrowDownIcon,
	ChartBarIcon
} from '@heroicons/react/24/outline'

interface MarketOverviewProps {
	data?: any
	isLoading: boolean
}

export default function MarketOverview({ data, isLoading }: MarketOverviewProps) {
	const getRegimeColor = (regime: string) => {
		switch (regime?.toLowerCase()) {
			case 'risk_on':
				return 'text-green-400 bg-green-400/20'
			case 'risk_off':
				return 'text-red-400 bg-red-400/20'
			case 'trending':
				return 'text-blue-400 bg-blue-400/20'
			case 'choppy':
				return 'text-yellow-400 bg-yellow-400/20'
			default:
				return 'text-gray-400 bg-gray-400/20'
		}
	}

	const getRegimeIcon = (regime: string) => {
		switch (regime?.toLowerCase()) {
			case 'risk_on':
				return ArrowTrendingUpIcon
			case 'risk_off':
				return ArrowTrendingDownIcon
			case 'trending':
				return ArrowUpIcon
			case 'choppy':
				return ChartBarIcon
			default:
				return ChartBarIcon
		}
	}

	if (isLoading) {
		return (
			<div className="space-y-4">
				<div className="h-8 bg-gray-700 rounded animate-pulse"></div>
				<div className="grid grid-cols-2 gap-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<div key={i} className="h-16 bg-gray-700 rounded animate-pulse"></div>
					))}
				</div>
			</div>
		)
	}

	if (!data) {
		return (
			<div className="text-center py-8">
				<ChartBarIcon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
				<p className="text-gray-400">No market data available</p>
			</div>
		)
	}

	const topGainers = data.top_gainers || []
	const topLosers = data.top_losers || []
	const regime = data.regime || 'unknown'

	return (
		<div className="space-y-4">
			{/* Market Regime */}
			<div className="p-4 bg-gray-700/50 rounded-lg">
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-3">
						{(() => {
							const Icon = getRegimeIcon(regime)
							return <Icon className="h-5 w-5 text-gray-400" />
						})()}
						<div>
							<p className="text-sm text-gray-400">Market Regime</p>
							<p className={`text-lg font-semibold ${getRegimeColor(regime).split(' ')[0]}`}>
								{regime.replace('_', ' ').toUpperCase()}
							</p>
						</div>
					</div>
					
					<div className="text-right">
						<p className="text-sm text-gray-400">Volatility</p>
						<p className="text-lg font-semibold text-gray-200">
							{data.volatility ? (data.volatility * 100).toFixed(1) + '%' : 'N/A'}
						</p>
					</div>
				</div>
			</div>

			{/* Top Movers */}
			<div className="grid grid-cols-1 gap-4">
				{/* Top Gainers */}
				<div>
					<div className="flex items-center space-x-2 mb-2">
						<ArrowUpIcon className="h-4 w-4 text-green-400" />
						<span className="text-sm font-medium text-gray-300">Top Gainers</span>
					</div>
					<div className="space-y-2">
						{topGainers.slice(0, 3).map((asset: any, index: number) => (
							<motion.div
								key={asset.symbol}
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: index * 0.1 }}
								className="flex items-center justify-between p-2 bg-gray-700/30 rounded"
							>
								<div className="flex items-center space-x-2">
									<span className="text-sm font-medium text-gray-200">
										{asset.symbol.replace('USDT', '')}
									</span>
								</div>
								<div className="text-right">
									<div className="text-sm font-medium text-green-400">
										+{asset.change_percent?.toFixed(2) || '0.00'}%
									</div>
									<div className="text-xs text-gray-400">
										${asset.price?.toFixed(4) || '0.0000'}
									</div>
								</div>
							</motion.div>
						))}
					</div>
				</div>

				{/* Top Losers */}
				<div>
					<div className="flex items-center space-x-2 mb-2">
						<ArrowDownIcon className="h-4 w-4 text-red-400" />
						<span className="text-sm font-medium text-gray-300">Top Losers</span>
					</div>
					<div className="space-y-2">
						{topLosers.slice(0, 3).map((asset: any, index: number) => (
							<motion.div
								key={asset.symbol}
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: (index + 3) * 0.1 }}
								className="flex items-center justify-between p-2 bg-gray-700/30 rounded"
							>
								<div className="flex items-center space-x-2">
									<span className="text-sm font-medium text-gray-200">
										{asset.symbol.replace('USDT', '')}
									</span>
								</div>
								<div className="text-right">
									<div className="text-sm font-medium text-red-400">
										{asset.change_percent?.toFixed(2) || '0.00'}%
									</div>
									<div className="text-xs text-gray-400">
										${asset.price?.toFixed(4) || '0.0000'}
									</div>
								</div>
							</motion.div>
						))}
					</div>
				</div>
			</div>

			{/* Market Stats */}
			<div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
				<div className="text-center">
					<div className="text-lg font-bold text-gray-100">
						{data.total_volume ? `$${(data.total_volume / 1e9).toFixed(1)}B` : 'N/A'}
					</div>
					<div className="text-xs text-gray-400">24h Volume</div>
				</div>
				<div className="text-center">
					<div className="text-lg font-bold text-gray-100">
						{data.market_cap ? `$${(data.market_cap / 1e12).toFixed(1)}T` : 'N/A'}
					</div>
					<div className="text-xs text-gray-400">Market Cap</div>
				</div>
			</div>
		</div>
	)
}
