import { useMemo, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { motion } from 'framer-motion'
import Layout from '../components/Layout'
import { useI18n } from '../lib/i18n'
import { register } from '../lib/auth'

const COUNTRY_CODES = [
  { code: '+1', labelEn: 'United States (+1)', labelAr: 'الولايات المتحدة (+1)' },
  { code: '+971', labelEn: 'United Arab Emirates (+971)', labelAr: 'الإمارات العربية المتحدة (+971)' },
  { code: '+966', labelEn: 'Saudi Arabia (+966)', labelAr: 'السعودية (+966)' },
  { code: '+44', labelEn: 'United Kingdom (+44)', labelAr: 'المملكة المتحدة (+44)' },
  { code: '+20', labelEn: 'Egypt (+20)', labelAr: 'مصر (+20)' },
  { code: '+974', labelEn: 'Qatar (+974)', labelAr: 'قطر (+974)' },
  { code: '+961', labelEn: 'Lebanon (+961)', labelAr: 'لبنان (+961)' },
  { code: '+65', labelEn: 'Singapore (+65)', labelAr: 'سنغافورة (+65)' },
  { code: '+81', labelEn: 'Japan (+81)', labelAr: 'اليابان (+81)' },
  { code: '+61', labelEn: 'Australia (+61)', labelAr: 'أستراليا (+61)' }
]

export default function SignupPage() {
  const { t, language } = useI18n()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    countryCode: '+971',
    phoneNumber: '',
    agree: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const countryOptions = useMemo(() => {
    return COUNTRY_CODES.map(({ code, labelEn, labelAr }) => ({
      code,
      label: language === 'ar' ? labelAr : labelEn
    }))
  }, [language])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, agree: e.target.checked }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.signup.password_mismatch', 'Passwords do not match.'))
      return
    }

    if (!formData.agree) {
      setError(t('auth.signup.accept_terms', 'Please accept the terms to continue.'))
      return
    }

    if (!/^\d{6,15}$/.test(formData.phoneNumber.replace(/[^0-9]/g, ''))) {
      setError(t('auth.signup.phone_invalid', 'Enter a valid phone number (digits only).'))
      return
    }

    if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(formData.username)) {
      setError(t('auth.signup.username_invalid', 'Choose a username with 3-30 letters, numbers or _.- characters.'))
      return
    }

    setIsLoading(true)
    try {
      const payload = {
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        username: formData.username,
        phone_country_code: formData.countryCode,
        phone_number: formData.phoneNumber.replace(/[^0-9]/g, ''),
        language
      }
      const res = await register(payload)
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', res.access_token)
      }
      window.location.href = `/verify?email=${encodeURIComponent(formData.email)}`
    } catch (err: any) {
      const detail = err?.response?.data?.detail
      if (Array.isArray(detail)) {
        setError(detail.map((d: any) => (typeof d === 'string' ? d : d?.msg)).filter(Boolean).join('\n') || t('common.error', 'Error during registration.'))
      } else if (typeof detail === 'string') {
        setError(detail)
      } else if (detail && typeof detail === 'object') {
        setError(detail.message || JSON.stringify(detail))
      } else if (err?.message) {
        setError(err.message)
      } else {
        setError(t('common.error', 'Error during registration.'))
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>{t('auth.signup.title', 'Create a 3OMLA account')}</title>
        <meta name="description" content={t('auth.signup.subtitle', 'Join the intelligence hub and unlock guided trading workflows')} />
      </Head>

      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center py-12 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl w-full"
          >
            <div className="text-center mb-8">
              <h1 className="text-4xl font-black text-white mb-2 uppercase tracking-tight">
                {t('auth.signup.title', 'Create your 3OMLA account')}
              </h1>
              <p className="text-slate-300">{t('auth.signup.subtitle', 'Join the intelligence hub and unlock guided trading workflows')}</p>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="bg-slate-800/90 backdrop-blur-xl rounded-3xl p-8 border border-slate-700 shadow-2xl"
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">{t('auth.signup.first_name', 'First name')}</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder={t('auth.signup.first_name', 'First name')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">{t('auth.signup.last_name', 'Last name')}</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder={t('auth.signup.last_name', 'Last name')}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">{t('auth.signup.email', 'Email')}</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder={t('auth.signup.email', 'Email')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">{t('auth.signup.username', 'Username')}</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder={t('auth.signup.username_placeholder', 'Choose a unique username')}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">{t('auth.signup.password', 'Password')}</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder={t('auth.signup.password_rules', 'Use at least 8 characters with uppercase, lowercase, and a number')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">{t('auth.signup.confirm_password', 'Confirm password')}</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder={t('auth.signup.confirm_password', 'Confirm password')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">{t('auth.signup.country_code', 'Country code')}</label>
                    <select
                      name="countryCode"
                      value={formData.countryCode}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      {countryOptions.map(option => (
                        <option key={option.code} value={option.code}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-white mb-2">{t('auth.signup.phone', 'Mobile number')}</label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder={t('auth.signup.phone', 'Mobile number')}
                    />
                  </div>
                </div>

                <label className="flex items-center space-x-3 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={formData.agree}
                    onChange={handleCheckbox}
                    className="w-4 h-4 text-green-500 bg-slate-700 border-slate-600 rounded focus:ring-green-500 focus:ring-2"
                  />
                  <span>{t('auth.signup.accept_terms', 'I agree to the Terms of Service and Privacy Policy')}</span>
                </label>

                {error && (
                  <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {error}
                  </div>
                )}

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
                      {t('auth.signup.creating', 'Creating account...')}
                    </div>
                  ) : (
                    t('auth.signup.cta', 'Create account')
                  )}
                </motion.button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-slate-400">
                  {t('auth.signup.already', 'Already have an account?')}{' '}
                  <Link href="/login" className="text-green-400 hover:text-green-300 font-semibold">
                    {t('auth.signup.login_link', 'Sign in')}
                  </Link>
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <div className="text-center p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                <div className="text-2xl mb-2">🚀</div>
                <div className="text-sm text-slate-300">{t('about.feature_1_title', 'Real-time intelligence')}</div>
              </div>
              <div className="text-center p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                <div className="text-2xl mb-2">💰</div>
                <div className="text-sm text-slate-300">{t('dashboard.profit_tracking', 'Profit tracking')}</div>
              </div>
              <div className="text-center p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                <div className="text-2xl mb-2">🔒</div>
                <div className="text-sm text-slate-300">{t('about.feature_4_title', 'Risk frameworks')}</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </Layout>
    </>
  )
}
