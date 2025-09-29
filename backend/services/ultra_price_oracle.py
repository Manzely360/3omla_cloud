"""Ultra Price Oracle
=====================

This module provides a lightweight price aggregation service that relies only on
public HTTP APIs. It replaces the previous implementation that required
WebSocket streams and private credentials, allowing the backend to start and
serve responses in sealed environments (e.g. fresh deployments, CI) without any
secrets.

The oracle currently aggregates spot quotes from multiple high-liquidity
exchanges (Binance, OKX, KuCoin) and derives synthetic USDT pairs. The design is
intentionally simple: every refresh it pulls the latest 24h ticker snapshot from
those exchanges, normalises the payload, and maintains an in-memory view of each
symbol across venues. The FastAPI routes call the async helpers below to obtain
ultra aggregated prices, recent movements, and naive arbitrage spreads.
"""

from __future__ import annotations

import asyncio
import os
import statistics
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import aiohttp
import structlog

logger = structlog.get_logger()

# Exchange weights roughly reflect average venue depth so the weighted price has
# a sensible skew even when volume numbers are missing.
EXCHANGE_WEIGHTS: Dict[str, float] = {
    "binance": 0.6,
    "okx": 0.25,
    "kucoin": 0.15,
}

DEFAULT_SYMBOLS: List[str] = [
    "BTCUSDT",
    "ETHUSDT",
    "BNBUSDT",
    "SOLUSDT",
    "XRPUSDT",
    "ADAUSDT",
    "DOGEUSDT",
    "AVAXUSDT",
    "TONUSDT",
    "TRXUSDT",
]


@dataclass(slots=True)
class PriceData:
    """Normalised snapshot for a symbol on a given exchange."""

    exchange: str
    symbol: str
    price: float
    volume_24h: float
    timestamp: datetime
    bid: Optional[float] = None
    ask: Optional[float] = None
    spread_pct: Optional[float] = None
    change_pct: Optional[float] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.exchange,
            "price": self.price,
            "volume_24h": self.volume_24h,
            "bid": self.bid,
            "ask": self.ask,
            "spread_pct": self.spread_pct,
            "change_pct": self.change_pct,
            "timestamp": self.timestamp.isoformat(),
        }


@dataclass(slots=True)
class AggregatedPrice:
    """Aggregated view derived from multiple exchanges."""

    symbol: str
    weighted_price: float
    simple_average: float
    median_price: float
    min_price: float
    max_price: float
    price_variance: float
    total_volume: float
    exchange_count: int
    timestamp: datetime
    exchanges: List[PriceData] = field(default_factory=list)
    momentum_score: Optional[float] = None
    volatility_score: Optional[float] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "symbol": self.symbol,
            "ultra_price": self.weighted_price,
            "simple_average": self.simple_average,
            "median_price": self.median_price,
            "min_price": self.min_price,
            "max_price": self.max_price,
            "spread_pct": ((self.max_price - self.min_price) / self.weighted_price * 100)
            if self.weighted_price
            else 0.0,
            "confidence_score": min(self.exchange_count / 3.0, 1.0) * 100,
            "momentum_score": self.momentum_score,
            "volatility_score": self.volatility_score,
            "total_volume_24h": self.total_volume,
            "exchange_count": self.exchange_count,
            "timestamp": self.timestamp.isoformat(),
            "exchanges": [p.to_dict() for p in self.exchanges],
        }


