import Head from 'next/head'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import Layout from '../components/Layout'
import { useI18n } from '../lib/i18n'
import { api } from '../lib/api'

export default function SettingsPage() {
  const { t } = useI18n()
  // Prefer positions as a connectivity check; balances can fail depending on account mode/permissions
  const qc = useQueryClient()
  const { data: livePositions, error } = useQuery(['live-positions'], () => api.getLivePositions(), { retry: 0 })

  const { data: bybitCredential } = useQuery(['credential-status', 'bybit'], () => api.getCredentialStatus('bybit'), { retry: 0, staleTime: 60000 })
  const { data: binanceCredential } = useQuery(['credential-status', 'binance'], () => api.getCredentialStatus('binance'), { retry: 0, staleTime: 60000 })
  const { data: cmcCredential } = useQuery(['credential-status', 'cmc'], () => api.getCredentialStatus('cmc'), { retry: 0, staleTime: 60000 })

  const [provider, setProvider] = useState('bybit')
  const [apiKey, setApiKey] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [whaleMin, setWhaleMin] = useState<string>('200000')

  const saveCreds = useMutation(
    async () => {
      return api.saveCredential(provider, apiKey, apiSecret)
    },
    {
      onSuccess: () => {
        qc.invalidateQueries(['live-positions'])
        qc.invalidateQueries(['credential-status', provider])
        setApiKey('')
        setApiSecret('')
      },
    }
  )

  // Whale alerts threshold persistence
  const saveWhales = () => {
    try {
      const v = Math.max(10000, parseInt(whaleMin || '200000'))
      if (typeof window !== 'undefined') {
        localStorage.setItem('whale_min_usd', String(v))
        alert(`Saved whale alert threshold: $${v}`)
      }
    } catch {}
  }

  return (
    <>
      <Head><title>Settings - 3OMLA Intelligence Hub</title></Head>
      <Layout>
        <div className="space-y-6">
          <h1 className="text-2xl font-semibold">{t('settings.title','Settings')}</h1>
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">{t('settings.exchangeConnections','Exchange Connections')}</h2>
              {error && (
                <span className="text-xs text-amber-300">{t('settings.connectionWarning','Live connectivity check failed')}</span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[{
                key: 'bybit',
                label: 'Bybit',
                configured: Boolean(bybitCredential),
                connected: !error && Array.isArray(livePositions),
                helper: 'Derivatives live trading & positions',
              }, {
                key: 'binance',
                label: 'Binance',
                configured: Boolean(binanceCredential),
                connected: Boolean(binanceCredential),
                helper: 'Spot liquidity for analytics',
              }, {
                key: 'cmc',
                label: 'CoinMarketCap',
                configured: Boolean(cmcCredential),
                connected: Boolean(cmcCredential),
                helper: 'Market cap & rankings data',
              }].map((item) => (
                <div key={item.key} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600/60">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">{item.label}</p>
                      <p className="text-xs text-gray-400">{item.helper}</p>
                    </div>
                    <span className={`badge ${item.configured ? 'badge-success' : 'badge-warning'}`}>
                      {item.configured ? 'Configured' : 'Missing'}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    {item.key === 'bybit' ? (
                      item.connected ? 'Live positions responsive' : 'No live positions detected'
                    ) : item.configured ? 'Ready' : 'Add API keys to enable'
                    }
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">{t('settings.provider','Provider')}</label>
                <select className="input" value={provider} onChange={(e)=>setProvider(e.target.value)}>
                  <option value="bybit">Bybit</option>
                  <option value="binance">Binance</option>
                  <option value="cmc">CoinMarketCap</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">{t('settings.apiKey','API Key')}</label>
                <input className="input" value={apiKey} onChange={(e)=>setApiKey(e.target.value)} placeholder="Enter API key" />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">{t('settings.apiSecret','API Secret')}</label>
                <input className="input" value={apiSecret} onChange={(e)=>setApiSecret(e.target.value)} placeholder="Enter API secret (optional for CMC)" />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-end">
              <button className="btn-primary" onClick={()=>saveCreds.mutate()} disabled={saveCreds.isLoading}>
                {saveCreds.isLoading ? '...' : t('settings.save','Save & Connect')}
              </button>
            </div>
          </div>
          <div className="card">
            <h2 className="text-lg font-medium mb-2">Alerts</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Whale Min USD</label>
                <input className="input" value={whaleMin} onChange={(e)=>setWhaleMin(e.target.value)} placeholder="200000" />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-end">
              <button className="btn-primary" onClick={saveWhales}>{t('settings.save','Save')}</button>
            </div>
          </div>
        </div>
      </Layout>
    </>
  )
}
