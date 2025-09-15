"""
KuCoin spot poller using ccxt for public tickers (no API key).

Polls a set of USDT symbols every 1-2 seconds and pushes prices into Redis
for early correlation analytics. Also exposes Prometheus metrics on 8001.
"""

import asyncio
import os
import time
from typing import List, Dict

import redis.asyncio as redis
import structlog
from prometheus_client import start_http_server, Counter, Gauge

logger = structlog.get_logger()


DEFAULT_SYMBOLS = [
    "BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "ADAUSDT",
    "DOGEUSDT", "AVAXUSDT", "LINKUSDT", "MATICUSDT", "TRXUSDT",
]


def to_kucoin_symbol(symbol: str) -> str:
    # Convert 'BTCUSDT' -> 'BTC-USDT'
    if symbol.endswith("USDT"):
        return symbol[:-4] + "-USDT"
    if symbol.endswith("USD"):
        return symbol[:-3] + "-USD"
    return symbol


class KucoinPoller:
    def __init__(self) -> None:
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        self.redis = redis.from_url(self.redis_url, decode_responses=True)
        self.metrics_port = int(os.getenv("METRICS_PORT", 8001))
        self.health_port = int(os.getenv("HEALTH_PORT", 8002))
        self.symbols: List[str] = list(filter(None, (os.getenv("KUCOIN_SYMBOLS", "").split(",")))) or DEFAULT_SYMBOLS
        self.poll_interval = float(os.getenv("KUCOIN_POLL_INTERVAL", "1.5"))

        # Metrics
        try:
            start_http_server(self.metrics_port)
        except Exception:
            pass
        self.samples = Counter("kucoin_samples_total", "Samples collected", ["symbol"])
        self.up = Gauge("kucoin_poller_up", "Service up")
        self.up.set(1)

    async def _update_series(self, symbol: str, price: float, max_len: int = 3600) -> None:
        key = f"rt:prices:{symbol}:kucoin_spot"
        val = f"{int(time.time())},{price}"
        pipe = self.redis.pipeline()
        pipe.lpush(key, val)
        pipe.ltrim(key, 0, max_len - 1)
        pipe.expire(key, max(3600, max_len))
        await pipe.execute()

    async def run(self) -> None:
        import ccxt.async_support as ccxt
        ex = ccxt.kucoin()
        try:
            await ex.load_markets()
            logger.info("KuCoin poller started", symbols=self.symbols)
            while True:
                t0 = time.time()
                try:
                    for sym in self.symbols:
                        ex_sym = to_kucoin_symbol(sym)
                        try:
                            tkr = await ex.fetch_ticker(ex_sym)
                            price = float(tkr.get("last") or tkr.get("close") or 0.0)
                            if price > 0:
                                await self._update_series(sym, price)
                                try:
                                    self.samples.labels(sym).inc()
                                except Exception:
                                    pass
                        except Exception as e:
                            logger.error("KuCoin fetch failed", symbol=sym, error=str(e))
                            continue
                except Exception as e:
                    logger.error("KuCoin poller loop error", error=str(e))
                # pacing
                dt = time.time() - t0
                await asyncio.sleep(max(0.2, self.poll_interval - dt))
        finally:
            try:
                await ex.close()
            except Exception:
                pass


async def main() -> None:
    poller = KucoinPoller()
    await poller.run()


if __name__ == "__main__":
    asyncio.run(main())

