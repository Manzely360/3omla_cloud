import { useState } from 'react'

type Props = {
  defaultSymbol?: string
}

export default function QuickTrade({ defaultSymbol = 'BTCUSDT' }: Props) {
  const [symbol, setSymbol] = useState(defaultSymbol)
  const [qty, setQty] = useState(0.001)
  const [side, setSide] = useState<'buy'|'sell'>('buy')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const submit = async () => {
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch('/api/v1/trading/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: symbol.toUpperCase(),
          exchange: 'binance',
          order_type: 'market',
          side,
          quantity: Number(qty),
          mode: 'paper',
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setMsg(`Order placed (#${data.id}) ${side.toUpperCase()} ${qty} ${symbol}`)
    } catch (e: any) {
      setMsg(`Failed: ${e?.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <input className="input w-40" value={symbol} onChange={(e)=>setSymbol(e.target.value.toUpperCase())} />
        <input className="input w-32" type="number" min={0} step={0.001} value={qty} onChange={(e)=>setQty(Number(e.target.value))} />
        <div className="flex rounded overflow-hidden border border-gray-700">
          <button className={`px-3 py-2 text-sm ${side==='buy'?'bg-green-700 text-white':'text-green-400'}`} onClick={()=>setSide('buy')}>Buy</button>
          <button className={`px-3 py-2 text-sm ${side==='sell'?'bg-red-700 text-white':'text-red-400'}`} onClick={()=>setSide('sell')}>Sell</button>
        </div>
        <button className="btn-primary" onClick={submit} disabled={loading}>{loading ? 'Placing...' : 'Market Order'}</button>
      </div>
      {msg && <div className="text-xs text-gray-300">{msg}</div>}
    </div>
  )
}

