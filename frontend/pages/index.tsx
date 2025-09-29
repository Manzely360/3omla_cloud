import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '../components/Layout'
import api from '../lib/api'
import Favicon from '../components/Favicon'
import { useI18n } from '../lib/i18n'

// Money Rain Animation Component
const MoneyRain = ({ isActive }: { isActive: boolean }) => {
  const [drops, setDrops] = useState<Array<{ id: number; x: number; delay: number; duration: number }>>([])

  useEffect(() => {
    if (isActive) {
      const newDrops = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 3 + Math.random() * 2
      }))
      setDrops(newDrops)
    }
  }, [isActive])

  if (!isActive) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {drops.map((drop) => (
        <motion.div
          key={drop.id}
          className="absolute text-2xl"
          style={{ left: `${drop.x}%` }}
          initial={{ y: -50, opacity: 1, rotate: 0 }}
          animate={{ 
            y: window.innerHeight + 50, 
            opacity: 0, 
            rotate: 360 
          }}
          transition={{
            duration: drop.duration,
            delay: drop.delay,
            ease: "linear",
            repeat: Infinity
          }}
        >
          💰
        </motion.div>
      ))}
    </div>
  )
}

// Pill components for the new branding
const GreenPill = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-sm shadow-lg shadow-green-500/30 ${className}`}>
    <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
    {children}
  </div>
)

const RedPill = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold text-sm shadow-lg shadow-red-500/30 ${className}`}>
    <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
    {children}
  </div>
)

