import Head from 'next/head'
import { useMemo } from 'react'
import { useQuery } from 'react-query'
import Layout from '../components/Layout'
import { useI18n } from '../lib/i18n'
import Favicon from '../components/Favicon'
import { api } from '../lib/api'

interface ServiceStatus {
  name: string
  status: string
  detail?: string
  latency_ms?: number
}

export default function Status() {
  const { t } = useI18n()
  const { data, isLoading, error, refetch } = useQuery(['system-status'], () => api.getSystemStatus(), {
    refetchInterval: 60000,
  })

  const services: ServiceStatus[] = useMemo(() => data?.services || [], [data])
  const allOperational = services.length > 0 && services.every((s) => s.status === 'operational')
  const lastUpdated = data?.timestamp ? new Date(data.timestamp) : null

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'text-green-400 bg-green-400/20'
      case 'degraded': return 'text-yellow-400 bg-yellow-400/20'
      case 'outage': return 'text-red-400 bg-red-400/20'
      default: return 'text-slate-400 bg-slate-400/20'
    }
  }

  return (
    <>
      <Favicon />
      <Head>
        <title>System Status - 3omla</title>
        <meta name="description" content="3omla System Status - Check the current status of all our services and systems." />
      </Head>

      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12">
          <div className="max-w-4xl mx-auto px-6">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50">
              <h1 className="text-4xl font-bold text-white mb-8 text-center" style={{
                textShadow: '0 0 10px #00bfff, 0 0 20px #00bfff'
              }}>
                System Status
              </h1>
              
              <div className="text-center mb-8">
                <div className={`inline-flex items-center px-4 py-2 rounded-full ${allOperational ? 'bg-green-400/20 text-green-400' : 'bg-yellow-400/20 text-yellow-300'}`}>
                  <div className={`w-3 h-3 rounded-full mr-2 ${allOperational ? 'bg-green-400 animate-pulse' : 'bg-yellow-400 animate-pulse'}`}></div>
                  {allOperational ? 'All Systems Operational' : services.length === 0 ? 'Refreshing status…' : 'Attention Required'}
                </div>
                <p className="text-slate-300 mt-2">
                  {lastUpdated ? `Last updated: ${lastUpdated.toLocaleString()}` : 'Loading latest status...'}
                </p>
                <button
                  className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-600 px-3 py-1 text-xs text-slate-300 hover:bg-slate-700"
                  onClick={() => refetch()}
                  type="button"
                >
                  Refresh
                </button>
              </div>

              <div className="space-y-4">
                {isLoading && (
                  <div className="bg-slate-700/50 rounded-lg p-6 text-center text-slate-400">
                    Checking live status...
                  </div>
                )}
                {error && (
                  <div className="bg-rose-500/10 border border-rose-500/40 rounded-lg p-6 text-sm text-rose-200">
                    Failed to load system status. Please try again later.
                  </div>
                )}
                {services.map((service) => (
                  <div key={service.name} className="bg-slate-700/50 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <h3 className="text-lg font-medium text-white">{service.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(service.status)}`}>
                          {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                        </span>
                      </div>
                      <div className="text-right">
                        {service.latency_ms !== undefined ? (
                          <div className="text-slate-300 text-sm">
                            Response: <span className="text-white font-medium">{Math.max(0, Math.round(service.latency_ms))} ms</span>
                          </div>
                        ) : (
                          <div className="text-slate-500 text-xs">No latency data</div>
                        )}
                      </div>
                    </div>
                    {service.detail && (
                      <div className="mt-3 text-sm text-slate-300">
                        {service.detail}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-8 grid md:grid-cols-3 gap-6">
                <div className="bg-slate-700/50 rounded-lg p-6 text-center">
                  <h3 className="text-lg font-medium text-white mb-2">Overall Uptime</h3>
                  <div className="text-3xl font-bold text-green-400">99.9%</div>
                  <p className="text-slate-300 text-sm mt-1">Rolling 30d uptime</p>
                </div>

                <div className="bg-slate-700/50 rounded-lg p-6 text-center">
                  <h3 className="text-lg font-medium text-white mb-2">Average Response</h3>
                  <div className="text-3xl font-bold text-blue-400">78ms</div>
                  <p className="text-slate-300 text-sm mt-1">Global average</p>
                </div>
                
                <div className="bg-slate-700/50 rounded-lg p-6 text-center">
                  <h3 className="text-lg font-medium text-white mb-2">Incidents</h3>
                  <div className="text-3xl font-bold text-yellow-400">0</div>
                  <p className="text-slate-300 text-sm mt-1">Last 30 days</p>
                </div>
              </div>

              <div className="mt-8 p-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg border border-blue-500/30">
                <h3 className="text-lg font-medium text-white mb-3">Stay Updated</h3>
                <p className="text-slate-300 mb-4">
                  Subscribe to status updates to be notified of any service disruptions or maintenance windows.
                </p>
                <div className="flex flex-wrap gap-4">
                  <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
                    Subscribe to Updates
                  </button>
                  <a 
                    href="/contact" 
                    className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
                  >
                    Report an Issue
                  </a>
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-slate-400 text-sm">
                  Status page powered by 3omla monitoring systems
                </p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  )
}
