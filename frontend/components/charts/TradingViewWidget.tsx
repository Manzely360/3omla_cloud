"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Maximize2, 
  Minimize2, 
  Settings, 
  Download,
  RefreshCw
} from 'lucide-react';

interface TradingViewWidgetProps {
  symbol: string;
  interval?: string;
  theme?: 'light' | 'dark';
  height?: number;
  width?: number;
  autosize?: boolean;
  className?: string;
}

declare global {
  interface Window {
    TradingView: any;
  }
}

const TradingViewWidget: React.FC<TradingViewWidgetProps> = ({
  symbol,
  interval = '1D',
  theme = 'dark',
  height = 400,
  width,
  autosize = true,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load TradingView script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      setIsLoading(false);
    };
    script.onerror = () => {
      setError('Failed to load TradingView widget');
      setIsLoading(false);
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // Create widget
  useEffect(() => {
    if (!window.TradingView || !containerRef.current) return;

    const widgetConfig = {
      symbol: symbol,
      interval: interval,
      timezone: 'Etc/UTC',
      theme: theme,
      style: '1',
      locale: 'en',
      toolbar_bg: theme === 'dark' ? '#1e1e1e' : '#ffffff',
      enable_publishing: false,
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      container_id: containerRef.current.id,
      studies: [
        'RSI@tv-basicstudies',
        'MACD@tv-basicstudies',
        'MA@tv-basicstudies',
        'Volume@tv-basicstudies'
      ],
      overrides: {
        'paneProperties.background': theme === 'dark' ? '#1e1e1e' : '#ffffff',
        'paneProperties.vertGridProperties.color': theme === 'dark' ? '#2a2a2a' : '#e1e1e1',
        'paneProperties.horzGridProperties.color': theme === 'dark' ? '#2a2a2a' : '#e1e1e1',
        'symbolWatermarkProperties.transparency': 90,
        'scalesProperties.textColor': theme === 'dark' ? '#d1d4dc' : '#131722',
        'mainSeriesProperties.candleStyle.upColor': '#26a69a',
        'mainSeriesProperties.candleStyle.downColor': '#ef5350',
        'mainSeriesProperties.candleStyle.borderUpColor': '#26a69a',
        'mainSeriesProperties.candleStyle.borderDownColor': '#ef5350',
        'mainSeriesProperties.candleStyle.wickUpColor': '#26a69a',
        'mainSeriesProperties.candleStyle.wickDownColor': '#ef5350'
      },
      disabled_features: [
        'use_localstorage_for_settings',
        'volume_force_overlay',
        'create_volume_indicator_by_default'
      ],
      enabled_features: [
        'study_templates',
        'side_toolbar_in_fullscreen_mode'
      ],
      autosize: autosize,
      height: height,
      width: width
    };

    try {
      widgetRef.current = new window.TradingView.widget(widgetConfig);
    } catch (err) {
      setError('Failed to create TradingView widget');
      console.error('TradingView widget error:', err);
    }

    return () => {
      if (widgetRef.current) {
        widgetRef.current.remove();
      }
    };
  }, [symbol, interval, theme, height, width, autosize]);

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleRefresh = () => {
    if (widgetRef.current) {
      widgetRef.current.remove();
      // Recreate widget
      setTimeout(() => {
        const widgetConfig = {
          symbol: symbol,
          interval: interval,
          timezone: 'Etc/UTC',
          theme: theme,
          style: '1',
          locale: 'en',
          toolbar_bg: theme === 'dark' ? '#1e1e1e' : '#ffffff',
          enable_publishing: false,
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
          container_id: containerRef.current?.id,
          studies: [
            'RSI@tv-basicstudies',
            'MACD@tv-basicstudies',
            'MA@tv-basicstudies',
            'Volume@tv-basicstudies'
          ],
          overrides: {
            'paneProperties.background': theme === 'dark' ? '#1e1e1e' : '#ffffff',
            'paneProperties.vertGridProperties.color': theme === 'dark' ? '#2a2a2a' : '#e1e1e1',
            'paneProperties.horzGridProperties.color': theme === 'dark' ? '#2a2a2a' : '#e1e1e1',
            'symbolWatermarkProperties.transparency': 90,
            'scalesProperties.textColor': theme === 'dark' ? '#d1d4dc' : '#131722',
            'mainSeriesProperties.candleStyle.upColor': '#26a69a',
            'mainSeriesProperties.candleStyle.downColor': '#ef5350',
            'mainSeriesProperties.candleStyle.borderUpColor': '#26a69a',
            'mainSeriesProperties.candleStyle.borderDownColor': '#ef5350',
            'mainSeriesProperties.candleStyle.wickUpColor': '#26a69a',
            'mainSeriesProperties.candleStyle.wickDownColor': '#ef5350'
          },
          disabled_features: [
            'use_localstorage_for_settings',
            'volume_force_overlay',
            'create_volume_indicator_by_default'
          ],
          enabled_features: [
            'study_templates',
            'side_toolbar_in_fullscreen_mode'
          ],
          autosize: autosize,
          height: height,
          width: width
        };
        widgetRef.current = new window.TradingView.widget(widgetConfig);
      }, 100);
    }
  };

  const handleDownload = () => {
    if (widgetRef.current) {
      widgetRef.current.takeScreenshot();
    }
  };

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-muted-foreground mb-2">Failed to load TradingView widget</p>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`relative ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <span>{symbol}</span>
            <Badge variant="outline" className="text-xs">
              {interval}
            </Badge>
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
            >
              <Download className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFullscreen}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground">Loading chart...</p>
              </div>
            </div>
          )}
          
          <div
            id={`tradingview-${symbol}-${Date.now()}`}
            ref={containerRef}
            className="w-full"
            style={{ height: `${height}px` }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default TradingViewWidget;

