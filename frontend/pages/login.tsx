import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { motion } from 'framer-motion'
import Layout from '../components/Layout'
import { useI18n } from '../lib/i18n'
import { login } from '../lib/auth'

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { t, language } = useI18n()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    try {
      const res = await login(formData.email, formData.password)
      if (typeof window !== 'undefined' && res?.access_token) {
        window.localStorage.setItem('auth_token', res.access_token)
      }
      window.location.href = '/dashboard'
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Unable to login. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <>
      <Head>
        <title>{t('auth.login.title', 'Login')} - 3OMLA</title>
        <meta name="description" content={t('auth.login.subtitle', 'Sign in to continue with 3OMLA')} />
      </Head>

      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center py-12 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-md w-full"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-black text-white mb-2 uppercase tracking-tight">
                {t('auth.login.title', 'Welcome back')}
              </h1>
              <p className="text-slate-300">{t('auth.login.subtitle', 'Sign in to continue your trading journey')}</p>
            </div>

            {/* Login Form */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="bg-slate-800/90 backdrop-blur-xl rounded-3xl p-8 border border-slate-700 shadow-2xl"
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    {t('auth.login.email', 'Email address')}
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                    placeholder={t('auth.login.email', 'Email address')}
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    {t('auth.login.password', 'Password')}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                    placeholder={t('auth.login.password', 'Password')}
                  />
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-green-500 bg-slate-700 border-slate-600 rounded focus:ring-green-500 focus:ring-2"
                    />
                    <span
                      className="ml-2 text-sm text-slate-300"
                      style={language === 'ar' ? { marginLeft: 0, marginRight: '0.5rem' } : undefined}
                    >
                      {t('auth.login.remember', 'Remember me')}
                    </span>
                  </label>
                  <Link href="/forgot-password" className="text-sm text-green-400 hover:text-green-300">
                    {t('auth.login.forgot', 'Forgot password?')}
                  </Link>
                </div>

                {error && (
                  <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-lg font-bold rounded-2xl shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      {t('auth.login.creating', 'Signing in...')}
                    </div>
                  ) : (
                    t('auth.login.cta', 'Sign in')
                  )}
                </motion.button>
              </form>

              {/* Signup Link */}
              <div className="mt-6 text-center">
                <p className="text-slate-400">
                  {t('auth.login.no_account', "Don't have an account?")}{' '}
                  <Link href="/signup" className="text-green-400 hover:text-green-300 font-semibold">
                    {t('auth.login.signup_link', 'Create an account')}
                  </Link>
                </p>
              </div>

              {/* Trial Link */}
              <div className="mt-4 text-center">
                <Link href="/trial" className="text-blue-400 hover:text-blue-300 font-semibold text-sm">
                  {t('auth.login.trial_link', 'Try free for 48 hours')}
                </Link>
              </div>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <div className="text-center p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                <div className="text-2xl mb-2">📈</div>
                <div className="text-sm text-slate-300">{t('header.signals', 'Signals')}</div>
              </div>
              <div className="text-center p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                <div className="text-2xl mb-2">💰</div>
                <div className="text-sm text-slate-300">{t('dashboard.profit_tracking', 'Profit tracking')}</div>
              </div>
              <div className="text-center p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                <div className="text-2xl mb-2">🤖</div>
                <div className="text-sm text-slate-300">{t('dashboard.auto_trading', 'Automated trading')}</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </Layout>
    </>
  )
}
