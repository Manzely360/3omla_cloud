"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Volume, DollarSign } from 'lucide-react';

interface MobileTradingCardProps {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  marketCap?: number;
  onClick?: () => void;
  className?: string;
}

const MobileTradingCard: React.FC<MobileTradingCardProps> = ({
  symbol,
  name,
  price,
  change24h,
  changePercent24h,
  volume24h,
  marketCap,
  onClick,
  className = ''
}) => {
  const isPositive = changePercent24h >= 0;
  const ChangeIcon = isPositive ? TrendingUp : TrendingDown;

  const formatPrice = (price: number) => {
    if (price < 0.01) {
      return `$${price.toFixed(8)}`;
    } else if (price < 1) {
      return `$${price.toFixed(6)}`;
    } else if (price < 100) {
      return `$${price.toFixed(4)}`;
    } else {
      return `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
    }
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) {
      return `$${(volume / 1e9).toFixed(2)}B`;
    } else if (volume >= 1e6) {
      return `$${(volume / 1e6).toFixed(2)}M`;
    } else if (volume >= 1e3) {
      return `$${(volume / 1e3).toFixed(2)}K`;
    } else {
      return `$${volume.toFixed(2)}`;
    }
  };

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1e12) {
      return `$${(marketCap / 1e12).toFixed(2)}T`;
    } else if (marketCap >= 1e9) {
      return `$${(marketCap / 1e9).toFixed(2)}B`;
    } else if (marketCap >= 1e6) {
      return `$${(marketCap / 1e6).toFixed(2)}M`;
    } else {
      return `$${marketCap.toFixed(2)}`;
    }
  };

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <Card 
        className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${className}`}
        onClick={onClick}
      >
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/40 rounded-full flex items-center justify-center">
                <span className="text-primary font-bold text-sm">
                  {symbol.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{symbol}</h3>
                <p className="text-sm text-muted-foreground truncate max-w-[120px]">
                  {name}
                </p>
              </div>
            </div>
            
            <Badge 
              variant={isPositive ? "default" : "destructive"}
              className={`flex items-center space-x-1 ${
                isPositive 
                  ? 'bg-green-500/10 text-green-600 border-green-500/20' 
                  : 'bg-red-500/10 text-red-600 border-red-500/20'
              }`}
            >
              <ChangeIcon className="w-3 h-3" />
              <span className="text-xs font-medium">
                {isPositive ? '+' : ''}{changePercent24h.toFixed(2)}%
              </span>
            </Badge>
          </div>

          {/* Price and Change */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-2xl font-bold text-foreground">
                {formatPrice(price)}
              </p>
              <p className={`text-sm font-medium ${
                isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {isPositive ? '+' : ''}{formatPrice(change24h)}
              </p>
            </div>
            
            <div className="text-right">
              <div className="flex items-center space-x-1 text-muted-foreground text-sm">
                <Volume className="w-4 h-4" />
                <span>24h Vol</span>
              </div>
              <p className="font-medium text-foreground">
                {formatVolume(volume24h)}
              </p>
            </div>
          </div>

          {/* Market Cap (if available) */}
          {marketCap && (
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div className="flex items-center space-x-1 text-muted-foreground text-sm">
                <DollarSign className="w-4 h-4" />
                <span>Market Cap</span>
              </div>
              <p className="font-medium text-foreground">
                {formatMarketCap(marketCap)}
              </p>
            </div>
          )}

          {/* Price Change Indicator */}
          <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${
                isPositive ? 'bg-gradient-to-r from-green-500 to-green-400' : 'bg-gradient-to-r from-red-500 to-red-400'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(Math.abs(changePercent24h) * 10, 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MobileTradingCard;

