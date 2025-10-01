"use client"

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

interface TechnicalIndicator {
  [key: string]: number
}

interface TradingSignal {
  symbol: string
  signal_type: string
  strength: number
  direction: 'buy' | 'sell' | 'hold'
  price: number
  timestamp: number
  indicators: { [key: string]: number }
  description: string
}

interface AnalysisData {
  symbol: string
  indicators: TechnicalIndicator
  signals: TradingSignal[]
  timestamp: number
  signal_count: number
}

interface AnalysisResponse {
  symbol: string
  analysis: AnalysisData
  timestamp: string
}

interface IndicatorsResponse {
  symbol: string
  indicators: TechnicalIndicator
  timestamp: string
}

interface SignalsResponse {
  symbol: string
  signals: TradingSignal[]
  timestamp: string
}

interface AllSignalsResponse {
  signals: TradingSignal[]
  total: number
  timestamp: string
}

interface AllIndicatorsResponse {
  indicators: Array<{
    symbol: string
    indicators: TechnicalIndicator
    timestamp: string
  }>
  total: number
  timestamp: string
}

interface AnalysisSummary {
  total_symbols: number
  signals_by_type: { [key: string]: number }
  top_signals: TradingSignal[]
  indicators_available: string[]
  timestamp: string
}

// Hook for getting analysis data for a specific symbol
export function useAnalysis(symbol: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['analysis', symbol],
    queryFn: async (): Promise<AnalysisResponse> => {
      const response = await fetch(`${apiUrl}/api/v1/analysis/analysis/${symbol}`)
      if (!response.ok) {
        throw new Error('Failed to fetch analysis data')
      }
      return response.json()
    },
    enabled: !!symbol,
    refetchInterval: 10000, // Refresh every 10 seconds
    refetchOnWindowFocus: false,
  })

  return { data, isLoading, error }
}

// Hook for getting technical indicators for a specific symbol
export function useIndicators(symbol: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['indicators', symbol],
    queryFn: async (): Promise<IndicatorsResponse> => {
      const response = await fetch(`${apiUrl}/api/v1/analysis/indicators/${symbol}`)
      if (!response.ok) {
        throw new Error('Failed to fetch indicators')
      }
      return response.json()
    },
    enabled: !!symbol,
    refetchInterval: 10000,
    refetchOnWindowFocus: false,
  })

  return { data, isLoading, error }
}

// Hook for getting trading signals for a specific symbol
export function useSignals(symbol: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['signals', symbol],
    queryFn: async (): Promise<SignalsResponse> => {
      const response = await fetch(`${apiUrl}/api/v1/analysis/signals/${symbol}`)
      if (!response.ok) {
        throw new Error('Failed to fetch signals')
      }
      return response.json()
    },
    enabled: !!symbol,
    refetchInterval: 10000,
    refetchOnWindowFocus: false,
  })

  return { data, isLoading, error }
}

// Hook for getting all trading signals
export function useAllSignals(
  limit = 50,
  signalType?: string,
  minStrength = 0.6
) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['allSignals', limit, signalType, minStrength],
    queryFn: async (): Promise<AllSignalsResponse> => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        min_strength: minStrength.toString(),
      })
      
      if (signalType) {
        params.append('signal_type', signalType)
      }
      
      const response = await fetch(`${apiUrl}/api/v1/analysis/signals?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch signals')
      }
      return response.json()
    },
    refetchInterval: 15000, // Refresh every 15 seconds
    refetchOnWindowFocus: false,
  })

  return { data, isLoading, error }
}

// Hook for getting all technical indicators
export function useAllIndicators(limit = 50, indicatorType?: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['allIndicators', limit, indicatorType],
    queryFn: async (): Promise<AllIndicatorsResponse> => {
      const params = new URLSearchParams({
        limit: limit.toString(),
      })
      
      if (indicatorType) {
        params.append('indicator_type', indicatorType)
      }
      
      const response = await fetch(`${apiUrl}/api/v1/analysis/indicators?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch indicators')
      }
      return response.json()
    },
    refetchInterval: 15000,
    refetchOnWindowFocus: false,
  })

  return { data, isLoading, error }
}

// Hook for getting analysis summary
export function useAnalysisSummary() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['analysisSummary'],
    queryFn: async (): Promise<AnalysisSummary> => {
      const response = await fetch(`${apiUrl}/api/v1/analysis/summary`)
      if (!response.ok) {
        throw new Error('Failed to fetch analysis summary')
      }
      return response.json()
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    refetchOnWindowFocus: false,
  })

  return { data, isLoading, error }
}

// Hook for getting analysis health
export function useAnalysisHealth() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['analysisHealth'],
    queryFn: async () => {
      const response = await fetch(`${apiUrl}/api/v1/analysis/health`)
      if (!response.ok) {
        throw new Error('Failed to fetch analysis health')
      }
      return response.json()
    },
    refetchInterval: 60000, // Refresh every minute
    refetchOnWindowFocus: false,
  })

  return { data, isLoading, error }
}

// Utility functions for working with analysis data
export function getSignalStrengthColor(strength: number): string {
  if (strength >= 0.8) return 'text-green-500'
  if (strength >= 0.6) return 'text-yellow-500'
  return 'text-red-500'
}

export function getSignalDirectionColor(direction: string): string {
  switch (direction) {
    case 'buy':
      return 'text-green-500'
    case 'sell':
      return 'text-red-500'
    default:
      return 'text-gray-500'
  }
}

export function getSignalDirectionIcon(direction: string): string {
  switch (direction) {
    case 'buy':
      return '↗'
    case 'sell':
      return '↘'
    default:
      return '→'
  }
}

export function formatIndicatorValue(value: number, indicatorType: string): string {
  if (indicatorType.includes('rsi') || indicatorType.includes('stoch')) {
    return value.toFixed(1)
  }
  if (indicatorType.includes('price') || indicatorType.includes('sma') || indicatorType.includes('ema')) {
    return value.toFixed(2)
  }
  if (indicatorType.includes('change')) {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }
  return value.toFixed(4)
}

export function getIndicatorDescription(indicatorType: string): string {
  const descriptions: { [key: string]: string } = {
    'rsi_14': 'Relative Strength Index (14 periods)',
    'sma_20': 'Simple Moving Average (20 periods)',
    'sma_50': 'Simple Moving Average (50 periods)',
    'ema_12': 'Exponential Moving Average (12 periods)',
    'ema_26': 'Exponential Moving Average (26 periods)',
    'macd': 'MACD Line',
    'signal': 'MACD Signal Line',
    'histogram': 'MACD Histogram',
    'upper': 'Bollinger Bands Upper',
    'middle': 'Bollinger Bands Middle',
    'lower': 'Bollinger Bands Lower',
    'k': 'Stochastic %K',
    'd': 'Stochastic %D',
    'atr_14': 'Average True Range (14 periods)',
    'price': 'Current Price',
    'price_change_1h': 'Price Change (1 hour)',
    'price_change_4h': 'Price Change (4 hours)',
    'price_change_24h': 'Price Change (24 hours)',
  }
  
  return descriptions[indicatorType] || indicatorType
}

