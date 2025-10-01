"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MobileLayout } from '@/components/layout/mobile-layout';
import { MobileTradingCard } from '@/components/ui/mobile-trading-card';
import { TradingViewWidget } from '@/components/charts/TradingViewWidget';
import { NotificationSystem } from '@/components/notifications/NotificationSystem';
import { useNotifications } from '@/hooks/useNotifications';
import { useAllMarketData } from '@/hooks/useRealTimeData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown,
  Volume,
  DollarSign,
  RefreshCw,
  Star,
  StarOff
} from 'lucide-react';

const MobileDashboard: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { data: marketData, isLoading, error, refetch } = useAllMarketData();
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    clearAll, 
    removeNotification,
    notifySuccess,
    notifyError 
  } = useNotifications();

  // Load favorites from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('3omla-favorites');
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load favorites:', error);
      }
    }
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('3omla-favorites', JSON.stringify(favorites));
  }, [favorites]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      notifySuccess('Market Data', 'Market data refreshed successfully');
    } catch (error) {
      notifyError('Refresh Failed', 'Failed to refresh market data');
    } finally {
      setIsRefreshing(false);
    }
  };

  const toggleFavorite = (symbol: string) => {
    setFavorites(prev => 
      prev.includes(symbol) 
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
  };

  const filteredData = marketData?.filter(item => {
    const matchesSearch = item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedTab === 'favorites') {
      return matchesSearch && favorites.includes(item.symbol);
    }
    
    return matchesSearch;
  }) || [];

  const tabs = [
    { id: 'all', label: 'All', count: marketData?.length || 0 },
    { id: 'favorites', label: 'Favorites', count: favorites.length },
    { id: 'gainers', label: 'Gainers', count: marketData?.filter(item => item.changePercent24h > 0).length || 0 },
    { id: 'losers', label: 'Losers', count: marketData?.filter(item => item.changePercent24h < 0).length || 0 },
  ];

  if (error) {
    return (
      <MobileLayout currentPage="dashboard">
        <div className="p-4">
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">Failed to load market data</p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout currentPage="dashboard">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Market</h1>
            <p className="text-sm text-muted-foreground">
              Real-time crypto market data
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <NotificationSystem
              notifications={notifications}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
              onClearAll={clearAll}
              onRemove={removeNotification}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search tokens..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedTab === tab.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>{tab.label}</span>
              <Badge variant="secondary" className="text-xs">
                {tab.count}
              </Badge>
            </button>
          ))}
        </div>

        {/* Market Data */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-muted rounded-lg h-24" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredData.map((item, index) => (
              <motion.div
                key={item.symbol}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <MobileTradingCard
                  symbol={item.symbol}
                  name={item.name}
                  price={item.price}
                  change24h={item.change24h}
                  changePercent24h={item.changePercent24h}
                  volume24h={item.volume24h}
                  marketCap={item.marketCap}
                  onClick={() => {
                    // Navigate to token detail page
                    window.location.href = `/coin/${item.symbol}`;
                  }}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredData.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No tokens found
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'Try adjusting your search terms' : 'No market data available'}
            </p>
            {searchQuery && (
              <Button
                variant="outline"
                onClick={() => setSearchQuery('')}
              >
                Clear search
              </Button>
            )}
          </div>
        )}

        {/* Load More Button */}
        {!isLoading && filteredData.length > 0 && (
          <div className="text-center py-4">
            <Button variant="outline" className="w-full">
              Load More
            </Button>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default MobileDashboard;

