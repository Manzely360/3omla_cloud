import Head from 'next/head'
import { useEffect, useMemo, useState } from 'react'
import Layout from '../components/Layout'
import { useI18n } from '../lib/i18n'
import Favicon from '../components/Favicon'

export default function API() {
  const { t } = useI18n()
  const [isLightMode, setIsLightMode] = useState(false)
  const [showKey, setShowKey] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const html = document.documentElement
    const detect = () => setIsLightMode(html.classList.contains('theme-light'))
    detect()
    const observer = new MutationObserver(detect)
    observer.observe(html, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  const apiBase = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_API_URL || ''
    return base ? `${base}/api/v1` : '/api/v1'
  }, [])

  const heroTitleClass = isLightMode
    ? 'text-4xl font-bold text-slate-900 mb-4 drop-shadow-[0_0_20px_rgba(254,215,170,0.6)] text-center'
    : 'text-4xl font-bold text-white mb-4 drop-shadow-[0_0_24px_rgba(59,130,246,0.55)] text-center'

  const heroSubtitleClass = isLightMode
    ? 'text-lg text-slate-600 text-center max-w-2xl mx-auto'
    : 'text-lg text-slate-300 text-center max-w-2xl mx-auto'

  const panelClass = isLightMode
    ? 'bg-white/95 border border-slate-200 shadow-[0_28px_60px_rgba(253,186,116,0.22)]'
    : 'bg-slate-800/60 border border-slate-700/60 backdrop-blur-xl'

  const sectionHeadingClass = isLightMode ? 'text-2xl font-semibold text-slate-900 mb-4' : 'text-2xl font-semibold text-white mb-4'
  const bodyTextClass = isLightMode ? 'text-slate-600 leading-relaxed' : 'text-slate-300 leading-relaxed'
  const codeBlockClass = isLightMode
    ? 'bg-slate-900/95 text-emerald-300 rounded-lg p-4 overflow-x-auto'
    : 'bg-slate-900 text-green-400 rounded-lg p-4 overflow-x-auto'

  return (
    <>
      <Favicon />
      <Head>
        <title>API Documentation - 3OMLA</title>
        <meta
          name="description"
          content="3OMLA API documentation covering authentication, endpoints, and rate limits for market intelligence access."
        />
      </Head>

      <Layout>
        <div
          className={`min-h-screen py-12 transition-colors ${
            isLightMode
              ? 'bg-gradient-to-br from-white via-amber-50 to-white'
              : 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
          }`}
        >
          <div className="mx-auto max-w-5xl px-6">
            <div className={`rounded-3xl p-10 transition-all ${panelClass}`}>
              <header className="mb-10 space-y-3">
                <h1 className={heroTitleClass}>{t('api.title', '3OMLA API')}</h1>
                <p className={heroSubtitleClass}>
                  {t(
                    'api.subtitle',
                    'Access lead-lag analytics, live signals, and market health directly from your infrastructure using secure REST endpoints.'
                  )}
                </p>
              </header>

              <div className="space-y-10">
                <section>
                  <h2 className={sectionHeadingClass}>{t('api.base_url.heading', 'Base URL')}</h2>
                  <p className={`${bodyTextClass} mb-4`}>
                    {t(
                      'api.base_url.copy',
                      'All endpoints are prefixed with the base path shown below. The documentation mirrors your current deployment so environments stay in sync.'
                    )}
                  </p>
                  <div className={isLightMode ? 'rounded-xl border border-slate-200 bg-white p-4 shadow-inner' : 'rounded-xl border border-slate-700 bg-slate-900/80 p-4'}>
                    <code className={isLightMode ? 'text-slate-900 font-semibold' : 'text-blue-300 font-semibold'}>{apiBase}</code>
                  </div>
                </section>

                <section>
                  <h2 className={sectionHeadingClass}>{t('api.auth.heading', 'Authentication')}</h2>
                  <p className={`${bodyTextClass} mb-4`}>
                    {t(
                      'api.auth.copy',
                      'Generate API keys from your account settings. Keys are scoped per workspace and can be rotated at any time.'
                    )}
                  </p>

                  <div className={isLightMode ? 'rounded-xl border border-slate-200 bg-amber-50/80 p-4' : 'rounded-xl border border-slate-700 bg-slate-900/70 p-4'}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className={isLightMode ? 'text-sm font-semibold text-amber-700 uppercase tracking-wide' : 'text-sm font-semibold text-sky-300 uppercase tracking-wide'}>
                          {showKey ? t('api.auth.revealed', 'Primary key') : t('api.auth.hidden', 'Primary key (hidden)')}
                        </p>
                        <p className={isLightMode ? 'font-mono text-slate-800 mt-1' : 'font-mono text-slate-200 mt-1'}>
                          {showKey ? 'sk_live_********************************' : '••••-••••-••••-••••-••••'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowKey((prev) => !prev)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                          isLightMode ? 'bg-slate-900 text-white hover:bg-slate-700' : 'bg-slate-200/20 text-sky-200 hover:bg-slate-200/30'
                        }`}
                      >
                        {showKey ? t('api.auth.hide', 'Hide') : t('api.auth.show', 'Reveal')}
                      </button>
                    </div>
                    <p className={`${isLightMode ? 'text-xs text-slate-600 mt-3' : 'text-xs text-slate-400 mt-3'}`}>
                      {t('api.auth.storage', 'Store keys in environment variables such as API_KEY and never ship them in client bundles.')}
                    </p>
                  </div>

                  <div className={`${codeBlockClass} mt-4`}>
                    <pre>{`Authorization: Bearer YOUR_API_KEY`}</pre>
                  </div>
                </section>

                <section>
                  <h2 className={sectionHeadingClass}>{t('api.core.heading', 'Core endpoints')}</h2>
                  <p className={`${bodyTextClass} mb-6`}>
                    {t(
                      'api.core.copy',
                      'Each response includes timestamps and confidence scores derived from Binance, Bybit, KuCoin, and CoinMarketCap sources.'
                    )}
                  </p>

                  <div className="space-y-6">
                    <EndpointCard
                      isLightMode={isLightMode}
                      title={t('api.core.signals.title', 'Active signals')}
                      method="GET"
                      path="/signals/active"
                      description={t(
                        'api.core.signals.copy',
                        'Live entries that cleared the momentum and liquidity filters.'
                      )}
                      example={`{
  "signals": [
    {
      "symbol": "BTCUSDT",
      "action": "BUY",
      "strength": 0.82,
      "confidence": 0.74,
      "timestamp": "2024-05-18T09:21:00Z"
    }
  ]
}`}
                    />
                    <EndpointCard
                      isLightMode={isLightMode}
                      title={t('api.core.leadlag.title', 'Lead-lag map')}
                      method="GET"
                      path="/analytics/lead-lag"
                      description={t(
                        'api.core.leadlag.copy',
                        'Discover which asset leads and how many seconds until its peer reacts.'
                      )}
                    />
                    <EndpointCard
                      isLightMode={isLightMode}
                      title={t('api.core.correlation.title', 'Correlation matrix')}
                      method="GET"
                      path="/analytics/correlation-matrix"
                      description={t(
                        'api.core.correlation.copy',
                        'Returns a JSON heat-map for your requested symbol universe.'
                      )}
                    />
                    <EndpointCard
                      isLightMode={isLightMode}
                      title={t('api.core.prices.title', 'Aggregated prices')}
                      method="GET"
                      path="/market/prices"
                      description={t(
                        'api.core.prices.copy',
                        'Weighted price feed blended from Binance, OKX, and KuCoin.'
                      )}
                    />
                  </div>
                </section>

                <section>
                  <h2 className={sectionHeadingClass}>{t('api.rate_limits.heading', 'Rate limits')}</h2>
                  <p className={`${bodyTextClass} mb-4`}>
                    {t(
                      'api.rate_limits.copy',
                      'Requests are measured per key. Exceeding a tier returns HTTP 429 with a retry-after header.'
                    )}
                  </p>
                  <ul className={isLightMode ? 'space-y-2 text-slate-600' : 'space-y-2 text-slate-300'}>
                    <li>• {t('api.rate_limits.free', 'Free: 100 requests/hour')}</li>
                    <li>• {t('api.rate_limits.pro', 'Pro: 1,000 requests/hour')}</li>
                    <li>• {t('api.rate_limits.enterprise', 'Enterprise: custom agreements')}</li>
                  </ul>
                </section>

                <section>
                  <h2 className={sectionHeadingClass}>{t('api.errors.heading', 'Error handling')}</h2>
                  <p className={`${bodyTextClass} mb-4`}>
                    {t(
                      'api.errors.copy',
                      'Every error response follows a consistent envelope so your monitoring can classify incidents quickly.'
                    )}
                  </p>
                  <div className={codeBlockClass}>
                    <pre>{`{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again later.",
    "retry_after": 30
  }
}`}</pre>
                  </div>
                </section>

                <section>
                  <h2 className={sectionHeadingClass}>{t('api.access.heading', 'Getting access')}</h2>
                  <p className={`${bodyTextClass} mb-6`}>
                    {t(
                      'api.access.copy',
                      'Create an account, connect your Binance or Bybit read-only keys, and upgrade to unlock production usage. Sandbox mode is free for the first 48 hours.'
                    )}
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <a
                      href="/signup"
                      className={`rounded-lg px-6 py-3 font-semibold transition-all ${
                        isLightMode
                          ? 'bg-slate-900 text-white hover:bg-slate-700'
                          : 'bg-gradient-to-r from-green-500 to-blue-500 text-white hover:shadow-[0_18px_40px_rgba(59,130,246,0.35)]'
                      }`}
                    >
                      {t('api.access.get_started', 'Get started')}
                    </a>
                    <a
                      href="/contact"
                      className={`rounded-lg px-6 py-3 font-semibold transition-colors ${
                        isLightMode
                          ? 'bg-white border border-slate-300 text-slate-700 hover:border-slate-400'
                          : 'bg-slate-700 text-white hover:bg-slate-600'
                      }`}
                    >
                      {t('api.access.sales', 'Talk to sales')}
                    </a>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  )
}

interface EndpointCardProps {
  title: string
  method: string
  path: string
  description: string
  example?: string
  isLightMode: boolean
}

function EndpointCard({ title, method, path, description, example, isLightMode }: EndpointCardProps) {
  const badgeClass = isLightMode
    ? 'bg-amber-100 text-amber-700'
    : 'bg-sky-500/20 text-sky-200'
  const containerClass = isLightMode
    ? 'rounded-xl border border-slate-200 bg-white/95 p-6 shadow-[0_12px_30px_rgba(203,213,225,0.35)]'
    : 'rounded-xl border border-slate-700/60 bg-slate-900/50 p-6'
  const methodClass = isLightMode ? 'text-xs font-bold text-amber-700' : 'text-xs font-bold text-sky-300'
  const pathClass = isLightMode ? 'font-mono text-slate-900 text-sm' : 'font-mono text-slate-100 text-sm'
  const bodyClass = isLightMode ? 'text-slate-600 mt-2' : 'text-slate-300 mt-2'

  return (
    <div className={containerClass}>
      <div className="flex items-center justify-between gap-4">
        <span className={`rounded-full px-3 py-1 text-xs uppercase tracking-wide ${badgeClass}`}>{title}</span>
        <span className={methodClass}>{method}</span>
      </div>
      <div className="mt-3">
        <p className={pathClass}>{path}</p>
        <p className={bodyClass}>{description}</p>
      </div>
      {example && (
        <div className={`${isLightMode ? 'bg-slate-900/95 text-emerald-300' : 'bg-slate-900 text-emerald-300'} mt-4 rounded-lg p-4 font-mono text-xs`}>
          <pre>{example}</pre>
        </div>
      )}
    </div>
  )
}
