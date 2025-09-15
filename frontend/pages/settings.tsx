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
  const bybitConfigured = !error && Array.isArray(livePositions)

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
      <Head><title>Settings - Crypto Lead-Lag Pattern Radar</title></Head>
      <Layout>
        <div className="space-y-6">
          <h1 className="text-2xl font-semibold">{t('settings.title','Settings')}</h1>
          <div className="card">
            <h2 className="text-lg font-medium mb-2">{t('settings.exchangeConnections','Exchange Connections')}</h2>
            <div className="flex items-center justify-between bg-gray-700/50 rounded-lg p-3">
              <div>
                <p className="font-medium">Bybit</p>
                <p className="text-sm text-gray-400">Status: {bybitConfigured ? 'Connected' : 'Not configured'}</p>
              </div>
              <span className={`badge ${bybitConfigured ? 'badge-success' : 'badge-warning'}`}>{bybitConfigured ? 'OK' : 'Action Required'}</span>
            </div>
            {!bybitConfigured && (
              <p className="text-sm text-gray-400 mt-3">
                Set BYBIT_API_KEY and BYBIT_SECRET_KEY in your .env, then redeploy backend. Make sure the key has Read permissions for Positions/Orders.
              </p>
            )}
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
