"""
Bybit WebSocket data ingestion service (public market data)
Collects spot trades, klines, and orderbook snapshots
"""

import asyncio
import json
import os
from datetime import datetime, timezone
from typing import Dict, List

import structlog
import websockets
from dotenv import load_dotenv
from prometheus_client import start_http_server, Counter, Gauge
from aiohttp import web
import time
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

import redis.asyncio as redis


load_dotenv()

structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer(),
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

FALLBACK_SYMBOLS = [
    symbol.strip().upper()
    for symbol in os.getenv(
        "BYBIT_FALLBACK_SYMBOLS",
        "BTCUSDT,ETHUSDT,SOLUSDT,XRPUSDT,ADAUSDT",
    ).split(",")
    if symbol.strip()
]


class BybitWebSocketService:
    def __init__(self) -> None:
        self.redis_client: redis.Redis = None  # type: ignore
        self.db_engine = None
        self.db_session: async_sessionmaker[AsyncSession] | None = None

        # Bybit Public WS endpoints (v5)
        self.ws_spot_public = os.getenv("BYBIT_WS_PUBLIC_SPOT", "wss://stream.bybit.com/v5/public/spot")
        self.ws_spot_testnet = os.getenv("BYBIT_WS_PUBLIC_SPOT_TESTNET", "wss://stream-testnet.bybit.com/v5/public/spot")
        self.use_testnet = os.getenv("BYBIT_TESTNET", "false").lower() == "true"

        # retry / heartbeat
        self.reconnect_delay = int(os.getenv("WS_RECONNECT_DELAY", 5))
        self.heartbeat_interval = int(os.getenv("WS_HEARTBEAT_INTERVAL", 30))
        self.metrics_port = int(os.getenv("METRICS_PORT", 8001))
        self.health_port = int(os.getenv("HEALTH_PORT", 8002))

        # Metrics
        self.trades_counter = Counter(
            "bybit_trades_total", "Number of trades processed", ["symbol"]
        )
        self.klines_counter = Counter(
            "bybit_klines_closed_total",
            "Number of closed klines processed",
            ["symbol", "interval"],
        )
        self.orderbook_counter = Counter(
            "bybit_orderbook_updates_total",
            "Number of order book updates processed",
            ["symbol"],
        )
        self.service_up = Gauge("bybit_service_up", "Service up state (1=up)")
        self.last_heartbeat = Gauge(
            "bybit_last_heartbeat_timestamp", "Last heartbeat unix timestamp"
        )

        self._health_runner: web.AppRunner | None = None

    async def initialize(self) -> None:
        try:
            # Start metrics server
            try:
                start_http_server(self.metrics_port)
                self.service_up.set(1)
            except Exception:
                pass

            # Start health server once
            try:
                if not self._health_runner:
                    app = web.Application()

                    async def health(_request):
                        return web.json_response({
                            "status": "ok",
                            "service": "bybit_ingestion",
                            "use_testnet": self.use_testnet,
                        })

                    app.router.add_get('/health', health)
                    runner = web.AppRunner(app)
                    await runner.setup()
                    site = web.TCPSite(runner, '0.0.0.0', self.health_port)
                    await site.start()
                    self._health_runner = runner
            except Exception as e:
                logger.error("Failed to start health server", error=str(e))
            redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
            self.redis_client = redis.from_url(redis_url, decode_responses=True)
            await self.redis_client.ping()

            database_url = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/coinmatcher")
            async_database_url = database_url.replace("postgresql://", "postgresql+asyncpg://")
            self.db_engine = create_async_engine(async_database_url, echo=False, pool_pre_ping=True, pool_recycle=300)
            self.db_session = async_sessionmaker(self.db_engine, class_=AsyncSession, expire_on_commit=False)

            logger.info("Bybit connections established")
        except Exception as e:
            logger.error("Bybit init failed", error=str(e))
            raise

    async def get_active_symbols(self) -> List[str]:
        try:
            assert self.db_session is not None
            async with self.db_session() as session:
                result = await session.execute(
                    text("SELECT symbol FROM symbols WHERE is_active = true AND exchange = 'bybit'")
                )
                return [row[0] for row in result.fetchall()]
        except Exception as e:
            logger.error("Failed to get Bybit symbols", error=str(e))
            return []

    async def subscribe(self, symbols: List[str]) -> None:
        # Bybit v5 public subscription format uses JSON with op: 'subscribe', args: [...]
        url = self.ws_spot_testnet if self.use_testnet else self.ws_spot_public
        topics: List[str] = []
        for sym in symbols:
            # topics: trade, kline.1, orderbook.50
            topics.append(f"trade.{sym}")
            topics.append(f"kline.1.{sym}")
            topics.append(f"orderbook.50.{sym}")

        while True:
            try:
                async with websockets.connect(url) as ws:
                    sub_msg = {"op": "subscribe", "args": topics}
                    await ws.send(json.dumps(sub_msg))
                    logger.info("Subscribed to Bybit topics", count=len(topics))

                    async for message in ws:
                        await self._handle_message(message)
            except Exception as e:
                logger.error("Bybit WS error", error=str(e))
                await asyncio.sleep(self.reconnect_delay)

    async def _handle_message(self, message: str) -> None:
        try:
            payload = json.loads(message)
            if "topic" not in payload or "data" not in payload:
                return
            topic: str = payload["topic"]
            data = payload["data"]

            if topic.startswith("trade."):
                await self._handle_trades(data, topic)
            elif topic.startswith("kline."):
                await self._handle_kline(data, topic)
            elif topic.startswith("orderbook."):
                await self._handle_orderbook(data, topic)
        except Exception as e:
            logger.error("Bybit handle message failed", error=str(e))

    async def _handle_trades(self, trades: List[Dict], topic: str) -> None:
        try:
            symbol = topic.split(".")[-1]
            for t in trades:
                trade = {
                    "symbol": symbol,
                    "exchange": "bybit_spot",
                    "trade_id": str(t.get("i") or t.get("T") or t.get("s")),
                    "price": float(t["p"]),
                    "quantity": float(t["q"]),
                    "quote_quantity": float(t["p"]) * float(t["q"]),
                    "is_buyer_maker": bool(t.get("m", False)),
                    "timestamp": datetime.utcfromtimestamp(int(t["T"]) / 1000),
                }
                await self._store_trade_redis(trade)
                await self._store_trade_db(trade)
                try:
                    self.trades_counter.labels(symbol).inc()
                except Exception:
                    pass
                # Update real-time time series in Redis for fast analytics
                try:
                    price = float(t["p"]) if "p" in t else float(trade["price"])  # type: ignore
                    await self._update_realtime_series(symbol, "bybit_spot", price)
                except Exception:
                    pass
        except Exception as e:
            logger.error("Bybit trade store failed", error=str(e))

    async def _handle_kline(self, klines: List[Dict], topic: str) -> None:
        try:
            # topic: kline.1.SYMBOL
            symbol = topic.split(".")[-1]
            for k in klines:
                kline = {
                    "symbol": symbol,
                    "exchange": "bybit_spot",
                    "interval": "1m",
                    "open_time": datetime.utcfromtimestamp(int(k["start"])),
                    "close_time": datetime.utcfromtimestamp(int(k["end"])),
                    "open_price": float(k["open"]),
                    "high_price": float(k["high"]),
                    "low_price": float(k["low"]),
                    "close_price": float(k["close"]),
                    "volume": float(k.get("volume", 0.0)),
                    "quote_volume": float(k.get("turnover", 0.0)),
                    "trades_count": int(k.get("confirm", 0)),
                    "taker_buy_volume": 0.0,
                    "taker_buy_quote_volume": 0.0,
                    "is_closed": bool(k.get("confirm", False)),
                }
                await self._store_kline_redis(kline)
                if kline["is_closed"]:
                    await self._store_kline_db(kline)
                    try:
                        self.klines_counter.labels(symbol, "1m").inc()
                    except Exception:
                        pass
        except Exception as e:
            logger.error("Bybit kline store failed", error=str(e))

    async def _handle_orderbook(self, ob: Dict, topic: str) -> None:
        try:
            symbol = topic.split(".")[-1]
            # Bybit v5 sends bids/asks arrays of {price, size}
            bids = [[float(x["price"]), float(x["size"])] for x in ob.get("b", [])]
            asks = [[float(x["price"]), float(x["size"])] for x in ob.get("a", [])]
            record = {
                "symbol": symbol,
                "exchange": "bybit_spot",
                "timestamp": datetime.utcfromtimestamp(int(ob.get("ts", 0)) / 1000),
                "bids": bids,
                "asks": asks,
                "best_bid": bids[0][0] if bids else 0.0,
                "best_ask": asks[0][0] if asks else 0.0,
                "spread": (asks[0][0] - bids[0][0]) if bids and asks else 0.0,
                "mid_price": ((asks[0][0] + bids[0][0]) / 2.0) if bids and asks else 0.0,
            }
            await self._store_orderbook_redis(record)
            await self._store_orderbook_db(record)
            try:
                self.orderbook_counter.labels(symbol).inc()
            except Exception:
                pass
        except Exception as e:
            logger.error("Bybit orderbook store failed", error=str(e))

    async def _store_kline_redis(self, kline: Dict) -> None:
        try:
            key = f"kline:{kline['symbol']}:{kline['interval']}:{kline['exchange']}"
            await self.redis_client.setex(key, 3600, json.dumps(kline, default=str))
        except Exception as e:
            logger.error("Bybit kline redis failed", error=str(e))

    async def _store_kline_db(self, kline: Dict) -> None:
        try:
            assert self.db_session is not None
            async with self.db_session() as session:
                query = text(
                    """
                    INSERT INTO klines (
                        symbol, exchange, interval, open_time, close_time,
                        open_price, high_price, low_price, close_price,
                        volume, quote_volume, trades_count,
                        taker_buy_volume, taker_buy_quote_volume
                    ) VALUES (
                        :symbol, :exchange, :interval, :open_time, :close_time,
                        :open_price, :high_price, :low_price, :close_price,
                        :volume, :quote_volume, :trades_count,
                        :taker_buy_volume, :taker_buy_quote_volume
                    )
                    ON CONFLICT (symbol, exchange, interval, open_time)
                    DO NOTHING
                    """
                )
                await session.execute(query, kline)
                await session.commit()
        except Exception as e:
            logger.error("Bybit kline db failed", error=str(e))

    async def _store_trade_redis(self, trade: Dict) -> None:
        try:
            key = f"trade:{trade['symbol']}:{trade['exchange']}:{trade['trade_id']}"
            await self.redis_client.setex(key, 300, json.dumps(trade, default=str))
        except Exception as e:
            logger.error("Bybit trade redis failed", error=str(e))

    async def _store_trade_db(self, trade: Dict) -> None:
        try:
            assert self.db_session is not None
            async with self.db_session() as session:
                query = text(
                    """
                    INSERT INTO trades (
                        symbol, exchange, trade_id, price, quantity,
                        quote_quantity, is_buyer_maker, timestamp
                    ) VALUES (
                        :symbol, :exchange, :trade_id, :price, :quantity,
                        :quote_quantity, :is_buyer_maker, :timestamp
                    )
                    ON CONFLICT (trade_id) DO NOTHING
                    """
                )
                await session.execute(query, trade)
                await session.commit()
        except Exception as e:
            logger.error("Bybit trade db failed", error=str(e))

    async def _store_orderbook_redis(self, ob: Dict) -> None:
        try:
            key = f"orderbook:{ob['symbol']}:{ob['exchange']}"
            await self.redis_client.setex(key, 60, json.dumps(ob, default=str))
        except Exception as e:
            logger.error("Bybit orderbook redis failed", error=str(e))

    async def _store_orderbook_db(self, ob: Dict) -> None:
        try:
            assert self.db_session is not None
            async with self.db_session() as session:
                query = text(
                    """
                    INSERT INTO order_books (
                        symbol, exchange, timestamp, bids, asks,
                        best_bid, best_ask, spread, mid_price
                    ) VALUES (
                        :symbol, :exchange, :timestamp, CAST(:bids AS JSONB), CAST(:asks AS JSONB),
                        :best_bid, :best_ask, :spread, :mid_price
                    )
                    """
                )
                import json as _json
                params = dict(ob)
                params["bids"] = _json.dumps(ob.get("bids", []))
                params["asks"] = _json.dumps(ob.get("asks", []))
                await session.execute(query, params)
                await session.commit()
        except Exception as e:
            logger.error("Bybit orderbook db failed", error=str(e))

    async def start(self) -> None:
        logger.info("Starting Bybit WS service")
        await self.initialize()
        symbols = await self.get_active_symbols()
        if not symbols:
            symbols = FALLBACK_SYMBOLS.copy()
            logger.warning(
                "No Bybit symbols found in database; using fallback list",
                count=len(symbols),
            )

        if not symbols:
            logger.error("Fallback symbol list is empty; staying idle")
            while True:
                await asyncio.sleep(self.heartbeat_interval)

        # Heartbeat task
        asyncio.create_task(self._heartbeat())
        await self.subscribe(symbols)

    async def _heartbeat(self) -> None:
        while True:
            try:
                await asyncio.sleep(self.heartbeat_interval)
                await self.redis_client.ping()
                assert self.db_session is not None
                async with self.db_session() as session:
                    await session.execute(text("SELECT 1"))
                logger.debug("Bybit heartbeat ok")
                try:
                    self.last_heartbeat.set(time.time())
                except Exception:
                    pass
            except Exception as e:
                logger.error("Bybit heartbeat failed", error=str(e))
                await self.initialize()

    async def _update_realtime_series(self, symbol: str, exchange: str, price: float, max_len: int = 3600) -> None:
        try:
            import time as _t
            key = f"rt:prices:{symbol}:{exchange}"
            val = f"{int(_t.time())},{price}"
            pipe = self.redis_client.pipeline()
            pipe.lpush(key, val)
            pipe.ltrim(key, 0, max_len - 1)
            pipe.expire(key, max(3600, max_len))
            await pipe.execute()
        except Exception as e:
            logger.error("Bybit realtime series failed", error=str(e))


async def main() -> None:
    service = BybitWebSocketService()
    await service.start()


if __name__ == "__main__":
    asyncio.run(main())
