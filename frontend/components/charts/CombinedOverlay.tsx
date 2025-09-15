import { useEffect, useRef } from 'react'
import { createChart } from 'lightweight-charts'

type Candle = { time: number; open: number; high: number; low: number; close: number }
type Point = { time: number; value: number }

export default function CombinedOverlay({ candles, overlay, overlayLabel }:{ candles: Candle[]; overlay: Point[]; overlayLabel?: string }){
  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!ref.current) return
    const chart = createChart(ref.current, { width: ref.current.clientWidth, height: 360, layout: { background: { color: '#111827' }, textColor: '#e5e7eb' }, grid: { vertLines: { color: '#1f2937' }, horzLines: { color: '#1f2937' } } })
    const cs = chart.addCandlestickSeries({ upColor: '#22c55e', downColor: '#ef4444', wickUpColor: '#22c55e', wickDownColor: '#ef4444', borderVisible: false })
    cs.setData(candles)
    const ls = chart.addLineSeries({ color: '#60a5fa', lineWidth: 2 })
    ls.setData(overlay)
    if (overlayLabel) {
      // add last price line marker via priceLine
      const last = overlay[overlay.length-1]
      if (last) {
        ls.createPriceLine({ price: last.value, color: '#60a5fa', lineWidth: 1, lineStyle: 2, title: overlayLabel })
      }
    }
    const onResize = () => chart.applyOptions({ width: ref.current?.clientWidth || 600 })
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('resize', onResize); chart.remove() }
  }, [candles, overlay, overlayLabel])
  return <div ref={ref} className="w-full" />
}