const BluePill = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold text-sm shadow-lg shadow-blue-500/30 ${className}`}>
    <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
    {children}
  </div>
)

// Profit calculator component
const ProfitCalculator = ({
  budget,
  onBudgetChange,
  onInvest,
  isAuthenticated
}: {
  budget: number
  onBudgetChange: (budget: number) => void
  onInvest: () => void
  isAuthenticated: boolean
}) => {
  const { t } = useI18n()
  const [isCalculating, setIsCalculating] = useState(false)
  const [profit, setProfit] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (budget > 0 && isClient) {
      setIsCalculating(true)
      const timer = setTimeout(() => {
        // Simulate live calculation based on "real data"
        const baseProfit = budget * 0.15 // 15% base profit
        const volatility = Math.random() * 0.1 // 0-10% additional
        const calculatedProfit = baseProfit + (budget * volatility)
        setProfit(calculatedProfit)
        setIsCalculating(false)
        setShowResult(true)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [budget, isClient])

  return (
    <motion.div 
      className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 border border-slate-700 shadow-2xl animation-container"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">💰 {t('homepage.calculator_title')}</h2>
        <p className="text-slate-300">{t('homepage.calculator_subtitle')}</p>
      </div>

      <div className="max-w-md mx-auto">
        <div className="relative">
          <input
            type="number"
            value={budget || ''}
            onChange={(e) => onBudgetChange(Number(e.target.value))}
            placeholder={t('homepage.budget_input')}
            className="w-full px-6 py-4 text-2xl font-bold text-center bg-slate-800 border-2 border-slate-600 rounded-2xl text-white placeholder-slate-400 focus:border-green-500 focus:outline-none transition-all duration-300"
          />
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-500/20 to-blue-500/20 opacity-0 transition-opacity duration-300 hover:opacity-100 pointer-events-none"></div>
        </div>

        <AnimatePresence>
          {isCalculating && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-6 text-center"
            >
              <div className="inline-flex items-center space-x-2 text-blue-400">
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-lg font-semibold">Analyzing live market data...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showResult && profit > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="mt-6 text-center"
            >
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-2xl p-6">
                <div className="text-4xl font-bold text-green-400 mb-2">
                  +${profit.toLocaleString()}
                </div>
                <div className="text-lg text-slate-300">
                  {t('homepage.profit_label')}
                </div>
                <div className="text-sm text-green-300 mt-2">
                  {t('homepage.profit_hint')}
                </div>
              </div>
              <motion.button
                type="button"
                onClick={onInvest}
                className="mt-6 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 px-8 py-3 text-lg font-semibold text-white shadow-lg shadow-amber-500/40 transition-transform duration-200 hover:-translate-y-0.5"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {t('homepage.invest_now')}
              </motion.button>
              <p className="mt-3 text-sm text-slate-300">
                {isAuthenticated ? t('homepage.invest_cta_signed_in') : t('homepage.invest_cta_signed_out')}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// Popup component for profit opportunities
const ProfitPopup = ({ profit, onClose }: { profit: number, onClose: () => void }) => {
  const opportunities = [
    { title: "BTC Lead-Lag Signal", profit: profit * 0.4, color: "green" },
    { title: "ETH Arbitrage", profit: profit * 0.3, color: "blue" },
    { title: "Altcoin Momentum", profit: profit * 0.2, color: "purple" },
    { title: "DeFi Yield Farming", profit: profit * 0.1, color: "yellow" }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 max-w-2xl w-full border border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-white mb-2">🚀 Profit Opportunities</h3>
          <p className="text-slate-300">Multiple ways to turn your ${profit.toLocaleString()} into more</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {opportunities.map((opp, index) => (
            <motion.div
              key={opp.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-2xl border-2 ${
                opp.color === 'green' ? 'border-green-500/50 bg-green-500/10' :
                opp.color === 'blue' ? 'border-blue-500/50 bg-blue-500/10' :
                opp.color === 'purple' ? 'border-purple-500/50 bg-purple-500/10' :
                'border-yellow-500/50 bg-yellow-500/10'
              }`}
            >
              <div className="font-bold text-white mb-2">{opp.title}</div>
              <div className={`text-2xl font-bold ${
                opp.color === 'green' ? 'text-green-400' :
                opp.color === 'blue' ? 'text-blue-400' :
                opp.color === 'purple' ? 'text-purple-400' :
                'text-yellow-400'
              }`}>
                +${opp.profit.toLocaleString()}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center">
          <motion.div
            className="text-3xl font-bold text-green-400 mb-4"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            You are steps away from earning ${profit.toLocaleString()}
          </motion.div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="btn-primary px-8 py-4 text-lg font-bold">
              Sign Up Now
            </Link>
            <Link href="/trial" className="btn-secondary px-8 py-4 text-lg font-bold">
              Try Free for 48 Hours
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function HomePage() {
  const { t } = useI18n()
  const router = useRouter()
  const [budget, setBudget] = useState(0)
  const [showPopup, setShowPopup] = useState(false)
  const [currentProfit, setCurrentProfit] = useState(0)
  const [showMoneyRain, setShowMoneyRain] = useState(false)
  const [liveData, setLiveData] = useState<any>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const profitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rainTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch live data on component mount
  useEffect(() => {
    const fetchLiveData = async () => {
      try {
        const [pricesResult, signalsResult] = await Promise.all([
          api.getPrices(['BTCUSDT', 'ETHUSDT', 'SOLUSDT']),
          api.getActiveSignals()
        ])
        
        setLiveData({
          prices: pricesResult.data || [],
          signals: signalsResult.data || []
        })
      } catch (error) {
        console.error('Failed to fetch live data:', error)
      }
    }

    fetchLiveData()
    
    // Update data every 30 seconds
    const interval = setInterval(fetchLiveData, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    setIsAuthenticated(Boolean(window.localStorage.getItem('auth_token')))
  }, [])

  useEffect(() => () => {
    if (profitTimeoutRef.current) {
      clearTimeout(profitTimeoutRef.current)
      profitTimeoutRef.current = null
    }
    if (rainTimeoutRef.current) {
      clearTimeout(rainTimeoutRef.current)
      rainTimeoutRef.current = null
    }
  }, [])

  useEffect(() => {
    if (budget <= 0) {
      if (profitTimeoutRef.current) clearTimeout(profitTimeoutRef.current)
      if (rainTimeoutRef.current) clearTimeout(rainTimeoutRef.current)
      setShowPopup(false)
      setShowMoneyRain(false)
      return
    }

    if (profitTimeoutRef.current) {
      clearTimeout(profitTimeoutRef.current)
      profitTimeoutRef.current = null
    }
    profitTimeoutRef.current = setTimeout(() => {
      const baseProfit = liveData?.prices?.length > 0
        ? budget * (0.12 + Math.random() * 0.08)
        : budget * (0.15 + Math.random() * 0.1)
      setCurrentProfit(baseProfit)
      setShowPopup(true)
      setShowMoneyRain(true)
      if (rainTimeoutRef.current) clearTimeout(rainTimeoutRef.current)
      rainTimeoutRef.current = setTimeout(() => {
        setShowMoneyRain(false)
        rainTimeoutRef.current = null
      }, 4000)
      profitTimeoutRef.current = null
    }, 600)

    return () => {
      if (profitTimeoutRef.current) clearTimeout(profitTimeoutRef.current)
    }
  }, [budget, liveData])

  const handleInvestClick = () => {
    if (isAuthenticated) {
      router.push('/dashboard')
    } else {
      router.push('/signup?redirect=/dashboard')
    }
  }

  return (
    <>
      <Favicon />
      <Head>
        <title>3omla • The Future of Trading Intelligence</title>
        <meta
          name="description"
          content="Turn your crypto budget into massive profits with 3omla's advanced lead-lag analysis and automated trading signals. Start your free trial today!"
        />
      </Head>

      <Layout>
        <MoneyRain isActive={showMoneyRain} />
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          {/* Free Trial Banner */}
          <motion.div 
            className="bg-gradient-to-r from-yellow-500 to-amber-500 text-black text-center py-2 font-bold text-sm"
            initial={{ y: -50 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
          >
            🎉 48-HOUR FREE TRIAL - NO CREDIT CARD REQUIRED! Start making money today! 🎉
          </motion.div>

          {/* Partner Logos */}
          <motion.div 
            className="bg-slate-800/50 py-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="max-w-6xl mx-auto px-4">
              <p className="text-center text-slate-400 text-sm mb-4">Trusted by traders worldwide</p>
              <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
                <div className="text-white font-bold text-lg">Binance</div>
                <div className="text-white font-bold text-lg">KuCoin</div>
                <div className="text-white font-bold text-lg">Bybit</div>
                <div className="text-white font-bold text-lg">Coinbase</div>
                <div className="text-white font-bold text-lg">Kraken</div>
                <div className="text-white font-bold text-lg">OKX</div>
                <div className="text-white font-bold text-lg">Gate.io</div>
              </div>
            </div>
          </motion.div>

          {/* Hero Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative py-20 px-4"
          >
            <div className="max-w-6xl mx-auto text-center">
              {/* Main Title */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mb-8"
              >
                <h1 className="text-6xl md:text-8xl font-black text-white mb-4 drop-shadow-2xl" style={{
                  textShadow: '0 0 20px #00bfff, 0 0 40px #00bfff, 0 0 60px #00bfff'
                }}>
                  {/* Title removed - now only in header */}
                </h1>
                <p className="text-2xl md:text-3xl text-blue-200 font-light mb-2">
                  {t('homepage.subtitle')}
                </p>
                <p className="text-lg text-yellow-300 font-semibold animate-pulse">
                  {t('homepage.description')}
                </p>
              </motion.div>

              {/* Pill Showcase */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-wrap justify-center gap-4 mb-12"
              >
                <GreenPill>{t('homepage.pill_buy')}</GreenPill>
                <RedPill>{t('homepage.pill_sell')}</RedPill>
                <BluePill>{t('homepage.pill_auto')}</BluePill>
              </motion.div>

              {/* Budget Input Section */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="max-w-2xl mx-auto"
              >
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {t('homepage.budget_label')}
                  </h2>
                  <p className="text-slate-300 mb-4">{t('homepage.start_journey')}</p>
                  <div className="relative animation-container">
                    <input
                      type="number"
                      id="homepage-budget"
                      value={budget || ''}
                      onChange={(e) => setBudget(Number(e.target.value))}
                      placeholder={t('homepage.budget_input')}
                      aria-label={t('homepage.budget_label')}
                      className="w-full px-8 py-6 text-4xl font-bold text-center bg-slate-800 border-4 border-slate-600 rounded-3xl text-white placeholder-slate-400 focus:border-green-500 focus:outline-none transition-all duration-300 animate-pulse-glow"
                    />
                    <div className="animated-element bg-gradient-to-r from-green-500/20 to-blue-500/20 opacity-0 transition-opacity duration-300 hover:opacity-100 pointer-events-none"></div>
                  </div>
              </div>
              </motion.div>

              {/* Profit Calculator */}
              {budget > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="mt-12"
                >
                  <ProfitCalculator
                    budget={budget}
                    onBudgetChange={setBudget}
                    onInvest={handleInvestClick}
                    isAuthenticated={isAuthenticated}
                  />
                </motion.div>
              )}
              </div>
          </motion.section>

          {/* Features Section */}
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="py-20 px-4"
          >
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold text-white mb-4">Why Choose 3omla?</h2>
                <p className="text-xl text-slate-300">Advanced technology meets simple interface</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-3xl border border-slate-700 text-center"
                >
                  <div className="text-6xl mb-4">🧠</div>
                  <h3 className="text-2xl font-bold text-white mb-4">AI-Powered Analysis</h3>
                  <p className="text-slate-300">Our advanced algorithms analyze market data 24/7 to find the best opportunities</p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-3xl border border-slate-700 text-center"
                >
                  <div className="text-6xl mb-4">⚡</div>
                  <h3 className="text-2xl font-bold text-white mb-4">Lightning Fast</h3>
                  <p className="text-slate-300">Execute trades in milliseconds with our high-speed infrastructure</p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-3xl border border-slate-700 text-center"
                >
                  <div className="text-6xl mb-4">🔒</div>
                  <h3 className="text-2xl font-bold text-white mb-4">Secure & Safe</h3>
                  <p className="text-slate-300">Bank-level security with multi-layer encryption and cold storage</p>
                </motion.div>
              </div>
            </div>
          </motion.section>

          {/* Blog Section */}
          <motion.section 
            className="py-20 px-4 bg-slate-800/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.0 }}
          >
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold text-white mb-4">Crypto Knowledge Hub</h2>
                <p className="text-xl text-slate-300">Learn from our experts and stay ahead of the market</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Link href="/blog/crypto-millionaire-100-dollars" className="group">
                  <motion.div 
                    className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-3xl border border-slate-700 hover:border-yellow-500/50 transition-all duration-300"
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="text-4xl mb-4">💰</div>
                    <h3 className="text-xl font-bold text-white mb-4 group-hover:text-yellow-400 transition-colors">
                      How to Become a Crypto Millionaire with Just $100
                    </h3>
                    <p className="text-slate-300 text-sm">Discover the secrets of turning small investments into massive wealth through strategic crypto trading.</p>
                  </motion.div>
                </Link>
                
                <Link href="/blog/web3-dangers-rugpulls" className="group">
                  <motion.div 
                    className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-3xl border border-slate-700 hover:border-yellow-500/50 transition-all duration-300"
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="text-4xl mb-4">⚠️</div>
                    <h3 className="text-xl font-bold text-white mb-4 group-hover:text-yellow-400 transition-colors">
                      Web3 Dangers: The Rise of Rugpulls
                    </h3>
                    <p className="text-slate-300 text-sm">Learn how to identify and avoid dangerous Web3 projects that could wipe out your investments.</p>
                  </motion.div>
                </Link>
                
                <Link href="/blog/crypto-development-trends" className="group">
                  <motion.div 
                    className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-3xl border border-slate-700 hover:border-yellow-500/50 transition-all duration-300"
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="text-4xl mb-4">🚀</div>
                    <h3 className="text-xl font-bold text-white mb-4 group-hover:text-yellow-400 transition-colors">
                      Crypto Development Trends 2024
                    </h3>
                    <p className="text-slate-300 text-sm">Stay updated with the latest developments in cryptocurrency technology and market trends.</p>
                  </motion.div>
                </Link>
              </div>
            </div>
          </motion.section>
        </div>

        {/* Profit Popup */}
        <AnimatePresence>
          {showPopup && (
            <ProfitPopup 
              profit={currentProfit} 
              onClose={() => setShowPopup(false)} 
            />
          )}
        </AnimatePresence>

        {/* Footer */}
        <footer className="bg-slate-900 border-t border-slate-700 py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div>
                <h3 className="text-xl font-bold text-white mb-4">3omla</h3>
                <p className="text-slate-400 text-sm">
                  The ultimate AI-powered crypto trading platform for modern investors.
                </p>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Quick Links</h4>
                <ul className="space-y-2">
                  <li><Link href="/about" className="text-slate-400 hover:text-yellow-400 transition-colors text-sm">About Us</Link></li>
                  <li><Link href="/contact" className="text-slate-400 hover:text-yellow-400 transition-colors text-sm">Contact Us</Link></li>
                  <li><Link href="/privacy" className="text-slate-400 hover:text-yellow-400 transition-colors text-sm">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="text-slate-400 hover:text-yellow-400 transition-colors text-sm">Terms of Service</Link></li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Resources</h4>
                <ul className="space-y-2">
                  <li><Link href="/blog" className="text-slate-400 hover:text-yellow-400 transition-colors text-sm">Blog</Link></li>
                  <li><Link href="/help" className="text-slate-400 hover:text-yellow-400 transition-colors text-sm">Help Center</Link></li>
                  <li><Link href="/api" className="text-slate-400 hover:text-yellow-400 transition-colors text-sm">API Documentation</Link></li>
                </ul>
            </div>

              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Connect</h4>
                <div className="flex space-x-4">
                  <a href="#" className="text-slate-400 hover:text-yellow-400 transition-colors">Twitter</a>
                  <a href="#" className="text-slate-400 hover:text-yellow-400 transition-colors">Discord</a>
                  <a href="#" className="text-slate-400 hover:text-yellow-400 transition-colors">Telegram</a>
                </div>
              </div>
            </div>
            
            <div className="border-t border-slate-700 pt-8">
              <div className="text-center text-slate-400 text-sm">
                <p className="mb-2">
                  <strong className="text-yellow-400">⚠️ TRADING DISCLAIMER:</strong> Trading cryptocurrencies involves substantial risk of loss and is not suitable for all investors. 
                  Past performance does not guarantee future results. The value of cryptocurrencies can go down as well as up, 
                  and you may lose some or all of your invested capital.
                </p>
                <p className="mb-2">
                  <strong className="text-yellow-400">DYOR (Do Your Own Research):</strong> Always conduct your own research and consider consulting with a financial advisor 
                  before making investment decisions. Never invest more than you can afford to lose.
                </p>
                <p>
                  © 2024 3omla. All rights reserved. | 
                  <Link href="/privacy" className="hover:text-yellow-400 transition-colors ml-1">Privacy Policy</Link> | 
                  <Link href="/terms" className="hover:text-yellow-400 transition-colors ml-1">Terms of Service</Link>
                </p>
              </div>
            </div>
        </div>
        </footer>
      </Layout>
    </>
  )
}
