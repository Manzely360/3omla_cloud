import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import {
  HomeIcon,
  ChartBarIcon,
  BoltIcon,
  CogIcon,
  DocumentTextIcon,
  PlayIcon,
  EyeIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { useI18n } from '../../lib/i18n'

const nav = [
  { key: 'nav.dashboard', fallback: 'Dashboard', href: '/', icon: HomeIcon },
  { key: 'nav.trading', fallback: 'Trading', href: '/trading', icon: CurrencyDollarIcon },
  { key: 'nav.analytics', fallback: 'Analytics', href: '/analytics', icon: ChartBarIcon },
  { key: 'nav.signals', fallback: 'Signals', href: '/signals', icon: BoltIcon },
  { key: 'nav.leadlag', fallback: 'Lead-Lag', href: '/lead-lag', icon: ArrowTrendingUpIcon },
  { key: 'nav.correlations', fallback: 'Correlations', href: '/correlations', icon: ChartBarIcon },
  { key: 'nav.charts', fallback: 'Charts', href: '/charts', icon: ChartBarIcon },
  { key: 'nav.orderbook', fallback: 'Order Book', href: '/orderbook', icon: ChartBarIcon },
  { key: 'nav.backtesting', fallback: 'Backtesting', href: '/backtesting', icon: PlayIcon },
  { key: 'nav.alerts', fallback: 'Alerts', href: '/alerts', icon: EyeIcon },
  { key: 'nav.market', fallback: 'Market Data', href: '/market', icon: DocumentTextIcon },
  { key: 'nav.settings', fallback: 'Settings', href: '/settings', icon: CogIcon }
]

export default function Sidebar() {
  const { t } = useI18n()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3 }}
      className={clsx(
        'bg-gray-800 border-r border-gray-700 transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center space-x-2"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <BoltIcon className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">Coin Matcher</span>
            </motion.div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <div className="w-4 h-4 flex flex-col justify-center space-y-1">
              <div className="w-full h-0.5 bg-gray-400"></div>
              <div className="w-full h-0.5 bg-gray-400"></div>
              <div className="w-full h-0.5 bg-gray-400"></div>
            </div>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {nav.map((item, index) => {
            const isActive = router.pathname === item.href
            return (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  href={item.href}
                  className={clsx(
                    'flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors group',
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <span className="font-medium">{t(item.key, item.fallback)}</span>
                  )}
                </Link>
              </motion.div>
            )
          })}
        </nav>

        {/* Status Indicator */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            {!isCollapsed && (
              <span className="text-sm text-gray-400">Live Data</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
