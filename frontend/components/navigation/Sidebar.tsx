import { useEffect, useState } from 'react'
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
  const [isLightMode, setIsLightMode] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const html = document.documentElement
    const detectTheme = () => setIsLightMode(html.classList.contains('theme-light'))
    detectTheme()
    const observer = new MutationObserver(detectTheme)
    observer.observe(html, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

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
        className={`fixed top-4 left-4 z-50 p-2 rounded-lg border transition-colors shadow-lg ${
          isLightMode
            ? 'bg-white/95 border-slate-200 text-slate-700 hover:bg-amber-100'
            : 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
        }`}
        aria-label={isOpen ? 'Close navigation' : 'Open navigation'}
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
            className={`fixed left-0 top-0 z-40 h-full w-80 overflow-y-auto border-r backdrop-blur-xl transition-colors duration-300 ${
              isLightMode
                ? 'bg-white/95 border-slate-200'
                : 'bg-slate-900/95 border-slate-700/50'
            }`}
          >
            {/* Header */}
            <div className={`p-6 border-b transition-colors ${isLightMode ? 'border-slate-200' : 'border-slate-700'}`}>
              <Logo3omla variant="full" size="md" className="justify-center" />
              <p className={`mt-1 text-center text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
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
                        ? isLightMode
                          ? 'bg-gradient-to-r from-sky-400 to-indigo-500 text-white shadow-lg'
                          : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                        : isLightMode
                        ? 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900 hover:border-slate-300'
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
                    className={`flex items-center space-x-3 rounded-lg p-3 transition-colors ${
                      isLightMode
                        ? 'text-slate-600 hover:bg-amber-100/70 hover:text-slate-900'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
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
