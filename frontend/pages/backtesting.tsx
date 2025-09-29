import Head from 'next/head'
import { useQuery } from 'react-query'
import Layout from '../components/Layout'
import { api } from '../lib/api'

export default function BacktestingPage() {
  const { data: strategies } = useQuery(['strategies'], () => api.getStrategies())
  const { data: backtests } = useQuery(['backtests'], () => api.getBacktests())

  return (
    <>
      <Head><title>Backtesting - 3OMLA Intelligence Hub</title></Head>
      <Layout>
        <div className="space-y-6">
          <h1 className="text-2xl font-semibold">Backtesting</h1>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="text-lg font-medium mb-3">Strategies</h2>
              <div className="space-y-2">
                {(strategies || []).map((s: any) => (
                  <div key={s.name} className="flex items-center justify-between bg-gray-700/50 rounded-lg p-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{s.name}</p>
                      <p className="text-sm text-gray-400 truncate">{s.description || s.type}</p>
                    </div>
                    <button className="btn-secondary text-xs">Configure</button>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <h2 className="text-lg font-medium mb-3">Recent Backtests</h2>
              <div className="space-y-2">
                {(backtests || []).map((b: any) => (
                  <div key={b.id} className="grid grid-cols-4 gap-2 text-sm bg-gray-700/50 rounded-lg p-3">
                    <span className="truncate">{b.name}</span>
                    <span className="truncate">{b.status}</span>
                    <span className="truncate">{b.total_return ?? '-'}%</span>
                    <span className="truncate">{new Date(b.created_at).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  )
}

