import Head from 'next/head'
import { useQuery } from 'react-query'
import Layout from '../components/Layout'
import MarketOverview from '../components/market/MarketOverview'
import WhaleActivity from '../components/market/WhaleActivity'
import QuickTrade from '../components/trading/QuickTrade'
import { api } from '../lib/api'

export default function MarketPage() {
  const { data: overview, isLoading, error } = useQuery(['market-overview-page'], () => api.getMarketOverview(), {
    refetchInterval: 60000,
  })

  return (
    <>
      <Head><title>Market - 3OMLA Intelligence Hub</title></Head>
      <Layout>
        <div className="space-y-6">
          <h1 className="text-2xl font-semibold">Market Overview</h1>
          {error && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              Failed to load market overview. Please try again shortly.
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <MarketOverview data={overview} isLoading={isLoading} />
            </div>
            <div className="card">
              <WhaleActivity defaultMin={100000} />
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold mb-3">Quick Trade (Paper)</h2>
            <QuickTrade defaultSymbol={'BTCUSDT'} />
          </div>
        </div>
      </Layout>
    </>
  )
}
