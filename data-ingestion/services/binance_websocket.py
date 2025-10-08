"""
Binance WebSocket data ingestion service
Real-time market data collection for spot and futures markets
"""

import asyncio
import json
import websockets
import structlog
from datetime import datetime, timezone
from typing import Dict, List, Set, Optional
import redis.asyncio as redis
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text
import os
from dotenv import load_dotenv
from prometheus_client import start_http_server, Counter, Gauge
from aiohttp import web
import time

# Load environment variables
load_dotenv()

# Configure logging
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
        structlog.processors.JSONRenderer()
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
        "BINANCE_FALLBACK_SYMBOLS",
        "BTCUSDT,ETHUSDT,BNBUSDT,SOLUSDT,XRPUSDT,ADAUSDT,DOGEUSDT,AVAXUSDT",
    ).split(",")
    if symbol.strip()
]


class BinanceWebSocketService:
    """Binance WebSocket data ingestion service"""
    
    def __init__(self):
        self.redis_client = None
        self.db_engine = None
        self.db_session = None
        self.active_connections: Dict[str, websockets.WebSocketServerProtocol] = {}
        self.subscribed_streams: Set[str] = set()
        self.reconnect_delay = int(os.getenv("WS_RECONNECT_DELAY", 5))
        self.heartbeat_interval = int(os.getenv("WS_HEARTBEAT_INTERVAL", 30))
        self.metrics_port = int(os.getenv("METRICS_PORT", 8001))
        self.health_port = int(os.getenv("HEALTH_PORT", 8002))
        
        # Binance WebSocket URLs (combined stream endpoints)
        # Use the "/stream?streams=" endpoints to multiplex many streams over one connection
        self.spot_base_url = "wss://stream.binance.com:9443/stream?streams="
        self.futures_base_url = "wss://fstream.binance.com/stream?streams="
        self.testnet_spot_url = "wss://testnet.binance.vision/stream?streams="
        self.testnet_futures_url = "wss://stream.binancefuture.com/stream?streams="
        
        # Use testnet only when explicitly requested
        self.use_testnet = os.getenv("BINANCE_TESTNET", "false").lower() == "true"

        # Metrics
        self.trades_counter = Counter(
            "binance_trades_total", "Number of trades processed", ["market_type", "symbol"]
        )
        self.klines_counter = Counter(
            "binance_klines_closed_total",
            "Number of closed klines processed",
            ["market_type", "symbol", "interval"],
        )
        self.orderbook_counter = Counter(
            "binance_orderbook_updates_total",
            "Number of order book updates processed",
            ["market_type", "symbol"],
        )
        self.service_up = Gauge("binance_service_up", "Service up state (1=up)")
        self.last_heartbeat = Gauge(
            "binance_last_heartbeat_timestamp", "Last heartbeat unix timestamp"
        )

        # aiohttp health server runner
        self._health_runner: Optional[web.AppRunner] = None
        
    async def initialize(self):
        """Initialize Redis and database connections"""
        try:
            # Start metrics server (idempotent if called multiple times in same process)
            try:
                start_http_server(self.metrics_port)
                self.service_up.set(1)
            except Exception:
                pass

            # Start health HTTP server (aiohttp) once
            try:
                if not self._health_runner:
                    app = web.Application()

                    async def health(_request):
                        return web.json_response({
                            "status": "ok",
                            "service": "binance_ingestion",
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
            # Initialize Redis
            redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
            self.redis_client = redis.from_url(redis_url, decode_responses=True)
            await self.redis_client.ping()
            logger.info("Redis connection established")
            
            # Initialize Database
            database_url = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/coinmatcher")
            async_database_url = database_url.replace("postgresql://", "postgresql+asyncpg://")
            
            self.db_engine = create_async_engine(
                async_database_url,
                echo=False,
                pool_pre_ping=True,
                pool_recycle=300,
            )
            
            self.db_session = async_sessionmaker(
                self.db_engine,
                class_=AsyncSession,
                expire_on_commit=False
            )
            
            logger.info("Database connection established")
            
        except Exception as e:
            logger.error("Failed to initialize connections", error=str(e))
            raise
    
    async def get_active_symbols(self) -> List[str]:
        """Get list of active trading symbols"""
        try:
            async with self.db_session() as session:
                result = await session.execute(
                    text("SELECT symbol FROM symbols WHERE is_active = true AND exchange = 'binance'")
                )
                symbols = [row[0] for row in result.fetchall()]
                logger.info("Retrieved active symbols", count=len(symbols))
                return symbols
        except Exception as e:
            logger.error("Failed to get active symbols", error=str(e))
            return []
    
    async def subscribe_to_streams(self, symbols: List[str]):
        """Subscribe to WebSocket streams for given symbols"""
        try:
            # Create stream names for different data types
            streams = []
            
            for symbol in symbols:
                symbol_lower = symbol.lower()
                
                # Kline streams (1m, 5m, 15m, 1h, 4h, 1d)
                for interval in ["1m", "5m", "15m", "1h", "4h", "1d"]:
                    streams.append(f"{symbol_lower}@kline_{interval}")
                
                # Trade streams
                streams.append(f"{symbol_lower}@trade")
                
                # Order book streams (diff. depth updates provide symbol + event time)
                streams.append(f"{symbol_lower}@depth@100ms")
            
            # Subscribe to spot streams
            await self._subscribe_spot_streams(streams)
            
            # Subscribe to futures streams
            await self._subscribe_futures_streams(streams)
            
            logger.info("Subscribed to streams", stream_count=len(streams))
            
        except Exception as e:
            logger.error("Failed to subscribe to streams", error=str(e))
            raise
    
    async def _subscribe_spot_streams(self, streams: List[str]):
        """Subscribe to spot market streams"""
        try:
            base_url = self.testnet_spot_url if self.use_testnet else self.spot_base_url
            # Combine streams with '/' as required by Binance combined stream API
            stream_url = f"{base_url}{'/'.join(streams)}"
            
            async with websockets.connect(stream_url) as websocket:
                self.active_connections["spot"] = websocket
                logger.info("Connected to Binance spot WebSocket")
                
                async for message in websocket:
                    try:
                        data = json.loads(message)
                        await self._process_spot_data(data)
                    except json.JSONDecodeError as e:
                        logger.error("Failed to parse spot message", error=str(e))
                    except Exception as e:
                        logger.error("Error processing spot data", error=str(e))
                        
        except Exception as e:
            logger.error("Spot WebSocket connection failed", error=str(e))
            await asyncio.sleep(self.reconnect_delay)
            await self._subscribe_spot_streams(streams)
    
    async def _subscribe_futures_streams(self, streams: List[str]):
        """Subscribe to futures market streams"""
        try:
            base_url = self.testnet_futures_url if self.use_testnet else self.futures_base_url
            stream_url = f"{base_url}{'/'.join(streams)}"
            
            async with websockets.connect(stream_url) as websocket:
                self.active_connections["futures"] = websocket
                logger.info("Connected to Binance futures WebSocket")
                
                async for message in websocket:
                    try:
                        data = json.loads(message)
                        await self._process_futures_data(data)
                    except json.JSONDecodeError as e:
                        logger.error("Failed to parse futures message", error=str(e))
                    except Exception as e:
                        logger.error("Error processing futures data", error=str(e))
                        
        except Exception as e:
            logger.error("Futures WebSocket connection failed", error=str(e))
            await asyncio.sleep(self.reconnect_delay)
            await self._subscribe_futures_streams(streams)
    
    async def _process_spot_data(self, data: Dict):
        """Process spot market data"""
        try:
            if "stream" in data and "data" in data:
                stream = data["stream"]
                market_data = data["data"]
                
                if "@kline_" in stream:
                    await self._process_kline_data(market_data, "spot")
                elif "@trade" in stream:
                    await self._process_trade_data(market_data, "spot")
                elif "@depth" in stream:
                    await self._process_orderbook_data(market_data, "spot")
                    
        except Exception as e:
            logger.error("Failed to process spot data", error=str(e))
    
    async def _process_futures_data(self, data: Dict):
        """Process futures market data"""
        try:
            if "stream" in data and "data" in data:
                stream = data["stream"]
                market_data = data["data"]
                
                if "@kline_" in stream:
                    await self._process_kline_data(market_data, "futures")
                elif "@trade" in stream:
                    await self._process_trade_data(market_data, "futures")
                elif "@depth" in stream:
                    await self._process_orderbook_data(market_data, "futures")
                    
        except Exception as e:
            logger.error("Failed to process futures data", error=str(e))
    
    async def _process_kline_data(self, data: Dict, market_type: str):
        """Process kline (candlestick) data"""
        try:
            kline = data["k"]
            
            # Use timezone-naive UTC datetimes for DB compatibility
            kline_data = {
                "symbol": kline["s"],
                "exchange": f"binance_{market_type}",
                "interval": kline["i"],
                "open_time": datetime.utcfromtimestamp(kline["t"] / 1000),
                "close_time": datetime.utcfromtimestamp(kline["T"] / 1000),
                "open_price": float(kline["o"]),
                "high_price": float(kline["h"]),
                "low_price": float(kline["l"]),
                "close_price": float(kline["c"]),
                "volume": float(kline["v"]),
                "quote_volume": float(kline["q"]),
                "trades_count": int(kline["n"]),
                "taker_buy_volume": float(kline["V"]),
                "taker_buy_quote_volume": float(kline["Q"]),
                "is_closed": kline["x"]  # Whether this kline is closed
            }
            
            # Store in Redis for real-time access
            await self._store_kline_redis(kline_data)
            
            # Store in database if kline is closed
            if kline_data["is_closed"]:
                await self._store_kline_db(kline_data)
                try:
                    self.klines_counter.labels(market_type, kline_data["symbol"], kline_data["interval"]).inc()
                except Exception:
                    pass
                
        except Exception as e:
            logger.error("Failed to process kline data", error=str(e))
    
    async def _process_trade_data(self, data: Dict, market_type: str):
        """Process trade data"""
        try:
            # Use timezone-naive UTC datetime for DB compatibility
            trade_data = {
                "symbol": data["s"],
                "exchange": f"binance_{market_type}",
                "trade_id": str(data["t"]),
                "price": float(data["p"]),
                "quantity": float(data["q"]),
                "quote_quantity": float(data["p"]) * float(data["q"]),
                "is_buyer_maker": data["m"],
                "timestamp": datetime.utcfromtimestamp(data["T"] / 1000),
            }
            
            # Store in Redis for real-time access
            await self._store_trade_redis(trade_data)
            
            # Store in database
            await self._store_trade_db(trade_data)
            try:
                self.trades_counter.labels(market_type, trade_data["symbol"]).inc()
            except Exception:
                pass

            # Update real-time time series in Redis for fast analytics
            try:
                await self._update_realtime_series(trade_data["symbol"], f"binance_{market_type}", trade_data["price"])
            except Exception:
                pass
            
        except Exception as e:
            logger.error("Failed to process trade data", error=str(e))
    
    async def _process_orderbook_data(self, data: Dict, market_type: str):
        """Process order book data"""
        try:
            orderbook_data = {
                "symbol": data["s"],
                "exchange": f"binance_{market_type}",
                # diff. depth stream includes event time E
                "timestamp": datetime.utcfromtimestamp(data["E"] / 1000),
                "bids": [[float(bid[0]), float(bid[1])] for bid in data["b"]],
                "asks": [[float(ask[0]), float(ask[1])] for ask in data["a"]],
                "best_bid": float(data["b"][0][0]) if data["b"] else 0.0,
                "best_ask": float(data["a"][0][0]) if data["a"] else 0.0,
                "spread": float(data["a"][0][0]) - float(data["b"][0][0]) if data["a"] and data["b"] else 0.0,
                "mid_price": (float(data["a"][0][0]) + float(data["b"][0][0])) / 2 if data["a"] and data["b"] else 0.0
            }
            
            # Store in Redis for real-time access
            await self._store_orderbook_redis(orderbook_data)
            
            # Store in database
            await self._store_orderbook_db(orderbook_data)
            try:
                self.orderbook_counter.labels(market_type, orderbook_data["symbol"]).inc()
            except Exception:
                pass
            
        except Exception as e:
            logger.error("Failed to process orderbook data", error=str(e))
    
    async def _store_kline_redis(self, kline_data: Dict):
        """Store kline data in Redis"""
        try:
            key = f"kline:{kline_data['symbol']}:{kline_data['interval']}:{kline_data['exchange']}"
            await self.redis_client.setex(key, 3600, json.dumps(kline_data, default=str))
        except Exception as e:
            logger.error("Failed to store kline in Redis", error=str(e))
    
    async def _store_kline_db(self, kline_data: Dict):
        """Store kline data in database"""
        try:
            async with self.db_session() as session:
                query = text("""
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
                    DO UPDATE SET
                        close_price = EXCLUDED.close_price,
                        high_price = EXCLUDED.high_price,
                        low_price = EXCLUDED.low_price,
                        volume = EXCLUDED.volume,
                        quote_volume = EXCLUDED.quote_volume,
                        trades_count = EXCLUDED.trades_count,
                        taker_buy_volume = EXCLUDED.taker_buy_volume,
                        taker_buy_quote_volume = EXCLUDED.taker_buy_quote_volume
                """)
                
                await session.execute(query, kline_data)
                await session.commit()
                
        except Exception as e:
            logger.error("Failed to store kline in database", error=str(e))
    
    async def _store_trade_redis(self, trade_data: Dict):
        """Store trade data in Redis"""
        try:
            key = f"trade:{trade_data['symbol']}:{trade_data['exchange']}:{trade_data['trade_id']}"
            await self.redis_client.setex(key, 300, json.dumps(trade_data, default=str))
        except Exception as e:
            logger.error("Failed to store trade in Redis", error=str(e))
    
    async def _store_trade_db(self, trade_data: Dict):
        """Store trade data in database"""
        try:
            async with self.db_session() as session:
                query = text("""
                    INSERT INTO trades (
                        symbol, exchange, trade_id, price, quantity,
                        quote_quantity, is_buyer_maker, timestamp
                    ) VALUES (
                        :symbol, :exchange, :trade_id, :price, :quantity,
                        :quote_quantity, :is_buyer_maker, :timestamp
                    )
                    ON CONFLICT (trade_id) DO NOTHING
                """)
                
                await session.execute(query, trade_data)
                await session.commit()
                
        except Exception as e:
            logger.error("Failed to store trade in database", error=str(e))
    
    async def _store_orderbook_redis(self, orderbook_data: Dict):
        """Store orderbook data in Redis"""
        try:
            key = f"orderbook:{orderbook_data['symbol']}:{orderbook_data['exchange']}"
            await self.redis_client.setex(key, 60, json.dumps(orderbook_data, default=str))
        except Exception as e:
            logger.error("Failed to store orderbook in Redis", error=str(e))
    
    async def _store_orderbook_db(self, orderbook_data: Dict):
        """Store orderbook data in database"""
        try:
            async with self.db_session() as session:
                query = text("""
                    INSERT INTO order_books (
                        symbol, exchange, timestamp, bids, asks,
                        best_bid, best_ask, spread, mid_price
                    ) VALUES (
                        :symbol, :exchange, :timestamp, CAST(:bids AS JSONB), CAST(:asks AS JSONB),
                        :best_bid, :best_ask, :spread, :mid_price
                    )
                """)
                
                params = dict(orderbook_data)
                # Ensure JSONB parameters are serialized
                params["bids"] = json.dumps(orderbook_data.get("bids", []))
                params["asks"] = json.dumps(orderbook_data.get("asks", []))
                
                await session.execute(query, params)
                await session.commit()
                
        except Exception as e:
            logger.error("Failed to store orderbook in database", error=str(e))
    
    async def start_heartbeat(self):
        """Start heartbeat monitoring"""
        while True:
            try:
                await asyncio.sleep(self.heartbeat_interval)
                
                # Check Redis connection
                await self.redis_client.ping()
                
                # Check database connection
                async with self.db_session() as session:
                    await session.execute(text("SELECT 1"))
                
                logger.debug("Heartbeat check passed")
                try:
                    self.last_heartbeat.set(time.time())
                except Exception:
                    pass
                
            except Exception as e:
                logger.error("Heartbeat check failed", error=str(e))
                # Attempt to reconnect
                await self.initialize()

    async def _update_realtime_series(self, symbol: str, exchange: str, price: float, max_len: int = 3600):
        """Push latest price point into Redis list for early correlation.

        Key: rt:prices:{symbol}:{exchange}
        Value: "{epoch_sec},{price}"
        """
        try:
            import time as _t
            key = f"rt:prices:{symbol}:{exchange}"
            val = f"{int(_t.time())},{price}"
            # Push newest first and trim
            pipe = self.redis_client.pipeline()
            pipe.lpush(key, val)
            pipe.ltrim(key, 0, max_len - 1)
            # Set an expiry to auto-cleanup inactive series
            pipe.expire(key, max(3600, max_len))
            await pipe.execute()
        except Exception as e:
            logger.error("Failed to update realtime series", error=str(e))
    
    async def run(self):
        """Main service loop"""
        try:
            logger.info("Starting Binance WebSocket service")
            
            # Initialize connections
            await self.initialize()
            
            # Get active symbols
            symbols = await self.get_active_symbols()
            if not symbols:
                symbols = FALLBACK_SYMBOLS.copy()
                logger.warning(
                    "No active symbols found in database; using fallback list",
                    count=len(symbols),
                )

            if not symbols:
                logger.error("Fallback symbol list is empty; staying idle")
                while True:
                    await asyncio.sleep(self.heartbeat_interval)

            # Start heartbeat monitoring
            heartbeat_task = asyncio.create_task(self.start_heartbeat())
            
            # Subscribe to streams
            await self.subscribe_to_streams(symbols)
            
        except KeyboardInterrupt:
            logger.info("Service stopped by user")
        except Exception as e:
            logger.error("Service failed", error=str(e))
            raise
        finally:
            # Cleanup
            if self.redis_client:
                await self.redis_client.close()
            if self.db_engine:
                await self.db_engine.dispose()
            logger.info("Service cleanup completed")


async def main():
    """Main entry point"""
    service = BinanceWebSocketService()
    await service.run()


if __name__ == "__main__":
    asyncio.run(main())
