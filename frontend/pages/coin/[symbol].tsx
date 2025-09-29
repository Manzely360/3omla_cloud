import { useRouter } from 'next/router'
import Head from 'next/head'
import { useEffect, useMemo } from 'react'
import Layout from '../../components/Layout'
import { useQuery } from 'react-query'
import { motion } from 'framer-motion'

function useAdvisor(symbol?: string) {
  return useQuery(['advisor', symbol], async () => {
    if (!symbol) return null
    const params = new URLSearchParams({ symbol })
    const res = await fetch(`/api/v1/advisor/insights?${params.toString()}`)
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }, { enabled: Boolean(symbol), refetchInterval: 60000 })
}

export default function CoinExplorer() {
  const router = useRouter()
  const { symbol } = router.query
  const slug = useMemo(() => typeof symbol === 'string' ? symbol.toUpperCase() : undefined, [symbol])
  const { data, isLoading, error } = useAdvisor(slug)

  useEffect(() => {
    if (slug) {
      document.title = `3omla Advisor · ${slug}`
    }
  }, [slug])

  const snapshots = data?.snapshots ?? {}

  return (
    <>
      <Head>
        <title>{slug ? `3omla Advisor · ${slug}` : '3omla Advisor'}</title>
      </Head>
      <Layout>
        <div className="space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold text-slate-800">{slug ?? 'Loading…'} Advisor</h1>
              <p className="text-sm text-slate-500">AI-assisted outlook across 5m/15m/30m intervals, trend interest, and live companions.</p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={slug ? `/api/v1/advisor/report?symbol=${slug}` : '#'}
                className="btn-primary px-4"
              >
                Download PDF
              </a>
              <button
                className="btn-secondary px-4"
                onClick={() => router.push(`/portal?symbol=${slug ?? ''}`)}
              >
                Open Portal
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-3xl border border-rose-200 bg-rose-50/70 p-4 text-sm text-rose-600">{String(error)}</div>
          )}

          {isLoading && (
            <div className="rounded-3xl border border-indigo-100 bg-indigo-50/70 p-4 text-sm text-indigo-500">Loading advisor intelligence…</div>
          )}

          {data && (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {['5m', '15m', '30m'].map((interval) => {
                  const snap = snapshots[interval] || {}
                  return (
                    <motion.div key={interval} className="card card-gradient border-gradient hover-tilt" whileHover={{ y: -6 }}>
                      <h2 className="text-lg font-semibold text-slate-800">{interval} Outlook</h2>
                      <p className="mt-2 text-sm text-slate-500">Close: {snap.close ? Number(snap.close).toFixed(4) : '—'}</p>
                      <p className={`text-sm font-semibold ${snap.change_pct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {(snap.change_pct ?? 0) * 100 >= 0 ? '+' : ''}{((snap.change_pct ?? 0) * 100).toFixed(2)}%
                      </p>
                      <p className="text-xs text-slate-400">Avg volume {snap.volume ? Number(snap.volume).toFixed(2) : '—'}</p>
                    </motion.div>
                  )
                })}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <motion.div className="card card-gradient border-gradient" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <h2 className="text-lg font-semibold text-slate-800">Google Trends Pulse</h2>
                  <p className="text-xs text-slate-500 mb-3">Monitoring public interest across multiple horizons.</p>
                  <div className="space-y-2">
                    {['past_hour', 'past_day', 'past_week', 'past_year'].map((key) => {
                      const record = data?.trends?.horizons?.[key]
                      return (
                        <div key={key} className="flex items-center justify-between rounded-2xl bg-white/80 border border-indigo-100 px-3 py-2 text-sm">
                          <span className="text-slate-600 capitalize">{key.replace('past_', 'Last ')}</span>
                          <span className="text-slate-800 font-semibold">{record ? record.last.toFixed(1) : '—'} / {record ? record.mean.toFixed(1) : '—'}</span>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>

                <motion.div className="card card-gradient border-gradient" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <h2 className="text-lg font-semibold text-slate-800">Advisor Verdict</h2>
                  <p className="text-sm text-slate-500">Synthesised from price action, trend skew, and lead-lag context.</p>
                  <div className="mt-3 space-y-2">
                    <div className="rounded-2xl bg-white/80 border border-indigo-100 px-4 py-3">
                      <p className="text-xs uppercase tracking-wide text-indigo-400">Recommendation</p>
                      <p className="text-2xl font-semibold text-slate-800">{data?.advice?.recommendation?.toUpperCase() ?? '—'}</p>
                    </div>
                    <div className="rounded-2xl bg-white/80 border border-emerald-100 px-4 py-3">
                      <p className="text-xs uppercase tracking-wide text-emerald-400">Confidence</p>
                      <p className="text-lg font-semibold text-emerald-600">{data?.advice?.confidence ? `${(data.advice.confidence * 100).toFixed(1)}%` : '—'}</p>
                    </div>
                    <p className="text-xs text-slate-400">{data?.advice?.notes}</p>
                  </div>
                </motion.div>
              </div>

              {data?.companions?.length ? (
                <div className="card card-gradient border-gradient">
                  <h2 className="text-lg font-semibold text-slate-800">Lead-Lag Companions</h2>
                  <div className="mt-3 overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                          <th className="px-2 py-2">Leader → Follower</th>
                          <th className="px-2 py-2">Lag</th>
                          <th className="px-2 py-2">Correlation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.companions.map((row: any, idx: number) => (
                          <tr key={idx} className="border-b border-indigo-100/80">
                            <td className="px-2 py-2 text-slate-700">{row.leader_symbol} → {row.follower_symbol}</td>
                            <td className="px-2 py-2 text-slate-600">{row.best_lag}</td>
                            <td className="px-2 py-2 text-slate-600">{row.best_abs_corr?.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}

              <div className="card card-gradient border-gradient">
                <h2 className="text-lg font-semibold text-slate-800">Advisor Walkthrough</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <video
                    className="w-full rounded-2xl border border-white shadow-lg shadow-indigo-200/60"
                    controls
                    poster="https://images.unsplash.com/photo-1518773553398-650c184e0bb3?auto=format&fit=crop&w=900&q=80"
                  >
                    <source src="https://storage.googleapis.com/coverr-main/mp4/Taking_A_Stand.mp4" type="video/mp4" />
                  </video>
                  <div className="space-y-3 text-sm text-slate-600">
                    <p><strong>1.</strong> Review multi-timeframe bias above.</p>
                    <p><strong>2.</strong> Download the PDF before market open for Cairo (EET) sessions.</p>
                    <p><strong>3.</strong> Mirror the recommended stance on the Trading page with paper mode first.</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </Layout>
    </>
  )
}