class UltraPriceOracle:
    """Lightweight price oracle backed by free public REST endpoints."""

    def __init__(self) -> None:
        self.refresh_interval = int(os.getenv("ULTRA_REFRESH_INTERVAL", 30))
        self.request_timeout = int(os.getenv("ULTRA_REQUEST_TIMEOUT", 10))
        self.stale_after = int(os.getenv("ULTRA_STALE_SECONDS", 180))

        self._session: Optional[aiohttp.ClientSession] = None
        self._lock = asyncio.Lock()
        self._tasks: List[asyncio.Task] = []
        self._running = False

        # symbol -> exchange -> PriceData
        self._exchange_snapshots: Dict[str, Dict[str, PriceData]] = {}
        # symbol -> AggregatedPrice
        self.current_prices: Dict[str, AggregatedPrice] = {}
        self.last_refresh_error: Optional[str] = None

    async def start(self) -> None:
        if self._running:
            return

        timeout = aiohttp.ClientTimeout(total=self.request_timeout)
        self._session = aiohttp.ClientSession(timeout=timeout)
        self._running = True
        self._tasks.append(
            asyncio.create_task(self._refresh_loop(), name="ultra_oracle_refresh")
        )
        logger.info(
            "Ultra price oracle running",
            refresh_interval=self.refresh_interval,
            exchanges=list(EXCHANGE_WEIGHTS.keys()),
        )

    async def stop(self) -> None:
        if not self._running:
            return

        self._running = False
        for task in self._tasks:
            task.cancel()
        self._tasks.clear()

        if self._session:
            await self._session.close()
            self._session = None

        logger.info("Ultra price oracle stopped")

    async def _refresh_loop(self) -> None:
        while self._running:
            try:
                await self._refresh_once()
                self.last_refresh_error = None
            except asyncio.CancelledError:  # pragma: no cover - cooperative cancel
                break
            except Exception as exc:  # noqa: BLE001
                self.last_refresh_error = str(exc)
                logger.warning("Ultra oracle refresh failed", error=str(exc))

            await asyncio.sleep(self.refresh_interval)

    async def _refresh_once(self) -> None:
        if not self._session:
            return

        fetchers = [
            self._fetch_binance(self._session),
            self._fetch_okx(self._session),
            self._fetch_kucoin(self._session),
        ]
        results = await asyncio.gather(*fetchers, return_exceptions=True)

        updates: List[PriceData] = []
        for idx, result in enumerate(results):
            if isinstance(result, Exception):
                exchange = list(EXCHANGE_WEIGHTS.keys())[idx]
                logger.warning("Exchange snapshot failed", exchange=exchange, error=str(result))
                continue
            updates.extend(result)

        if updates:
            await self._apply_updates(updates)

    async def _apply_updates(self, updates: List[PriceData]) -> None:
        now = datetime.utcnow()
        stale_cutoff = now - timedelta(seconds=self.stale_after)

        async with self._lock:
            for price in updates:
                symbol_map = self._exchange_snapshots.setdefault(price.symbol, {})
                symbol_map[price.exchange] = price

            # Drop stale entries so we do not keep dead venues forever
            for symbol in list(self._exchange_snapshots.keys()):
                exchange_map = self._exchange_snapshots[symbol]
                for exchange in list(exchange_map.keys()):
                    if exchange_map[exchange].timestamp < stale_cutoff:
                        del exchange_map[exchange]
                if not exchange_map:
                    self._exchange_snapshots.pop(symbol, None)
                    self.current_prices.pop(symbol, None)

            recalculated: Dict[str, AggregatedPrice] = {}
            for symbol, exchange_map in self._exchange_snapshots.items():
                aggregated = self._aggregate_symbol(symbol, exchange_map)
                if aggregated:
                    recalculated[symbol] = aggregated
            self.current_prices = recalculated

    def _aggregate_symbol(
        self, symbol: str, exchange_map: Dict[str, PriceData]
    ) -> Optional[AggregatedPrice]:
        if not exchange_map:
            return None

        snapshots = list(exchange_map.values())
        price_values = [snap.price for snap in snapshots]
        volume_values = [max(snap.volume_24h, 0.0) for snap in snapshots]

        weighted_components: List[float] = []
        weights: List[float] = []
        for snap, volume in zip(snapshots, volume_values):
            base_weight = EXCHANGE_WEIGHTS.get(snap.exchange, 0.1)
            volume_weight = min(volume / 1_000_000, 1.0)  # cap so thin markets do not dominate
            weight = base_weight * (1 + volume_weight)
            weights.append(weight)
            weighted_components.append(snap.price * weight)

        total_weight = sum(weights) or float(len(snapshots))
        weighted_price = sum(weighted_components) / total_weight
        simple_average = sum(price_values) / len(price_values)
        median_price = statistics.median(price_values)
        min_price = min(price_values)
        max_price = max(price_values)
        price_variance = statistics.pvariance(price_values) if len(price_values) > 1 else 0.0
        total_volume = sum(volume_values)

        momentum_values = [snap.change_pct for snap in snapshots if snap.change_pct is not None]
        momentum_score = sum(momentum_values) / len(momentum_values) if momentum_values else None
        volatility_score = (
            ((max_price - min_price) / weighted_price) * 100 if weighted_price else None
        )

        ordered = sorted(snapshots, key=lambda s: s.price)
        return AggregatedPrice(
            symbol=symbol,
            weighted_price=weighted_price,
            simple_average=simple_average,
            median_price=median_price,
            min_price=min_price,
            max_price=max_price,
            price_variance=price_variance,
            total_volume=total_volume,
            exchange_count=len(snapshots),
            timestamp=datetime.utcnow(),
            exchanges=ordered,
            momentum_score=momentum_score,
            volatility_score=volatility_score,
        )

    # ------------------------------------------------------------------
    # Public API consumed by FastAPI routes
    # ------------------------------------------------------------------
    async def get_ultra_price(self, symbol: str) -> Optional[Dict[str, Any]]:
        symbol = symbol.upper()
        async with self._lock:
            aggregated = self.current_prices.get(symbol)
            return aggregated.to_dict() if aggregated else None

    async def get_all_symbols(self) -> List[str]:
        async with self._lock:
            symbols = sorted(self.current_prices.keys())
            if not symbols:
                return DEFAULT_SYMBOLS.copy()
            return symbols

    async def get_price_movements(self, threshold_pct: float = 0.1) -> List[Dict[str, Any]]:
        threshold = abs(threshold_pct)
        async with self._lock:
            movements: List[Dict[str, Any]] = []
            for aggregated in self.current_prices.values():
                score = aggregated.momentum_score
                if score is None or abs(score) < threshold:
                    continue
                movements.append(
                    {
                        "symbol": aggregated.symbol,
                        "momentum_score": score,
                        "volatility_score": aggregated.volatility_score,
                        "price": aggregated.weighted_price,
                        "exchange_count": aggregated.exchange_count,
                        "timestamp": aggregated.timestamp.isoformat(),
                    }
                )

        movements.sort(key=lambda item: abs(item["momentum_score"]), reverse=True)
        return movements[:50]

    async def detect_arbitrage_opportunities(
        self, min_spread_pct: float = 0.05
    ) -> List[Dict[str, Any]]:
        min_spread = max(min_spread_pct, 0.0)
        async with self._lock:
            opportunities: List[Dict[str, Any]] = []
            for aggregated in self.current_prices.values():
                if aggregated.exchange_count < 2:
                    continue

                spread_pct = (
                    ((aggregated.max_price - aggregated.min_price) / aggregated.weighted_price) * 100
                    if aggregated.weighted_price
                    else 0.0
                )
                if spread_pct < min_spread:
                    continue

                cheapest = min(aggregated.exchanges, key=lambda snap: snap.price)
                priciest = max(aggregated.exchanges, key=lambda snap: snap.price)
                opportunities.append(
                    {
                        "symbol": aggregated.symbol,
                        "spread_pct": spread_pct,
                        "profit_potential": spread_pct - 0.1,  # simple fee cushion
                        "buy_exchange": cheapest.exchange,
                        "buy_price": cheapest.price,
                        "sell_exchange": priciest.exchange,
                        "sell_price": priciest.price,
                        "volume_24h": aggregated.total_volume,
                        "timestamp": aggregated.timestamp.isoformat(),
                    }
                )

        opportunities.sort(key=lambda item: item["profit_potential"], reverse=True)
        return opportunities[:20]

    # ------------------------------------------------------------------
    # Exchange fetch helpers
    # ------------------------------------------------------------------
    async def _fetch_binance(self, session: aiohttp.ClientSession) -> List[PriceData]:
        url = "https://api.binance.com/api/v3/ticker/24hr"
        async with session.get(url) as resp:
            resp.raise_for_status()
            payload = await resp.json()

        now = datetime.utcnow()
        snapshots: List[PriceData] = []
        for item in payload:
            symbol = item.get("symbol")
            if not symbol or not symbol.endswith("USDT"):
                continue

            price = float(item.get("lastPrice", 0.0))
            bid = float(item.get("bidPrice", 0.0)) or None
            ask = float(item.get("askPrice", 0.0)) or None
            spread_pct = (
                ((ask - bid) / price) * 100 if price and ask is not None and bid is not None else None
            )
            change = item.get("priceChangePercent")
            change_pct = float(change) if change not in (None, "") else None

            snapshots.append(
                PriceData(
                    exchange="binance",
                    symbol=symbol,
                    price=price,
                    volume_24h=float(item.get("quoteVolume", 0.0) or 0.0),
                    timestamp=now,
                    bid=bid,
                    ask=ask,
                    spread_pct=spread_pct,
                    change_pct=change_pct,
                )
            )

        return snapshots

    async def _fetch_okx(self, session: aiohttp.ClientSession) -> List[PriceData]:
        url = "https://www.okx.com/api/v5/market/tickers?instType=SPOT"
        async with session.get(url) as resp:
            resp.raise_for_status()
            payload = await resp.json()

        data = payload.get("data", [])
        now = datetime.utcnow()
        snapshots: List[PriceData] = []
        for item in data:
            inst_id = item.get("instId", "")
            if not inst_id.endswith("-USDT") and not inst_id.endswith("-USD"):
                continue

            base, quote = inst_id.split("-")
            symbol = f"{base}{quote}"
            price = float(item.get("last", 0.0) or 0.0)
            bid = float(item.get("bidPx", 0.0) or 0.0) or None
            ask = float(item.get("askPx", 0.0) or 0.0) or None
            spread_pct = (
                ((ask - bid) / price) * 100 if price and ask is not None and bid is not None else None
            )
            open_price = float(item.get("open24h", 0.0) or 0.0)
            change_pct = (
                ((price - open_price) / open_price) * 100 if price and open_price else None
            )

            snapshots.append(
                PriceData(
                    exchange="okx",
                    symbol=symbol,
                    price=price,
                    volume_24h=float(item.get("volCcy24h", 0.0) or 0.0),
                    timestamp=now,
                    bid=bid,
                    ask=ask,
                    spread_pct=spread_pct,
                    change_pct=change_pct,
                )
            )

        return snapshots

    async def _fetch_kucoin(self, session: aiohttp.ClientSession) -> List[PriceData]:
        url = "https://api.kucoin.com/api/v1/market/allTickers"
        async with session.get(url) as resp:
            resp.raise_for_status()
            payload = await resp.json()

        data = payload.get("data", {})
        tickers = data.get("ticker", [])
        now = datetime.utcnow()
        snapshots: List[PriceData] = []
        for item in tickers:
            symbol_raw = item.get("symbol", "")
            if not symbol_raw.endswith("-USDT") and not symbol_raw.endswith("-USD"):
                continue

            base, quote = symbol_raw.split("-")
            symbol = f"{base}{quote}"
            price = float(item.get("last", 0.0) or 0.0)
            bid = float(item.get("buy", 0.0) or 0.0) or None
            ask = float(item.get("sell", 0.0) or 0.0) or None
            spread_pct = (
                ((ask - bid) / price) * 100 if price and ask is not None and bid is not None else None
            )
            change_rate = item.get("changeRate")
            change_pct = float(change_rate) * 100 if change_rate not in (None, "") else None

            snapshots.append(
                PriceData(
                    exchange="kucoin",
                    symbol=symbol,
                    price=price,
                    volume_24h=float(item.get("volValue", 0.0) or 0.0),
                    timestamp=now,
                    bid=bid,
                    ask=ask,
                    spread_pct=spread_pct,
                    change_pct=change_pct,
                )
            )

        return snapshots


# Global singleton instance used by the FastAPI app
ultra_oracle = UltraPriceOracle()
