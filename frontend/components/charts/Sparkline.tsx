import React from 'react'

type Pt = { t: string; equity: number }

export default function Sparkline({ data, width=160, height=40, stroke='#10b981' }: { data: Pt[]; width?: number; height?: number; stroke?: string }) {
  if (!Array.isArray(data) || data.length === 0) return <svg width={width} height={height}></svg>
  const xs = data.map((_, i) => i)
  const ys = data.map(d => d.equity)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const rangeY = (maxY - minY) || 1
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * (width - 2) + 1
    const y = height - 1 - (((d.equity - minY) / rangeY) * (height - 2))
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline fill="none" stroke={stroke} strokeWidth="2" points={points} />
    </svg>
  )
}

