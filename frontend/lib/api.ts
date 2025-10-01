const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''
const USE_MOCK_DATA = (
  (process.env.NEXT_PUBLIC_USE_MOCK_DATA ?? (process.env.NODE_ENV !== 'production' ? 'true' : 'false'))
) === 'true'

interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
}

interface PriceData {
  symbol: string
  price: number
  change24h: number
  volume24h: number
  marketCap: number
  timestamp: string
}

interface PredictionData {
  symbol: string
  currentPrice: number
  predictedPrice: number
  confidence: number
  timeFrame: string
  direction: 'up' | 'down' | 'neutral'
  reasoning: string
}

interface SignalData {
  id: string
  symbol: string
  signalType: 'buy' | 'sell' | 'hold'
  strength: number
  price: number
  timestamp: string
  reasoning: string
}

interface CorrelationData {
  symbol1: string
  symbol2: string
  correlation: number
  timeframe: string
  significance: number
}

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
      const headers = new Headers(options?.headers)

      if (!(options?.body instanceof FormData) && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json')
      }

      const token = typeof window !== 'undefined' ? window.localStorage.getItem('auth_token') : null
      if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`)
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return {
        data,
        success: true,
      }
    } catch (error) {
      console.error('API request failed:', error)
      return {
        data: null as T,
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // Price Data
  async getPrices(symbols: string[]): Promise<ApiResponse<PriceData[]>> {
    return this.request<PriceData[]>(`/api/v1/market/prices?symbols=${symbols.join(',')}`)
  }

  async getPriceHistory(symbol: string, timeframe: string = '1h', limit: number = 100): Promise<ApiResponse<PriceData[]>> {
    return this.request<PriceData[]>(`/api/v1/market/history/${symbol}?timeframe=${timeframe}&limit=${limit}`)
  }

  // Predictions
  async getPredictions(symbols: string[]): Promise<ApiResponse<PredictionData[]>> {
    return this.request<PredictionData[]>(`/api/v1/analytics/predictions?symbols=${symbols.join(',')}`)
  }

  async getPrediction(symbol: string, timeframe: string = '1h'): Promise<ApiResponse<PredictionData>> {
    return this.request<PredictionData>(`/api/v1/analytics/predictions/${symbol}?timeframe=${timeframe}`)
  }

  // Signals
  async getActiveSignals(): Promise<ApiResponse<SignalData[]>> {
    return this.request<SignalData[]>('/api/v1/signals/active')
  }

  async getSignals(symbol?: string): Promise<ApiResponse<SignalData[]>> {
    const endpoint = symbol ? `/api/v1/signals?symbol=${symbol}` : '/api/v1/signals'
    return this.request<SignalData[]>(endpoint)
  }

  // Correlations
  async getCorrelations(symbols: string[]): Promise<ApiResponse<CorrelationData[]>> {
    return this.request<CorrelationData[]>(`/api/v1/analytics/correlations?symbols=${symbols.join(',')}`)
  }

  async getCorrelationMatrix(symbols: string[]): Promise<ApiResponse<Record<string, Record<string, number>>>> {
    return this.request<Record<string, Record<string, number>>>(`/api/v1/analytics/correlation-matrix?symbols=${symbols.join(',')}`)
  }

  // Lead-Lag Analysis
  async getLeadLagAnalysis(symbols: string[]): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/api/v1/analytics/lead-lag?symbols=${symbols.join(',')}`)
  }

  // Market Overview
  async getMarketOverview(): Promise<any> {
    const result = await this.request<any>('/api/v1/market/market-overview')
    if (!result.success) {
      throw new Error(result.message || 'Failed to load market overview')
    }
    return result.data
  }

  async getCMCOverview(): Promise<any> {
    const result = await this.request<any>('/api/v1/cmc/market-overview')
    if (!result.success) {
      throw new Error(result.message || 'Failed to load CoinMarketCap overview')
    }
    return result.data
  }

  // Trading
  async getTradingHistory(userId?: string): Promise<ApiResponse<any[]>> {
    const endpoint = userId ? `/api/v1/trading/history?user_id=${userId}` : '/api/v1/trading/history'
    return this.request<any[]>(endpoint)
  }

  async getPositions(userId?: string): Promise<ApiResponse<any[]>> {
    const endpoint = userId ? `/api/v1/trading/positions?user_id=${userId}` : '/api/v1/trading/positions'
    return this.request<any[]>(endpoint)
  }

  async getLivePositions(): Promise<any[]> {
    const result = await this.request<any[]>('/api/v1/trading/live/positions')
    if (!result.success) {
      throw new Error(result.message || 'Failed to load live positions')
    }
    return result.data || []
  }

  // Demo Trading
  async getDemoPortfolio(userId: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/demo/portfolio/${userId}`)
  }

  async executeDemoTrade(trade: {
    userId: string
    symbol: string
    type: 'buy' | 'sell'
    amount: number
    price: number
  }): Promise<ApiResponse<any>> {
    return this.request<any>('/api/v1/demo/trade', {
      method: 'POST',
      body: JSON.stringify(trade),
    })
  }

  async saveCredential(provider: string, apiKey: string, apiSecret?: string | null): Promise<any> {
    const result = await this.request<any>('/api/v1/integrations/credentials', {
      method: 'POST',
      body: JSON.stringify({ provider, api_key: apiKey, api_secret: apiSecret }),
    })
    if (!result.success) {
      throw new Error(result.message || 'Failed to save credential')
    }
    return result.data
  }

  async getCredentialStatus(provider: string): Promise<boolean> {
    try {
      const result = await this.request<any>(`/api/v1/integrations/credentials/${provider}`)
      return result.success
    } catch (error: any) {
      if (error instanceof Error && error.message.includes('status: 404')) {
        return false
      }
      throw error
    }
  }

  async getSimilarAssets(params: { symbol: string; interval?: string; correlation_threshold?: number; limit?: number }): Promise<any[]> {
    const query = new URLSearchParams()
    query.set('symbol', params.symbol)
    if (params.interval) query.set('interval', params.interval)
    if (typeof params.correlation_threshold === 'number') {
      query.set('correlation_threshold', String(params.correlation_threshold))
    }
    if (typeof params.limit === 'number') query.set('limit', String(params.limit))

    const result = await this.request<any>(`/api/v1/analytics/similar-assets?${query.toString()}`)
    if (!result.success) {
      throw new Error(result.message || 'Failed to load similar assets')
    }
    return result.data || []
  }

  async getSystemStatus(): Promise<any> {
    const result = await this.request<any>('/api/v1/status')
    if (!result.success) {
      throw new Error(result.message || 'Failed to load system status')
    }
    return result.data
  }

  // Health Check
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.request<{ status: string; timestamp: string }>('/health')
  }
}

// Mock data for development/fallback
const mockData = {
  prices: [
    { symbol: 'BTCUSDT', price: 45000, change24h: 2.5, volume24h: 1000000000, marketCap: 850000000000, timestamp: new Date().toISOString() },
    { symbol: 'ETHUSDT', price: 3000, change24h: -1.2, volume24h: 500000000, marketCap: 360000000000, timestamp: new Date().toISOString() },
    { symbol: 'SOLUSDT', price: 100, change24h: 5.8, volume24h: 200000000, marketCap: 45000000000, timestamp: new Date().toISOString() },
  ],
  predictions: [
    { symbol: 'BTCUSDT', currentPrice: 45000, predictedPrice: 46500, confidence: 85, timeFrame: '1h', direction: 'up' as const, reasoning: 'Strong bullish momentum detected' },
    { symbol: 'ETHUSDT', currentPrice: 3000, predictedPrice: 2850, confidence: 72, timeFrame: '4h', direction: 'down' as const, reasoning: 'Bearish pressure identified' },
  ],
  signals: [
    { id: '1', symbol: 'BTCUSDT', signalType: 'buy' as const, strength: 0.85, price: 45000, timestamp: new Date().toISOString(), reasoning: 'Strong buy signal based on technical analysis' },
    { id: '2', symbol: 'ETHUSDT', signalType: 'sell' as const, strength: 0.72, price: 3000, timestamp: new Date().toISOString(), reasoning: 'Sell signal triggered by RSI divergence' },
  ]
}

// Enhanced API service with fallback to mock data
class EnhancedApiService extends ApiService {
  async getPrices(symbols: string[]): Promise<ApiResponse<PriceData[]>> {
    const result = await super.getPrices(symbols)
    if (!result.success) {
      if (USE_MOCK_DATA) {
        return {
          data: mockData.prices.filter(p => symbols.includes(p.symbol)),
          success: true,
          message: 'Using mock data - API unavailable'
        }
      }
      return {
        data: [],
        success: false,
        message: result.message || 'Failed to load prices'
      }
    }
    return result
  }

  async getPredictions(symbols: string[]): Promise<ApiResponse<PredictionData[]>> {
    const result = await super.getPredictions(symbols)
    if (!result.success) {
      if (USE_MOCK_DATA) {
        return {
          data: mockData.predictions.filter(p => symbols.includes(p.symbol)),
          success: true,
          message: 'Using mock data - API unavailable'
        }
      }
      return {
        data: [],
        success: false,
        message: result.message || 'Failed to load predictions'
      }
    }
    return result
  }

  async getActiveSignals(): Promise<ApiResponse<SignalData[]>> {
    const result = await super.getActiveSignals()
    if (!result.success) {
      if (USE_MOCK_DATA) {
        return {
          data: mockData.signals,
          success: true,
          message: 'Using mock data - API unavailable'
        }
      }
      return {
        data: [],
        success: false,
        message: result.message || 'Failed to load signals'
      }
    }
    return result
  }
}

export const api = new EnhancedApiService()
export default api
