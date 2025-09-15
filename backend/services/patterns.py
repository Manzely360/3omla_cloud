"""
Candlestick pattern detection (basic): engulfing, hammer, shooting star, doji
"""

from typing import List, Dict
from datetime import datetime


def detect_patterns(klines: List[Dict]) -> List[Dict]:
    out: List[Dict] = []
    n = len(klines)
    def body(k):
        return abs(k['close_price'] - k['open_price'])
    def upper_wick(k):
        return k['high_price'] - max(k['close_price'], k['open_price'])
    def lower_wick(k):
        return min(k['close_price'], k['open_price']) - k['low_price']
    for i in range(1, n):
        p = klines[i-1]
        k = klines[i]
        rng = k['high_price'] - k['low_price'] or 1e-9
        # Doji: small body vs range
        if body(k) / rng < 0.1:
            out.append({"type": "doji", "time": k['close_time']})
        # Hammer: small body near top, long lower wick
        if lower_wick(k) / rng > 0.6 and upper_wick(k) / rng < 0.2:
            out.append({"type": "hammer", "time": k['close_time']})
        # Shooting star: small body near bottom, long upper wick
        if upper_wick(k) / rng > 0.6 and lower_wick(k) / rng < 0.2:
            out.append({"type": "shooting_star", "time": k['close_time']})
        # Engulfing
        if k['close_price'] > k['open_price'] and p['close_price'] < p['open_price']:
            if k['close_price'] >= p['open_price'] and k['open_price'] <= p['close_price']:
                out.append({"type": "bullish_engulfing", "time": k['close_time']})
        if k['close_price'] < k['open_price'] and p['close_price'] > p['open_price']:
            if k['open_price'] >= p['close_price'] and k['close_price'] <= p['open_price']:
                out.append({"type": "bearish_engulfing", "time": k['close_time']})
    return out

