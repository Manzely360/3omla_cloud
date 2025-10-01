import { useState } from 'react'
import Link from 'next/link'
import Logo3omla from '../Logo3omla'
import { motion, AnimatePresence } from 'framer-motion'
import { useI18n } from '../../lib/i18n'

interface SidebarProps {
  onToggle?: (open: boolean) => void
}

const Sidebar = ({ onToggle }: SidebarProps) => {
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState('trading')
  const [isOpen, setIsOpen] = useState(false)

  const toggleSidebar = () => {
    const newState = !isOpen
    setIsOpen(newState)
    onToggle?.(newState)
  }

  const sidebarSections = {
    trading: {
      title: t('sidebar.trading'),
      icon: '📈',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: '🏠' },
        { name: 'Trading Panel', href: '/trading-panel', icon: '💹' },
        { name: 'Predictions', href: '/predictions', icon: '🔮' },
        { name: 'Demo Trading', href: '/demo-trading', icon: '💰' },
        { name: 'Trading History', href: '/trading-history', icon: '📊' }
      ]
    },
    analysis: {
      title: t('sidebar.analytics'),
      icon: '🔍',
      items: [
        { name: 'Correlation Matrix', href: '/correlations', icon: '🔗' },
        { name: 'Lead-Lag Analysis', href: '/lead-lag', icon: '⚡' },
        { name: 'Charts', href: '/charts', icon: '📊' },
        { name: 'Market Analysis', href: '/market-analysis', icon: '📈' }
      ]
    },
    signals: {
      title: t('sidebar.signals'),
      icon: '⚡',
      items: [
        { name: 'Active Signals', href: '/signals', icon: '🔔' },
        { name: 'Alerts', href: '/alerts', icon: '🚨' },
        { name: 'Strategies', href: '/strategies', icon: '🎯' },
        { name: 'Backtesting', href: '/backtesting', icon: '🔄' }
      ]
    },
    account: {
      title: t('sidebar.account'),
      icon: '👤',
      items: [
        { name: 'Profile', href: '/profile', icon: '👤' },
        { name: 'Settings', href: '/settings', icon: '⚙️' },
        { name: 'Rewards', href: '/rewards', icon: '🎁' },
        { name: 'Help', href: '/help', icon: '❓' },
        { name: 'Logout', href: '/logout', icon: '🚪' }
      ]
    }
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
      >
        {isOpen ? '✕' : '☰'}
      </button>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ duration: 0.3 }}
            className="fixed left-0 top-0 h-full w-80 bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 z-40 overflow-y-auto"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-700">
              <Logo3omla variant="full" size="md" className="justify-center" />
              <p className="text-sm text-slate-400 text-center mt-1">
                Trading Intelligence Platform
              </p>
            </div>

            {/* Navigation Tabs */}
            <div className="p-4">
              <div className="grid grid-cols-2 gap-2 mb-6">
                {Object.entries(sidebarSections).map(([key, section]) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`p-3 rounded-lg text-sm font-medium transition-all ${
                      activeTab === key
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <span className="text-lg">{section.icon}</span>
                      <span className="hidden sm:block">{section.title}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Active Section Content */}
              <div className="space-y-2">
                {sidebarSections[activeTab as keyof typeof sidebarSections]?.items.map((item, index) => (
                  <Link
                    key={index}
                    href={item.href}
                    className="flex items-center space-x-3 p-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-sm">{item.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
            className="fixed inset-0 bg-black/50 z-30"
          />
        )}
      </AnimatePresence>
    </>
  )
}

export default Sidebar
