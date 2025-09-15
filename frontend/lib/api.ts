import axios, { AxiosResponse } from 'axios'

const API_BASE_URL = ''

const apiClient = axios.create({
  // baseURL intentionally left empty to use Next.js /api proxy
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error)
)

export const api = {
  // Market Data
  async getMarketOverview(params?: any): Promise<any> {
    return apiClient.get('/api/v1/market/market-overview', { params })
  },
  async getActiveSignals(params?: any): Promise<any[]> {
    return apiClient.get('/api/v1/signals/active', { params })
  },
  async getCorrelationMatrix(params: any): Promise<any> {
    return apiClient.get('/api/v1/analytics/correlation-matrix', { params })
  },
  async getLeadLagRelationships(params?: any): Promise<any[]> {
    return apiClient.get('/api/v1/analytics/lead-lag', { params })
  },
  async getSimilarAssets(params: { symbol: string; correlation_threshold?: number; interval?: string; limit?: number }): Promise<any[]> {
    return apiClient.get('/api/v1/analytics/similar-assets', { params })
  },
  // Trading (paper/database)
  async getPortfolio(): Promise<any> {
    return apiClient.get('/api/v1/trading/portfolio')
  },
  async getPositions(params?: any): Promise<any[]> {
    return apiClient.get('/api/v1/trading/positions', { params })
  },
  async getOrders(params?: any): Promise<any[]> {
    return apiClient.get('/api/v1/trading/orders', { params })
  },
  // Trading (live Bybit)
  async getLiveBalance(): Promise<any> {
    return apiClient.get('/api/v1/trading/live/balance')
  },
  async getLivePositions(): Promise<any[]> {
    return apiClient.get('/api/v1/trading/live/positions')
  },
  async getLiveOpenOrders(params?: { symbol?: string }): Promise<any[]> {
    return apiClient.get('/api/v1/trading/live/open-orders', { params })
  },
  async getLiveTrades(params?: { symbol?: string; limit?: number }): Promise<any[]> {
    return apiClient.get('/api/v1/trading/live/trades', { params })
  },
  // CoinMarketCap
  async getCMCOverview(): Promise<any> {
    return apiClient.get('/api/v1/cmc/market-overview')
  },
  // Integrations
  async saveCredential(provider: string, apiKey: string, apiSecret?: string) {
    return apiClient.post('/api/v1/integrations/credentials', {
      provider,
      api_key: apiKey,
      api_secret: apiSecret,
    })
  },
  async getCredential(provider: string) {
    return apiClient.get(`/api/v1/integrations/credentials/${provider}`)
  },
  // Backtesting
  async getStrategies(): Promise<any[]> {
    return apiClient.get('/api/v1/trading/strategies')
  },
  async getBacktests(params?: any): Promise<any[]> {
    return apiClient.get('/api/v1/trading/backtests', { params })
  },
}

export default api
