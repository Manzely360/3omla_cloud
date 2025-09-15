import { useEffect } from 'react'
import toast from 'react-hot-toast'

export default function NotificationsHub() {
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://backend:8000'
    const url = `${base}/api/v1/signals/stream`
    let es: EventSource | null = null
    let esWhales: EventSource | null = null
    try {
      es = new EventSource(url)
      es.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data)
          const msg = `${payload.primary_symbol} ${payload.direction?.toUpperCase() || ''} ${
            payload.signal_type || 'signal'
          }`
          toast.success(msg)
        } catch {
          // ignore
        }
      }
      es.onerror = () => {
        // silent reconnect attempts by browser
      }
      // whale stream
      // load threshold from localStorage
      let minUsd = 200000
      try { if (typeof window !== 'undefined') { const v = parseInt(localStorage.getItem('whale_min_usd') || '200000'); if (!isNaN(v)) minUsd = v } } catch {}
      esWhales = new EventSource(`${base}/api/v1/whales/stream?min_trade_size=${minUsd}`)
      esWhales.onmessage = (e) => {
        try {
          const w = JSON.parse(e.data)
          if (w && w.symbol && w.usd_notional) {
            const side = (w.side || '').toUpperCase()
            const usd = Math.round((w.usd_notional||0)/1000)
            toast(`Whale ${side} ${usd}k ${w.symbol} @ ${w.price}`, { icon: '🐋' })
          }
        } catch {}
      }
    } catch {
      // ignore
    }
    return () => {
      if (es) es.close()
      if (esWhales) esWhales.close()
    }
  }, [])
  return null
}
