import { useEffect, useRef, useState } from 'react'
import { createChart, LineStyle } from 'lightweight-charts'

type Candle = { time: number; open: number; high: number; low: number; close: number }
type Pattern = { type: string; time: string }

export default function Candles({ data, patterns }: { data: Candle[]; patterns?: Pattern[] }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [mode, setMode] = useState<'none'|'hline'|'trend'>('none')
  useEffect(() => {
    if (!ref.current) return
    const chart = createChart(ref.current, { width: ref.current.clientWidth, height: 360, layout: { background: { color: '#111827' }, textColor: '#e5e7eb' }, grid: { vertLines: { color: '#1f2937' }, horzLines: { color: '#1f2937' } } })
    const series = chart.addCandlestickSeries({ upColor: '#22c55e', downColor: '#ef4444', wickUpColor: '#22c55e', wickDownColor: '#ef4444', borderVisible: false })
    series.setData(data)
    if (patterns && patterns.length) {
      const markers = patterns.map((p) => ({ time: Math.floor(new Date(p.time).getTime() / 1000) as any, position: 'aboveBar' as const, color: '#a855f7', shape: 'arrowDown', text: p.type }))
      series.setMarkers(markers)
    }
    // Drawing support
    const drawnLines: any[] = []
    let trendFirst: { time: any; value: number } | null = null
    const clickHandler = (param: any) => {
      if (!param) return
      if (mode === 'none') return
      const sd = param.seriesData?.get?.(series) || {}
      const time = param.time || sd?.time
      const value = sd?.close ?? sd?.value
      if (!time || typeof value !== 'number') return
      if (mode === 'hline') {
        try { series.createPriceLine({ price: value, color: '#60a5fa', lineStyle: LineStyle.Solid }) } catch {}
        setMode('none')
      } else if (mode === 'trend') {
        if (!trendFirst) {
          trendFirst = { time, value }
        } else {
          const ls = chart.addLineSeries({ color: '#f59e0b', lineWidth: 2 })
          ls.setData([
            { time: trendFirst.time as any, value: trendFirst.value },
            { time: time as any, value: value },
          ])
          drawnLines.push(ls)
          trendFirst = null
          setMode('none')
        }
      }
    }
    chart.subscribeClick(clickHandler)
    const onResize = () => chart.applyOptions({ width: ref.current?.clientWidth || 600 })
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('resize', onResize); chart.unsubscribeClick(clickHandler); chart.remove() }
  }, [data, patterns, mode])
  return (
    <div className="w-full relative">
      <div className="absolute top-2 right-2 z-10 flex items-center space-x-2">
        <button onClick={()=> setMode(mode==='hline'?'none':'hline')} className={`px-2 py-1 rounded text-xs ${mode==='hline'?'bg-blue-600 text-white':'bg-gray-700 text-gray-200'}`}>H-Line</button>
        <button onClick={()=> setMode(mode==='trend'?'none':'trend')} className={`px-2 py-1 rounded text-xs ${mode==='trend'?'bg-yellow-600 text-white':'bg-gray-700 text-gray-200'}`}>Trendline</button>
      </div>
      <div ref={ref} />
    </div>
  )
}
