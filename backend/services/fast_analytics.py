"""
Fast real-time analytics using Redis time series stored by ingestion services.

Computes rolling correlations and lead-lag on 1-second aggregated prices.
"""

from __future__ import annotations

from typing import List, Dict, Any, Optional, Tuple
import os
import asyncio
import redis.asyncio as redis
import numpy as np
from datetime import datetime


def _seconds_now() -> int:
    return int(datetime.utcnow().timestamp())


async def _fetch_series(r: redis.Redis, symbol: str, exchange: Optional[str] = None, window_secs: int = 300) -> List[Tuple[int, float]]:
    """Fetch last window_secs of price samples from Redis list.

    Keys are rt:prices:{symbol}:{exchange}. If exchange is None, pick any.
    Returns a sorted list of (ts, price).
    """
    keys: List[str] = []
    if exchange:
        keys = [f"rt:prices:{symbol}:{exchange}"]
    else:
        # try common exchanges
        keys = [
            f"rt:prices:{symbol}:binance_spot",
            f"rt:prices:{symbol}:bybit_spot",
            f"rt:prices:{symbol}:binance_futures",
            f"rt:prices:{symbol}:kucoin_spot",
        ]
    now = _seconds_now()
    records: List[Tuple[int, float]] = []
    for k in keys:
        try:
            raw = await r.lrange(k, 0, 3000)
            if not raw:
                continue
            arr: List[Tuple[int, float]] = []
            for b in raw:
                try:
                    s = b.decode() if isinstance(b, (bytes, bytearray)) else str(b)
                    ts_s, price_s = s.split(",", 1)
                    ts = int(ts_s)
                    if ts >= now - window_secs - 2:
                        arr.append((ts, float(price_s)))
                except Exception:
                    continue
            if len(arr) > len(records):
                records = arr
        except Exception:
            continue
    records.sort(key=lambda x: x[0])
    return records


def _resample_seconds(data: List[Tuple[int, float]], window_secs: int) -> Tuple[np.ndarray, np.ndarray]:
    """Resample to 1-second grid with forward fill.

    Returns times array and price array aligned to last window_secs.
    """
    if not data:
        return np.array([]), np.array([])
    end = data[-1][0]
    start = end - window_secs + 1
    grid = np.arange(start, end + 1, dtype=np.int64)
    prices = np.empty_like(grid, dtype=np.float64)
    last = data[0][1]
    j = 0
    for i, t in enumerate(grid):
        while j < len(data) and data[j][0] <= t:
            last = data[j][1]
            j += 1
        prices[i] = last
    return grid, prices


def _returns(prices: np.ndarray) -> np.ndarray:
    if prices.size < 3:
        return np.array([])
    # simple returns
    r = np.diff(prices) / prices[:-1]
    # standardize to zero mean, unit variance if possible
    if r.size and np.std(r) > 1e-12:
        r = (r - np.mean(r)) / (np.std(r) + 1e-12)
    return r


async def fast_correlation(symbols: List[str], window_secs: int = 300) -> Dict[str, Any]:
    """Compute fast correlation matrix from Redis time series for the last window_secs."""
    r = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"), decode_responses=False)
    try:
        series: Dict[str, np.ndarray] = {}
        for s in symbols:
            data = await _fetch_series(r, s, exchange=None, window_secs=window_secs)
            _, prices = _resample_seconds(data, window_secs)
            ret = _returns(prices)
            if ret.size:
                series[s] = ret
        syms = [s for s in symbols if s in series]
        n = len(syms)
        mat = [[None for _ in range(n)] for _ in range(n)]
        for i in range(n):
            for j in range(n):
                if i == j:
                    mat[i][j] = 1.0
                else:
                    a = series[syms[i]]
                    b = series[syms[j]]
                    m = min(a.size, b.size)
                    if m < 5:
                        mat[i][j] = None
                    else:
                        mat[i][j] = float(np.corrcoef(a[-m:], b[-m:])[0, 1])
        return {"symbols": syms, "matrix": mat, "window_secs": window_secs}
    finally:
        try:
            await r.close()
        except Exception:
            pass


async def fast_lead_lag(symbol1: str, symbol2: str, window_secs: int = 600, max_lag_secs: int = 60) -> Dict[str, Any]:
    """Compute fast lead-lag using cross-correlation of standardized returns in last window."""
    r = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"), decode_responses=False)
    try:
        d1 = await _fetch_series(r, symbol1, exchange=None, window_secs=window_secs)
        d2 = await _fetch_series(r, symbol2, exchange=None, window_secs=window_secs)
        _, p1 = _resample_seconds(d1, window_secs)
        _, p2 = _resample_seconds(d2, window_secs)
        r1 = _returns(p1)
        r2 = _returns(p2)
        m = min(r1.size, r2.size)
        if m < 10:
            return {"status": "insufficient_data", "window_secs": window_secs}
        a = r1[-m:]
        b = r2[-m:]
        # compute cross correlation for lags
        best = {"lag": 0, "corr": 0.0}
        for lag in range(-max_lag_secs, max_lag_secs + 1):
            if lag == 0:
                x, y = a, b
            elif lag > 0:
                x, y = a[lag:], b[: b.size - lag]
            else:
                x, y = a[: a.size + lag], b[-lag:]
            if x.size < 10 or y.size != x.size:
                continue
            c = float(np.corrcoef(x, y)[0, 1])
            if abs(c) > abs(best["corr"]):
                best = {"lag": lag, "corr": c}
        return {
            "symbol1": symbol1,
            "symbol2": symbol2,
            "best_lag_secs": best["lag"],
            "best_corr": best["corr"],
            "window_secs": window_secs,
        }
    finally:
        try:
            await r.close()
        except Exception:
            pass
