import Head from 'next/head'
import { useQuery } from 'react-query'
import Layout from '../components/Layout'
import ActiveSignals from '../components/signals/ActiveSignals'
import { api } from '../lib/api'

export default function SignalsPage() {
  const { data: signals, isLoading } = useQuery(
    ['active-signals'],
    () => api.getActiveSignals({ min_strength: 0.5, min_confidence: 0.6 }),
    { refetchInterval: 10000 }
  )

  return (
    <>
      <Head>
        <title>Signals - Crypto Lead-Lag Pattern Radar</title>
      </Head>
      <Layout>
        <div className="space-y-6">
          <h1 className="text-2xl font-semibold">Active Signals</h1>
          <div className="card">
            <ActiveSignals signals={signals} isLoading={isLoading} />
          </div>
        </div>
      </Layout>
    </>
  )
}

