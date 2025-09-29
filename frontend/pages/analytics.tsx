import Head from 'next/head'
import { useState } from 'react'
import { useQuery } from 'react-query'
import Layout from '../components/Layout'
import { useI18n } from '../lib/i18n'
import CorrelationHeatmap from '../components/analytics/CorrelationHeatmap'
import LeadLagNetwork from '../components/analytics/LeadLagNetwork'
import { api } from '../lib/api'

export default function AnalyticsPage() {
  const { t } = useI18n()
  const [selectedTimeframe, setSelectedTimeframe] = useState('15m')
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(['BTCUSDT','ETHUSDT','ADAUSDT','SOLUSDT'])

  const { data: correlationData, isLoading: correlationLoading } = useQuery(
    ['correlation-matrix', selectedSymbols, selectedTimeframe],
    () => api.getCorrelationMatrix({ symbols: selectedSymbols, interval: selectedTimeframe, window_size: 100 }),
    { refetchInterval: 60000 }
  )

  const { data: leadLagData, isLoading: leadLagLoading } = useQuery(
    ['lead-lag', selectedTimeframe],
    () => api.getLeadLagRelationships({ min_hit_rate: 0.6, min_correlation: 0.3, interval: selectedTimeframe, limit: 30 }),
    { refetchInterval: 120000 }
  )

  // Lead-Lag metrics (pairwise)
  const [pairA, setPairA] = useState('BTCUSDT')
  const [pairB, setPairB] = useState('ETHUSDT')
  const [metrics, setMetrics] = useState<any>(null)
  const fetchMetrics = async () => {
    const res = await fetch(`/api/v1/analytics/lead-lag-metrics?symbol1=${pairA}&symbol2=${pairB}&interval=${selectedTimeframe}&max_lag=20`)
    setMetrics(await res.json())
  }

  return (
    <>
      <Head>
        <title>Analytics - 3OMLA Intelligence Hub</title>
      </Head>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Analytics</h1>
            <select value={selectedTimeframe} onChange={(e) => setSelectedTimeframe(e.target.value)} className="input w-40">
              {['5m','15m','1h','4h','1d'].map(tf => <option key={tf} value={tf}>{tf}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="text-lg font-medium mb-4">{t('section.correlationMatrix','Correlation Matrix')}</h2>
              <CorrelationHeatmap data={correlationData} isLoading={correlationLoading} symbols={selectedSymbols} />
            </div>
            <div className="card">
              <h2 className="text-lg font-medium mb-4">{t('section.leadlagNetwork','Lead-Lag Network')}</h2>
              <LeadLagNetwork data={leadLagData} isLoading={leadLagLoading} />
            </div>
          </div>

          {/* Pairwise Lead-Lag Metrics */}
          <div className="card">
            <div className="flex items-end space-x-3 mb-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Symbol A</label>
                <input className="input w-40" value={pairA} onChange={(e)=>setPairA(e.target.value.toUpperCase())} />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Symbol B</label>
                <input className="input w-40" value={pairB} onChange={(e)=>setPairB(e.target.value.toUpperCase())} />
              </div>
              <button className="btn-primary" onClick={fetchMetrics}>Compute</button>
            </div>
            {metrics ? (
              <div className="text-sm text-gray-300 space-y-1">
                <div>Best lag: <span className="text-primary-400">{metrics.best_lag}</span> bars, abs(corr)={metrics.best_abs_corr?.toFixed?.(3) ?? 'n/a'}</div>
                <div>Granger p(B→A): {metrics.granger_p_value_symbol2_causes_symbol1 ?? 'n/a'} | p(A→B): {metrics.granger_p_value_symbol1_causes_symbol2 ?? 'n/a'}</div>
              </div>
            ) : (
              <div className="text-sm text-gray-400">Enter a pair and compute metrics.</div>
            )}
          </div>
        </div>
      </Layout>
    </>
  )
}
