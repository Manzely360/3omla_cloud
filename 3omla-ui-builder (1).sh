#!/bin/bash

# 3OMLA UI/UX COMPONENTS & SERVICES BUILDER
# ==========================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${MAGENTA}============================================${NC}"
echo -e "${CYAN}   BUILDING UI/UX COMPONENTS & SERVICES${NC}"
echo -e "${MAGENTA}============================================${NC}"

PROJECT_DIR="3omla-trading-platform"

# Navigate to project
cd "$PROJECT_DIR" 2>/dev/null || {
    echo -e "${RED}Project directory not found. Run 3omla-rebuild.sh first!${NC}"
    exit 1
}

# Create global styles
echo -e "${BLUE}Creating global styles...${NC}"
cat > src/styles/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 224 71.4% 4.1%;
    --primary: 201 96% 32%;
    --primary-foreground: 210 20% 98%;
    --secondary: 220 14.3% 95.9%;
    --secondary-foreground: 220.9 39.3% 11%;
    --accent: 220 14.3% 95.9%;
    --accent-foreground: 220.9 39.3% 11%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 20% 98%;
    --border: 220 13% 91%;
    --input: 220 13% 91%;
    --ring: 201 96% 32%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 224 47.4% 11.2%;
    --foreground: 210 20% 98%;
    --primary: 201 96% 32%;
    --primary-foreground: 210 20% 98%;
    --secondary: 215 27.9% 16.9%;
    --secondary-foreground: 210 20% 98%;
    --accent: 215 27.9% 16.9%;
    --accent-foreground: 210 20% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 20% 98%;
    --border: 215 27.9% 16.9%;
    --input: 215 27.9% 16.9%;
    --ring: 201 96% 32%;
  }
}

@layer utilities {
  .gradient-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
  
  .gradient-success {
    background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
  }
  
  .gradient-danger {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  }
  
  .glow-primary {
    box-shadow: 0 0 20px rgba(102, 126, 234, 0.4);
  }
  
  .glass-effect {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .trading-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
  }
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #4b4b63;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #5a5a73;
}

