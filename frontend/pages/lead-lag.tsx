import Head from 'next/head'
import { useQuery } from 'react-query'
import Layout from '../components/Layout'
import LeadLagNetwork from '../components/analytics/LeadLagNetwork'
import LeadLagList from '../components/analytics/LeadLagList'
import { api } from '../lib/api'

export default function LeadLagPage() {
  const { data, isLoading } = useQuery(
    ['lead-lag-page'],
    () => api.getLeadLagRelationships({ min_hit_rate: 0.6, min_correlation: 0.3, interval: '15m', limit: 50 }),
    { refetchInterval: 120000 }
  )

  return (
    <>
      <Head><title>Lead-Lag - 3OMLA Intelligence Hub</title></Head>
      <Layout>
        <div className="space-y-6">
          <h1 className="text-2xl font-semibold">Lead-Lag</h1>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <LeadLagList interval="15m" limit={15} />
            </div>
            <div className="card">
              <LeadLagNetwork data={data} isLoading={isLoading} />
            </div>
          </div>
        </div>
      </Layout>
    </>
  )
}
