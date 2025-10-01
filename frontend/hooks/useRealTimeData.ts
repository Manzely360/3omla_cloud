"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

interface MarketData {
  symbol: string
  price: number
  volume_24h: number
  change_24h: number
  exchange_count: number
  exchanges: string[]
  timestamp: number
  source: string
}

interface ExchangeData {
  symbol: string
  exchange: string
  price: number
  volume: number
  change_24h: number
  change_percent_24h: number
  timestamp: number
  source: string
}

interface RealTimeDataResponse {
  symbol: string
  exchanges: Record<string, ExchangeData>
  aggregated: MarketData | null
  timestamp: string
}

interface AllMarketDataResponse {
  symbols: MarketData[]
  total: number
  timestamp: string
}

interface ExchangeStatus {
  status: 'online' | 'offline'
  last_update?: string
  latency?: number
}

interface ExchangeStatusResponse {
  exchanges: Record<string, ExchangeStatus>
  timestamp: string
}

interface SearchResponse {
  symbols: MarketData[]
  query: string
  total: number
  timestamp: string
}

// WebSocket hook for real-time updates
export function useWebSocket(url: string) {
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<any>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url)
      
      ws.onopen = () => {
        console.log('WebSocket connected')
        setIsConnected(true)
        reconnectAttempts.current = 0
        setSocket(ws)
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          setLastMessage(data)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      ws.onclose = () => {
        console.log('WebSocket disconnected')
        setIsConnected(false)
        setSocket(null)
        
        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})`)
            connect()
          }, delay)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

    } catch (error) {
      console.error('Failed to create WebSocket:', error)
    }
  }, [url])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    if (socket) {
      socket.close()
    }
  }, [socket])

  const sendMessage = useCallback((message: any) => {
    if (socket && isConnected) {
      socket.send(JSON.stringify(message))
    }
  }, [socket, isConnected])

  useEffect(() => {
    connect()
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return {
    socket,
    isConnected,
    lastMessage,
    sendMessage,
    connect,
    disconnect
  }
}

// Hook for real-time market data
export function useRealTimeMarketData(symbol?: string) {
  const queryClient = useQueryClient()
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
  
  // WebSocket connection
  const wsUrl = apiUrl ? `${apiUrl.replace('http', 'ws')}/api/v1/realtime/ws` : `/api/v1/realtime/ws`
  const { isConnected, lastMessage, sendMessage } = useWebSocket(wsUrl)

  // Subscribe to symbol updates
  useEffect(() => {
    if (symbol && isConnected) {
      sendMessage({ type: 'subscribe', symbol })
      return () => {
        sendMessage({ type: 'unsubscribe', symbol })
      }
    }
  }, [symbol, isConnected, sendMessage])

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'market_data' && lastMessage.symbol === symbol) {
        // Update the query cache with new data
        queryClient.setQueryData(['marketData', symbol], lastMessage.data)
      } else if (lastMessage.type === 'exchange_status') {
        // Update exchange status
        queryClient.setQueryData(['exchangeStatus'], (old: any) => ({
          ...old,
          exchanges: {
            ...old?.exchanges,
            [lastMessage.exchange]: lastMessage.status
          }
        }))
      }
    }
  }, [lastMessage, symbol, queryClient])

  // REST API query for initial data
  const { data, isLoading, error } = useQuery({
    queryKey: ['marketData', symbol],
    queryFn: async (): Promise<RealTimeDataResponse> => {
      const response = await fetch(`${apiUrl}/api/v1/realtime/market-data/${symbol}`)
      if (!response.ok) {
        throw new Error('Failed to fetch market data')
      }
      return response.json()
    },
    enabled: !!symbol,
    refetchInterval: 5000, // Fallback refresh every 5 seconds
    refetchOnWindowFocus: false,
  })

  return {
    data,
    isLoading,
    error,
    isConnected,
    lastMessage
  }
}

// Hook for all market data
export function useAllMarketData(limit = 50, sortBy: 'price' | 'volume' | 'change' = 'volume') {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['allMarketData', limit, sortBy],
    queryFn: async (): Promise<AllMarketDataResponse> => {
      const response = await fetch(
        `${apiUrl}/api/v1/realtime/market-data?limit=${limit}&sort_by=${sortBy}`
      )
      if (!response.ok) {
        throw new Error('Failed to fetch market data')
      }
      return response.json()
    },
    refetchInterval: 10000, // Refresh every 10 seconds
    refetchOnWindowFocus: false,
  })

  return { data, isLoading, error }
}

// Hook for exchange status
export function useExchangeStatus() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['exchangeStatus'],
    queryFn: async (): Promise<ExchangeStatusResponse> => {
      const response = await fetch(`${apiUrl}/api/v1/realtime/exchanges/status`)
      if (!response.ok) {
        throw new Error('Failed to fetch exchange status')
      }
      return response.json()
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    refetchOnWindowFocus: false,
  })

  return { data, isLoading, error }
}

// Hook for symbol search
export function useSymbolSearch(query: string, limit = 20) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['symbolSearch', query, limit],
    queryFn: async (): Promise<SearchResponse> => {
      const response = await fetch(
        `${apiUrl}/api/v1/realtime/search?query=${encodeURIComponent(query)}&limit=${limit}`
      )
      if (!response.ok) {
        throw new Error('Failed to search symbols')
      }
      return response.json()
    },
    enabled: query.length > 0,
    refetchOnWindowFocus: false,
  })

  return { data, isLoading, error }
}

// Hook for real-time price updates
export function useRealTimePrice(symbol: string) {
  const { data, isConnected } = useRealTimeMarketData(symbol)
  
  const price = data?.aggregated?.price || 0
  const change24h = data?.aggregated?.change_24h || 0
  const volume24h = data?.aggregated?.volume_24h || 0
  const exchangeCount = data?.aggregated?.exchange_count || 0
  
  return {
    price,
    change24h,
    volume24h,
    exchangeCount,
    isConnected,
    data
  }
}

