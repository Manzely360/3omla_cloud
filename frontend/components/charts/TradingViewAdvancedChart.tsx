import { useEffect, useMemo, useRef, useState } from 'react'

declare global {
  interface Window {
    TradingView?: any
  }
}

interface TradingViewAdvancedChartProps {
  symbol: string
  interval?: string
  theme?: 'light' | 'dark'
  studies?: string[]
}

const DEFAULT_STUDIES = ['Volume@tv-basicstudies', 'RSI@tv-basicstudies', 'MACD@tv-basicstudies']

export default function TradingViewAdvancedChart({
  symbol,
  interval = '15',
  theme = 'dark',
  studies = DEFAULT_STUDIES,
}: TradingViewAdvancedChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [containerId] = useState(() => `tradingview-advanced-chart-${Math.random().toString(36).slice(2)}`)

  const tradingViewSymbol = useMemo(() => {
    if (!symbol) return 'BINANCE:BTCUSDT'
    const normalized = symbol.toUpperCase()
    if (normalized.includes(':')) return normalized
    return `BINANCE:${normalized}`
  }, [symbol])

  useEffect(() => {
    if (!containerRef.current) return

    const initializeWidget = () => {
      if (!window.TradingView || !containerRef.current) return

      containerRef.current.innerHTML = ''

      new window.TradingView.widget({
        autosize: true,
        symbol: tradingViewSymbol,
        interval,
        timezone: 'Etc/UTC',
        theme,
        style: '1',
        locale: 'en',
        toolbar_bg: '#1f2937',
        withdateranges: true,
        hide_side_toolbar: false,
        hide_top_toolbar: false,
        allow_symbol_change: true,
        save_image: false,
        container_id: containerId,
        details: true,
        hotlist: true,
        calendar: true,
        studies,
      })
    }

    if (window.TradingView) {
      initializeWidget()
      return
    }

    let script = document.getElementById('tradingview-widget-script') as HTMLScriptElement | null

    const handleScriptLoad = () => {
      if (script) {
        script.dataset.loaded = 'true'
      }
      initializeWidget()
    }

    if (!script) {
      script = document.createElement('script')
      script.id = 'tradingview-widget-script'
      script.type = 'text/javascript'
      script.async = true
      script.src = 'https://s3.tradingview.com/tv.js'
      script.addEventListener('load', handleScriptLoad, { once: true })
      document.head.appendChild(script)
    } else if (script.dataset.loaded === 'true') {
      initializeWidget()
    } else {
      script.addEventListener('load', handleScriptLoad, { once: true })
    }

    return () => {
      script?.removeEventListener('load', handleScriptLoad)
    }
  }, [containerId, interval, studies, theme, tradingViewSymbol])

  return <div id={containerId} ref={containerRef} className="h-full w-full" />
}
