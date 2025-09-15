import { useEffect, useRef } from 'react'
import { createChart, LineStyle } from 'lightweight-charts'

type Candle = { time: number; open: number; high: number; low: number; close: number }
type Pattern = { type: string; time: string }

export default function Candles({ data, patterns }: { data: Candle[]; patterns?: Pattern[] }) {
  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!ref.current) return
    const chart = createChart(ref.current, { width: ref.current.clientWidth, height: 360, layout: { background: { color: '#111827' }, textColor: '#e5e7eb' }, grid: { vertLines: { color: '#1f2937' }, horzLines: { color: '#1f2937' } } })
    const series = chart.addCandlestickSeries({ upColor: '#22c55e', downColor: '#ef4444', wickUpColor: '#22c55e', wickDownColor: '#ef4444', borderVisible: false })
    series.setData(data)
    if (patterns && patterns.length) {
      const markers = patterns.map((p) => ({ time: Math.floor(new Date(p.time).getTime() / 1000) as any, position: 'aboveBar' as const, color: '#a855f7', shape: 'arrowDown', text: p.type }))
      series.setMarkers(markers)
    }
    const onResize = () => chart.applyOptions({ width: ref.current?.clientWidth || 600 })
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('resize', onResize); chart.remove() }
  }, [data, patterns])
  return <div ref={ref} className="w-full" />
}

