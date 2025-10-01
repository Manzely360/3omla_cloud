"use client"

import * as React from "react"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn, formatPrice, formatPercentage, getChangeColor } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface PriceDisplayProps {
  price: number
  change24h?: number
  changePercent24h?: number
  volume24h?: number
  marketCap?: number
  symbol: string
  name?: string
  className?: string
  showTrend?: boolean
  animated?: boolean
}

export function PriceDisplay({
  price,
  change24h,
  changePercent24h,
  volume24h,
  marketCap,
  symbol,
  name,
  className,
  showTrend = true,
  animated = true,
}: PriceDisplayProps) {
  const [previousPrice, setPreviousPrice] = React.useState(price)
  const [priceDirection, setPriceDirection] = React.useState<"up" | "down" | "neutral">("neutral")

  React.useEffect(() => {
    if (price !== previousPrice) {
      setPriceDirection(price > previousPrice ? "up" : "down")
      setPreviousPrice(price)
    }
  }, [price, previousPrice])

  const change = change24h ?? changePercent24h ?? 0
  const isPositive = change > 0
  const isNegative = change < 0

  const TrendIcon = () => {
    if (isPositive) return <TrendingUp className="h-4 w-4" />
    if (isNegative) return <TrendingDown className="h-4 w-4" />
    return <Minus className="h-4 w-4" />
  }

  const priceVariants = {
    up: {
      scale: [1, 1.05, 1],
      color: "#22c55e",
      transition: { duration: 0.6, ease: "easeOut" }
    },
    down: {
      scale: [1, 1.05, 1],
      color: "#ef4444",
      transition: { duration: 0.6, ease: "easeOut" }
    },
    neutral: {
      scale: 1,
      color: "inherit",
      transition: { duration: 0.3 }
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold">{symbol}</h3>
          {name && (
            <span className="text-sm text-muted-foreground">{name}</span>
          )}
        </div>
        {showTrend && (
          <div className={cn(
            "flex items-center space-x-1 text-sm",
            getChangeColor(change)
          )}>
            <TrendIcon />
            <span>{formatPercentage(change)}</span>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={price}
          variants={animated ? priceVariants : undefined}
          animate={animated ? priceDirection : undefined}
          className="text-2xl font-bold"
        >
          {formatPrice(price)}
        </motion.div>
      </AnimatePresence>

      {(volume24h || marketCap) && (
        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
          {volume24h && (
            <div>
              <span className="block text-xs uppercase tracking-wide">Volume 24h</span>
              <span className="font-medium">
                ${(volume24h / 1e6).toFixed(2)}M
              </span>
            </div>
          )}
          {marketCap && (
            <div>
              <span className="block text-xs uppercase tracking-wide">Market Cap</span>
              <span className="font-medium">
                ${(marketCap / 1e9).toFixed(2)}B
              </span>
            </div>
          )}
        </div>
      )}

      {change24h !== undefined && (
        <div className={cn(
          "flex items-center space-x-2 text-sm",
          getChangeColor(change)
        )}>
          <span>
            {isPositive ? "+" : ""}{formatPrice(change24h)} ({formatPercentage(changePercent24h ?? 0)})
          </span>
          <span className="text-xs text-muted-foreground">24h</span>
        </div>
      )}
    </div>
  )
}

