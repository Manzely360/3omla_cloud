import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth tokens
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Market Data API
export const marketDataAPI = {
  // Get latest market data
  getLatest: async () => {
    const response = await api.get('/api/market-data/latest');
    return response.data;
  },

  // Get specific pair data
  getPair: async (symbol: string) => {
    const response = await api.get(`/api/market-data/pair/${symbol}`);
    return response.data;
  },

  // Get multiple pairs
  getPairs: async (symbols: string[]) => {
    const response = await api.get('/api/market-data/pairs', {
      params: { symbols: symbols.join(',') }
    });
    return response.data;
  },

  // Get trading signals
  getSignals: async () => {
    const response = await api.get('/api/trading/signals');
    return response.data;
  },

  // Get arbitrage opportunities
  getArbitrage: async () => {
    const response = await api.get('/api/arbitrage/opportunities');
    return response.data;
  },

  // Get lead-lag analysis
  getLeadLag: async (symbol1: string, symbol2: string) => {
    const response = await api.get('/api/analysis/lead-lag', {
      params: { symbol1, symbol2 }
    });
    return response.data;
  },

  // Search coins/tokens
  searchCoins: async (query: string) => {
    const response = await api.get('/api/market-data/search', {
      params: { q: query }
    });
    return response.data;
  },

  // Get real-time price updates via WebSocket
  subscribeToPrices: (symbols: string[], callback: (data: any) => void) => {
    const ws = new WebSocket(`${API_BASE_URL.replace('http', 'ws')}/ws/prices`);
    
    ws.onopen = () => {
      ws.send(JSON.stringify({ action: 'subscribe', symbols }));
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      callback(data);
    };
    
    return ws;
  }
};

export default marketDataAPI;



