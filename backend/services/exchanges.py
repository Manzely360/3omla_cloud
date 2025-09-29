"""
Unified exchange connector built on ccxt.

Provides:
- fetch_symbols: unified spot symbols across exchanges
- fetch_prices: current best bid/ask/last per exchange for a symbol

Notes:
- Focus on USDT spot markets for consistency
- Lightweight rate limiting and error handling
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List, Optional

import asyncio
import ccxt.async_support as ccxt  # type: ignore


SUPPORTED_EXCHANGES = [
    "binance",
    "bybit",
    "kucoin",
    "okx",
]


@dataclass
class PricePoint:
    name: str
    symbol: str
    price: float
    bid: float
    ask: float
    timestamp: Optional[datetime]


def _now_from_ms(ms: Optional[int]) -> Optional[datetime]:
    if not ms:
        return None
    try:
        return datetime.utcfromtimestamp(ms / 1000)
    except Exception:
        return None


class MultiExchangeConnector:
    def __init__(self, exchanges: Optional[List[str]] = None):
        names = exchanges or SUPPORTED_EXCHANGES
        self.exchanges: Dict[str, Any] = {}
        for name in names:
            try:
                ex = getattr(ccxt, name)({
                    "enableRateLimit": True,
                    "options": {"defaultType": "spot"},
                })
                self.exchanges[name] = ex
            except Exception:
                # Skip unavailable ccxt exchange
                continue

    async def close(self):
        await asyncio.gather(*[ex.close() for ex in self.exchanges.values()], return_exceptions=True)

    async def fetch_symbols(self, quote: str = "USDT") -> List[Dict[str, Any]]:
        tasks = []
        for name, ex in self.exchanges.items():
            tasks.append(self._load_markets_for(ex, name, quote))
        results = await asyncio.gather(*tasks, return_exceptions=True)
        out: List[Dict[str, Any]] = []
        for res in results:
            if isinstance(res, list):
                out.extend(res)
        # Deduplicate by symbol+exchange already unique; return all
        return out

    async def _load_markets_for(self, ex: Any, name: str, quote: str) -> List[Dict[str, Any]]:
        try:
            await ex.load_markets()
            rows: List[Dict[str, Any]] = []
            for market in ex.markets.values():
                if not market.get("spot"):
                    continue
                if not market.get("active", True):
                    continue
                if str(market.get("quote")) != quote:
                    continue
                symbol = str(market.get("symbol"))  # e.g., BTC/USDT
                base = str(market.get("base"))
                rows.append({
                    "symbol": symbol.replace("/", ""),  # unify style BTCUSDT
                    "exchange_symbol": symbol,
                    "base_asset": base,
                    "quote_asset": quote,
                    "exchange": name,
                })
            return rows
        except Exception:
            return []

    async def fetch_prices(self, unified_symbol: str) -> List[PricePoint]:
        """Fetch prices across exchanges for unified symbol like BTCUSDT.

        Attempts mapping to each exchange's market symbol format.
        """
        base = unified_symbol[:-4] if unified_symbol.endswith("USDT") else unified_symbol
        target_pair1 = f"{base}/USDT"
        tasks = []
        for name, ex in self.exchanges.items():
            tasks.append(self._fetch_ticker_for(ex, name, target_pair1, unified_symbol))
        results = await asyncio.gather(*tasks, return_exceptions=True)
        out: List[PricePoint] = []
        for res in results:
            if isinstance(res, PricePoint):
                out.append(res)
        # sort by timestamp asc (oldest first) for deterministic selection
        out.sort(key=lambda p: p.timestamp or datetime.utcnow())
        return out

    async def _fetch_ticker_for(self, ex: Any, name: str, symbol: str, unified_symbol: str) -> Optional[PricePoint]:
        try:
            # OKX uses - in symbols like BTC-USDT
            if name == "okx":
                symbol = symbol.replace("/", "-")
            ticker = await ex.fetch_ticker(symbol)
            last = float(ticker.get("last") or 0.0)
            bid = float(ticker.get("bid") or 0.0)
            ask = float(ticker.get("ask") or 0.0)
            ts = _now_from_ms(int(ticker.get("timestamp")) if ticker.get("timestamp") else None)
            if last <= 0 and (bid > 0 and ask > 0):
                last = (bid + ask) / 2
            if last <= 0:
                return None
            return PricePoint(name=name, symbol=unified_symbol, price=last, bid=bid, ask=ask, timestamp=ts)
        except Exception:
            return None


# Singleton-style instance used by services
multi_exchange_connector = MultiExchangeConnector()


