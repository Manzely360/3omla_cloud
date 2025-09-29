import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { motion } from 'framer-motion'
import Layout from '../components/Layout'
import { useI18n } from '../lib/i18n'

const TRIAL_SECONDS = 48 * 60 * 60

type TrialStatus = 'loading' | 'needsAuth' | 'needsVerification' | 'ready'

export default function TrialPage() {
  const { t, language } = useI18n()
  const [timeLeft, setTimeLeft] = useState(TRIAL_SECONDS)
  const [isActive, setIsActive] = useState(false)
  const [status, setStatus] = useState<TrialStatus>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('auth_token') : null
    if (!token) {
      setStatus('needsAuth')
      return
    }

    const controller = new AbortController()
    fetch('/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal
    })
      .then(async (res) => {
        if (!res.ok) {
          setStatus('needsAuth')
          return
        }
        const data = await res.json()
        if (data?.email_verified) {
          setStatus('ready')
        } else {
          setStatus('needsVerification')
        }
      })
      .catch(() => {
        setStatus('needsAuth')
      })

    return () => controller.abort()
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
      }, 1000)
    }
    return () => interval && clearInterval(interval)
  }, [isActive, timeLeft])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    const locale = language === 'ar' ? 'ar-SA' : 'en-US'
    return [hours, minutes, secs]
      .map((unit) => unit.toLocaleString(locale, { minimumIntegerDigits: 2 }))
      .join(':')
  }

  const startTrial = () => {
    setError(null)
    setIsActive(true)
  }

  const features = [
    { title: t('about.ai_analysis_title', 'AI-powered analysis'), description: t('about.ai_analysis_copy', 'Advanced analytics with live data.'), icon: '💰' },
    { title: t('about.lead_lag_title', 'Lead-lag detection'), description: t('about.lead_lag_copy', 'Spot leaders before the move.'), icon: '📊' },
    { title: t('about.auto_trading_title', 'Automated execution'), description: t('about.auto_trading_copy', 'Deploy AI strategies safely.'), icon: '🤖' },
    { title: t('about.data_title', 'Multi-exchange data'), description: t('about.data_copy', 'Coverage across major venues.'), icon: '🛡️' },
    { title: t('games.points', 'Points earned'), description: t('points.earn_more', 'Collect points via the daily challenge.'), icon: '🔍' },
    { title: t('about.commitment_title', 'Our commitment'), description: t('about.commitment_copy', 'Transparency, security, trader success.'), icon: '📈' }
  ]

  const renderGate = () => {
    if (status === 'loading') {
      return (
        <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-8 text-center text-white">
          {t('common.loading', 'Loading...')}
        </div>
      )
    }

    if (status === 'needsAuth') {
      return (
        <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-8 text-center text-white space-y-4">
          <p className="text-lg">
            {t('trial.auth_required', 'Create an account and verify your email to unlock the free trial.')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup" className="px-6 py-3 bg-green-500 text-white rounded-xl font-semibold">
              {t('auth.signup.cta', 'Create account')}
            </Link>
            <Link href="/login" className="px-6 py-3 bg-slate-700 text-white rounded-xl font-semibold">
              {t('auth.login.cta', 'Sign in')}
            </Link>
          </div>
        </div>
      )
    }

    if (status === 'needsVerification') {
      return (
        <div className="bg-slate-800/80 border border-amber-500/40 rounded-3xl p-8 text-center text-amber-100 space-y-4">
          <p className="text-lg font-semibold">{t('auth.verification.title', 'Verify your email')}</p>
          <p>{t('trial.verify_message', 'Check your inbox and verify your email to start the trial.')}</p>
          <Link href="/verify" className="px-6 py-3 bg-amber-500 text-slate-900 rounded-xl font-semibold">
            {t('auth.verification.resend', 'Resend verification email')}
          </Link>
        </div>
      )
    }

    return null
  }

  return (
    <>
      <Head>
        <title>3OMLA Trial</title>
        <meta name="description" content={t('trial.subtitle', 'Start your 48-hour free access to the 3OMLA intelligence hub')} />
      </Head>

      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
          <div className="max-w-6xl mx-auto">
            {status !== 'ready' ? (
              renderGate()
            ) : (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-center mb-12"
                >
                  <h1 className="text-5xl font-black text-white mb-4">48 {language === 'ar' ? 'ساعة مجانية' : 'Hour Free Trial'}</h1>
                  <p className="text-xl text-slate-300 mb-8">
                    {t('trial.subtitle', 'Start your 48-hour free access to the 3OMLA intelligence hub')}
                  </p>

                  <div className="bg-slate-800/90 backdrop-blur-xl rounded-3xl p-8 border border-slate-700 shadow-2xl max-w-md mx-auto">
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-white mb-4">{t('trial.timer_title', 'Trial time remaining')}</h2>
                      <div className="text-6xl font-mono font-bold text-green-400 mb-4">
                        {formatTime(timeLeft)}
                      </div>
                      <motion.button
                        onClick={startTrial}
                        disabled={isActive}
                        className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-lg font-bold rounded-2xl shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {isActive ? t('trial.active', 'Trial active') : t('trial.start', 'Start trial')}
                      </motion.button>
                      {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
                >
                  {features.map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="bg-slate-800/90 backdrop-blur-xl rounded-2xl p-6 border border-slate-700 hover:border-green-500/50 transition-all duration-300"
                    >
                      <div className="text-4xl mb-4">{feature.icon}</div>
                      <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                      <p className="text-slate-300 text-sm">{feature.description}</p>
                    </motion.div>
                  ))}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="text-center bg-gradient-to-r from-slate-800 to-slate-900 rounded-3xl p-8 border border-slate-700"
                >
                  <h2 className="text-3xl font-bold text-white mb-4">{t('trial.cta_title', 'Ready to start making profits?')}</h2>
                  <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
                    {t('trial.cta_copy', 'Join traders using 3OMLA to amplify their performance. Start the trial and experience the difference.')}
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                      href="/rewards"
                      className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-lg font-bold rounded-2xl shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all duration-300"
                    >
                      {t('rewards.title', 'Redeem 3OMLA points')}
                    </Link>
                    <Link
                      href="/games"
                      className="px-8 py-4 bg-slate-700 text-white text-lg font-bold rounded-2xl border border-slate-600 hover:bg-slate-600 transition-all duration-300"
                    >
                      {t('games.play_button', 'Play now')}
                    </Link>
                  </div>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </Layout>
    </>
  )
}
