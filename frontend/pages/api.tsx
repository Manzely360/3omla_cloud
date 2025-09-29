import Head from 'next/head'
import Layout from '../components/Layout'
import { useI18n } from '../lib/i18n'
import Favicon from '../components/Favicon'

export default function API() {
  const { t } = useI18n()

  return (
    <>
      <Favicon />
      <Head>
        <title>API Documentation - 3omla</title>
        <meta name="description" content="3omla API Documentation - Access our trading intelligence data through our REST API." />
      </Head>

      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12">
          <div className="max-w-4xl mx-auto px-6">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50">
              <h1 className="text-4xl font-bold text-white mb-8 text-center" style={{
                textShadow: '0 0 10px #00bfff, 0 0 20px #00bfff'
              }}>
                API Documentation
              </h1>
              
              <div className="space-y-8">
                <section>
                  <h2 className="text-2xl font-semibold text-white mb-4">Getting Started</h2>
                  <p className="text-slate-300 leading-relaxed mb-4">
                    The 3omla API provides programmatic access to our trading intelligence data, signals, and analytics. 
                    Use our API to integrate 3omla's insights into your own applications and trading systems.
                  </p>
                  
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-white mb-2">Base URL</h3>
                    <code className="text-blue-400">https://api.3omla.com/v1</code>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-white mb-4">Authentication</h2>
                  <p className="text-slate-300 leading-relaxed mb-4">
                    All API requests require authentication using your API key. Include your API key in the Authorization header:
                  </p>
                  
                  <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-green-400 text-sm">
{`Authorization: Bearer YOUR_API_KEY`}
                    </pre>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-white mb-4">Endpoints</h2>
                  
                  <div className="space-y-6">
                    <div className="bg-slate-700/50 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-white mb-3">Get Active Signals</h3>
                      <div className="bg-slate-900 rounded p-3 mb-3">
                        <code className="text-green-400">GET /signals/active</code>
                      </div>
                      <p className="text-slate-300 mb-3">Retrieve currently active trading signals.</p>
                      <div className="bg-slate-900 rounded p-3">
                        <pre className="text-blue-400 text-sm">
{`{
  "signals": [
    {
      "symbol": "BTCUSDT",
      "action": "BUY",
      "strength": 0.85,
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}`}
                        </pre>
                      </div>
                    </div>

                    <div className="bg-slate-700/50 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-white mb-3">Get Correlation Matrix</h3>
                      <div className="bg-slate-900 rounded p-3 mb-3">
                        <code className="text-green-400">GET /analytics/correlation-matrix</code>
                      </div>
                      <p className="text-slate-300 mb-3">Get correlation data between different cryptocurrencies.</p>
                    </div>

                    <div className="bg-slate-700/50 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-white mb-3">Get Lead-Lag Analysis</h3>
                      <div className="bg-slate-900 rounded p-3 mb-3">
                        <code className="text-green-400">GET /analytics/lead-lag</code>
                      </div>
                      <p className="text-slate-300 mb-3">Retrieve lead-lag relationship data between trading pairs.</p>
                    </div>

                    <div className="bg-slate-700/50 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-white mb-3">Get Market Data</h3>
                      <div className="bg-slate-900 rounded p-3 mb-3">
                        <code className="text-green-400">GET /market/prices</code>
                      </div>
                      <p className="text-slate-300 mb-3">Get real-time price data from multiple exchanges.</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-white mb-4">Rate Limits</h2>
                  <p className="text-slate-300 leading-relaxed mb-4">
                    API requests are rate limited to ensure fair usage:
                  </p>
                  <ul className="text-slate-300 space-y-2">
                    <li>• Free tier: 100 requests per hour</li>
                    <li>• Premium tier: 1,000 requests per hour</li>
                    <li>• Enterprise tier: 10,000 requests per hour</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-white mb-4">Error Handling</h2>
                  <p className="text-slate-300 leading-relaxed mb-4">
                    The API uses standard HTTP status codes and returns error details in JSON format:
                  </p>
                  
                  <div className="bg-slate-900 rounded-lg p-4">
                    <pre className="text-red-400 text-sm">
{`{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again later.",
    "details": "You have exceeded 100 requests per hour"
  }
}`}
                    </pre>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-white mb-4">Getting API Access</h2>
                  <p className="text-slate-300 leading-relaxed mb-6">
                    To get started with the 3omla API, you'll need to:
                  </p>
                  <ol className="text-slate-300 space-y-2 mb-6">
                    <li>1. Create a 3omla account</li>
                    <li>2. Upgrade to a premium subscription</li>
                    <li>3. Generate your API key in the account settings</li>
                    <li>4. Start making requests to our endpoints</li>
                  </ol>
                  
                  <div className="flex flex-wrap gap-4">
                    <a 
                      href="/signup" 
                      className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                    >
                      Get Started
                    </a>
                    <a 
                      href="/contact" 
                      className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-semibold transition-colors"
                    >
                      Contact Sales
                    </a>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  )
}
