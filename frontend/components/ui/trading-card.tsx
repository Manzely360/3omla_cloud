"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PriceDisplay } from "@/components/ui/price-display"
import { TrendingUp, TrendingDown, Activity, BarChart3 } from "lucide-react"

interface TradingCardProps {
  symbol: string
  name: string
  price: number
  change24h?: number
  changePercent24h?: number
  volume24h?: number
  marketCap?: number
  className?: string
  onClick?: () => void
  animated?: boolean
  glassmorphism?: boolean
}

export function TradingCard({
  symbol,
  name,
  price,
  change24h,
  changePercent24h,
  volume24h,
  marketCap,
  className,
  onClick,
  animated = true,
  glassmorphism = true,
}: TradingCardProps) {
  const change = change24h ?? changePercent24h ?? 0
  const isPositive = change > 0

  const cardVariants = {
    hover: {
      y: -8,
      scale: 1.02,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    },
    tap: {
      scale: 0.98,
      transition: {
        duration: 0.1
      }
    }
  }

  const glowVariants = {
    hover: {
      opacity: 1,
      scale: 1.1,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    },
    initial: {
      opacity: 0,
      scale: 1,
      transition: {
        duration: 0.3
      }
    }
  }

  return (
    <motion.div
      variants={animated ? cardVariants : undefined}
      whileHover={animated ? "hover" : undefined}
      whileTap={animated ? "tap" : undefined}
      className="relative"
    >
      <Card
        className={cn(
          "relative overflow-hidden cursor-pointer transition-all duration-300",
          glassmorphism && "glass-card",
          onClick && "hover:shadow-xl",
          className
        )}
        onClick={onClick}
      >
        {glassmorphism && (
          <motion.div
            variants={glowVariants}
            initial="initial"
            whileHover="hover"
            className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-secondary/20 opacity-0 pointer-events-none"
          />
        )}
        
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                isPositive ? "bg-green-500/20" : "bg-red-500/20"
              )}>
                {isPositive ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </div>
              <div>
                <CardTitle className="text-lg">{symbol}</CardTitle>
                <p className="text-sm text-muted-foreground">{name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <PriceDisplay
            price={price}
            change24h={change24h}
            changePercent24h={changePercent24h}
            volume24h={volume24h}
            marketCap={marketCap}
            symbol={symbol}
            name={name}
            animated={animated}
          />
        </CardContent>

        {/* Animated border gradient */}
        {glassmorphism && (
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/20 via-transparent to-secondary/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />
        )}
      </Card>
    </motion.div>
  )
}

