"""
Order book analytics: depth imbalance and spoof flags
"""

from typing import Dict, List, Tuple, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from datetime import timedelta
from models.market_data import OrderBook
from datetime import datetime


def _sum_band(levels: List[List[float]], mid: float, band: float, side: str) -> float:
    total = 0.0
    if side == 'bid':
        lo = mid * (1 - band)
        for price, qty in levels:
            if price >= lo:
                total += qty
    else:
        hi = mid * (1 + band)
        for price, qty in levels:
            if price <= hi:
                total += qty
    return total


def _imbalance(b: float, a: float) -> float:
    denom = (b + a) or 1e-9
    return (b - a) / denom


async def compute_imbalance(
    db: AsyncSession, symbol: str, exchange: str = 'binance', bands: List[float] = [0.001, 0.005, 0.01]
) -> Dict:
    # latest snapshot
    result = await db.execute(
        select(OrderBook).where(OrderBook.symbol == symbol, OrderBook.exchange == exchange).order_by(desc(OrderBook.timestamp)).limit(2)
    )
    books = result.scalars().all()
    if not books:
        return {"symbol": symbol, "exchange": exchange, "mid": None, "bands": [], "spoof_flags": []}
    ob = books[0]
    prev = books[1] if len(books) > 1 else None
    bids = ob.bids or []
    asks = ob.asks or []
    mid = ob.mid_price

    band_metrics = []
    spoof_flags = []
    for b in bands:
        bid_sum = _sum_band(bids, mid, b, 'bid')
        ask_sum = _sum_band(asks, mid, b, 'ask')
        imb = _imbalance(bid_sum, ask_sum)
        delta = None
        if prev:
            prev_bid = _sum_band(prev.bids or [], prev.mid_price, b, 'bid')
            prev_ask = _sum_band(prev.asks or [], prev.mid_price, b, 'ask')
            delta = _imbalance(bid_sum, ask_sum) - _imbalance(prev_bid, prev_ask)
        band_metrics.append({
            "band": b,
            "bid_sum": bid_sum,
            "ask_sum": ask_sum,
            "imbalance": imb,
            "delta": delta,
        })
        # simple spoof flag: sudden imbalance swing with little price change
        if prev and abs(delta or 0) > 0.4 and abs((mid - prev.mid_price) / prev.mid_price) < 0.001:
            spoof_flags.append({"band": b, "reason": "sudden_imbalance_swing"})

    return {
        "symbol": symbol,
        "exchange": exchange,
        "timestamp": ob.timestamp,
        "mid": mid,
        "bands": band_metrics,
        "spoof_flags": spoof_flags,
    }