/* Chart animations */
@keyframes chartEntry {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.chart-container {
  animation: chartEntry 0.5s ease-out;
}

/* Loading animations */
.pulse-dot {
  animation: pulse-dot 1.4s infinite ease-in-out both;
}

@keyframes pulse-dot {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
EOF

# Create main layout component
echo -e "${BLUE}Creating layout component...${NC}"
mkdir -p src/components/layout
cat > src/components/layout/MainLayout.tsx << 'EOF'
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Footer } from './Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className={`min-h-screen bg-background ${theme}`}>
      <Toaster
        position="top-right"
        toastOptions={{
          className: '',
          style: {
            background: theme === 'dark' ? '#2a2a3e' : '#fff',
            color: theme === 'dark' ? '#fff' : '#000',
            border: '1px solid',
            borderColor: theme === 'dark' ? '#404056' : '#e5e7eb',
          },
        }}
      />
      
      <Header 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isMobile={isMobile}
      />
      
      <div className="flex">
        <AnimatePresence mode="wait">
          {sidebarOpen && (
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={`${isMobile ? 'fixed inset-0 z-50 bg-black/50' : ''}`}
              onClick={isMobile ? () => setSidebarOpen(false) : undefined}
            >
              <div onClick={(e) => e.stopPropagation()}>
                <Sidebar isMobile={isMobile} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <main 
          className={`flex-1 transition-all duration-300 ${
            sidebarOpen && !isMobile ? 'ml-64' : 'ml-0'
          }`}
        >
          <div className="container mx-auto px-4 py-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>
      
      <Footer />
    </div>
  );
}
EOF

# Create WebSocket service for real-time data
echo -e "${BLUE}Creating WebSocket service...${NC}"
cat > src/services/websocket.ts << 'EOF'
import { EventEmitter } from 'events';

interface WebSocketConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

interface MarketData {
  symbol: string;
  price: string;
  volume: string;
  change24h: string;
  high24h: string;
  low24h: string;
  timestamp: number;
}

export class WebSocketService extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingTimer: NodeJS.Timeout | null = null;
  private subscriptions = new Set<string>();

  constructor(config: WebSocketConfig) {
    super();
    this.config = {
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      ...config,
    };
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.url);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          this.setupPing();
          this.resubscribe();
          this.emit('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.emit('error', error);
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.cleanup();
          this.emit('disconnected');
          this.scheduleReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleMessage(data: any) {
    // Parse different exchange formats
    if (data.e === 'trade') {
      // Binance format
      this.emit('trade', {
        symbol: data.s,
        price: data.p,
        quantity: data.q,
        timestamp: data.T,
      });
    } else if (data.type === 'ticker') {
      // Generic ticker format
      this.emit('ticker', this.parseMarketData(data));
    } else if (data.stream && data.data) {
      // Stream data format
      this.handleStreamData(data);
    }
  }

  private parseMarketData(data: any): MarketData {
    return {
      symbol: data.symbol || data.s,
      price: data.price || data.c,
      volume: data.volume || data.v,
      change24h: data.priceChangePercent || data.P,
      high24h: data.high || data.h,
      low24h: data.low || data.l,
      timestamp: data.timestamp || Date.now(),
    };
  }

  private handleStreamData(data: any) {
    const { stream, data: streamData } = data;
    
    if (stream.includes('ticker')) {
      this.emit('ticker', this.parseMarketData(streamData));
    } else if (stream.includes('depth')) {
      this.emit('orderbook', streamData);
    } else if (stream.includes('trade')) {
      this.emit('trade', streamData);
    }
  }

  subscribe(symbols: string[], streams: string[] = ['ticker', 'trade']) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected');
      return;
    }

    const subscribeMessage = {
      method: 'SUBSCRIBE',
      params: symbols.flatMap(symbol => 
        streams.map(stream => `${symbol.toLowerCase()}@${stream}`)
      ),
      id: Date.now(),
    };

    symbols.forEach(symbol => this.subscriptions.add(symbol));
    this.ws.send(JSON.stringify(subscribeMessage));
  }

  unsubscribe(symbols: string[]) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const unsubscribeMessage = {
      method: 'UNSUBSCRIBE',
      params: symbols.map(symbol => `${symbol.toLowerCase()}@ticker`),
      id: Date.now(),
    };

    symbols.forEach(symbol => this.subscriptions.delete(symbol));
    this.ws.send(JSON.stringify(unsubscribeMessage));
  }

  private resubscribe() {
    if (this.subscriptions.size > 0) {
      this.subscribe(Array.from(this.subscriptions));
    }
  }

  private setupPing() {
    this.pingTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ ping: Date.now() }));
      }
    }, 30000);
  }

  private cleanup() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private scheduleReconnect() {
    if (
      this.reconnectAttempts >= (this.config.maxReconnectAttempts || 10)
    ) {
      console.error('Max reconnect attempts reached');
      this.emit('max_reconnect_reached');
      return;
    }

    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      console.log(`Reconnecting... (attempt ${this.reconnectAttempts})`);
      this.connect();
    }, this.config.reconnectInterval);
  }

  disconnect() {
    this.cleanup();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// Singleton instances for different exchanges
export const binanceWS = new WebSocketService({
  url: process.env.NEXT_PUBLIC_WS_BINANCE || 'wss://stream.binance.com:9443/ws',
});

export const bybitWS = new WebSocketService({
  url: process.env.NEXT_PUBLIC_WS_BYBIT || 'wss://stream.bybit.com/v5/public/spot',
});

export const kucoinWS = new WebSocketService({
  url: process.env.NEXT_PUBLIC_WS_KUCOIN || 'wss://ws-api-spot.kucoin.com',
});
EOF

# Create Exchange API Service
echo -e "${BLUE}Creating Exchange API service...${NC}"
cat > src/services/exchangeAPI.ts << 'EOF'
import ccxt from 'ccxt';
import { toast } from 'react-hot-toast';

export type ExchangeName = 'binance' | 'bybit' | 'kucoin';

interface ExchangeCredentials {
  apiKey: string;
  secret: string;
  passphrase?: string; // For KuCoin
}

interface OrderParams {
  symbol: string;
  type: 'market' | 'limit';
  side: 'buy' | 'sell';
  amount: number;
  price?: number;
}

class ExchangeService {
  private exchanges: Map<ExchangeName, ccxt.Exchange> = new Map();
  private initialized = false;

  async initializeExchange(
    name: ExchangeName,
    credentials: ExchangeCredentials
  ): Promise<boolean> {
    try {
      let exchange: ccxt.Exchange;

      const config = {
        apiKey: credentials.apiKey,
        secret: credentials.secret,
        enableRateLimit: true,
        options: {
          defaultType: 'spot',
        },
      };

      switch (name) {
        case 'binance':
          exchange = new ccxt.binance(config);
          break;
        case 'bybit':
          exchange = new ccxt.bybit(config);
          break;
        case 'kucoin':
          exchange = new ccxt.kucoin({
            ...config,
            password: credentials.passphrase,
          });
          break;
        default:
          throw new Error(`Unsupported exchange: ${name}`);
      }

      // Test connection
      await exchange.loadMarkets();
      await exchange.fetchBalance();

      this.exchanges.set(name, exchange);
      toast.success(`${name} connected successfully!`);
      return true;
    } catch (error: any) {
      console.error(`Failed to initialize ${name}:`, error);
      toast.error(`Failed to connect ${name}: ${error.message}`);
      return false;
    }
  }

  async getBalance(exchangeName: ExchangeName) {
    const exchange = this.exchanges.get(exchangeName);
    if (!exchange) {
      throw new Error(`${exchangeName} not initialized`);
    }

    try {
      const balance = await exchange.fetchBalance();
      return {
        total: balance.total,
        free: balance.free,
        used: balance.used,
      };
    } catch (error: any) {
      console.error(`Failed to fetch balance from ${exchangeName}:`, error);
      throw error;
    }
  }

  async getMarkets(exchangeName: ExchangeName) {
    const exchange = this.exchanges.get(exchangeName);
    if (!exchange) {
      throw new Error(`${exchangeName} not initialized`);
    }

    try {
      await exchange.loadMarkets();
      return Object.values(exchange.markets).filter(
        market => market.active && market.spot
      );
    } catch (error: any) {
      console.error(`Failed to fetch markets from ${exchangeName}:`, error);
      throw error;
    }
  }

  async getTicker(exchangeName: ExchangeName, symbol: string) {
    const exchange = this.exchanges.get(exchangeName);
    if (!exchange) {
      throw new Error(`${exchangeName} not initialized`);
    }

    try {
      const ticker = await exchange.fetchTicker(symbol);
      return {
        symbol: ticker.symbol,
        last: ticker.last,
        bid: ticker.bid,
        ask: ticker.ask,
        high: ticker.high,
        low: ticker.low,
        volume: ticker.baseVolume,
        change: ticker.percentage,
        timestamp: ticker.timestamp,
      };
    } catch (error: any) {
      console.error(`Failed to fetch ticker from ${exchangeName}:`, error);
      throw error;
    }
  }

  async getOrderBook(exchangeName: ExchangeName, symbol: string, limit = 20) {
    const exchange = this.exchanges.get(exchangeName);
    if (!exchange) {
      throw new Error(`${exchangeName} not initialized`);
    }

    try {
      const orderBook = await exchange.fetchOrderBook(symbol, limit);
      return {
        bids: orderBook.bids,
        asks: orderBook.asks,
        timestamp: orderBook.timestamp,
      };
    } catch (error: any) {
      console.error(`Failed to fetch order book from ${exchangeName}:`, error);
      throw error;
    }
  }

  async placeOrder(exchangeName: ExchangeName, params: OrderParams) {
    const exchange = this.exchanges.get(exchangeName);
    if (!exchange) {
      throw new Error(`${exchangeName} not initialized`);
    }

    try {
      const order = await exchange.createOrder(
        params.symbol,
        params.type,
        params.side,
        params.amount,
        params.price
      );

      toast.success(
        `Order placed on ${exchangeName}: ${params.side.toUpperCase()} ${
          params.amount
        } ${params.symbol}`
      );

      return order;
    } catch (error: any) {
      console.error(`Failed to place order on ${exchangeName}:`, error);
      toast.error(`Order failed: ${error.message}`);
      throw error;
    }
  }

  async getOpenOrders(exchangeName: ExchangeName, symbol?: string) {
    const exchange = this.exchanges.get(exchangeName);
    if (!exchange) {
      throw new Error(`${exchangeName} not initialized`);
    }

    try {
      const orders = await exchange.fetchOpenOrders(symbol);
      return orders;
    } catch (error: any) {
      console.error(`Failed to fetch open orders from ${exchangeName}:`, error);
      throw error;
    }
  }

  async cancelOrder(exchangeName: ExchangeName, orderId: string, symbol: string) {
    const exchange = this.exchanges.get(exchangeName);
    if (!exchange) {
      throw new Error(`${exchangeName} not initialized`);
    }

    try {
      const result = await exchange.cancelOrder(orderId, symbol);
      toast.success(`Order cancelled on ${exchangeName}`);
      return result;
    } catch (error: any) {
      console.error(`Failed to cancel order on ${exchangeName}:`, error);
      toast.error(`Failed to cancel order: ${error.message}`);
      throw error;
    }
  }

  async getTradeHistory(
    exchangeName: ExchangeName,
    symbol?: string,
    limit = 50
  ) {
    const exchange = this.exchanges.get(exchangeName);
    if (!exchange) {
      throw new Error(`${exchangeName} not initialized`);
    }

    try {
      const trades = await exchange.fetchMyTrades(symbol, undefined, limit);
      return trades;
    } catch (error: any) {
      console.error(`Failed to fetch trade history from ${exchangeName}:`, error);
      throw error;
    }
  }

  isExchangeConnected(exchangeName: ExchangeName): boolean {
    return this.exchanges.has(exchangeName);
  }

  getConnectedExchanges(): ExchangeName[] {
    return Array.from(this.exchanges.keys());
  }
}

// Export singleton instance
export const exchangeService = new ExchangeService();
EOF

echo -e "${GREEN}✓ UI/UX Components and services created successfully!${NC}"

# Create the main app pages
echo -e "${BLUE}Creating main application pages...${NC}"

# Create app directory structure
mkdir -p src/app

# Create main page.tsx
cat > src/app/page.tsx << 'EOF'
'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { useAuth } from '@/hooks/useAuth';
import { LandingPage } from '@/components/landing/LandingPage';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return (
    <MainLayout>
      <Dashboard />
    </MainLayout>
  );
}
EOF

# Create layout.tsx
cat > src/app/layout.tsx << 'EOF'
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '3OMLA Trading Platform - AI-Powered Crypto Trading',
  description: 'Advanced cryptocurrency trading platform with AI analysis and automation',
  keywords: 'crypto, trading, bitcoin, ethereum, binance, bybit, kucoin, automated trading',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
EOF

echo -e "${GREEN}✓ Application structure created!${NC}"
echo ""
echo -e "${CYAN}Components and services have been created with:${NC}"
echo "• Modern UI/UX with dark/light mode"
echo "• WebSocket service for real-time data"
echo "• Exchange API integration (Binance, Bybit, KuCoin)"
echo "• Responsive design with mobile support"
echo "• Authentication system ready"
echo "• Trading features implementation"
echo ""
echo -e "${YELLOW}Ready to proceed with deployment setup!${NC}"
