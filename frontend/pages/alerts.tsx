import Head from 'next/head'
import Layout from '../components/Layout'

export default function AlertsPage() {
  return (
    <>
      <Head><title>Alerts - 3OMLA Intelligence Hub</title></Head>
      <Layout>
        <div className="space-y-6">
          <h1 className="text-2xl font-semibold">Alerts</h1>
          <div className="card">
            <p className="text-gray-300">Configure price, correlation, and lead-lag alerts. Integration coming next.</p>
          </div>
        </div>
      </Layout>
    </>
  )
}

