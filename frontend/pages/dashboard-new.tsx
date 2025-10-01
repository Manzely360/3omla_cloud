"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Search } from "@/components/ui/search"
import { TradingCard } from "@/components/ui/trading-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, Activity, BarChart3, DollarSign, Users, Wifi, WifiOff } from "lucide-react"
import { useAllMarketData, useExchangeStatus, useSymbolSearch } from "@/hooks/useRealTimeData"
import { formatPrice, formatPercentage, formatVolume } from "@/lib/utils"

// Mock stats - replace with real portfolio data
const stats = [
  {
    title: "Total Portfolio Value",
    value: "$125,430.50",
    change: "+12.5%",
    changeType: "positive" as const,
    icon: DollarSign,
  },
  {
    title: "Active Trades",
    value: "24",
    change: "+3",
    changeType: "positive" as const,
    icon: Activity,
  },
  {
    title: "Win Rate",
    value: "78.5%",
    change: "+2.1%",
    changeType: "positive" as const,
    icon: TrendingUp,
  },
  {
    title: "Total Users",
    value: "1,234",
    change: "+156",
    changeType: "positive" as const,
    icon: Users,
  },
]

export default function DashboardNew() {
  const [searchValue, setSearchValue] = React.useState("")
  
  // Real-time data hooks
  const { data: marketData, isLoading: marketDataLoading } = useAllMarketData(50, 'volume')
  const { data: exchangeStatus, isLoading: exchangeStatusLoading } = useExchangeStatus()
  const { data: searchResults, isLoading: searchLoading } = useSymbolSearch(searchValue, 20)
  
  // Get filtered tokens based on search or default market data
  const filteredTokens = React.useMemo(() => {
    if (searchValue.trim() && searchResults?.symbols) {
      return searchResults.symbols.map(symbol => ({
        symbol: symbol.symbol,
        name: symbol.symbol, // Use symbol as name for now
        price: symbol.price,
        change24h: symbol.change_24h,
        changePercent24h: symbol.change_24h,
        volume24h: symbol.volume_24h,
        marketCap: 0, // Not available in current data
      }))
    }
    
    if (marketData?.symbols) {
      return marketData.symbols.slice(0, 12).map(symbol => ({
        symbol: symbol.symbol,
        name: symbol.symbol, // Use symbol as name for now
        price: symbol.price,
        change24h: symbol.change_24h,
        changePercent24h: symbol.change_24h,
        volume24h: symbol.volume_24h,
        marketCap: 0, // Not available in current data
      }))
    }
    
    return []
  }, [searchValue, searchResults, marketData])

  const handleSearch = (value: string) => {
    setSearchValue(value)
  }

  const handleTokenSelect = (token: any) => {
    console.log("Selected token:", token)
    // Handle token selection - navigate to token page, etc.
  }
  
  // Get online exchange count
  const onlineExchanges = React.useMemo(() => {
    if (!exchangeStatus?.exchanges) return 0
    return Object.values(exchangeStatus.exchanges).filter(status => status.status === 'online').length
  }, [exchangeStatus])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Trading Dashboard
              </h1>
              <p className="text-muted-foreground text-lg">
                Real-time market data and trading insights
              </p>
            </div>
            
            {/* Exchange Status */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {onlineExchanges > 0 ? (
                  <Wifi className="h-5 w-5 text-green-500" />
                ) : (
                  <WifiOff className="h-5 w-5 text-red-500" />
                )}
                <span className="text-sm text-muted-foreground">
                  {onlineExchanges} exchanges online
                </span>
              </div>
              
              {marketDataLoading && (
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span className="text-sm text-muted-foreground">Loading...</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Search
            value={searchValue}
            onSearch={handleSearch}
            suggestions={filteredTokens}
            onSuggestionSelect={handleTokenSelect}
            isLoading={searchLoading}
            className="max-w-md"
          />
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {stats.map((stat, index) => (
            <motion.div key={stat.title} variants={itemVariants}>
              <Card className="glass-card hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className={`text-xs flex items-center ${
                    stat.changeType === "positive" ? "text-green-500" : "text-red-500"
                  }`}>
                    {stat.changeType === "positive" ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {stat.change}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Market Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Market Overview</h2>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>

          {marketDataLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <Card key={index} className="glass-card">
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-8 bg-muted rounded w-1/2"></div>
                      <div className="h-4 bg-muted rounded w-1/4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {filteredTokens.map((token, index) => (
                <motion.div key={token.symbol} variants={itemVariants}>
                  <TradingCard
                    symbol={token.symbol}
                    name={token.name}
                    price={token.price}
                    change24h={token.change24h}
                    changePercent24h={token.changePercent24h}
                    volume24h={token.volume24h}
                    marketCap={token.marketCap}
                    onClick={() => handleTokenSelect(token)}
                    animated={true}
                    glassmorphism={true}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <Card className="glass-card hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Analytics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                View detailed market analytics and trends
              </p>
              <Button className="w-full">Open Analytics</Button>
            </CardContent>
          </Card>

          <Card className="glass-card hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Trading</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Execute trades and manage your portfolio
              </p>
              <Button className="w-full">Start Trading</Button>
            </CardContent>
          </Card>

          <Card className="glass-card hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Signals</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Get real-time trading signals and alerts
              </p>
              <Button className="w-full">View Signals</Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
