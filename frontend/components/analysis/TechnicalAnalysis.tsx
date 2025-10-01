"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  BarChart3, 
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react"
import { useAnalysis, useSignals, useIndicators } from "@/hooks/useAnalysis"
import { 
  getSignalStrengthColor, 
  getSignalDirectionColor, 
  getSignalDirectionIcon,
  formatIndicatorValue,
  getIndicatorDescription
} from "@/hooks/useAnalysis"

interface TechnicalAnalysisProps {
  symbol: string
  className?: string
}

export function TechnicalAnalysis({ symbol, className }: TechnicalAnalysisProps) {
  const { data: analysis, isLoading: analysisLoading } = useAnalysis(symbol)
  const { data: signals, isLoading: signalsLoading } = useSignals(symbol)
  const { data: indicators, isLoading: indicatorsLoading } = useIndicators(symbol)

  const isLoading = analysisLoading || signalsLoading || indicatorsLoading

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Technical Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const analysisData = analysis?.analysis
  const signalsData = signals?.signals || []
  const indicatorsData = indicators?.indicators || {}

  // Group indicators by category
  const movingAverages = Object.entries(indicatorsData)
    .filter(([key]) => key.includes('sma') || key.includes('ema'))
    .map(([key, value]) => ({ name: key, value }))

  const oscillators = Object.entries(indicatorsData)
    .filter(([key]) => key.includes('rsi') || key.includes('stoch'))
    .map(([key, value]) => ({ name: key, value }))

  const macd = Object.entries(indicatorsData)
    .filter(([key]) => key.includes('macd') || key.includes('signal') || key.includes('histogram'))
    .map(([key, value]) => ({ name: key, value }))

  const bollingerBands = Object.entries(indicatorsData)
    .filter(([key]) => key.includes('upper') || key.includes('middle') || key.includes('lower'))
    .map(([key, value]) => ({ name: key, value }))

  const priceData = Object.entries(indicatorsData)
    .filter(([key]) => key.includes('price') || key.includes('change'))
    .map(([key, value]) => ({ name: key, value }))

  return (
    <div className={className}>
      {/* Signals Section */}
      {signalsData.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Trading Signals</span>
              <Badge variant="secondary">{signalsData.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {signalsData.map((signal, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-lg border bg-card"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">
                        {getSignalDirectionIcon(signal.direction)}
                      </span>
                      <span className="font-medium">{signal.signal_type}</span>
                    </div>
                    <Badge 
                      variant={signal.direction === 'buy' ? 'default' : 'destructive'}
                      className={getSignalDirectionColor(signal.direction)}
                    >
                      {signal.direction.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Strength</span>
                      <span className={`font-medium ${getSignalStrengthColor(signal.strength)}`}>
                        {(signal.strength * 100).toFixed(1)}%
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Price</span>
                      <span className="font-medium">
                        ${signal.price.toFixed(2)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {signal.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Technical Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Moving Averages */}
        {movingAverages.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Moving Averages</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {movingAverages.map((indicator, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">
                        {getIndicatorDescription(indicator.name)}
                      </span>
                    </div>
                    <span className="text-sm font-mono">
                      {formatIndicatorValue(indicator.value, indicator.name)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Oscillators */}
        {oscillators.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Oscillators</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {oscillators.map((indicator, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">
                        {getIndicatorDescription(indicator.name)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-mono">
                        {formatIndicatorValue(indicator.value, indicator.name)}
                      </span>
                      {indicator.name.includes('rsi') && (
                        <div className="flex items-center space-x-1">
                          {indicator.value > 70 && (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          {indicator.value < 30 && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          {indicator.value >= 30 && indicator.value <= 70 && (
                            <div className="h-4 w-4 rounded-full bg-gray-300" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* MACD */}
        {macd.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>MACD</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {macd.map((indicator, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">
                        {getIndicatorDescription(indicator.name)}
                      </span>
                    </div>
                    <span className="text-sm font-mono">
                      {formatIndicatorValue(indicator.value, indicator.name)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bollinger Bands */}
        {bollingerBands.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingDown className="h-5 w-5" />
                <span>Bollinger Bands</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bollingerBands.map((indicator, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">
                        {getIndicatorDescription(indicator.name)}
                      </span>
                    </div>
                    <span className="text-sm font-mono">
                      {formatIndicatorValue(indicator.value, indicator.name)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Price Data */}
        {priceData.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Price Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {priceData.map((indicator, index) => (
                  <div key={index} className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">
                      {getIndicatorDescription(indicator.name)}
                    </div>
                    <div className={`text-lg font-bold ${
                      indicator.name.includes('change') 
                        ? indicator.value >= 0 ? 'text-green-500' : 'text-red-500'
                        : ''
                    }`}>
                      {formatIndicatorValue(indicator.value, indicator.name)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Analysis Summary */}
      {analysisData && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Analysis Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {analysisData.signal_count}
                </div>
                <div className="text-sm text-muted-foreground">
                  Active Signals
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">
                  {Object.keys(indicatorsData).length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Indicators
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">
                  {new Date(analysisData.timestamp * 1000).toLocaleTimeString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  Last Updated
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

