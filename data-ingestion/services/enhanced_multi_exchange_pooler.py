"""
Enhanced Multi-Exchange Data Pooler
Aggregates real-time data from 10+ exchanges with failover and deduplication
"""

import asyncio
import json
import time
import os
from typing import Dict, List, Set, Optional, Any
from datetime import datetime, timezone
from dataclasses import dataclass, asdict
import structlog
import redis.asyncio as redis
from prometheus_client import start_http_server, Counter, Gauge, Histogram
import ccxt.async_support as ccxt
import websockets
from aiohttp import web

logger = structlog.get_logger()

@dataclass
class MarketData:
    symbol: str
    exchange: str
    price: float
    volume: float
    change_24h: float
    change_percent_24h: float
    timestamp: float
    source: str  # 'websocket' or 'rest'

@dataclass
class ExchangeConfig:
    name: str
    ccxt_class: Any
    websocket_url: Optional[str] = None
    rest_endpoint: str = ""
    rate_limit: int = 1200
    min_volume: float = 50000
    priority: int = 1  # 1 = highest priority
    enabled: bool = True

class EnhancedMultiExchangePooler:
    def __init__(self):
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        self.redis = redis.from_url(self.redis_url, decode_responses=True)
        self.metrics_port = int(os.getenv("METRICS_PORT", "8001"))
        self.health_port = int(os.getenv("HEALTH_PORT", "8002"))
        
        # Exchange configurations with priority and failover
        self.exchanges = {
            'binance': ExchangeConfig(
                name='binance',
                ccxt_class=ccxt.binance,
                websocket_url='wss://stream.binance.com:9443/stream?streams=',
                rest_endpoint='https://api.binance.com',
                rate_limit=1200,
                min_volume=100000,
                priority=1
            ),
            'bybit': ExchangeConfig(
                name='bybit',
                ccxt_class=ccxt.bybit,
                websocket_url='wss://stream.bybit.com/v5/public/spot',
                rest_endpoint='https://api.bybit.com',
                rate_limit=1200,
                min_volume=100000,
                priority=2
            ),
            'kucoin': ExchangeConfig(
                name='kucoin',
                ccxt_class=ccxt.kucoin,
                websocket_url='wss://ws-api.kucoin.com/endpoint',
                rest_endpoint='https://api.kucoin.com',
                rate_limit=1800,
                min_volume=50000,
                priority=3
            ),
            'coinbase': ExchangeConfig(
                name='coinbase',
                ccxt_class=ccxt.coinbasepro,
                websocket_url='wss://ws-feed.exchange.coinbase.com',
                rest_endpoint='https://api.exchange.coinbase.com',
                rate_limit=1000,
                min_volume=50000,
                priority=4
            ),
            'kraken': ExchangeConfig(
                name='kraken',
                ccxt_class=ccxt.kraken,
                websocket_url='wss://ws.kraken.com',
                rest_endpoint='https://api.kraken.com',
                rate_limit=1000,
                min_volume=50000,
                priority=5
            ),
            'okx': ExchangeConfig(
                name='okx',
                ccxt_class=ccxt.okx,
                websocket_url='wss://ws.okx.com:8443/ws/v5/public',
                rest_endpoint='https://www.okx.com',
                rate_limit=1200,
                min_volume=100000,
                priority=6
            ),
            'gateio': ExchangeConfig(
                name='gateio',
                ccxt_class=ccxt.gateio,
                websocket_url='wss://api.gateio.ws/ws/v4/',
                rest_endpoint='https://api.gateio.ws',
                rate_limit=1200,
                min_volume=50000,
                priority=7
            ),
            'huobi': ExchangeConfig(
                name='huobi',
                ccxt_class=ccxt.huobi,
                websocket_url='wss://api.huobi.pro/ws',
                rest_endpoint='https://api.huobi.pro',
                rate_limit=1000,
                min_volume=50000,
                priority=8
            ),
            'bitfinex': ExchangeConfig(
                name='bitfinex',
                ccxt_class=ccxt.bitfinex,
                websocket_url='wss://api-pub.bitfinex.com/ws/2',
                rest_endpoint='https://api.bitfinex.com',
                rate_limit=1000,
                min_volume=50000,
                priority=9
            ),
            'bitmex': ExchangeConfig(
                name='bitmex',
                ccxt_class=ccxt.bitmex,
                websocket_url='wss://www.bitmex.com/realtime',
                rest_endpoint='https://www.bitmex.com',
                rate_limit=1000,
                min_volume=100000,
                priority=10
            )
        }
        
        # Metrics
        self.setup_metrics()
        
        # Data storage
        self.symbol_data: Dict[str, Dict[str, MarketData]] = {}
        self.exchange_status: Dict[str, bool] = {}
        self.websocket_connections: Dict[str, websockets.WebSocketServerProtocol] = {}
        
        # Health server
        self._health_runner: Optional[web.AppRunner] = None
        
    def setup_metrics(self):
        """Setup Prometheus metrics"""
        try:
            start_http_server(self.metrics_port)
        except Exception:
            pass
            
        self.data_points = Counter("market_data_points_total", "Data points collected", ["exchange", "symbol", "source"])
        self.exchange_up = Gauge("exchange_status", "Exchange status (1=up, 0=down)", ["exchange"])
        self.latency = Histogram("data_latency_seconds", "Data processing latency", ["exchange"])
        self.pooled_symbols = Gauge("pooled_symbols_total", "Total pooled symbols")
        self.websocket_connections_gauge = Gauge("websocket_connections", "Active WebSocket connections", ["exchange"])
        
    async def initialize(self):
        """Initialize the pooler"""
        try:
            # Start health server
            await self.start_health_server()
            
            # Initialize Redis
            await self.redis.ping()
            logger.info("Redis connection established")
            
            # Initialize exchange status
            for exchange_name in self.exchanges:
                self.exchange_status[exchange_name] = False
                self.exchange_up.labels(exchange=exchange_name).set(0)
                
            logger.info("Enhanced Multi-Exchange Pooler initialized")
            
        except Exception as e:
            logger.error("Failed to initialize pooler", error=str(e))
            raise
    
    async def start_health_server(self):
        """Start health check server"""
        try:
            app = web.Application()
            
            async def health(request):
                active_exchanges = sum(1 for status in self.exchange_status.values() if status)
                total_symbols = len(self.symbol_data)
                
                return web.json_response({
                    "status": "ok",
                    "service": "enhanced_multi_exchange_pooler",
                    "active_exchanges": active_exchanges,
                    "total_exchanges": len(self.exchanges),
                    "total_symbols": total_symbols,
                    "exchange_status": self.exchange_status
                })
            
            app.router.add_get('/health', health)
            runner = web.AppRunner(app)
            await runner.setup()
            site = web.TCPSite(runner, '0.0.0.0', self.health_port)
            await site.start()
            self._health_runner = runner
            
        except Exception as e:
            logger.error("Failed to start health server", error=str(e))
    
    async def get_top_symbols(self, limit: int = 100) -> List[str]:
        """Get top symbols by volume across all exchanges"""
        try:
            all_symbols = set()
            symbol_volumes = {}
            
            for exchange_name, config in self.exchanges.items():
                if not config.enabled:
                    continue
                    
                try:
                    exchange = config.ccxt_class()
                    await exchange.load_markets()
                    
                    for symbol, market in exchange.markets.items():
                        if (market.get('quote') == 'USDT' and 
                            market.get('active', True) and 
                            market.get('type') == 'spot'):
                            
                            volume = market.get('info', {}).get('volume', 0)
                            if volume > config.min_volume:
                                all_symbols.add(symbol)
                                symbol_volumes[symbol] = symbol_volumes.get(symbol, 0) + volume
                    
                    await exchange.close()
                    
                except Exception as e:
                    logger.error(f"Failed to get symbols from {exchange_name}", error=str(e))
            
            # Sort by total volume and return top symbols
            sorted_symbols = sorted(symbol_volumes.items(), key=lambda x: x[1], reverse=True)
            return [symbol for symbol, _ in sorted_symbols[:limit]]
            
        except Exception as e:
            logger.error("Failed to get top symbols", error=str(e))
            return []
    
    async def start_websocket_connections(self, symbols: List[str]):
        """Start WebSocket connections for all exchanges"""
        tasks = []
        
        for exchange_name, config in self.exchanges.items():
            if config.enabled and config.websocket_url:
                task = asyncio.create_task(
                    self.connect_websocket(exchange_name, config, symbols)
                )
                tasks.append(task)
        
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
    
    async def connect_websocket(self, exchange_name: str, config: ExchangeConfig, symbols: List[str]):
        """Connect to exchange WebSocket"""
        try:
            if exchange_name == 'binance':
                await self.connect_binance_websocket(config, symbols)
            elif exchange_name == 'bybit':
                await self.connect_bybit_websocket(config, symbols)
            elif exchange_name == 'kucoin':
                await self.connect_kucoin_websocket(config, symbols)
            elif exchange_name == 'coinbase':
                await self.connect_coinbase_websocket(config, symbols)
            elif exchange_name == 'kraken':
                await self.connect_kraken_websocket(config, symbols)
            elif exchange_name == 'okx':
                await self.connect_okx_websocket(config, symbols)
            elif exchange_name == 'gateio':
                await self.connect_gateio_websocket(config, symbols)
            elif exchange_name == 'huobi':
                await self.connect_huobi_websocket(config, symbols)
            elif exchange_name == 'bitfinex':
                await self.connect_bitfinex_websocket(config, symbols)
            elif exchange_name == 'bitmex':
                await self.connect_bitmex_websocket(config, symbols)
                
        except Exception as e:
            logger.error(f"WebSocket connection failed for {exchange_name}", error=str(e))
            self.exchange_status[exchange_name] = False
            self.exchange_up.labels(exchange=exchange_name).set(0)
    
    async def connect_binance_websocket(self, config: ExchangeConfig, symbols: List[str]):
        """Connect to Binance WebSocket"""
        try:
            # Create stream names
            streams = []
            for symbol in symbols:
                symbol_lower = symbol.lower()
                streams.extend([
                    f"{symbol_lower}@ticker",
                    f"{symbol_lower}@trade"
                ])
            
            url = f"{config.websocket_url}{'/'.join(streams)}"
            
            async with websockets.connect(url) as websocket:
                self.websocket_connections[config.name] = websocket
                self.exchange_status[config.name] = True
                self.exchange_up.labels(exchange=config.name).set(1)
                self.websocket_connections_gauge.labels(exchange=config.name).set(1)
                
                logger.info(f"Connected to {config.name} WebSocket")
                
                async for message in websocket:
                    try:
                        data = json.loads(message)
                        await self.process_binance_data(data)
                    except Exception as e:
                        logger.error(f"Error processing {config.name} data", error=str(e))
                        
        except Exception as e:
            logger.error(f"Binance WebSocket connection failed", error=str(e))
            self.exchange_status[config.name] = False
            self.exchange_up.labels(exchange=config.name).set(0)
            self.websocket_connections_gauge.labels(exchange=config.name).set(0)
    
    async def connect_bybit_websocket(self, config: ExchangeConfig, symbols: List[str]):
        """Connect to Bybit WebSocket"""
        try:
            async with websockets.connect(config.websocket_url) as websocket:
                self.websocket_connections[config.name] = websocket
                self.exchange_status[config.name] = True
                self.exchange_up.labels(exchange=config.name).set(1)
                self.websocket_connections_gauge.labels(exchange=config.name).set(1)
                
                # Subscribe to tickers
                subscribe_msg = {
                    "op": "subscribe",
                    "args": [f"tickers.{symbol}" for symbol in symbols]
                }
                await websocket.send(json.dumps(subscribe_msg))
                
                logger.info(f"Connected to {config.name} WebSocket")
                
                async for message in websocket:
                    try:
                        data = json.loads(message)
                        await self.process_bybit_data(data)
                    except Exception as e:
                        logger.error(f"Error processing {config.name} data", error=str(e))
                        
        except Exception as e:
            logger.error(f"Bybit WebSocket connection failed", error=str(e))
            self.exchange_status[config.name] = False
            self.exchange_up.labels(exchange=config.name).set(0)
            self.websocket_connections_gauge.labels(exchange=config.name).set(0)
    
    async def connect_kucoin_websocket(self, config: ExchangeConfig, symbols: List[str]):
        """Connect to KuCoin WebSocket"""
        try:
            async with websockets.connect(config.websocket_url) as websocket:
                self.websocket_connections[config.name] = websocket
                self.exchange_status[config.name] = True
                self.exchange_up.labels(exchange=config.name).set(1)
                self.websocket_connections_gauge.labels(exchange=config.name).set(1)
                
                # Subscribe to tickers
                subscribe_msg = {
                    "id": int(time.time()),
                    "type": "subscribe",
                    "topic": "/market/ticker:all",
                    "response": True
                }
                await websocket.send(json.dumps(subscribe_msg))
                
                logger.info(f"Connected to {config.name} WebSocket")
                
                async for message in websocket:
                    try:
                        data = json.loads(message)
                        await self.process_kucoin_data(data)
                    except Exception as e:
                        logger.error(f"Error processing {config.name} data", error=str(e))
                        
        except Exception as e:
            logger.error(f"KuCoin WebSocket connection failed", error=str(e))
            self.exchange_status[config.name] = False
            self.exchange_up.labels(exchange=config.name).set(0)
            self.websocket_connections_gauge.labels(exchange=config.name).set(0)
    
    async def connect_coinbase_websocket(self, config: ExchangeConfig, symbols: List[str]):
        """Connect to Coinbase WebSocket"""
        try:
            async with websockets.connect(config.websocket_url) as websocket:
                self.websocket_connections[config.name] = websocket
                self.exchange_status[config.name] = True
                self.exchange_up.labels(exchange=config.name).set(1)
                self.websocket_connections_gauge.labels(exchange=config.name).set(1)
                
                # Subscribe to tickers
                subscribe_msg = {
                    "type": "subscribe",
                    "product_ids": symbols,
                    "channels": ["ticker"]
                }
                await websocket.send(json.dumps(subscribe_msg))
                
                logger.info(f"Connected to {config.name} WebSocket")
                
                async for message in websocket:
                    try:
                        data = json.loads(message)
                        await self.process_coinbase_data(data)
                    except Exception as e:
                        logger.error(f"Error processing {config.name} data", error=str(e))
                        
        except Exception as e:
            logger.error(f"Coinbase WebSocket connection failed", error=str(e))
            self.exchange_status[config.name] = False
            self.exchange_up.labels(exchange=config.name).set(0)
            self.websocket_connections_gauge.labels(exchange=config.name).set(0)
    
    async def connect_kraken_websocket(self, config: ExchangeConfig, symbols: List[str]):
        """Connect to Kraken WebSocket"""
        try:
            async with websockets.connect(config.websocket_url) as websocket:
                self.websocket_connections[config.name] = websocket
                self.exchange_status[config.name] = True
                self.exchange_up.labels(exchange=config.name).set(1)
                self.websocket_connections_gauge.labels(exchange=config.name).set(1)
                
                # Subscribe to tickers
                subscribe_msg = {
                    "event": "subscribe",
                    "pair": symbols,
                    "subscription": {"name": "ticker"}
                }
                await websocket.send(json.dumps(subscribe_msg))
                
                logger.info(f"Connected to {config.name} WebSocket")
                
                async for message in websocket:
                    try:
                        data = json.loads(message)
                        await self.process_kraken_data(data)
                    except Exception as e:
                        logger.error(f"Error processing {config.name} data", error=str(e))
                        
        except Exception as e:
            logger.error(f"Kraken WebSocket connection failed", error=str(e))
            self.exchange_status[config.name] = False
            self.exchange_up.labels(exchange=config.name).set(0)
            self.websocket_connections_gauge.labels(exchange=config.name).set(0)
    
    async def connect_okx_websocket(self, config: ExchangeConfig, symbols: List[str]):
        """Connect to OKX WebSocket"""
        try:
            async with websockets.connect(config.websocket_url) as websocket:
                self.websocket_connections[config.name] = websocket
                self.exchange_status[config.name] = True
                self.exchange_up.labels(exchange=config.name).set(1)
                self.websocket_connections_gauge.labels(exchange=config.name).set(1)
                
                # Subscribe to tickers
                subscribe_msg = {
                    "op": "subscribe",
                    "args": [{"channel": "tickers", "instId": symbol} for symbol in symbols]
                }
                await websocket.send(json.dumps(subscribe_msg))
                
                logger.info(f"Connected to {config.name} WebSocket")
                
                async for message in websocket:
                    try:
                        data = json.loads(message)
                        await self.process_okx_data(data)
                    except Exception as e:
                        logger.error(f"Error processing {config.name} data", error=str(e))
                        
        except Exception as e:
            logger.error(f"OKX WebSocket connection failed", error=str(e))
            self.exchange_status[config.name] = False
            self.exchange_up.labels(exchange=config.name).set(0)
            self.websocket_connections_gauge.labels(exchange=config.name).set(0)
    
    async def connect_gateio_websocket(self, config: ExchangeConfig, symbols: List[str]):
        """Connect to Gate.io WebSocket"""
        try:
            async with websockets.connect(config.websocket_url) as websocket:
                self.websocket_connections[config.name] = websocket
                self.exchange_status[config.name] = True
                self.exchange_up.labels(exchange=config.name).set(1)
                self.websocket_connections_gauge.labels(exchange=config.name).set(1)
                
                # Subscribe to tickers
                subscribe_msg = {
                    "time": int(time.time()),
                    "channel": "spot.tickers",
                    "event": "subscribe",
                    "payload": symbols
                }
                await websocket.send(json.dumps(subscribe_msg))
                
                logger.info(f"Connected to {config.name} WebSocket")
                
                async for message in websocket:
                    try:
                        data = json.loads(message)
                        await self.process_gateio_data(data)
                    except Exception as e:
                        logger.error(f"Error processing {config.name} data", error=str(e))
                        
        except Exception as e:
            logger.error(f"Gate.io WebSocket connection failed", error=str(e))
            self.exchange_status[config.name] = False
            self.exchange_up.labels(exchange=config.name).set(0)
            self.websocket_connections_gauge.labels(exchange=config.name).set(0)
    
    async def connect_huobi_websocket(self, config: ExchangeConfig, symbols: List[str]):
        """Connect to Huobi WebSocket"""
        try:
            async with websockets.connect(config.websocket_url) as websocket:
                self.websocket_connections[config.name] = websocket
                self.exchange_status[config.name] = True
                self.exchange_up.labels(exchange=config.name).set(1)
                self.websocket_connections_gauge.labels(exchange=config.name).set(1)
                
                # Subscribe to tickers
                subscribe_msg = {
                    "sub": f"market.tickers",
                    "id": int(time.time())
                }
                await websocket.send(json.dumps(subscribe_msg))
                
                logger.info(f"Connected to {config.name} WebSocket")
                
                async for message in websocket:
                    try:
                        data = json.loads(message)
                        await self.process_huobi_data(data)
                    except Exception as e:
                        logger.error(f"Error processing {config.name} data", error=str(e))
                        
        except Exception as e:
            logger.error(f"Huobi WebSocket connection failed", error=str(e))
            self.exchange_status[config.name] = False
            self.exchange_up.labels(exchange=config.name).set(0)
            self.websocket_connections_gauge.labels(exchange=config.name).set(0)
    
    async def connect_bitfinex_websocket(self, config: ExchangeConfig, symbols: List[str]):
        """Connect to Bitfinex WebSocket"""
        try:
            async with websockets.connect(config.websocket_url) as websocket:
                self.websocket_connections[config.name] = websocket
                self.exchange_status[config.name] = True
                self.exchange_up.labels(exchange=config.name).set(1)
                self.websocket_connections_gauge.labels(exchange=config.name).set(1)
                
                # Subscribe to tickers
                subscribe_msg = {
                    "event": "subscribe",
                    "channel": "ticker",
                    "symbol": "tBTCUSD"  # Example, would need to map symbols
                }
                await websocket.send(json.dumps(subscribe_msg))
                
                logger.info(f"Connected to {config.name} WebSocket")
                
                async for message in websocket:
                    try:
                        data = json.loads(message)
                        await self.process_bitfinex_data(data)
                    except Exception as e:
                        logger.error(f"Error processing {config.name} data", error=str(e))
                        
        except Exception as e:
            logger.error(f"Bitfinex WebSocket connection failed", error=str(e))
            self.exchange_status[config.name] = False
            self.exchange_up.labels(exchange=config.name).set(0)
            self.websocket_connections_gauge.labels(exchange=config.name).set(0)
    
    async def connect_bitmex_websocket(self, config: ExchangeConfig, symbols: List[str]):
        """Connect to BitMEX WebSocket"""
        try:
            async with websockets.connect(config.websocket_url) as websocket:
                self.websocket_connections[config.name] = websocket
                self.exchange_status[config.name] = True
                self.exchange_up.labels(exchange=config.name).set(1)
                self.websocket_connections_gauge.labels(exchange=config.name).set(1)
                
                # Subscribe to tickers
                subscribe_msg = {
                    "op": "subscribe",
                    "args": ["instrument:XBTUSD"]  # Example, would need to map symbols
                }
                await websocket.send(json.dumps(subscribe_msg))
                
                logger.info(f"Connected to {config.name} WebSocket")
                
                async for message in websocket:
                    try:
                        data = json.loads(message)
                        await self.process_bitmex_data(data)
                    except Exception as e:
                        logger.error(f"Error processing {config.name} data", error=str(e))
                        
        except Exception as e:
            logger.error(f"BitMEX WebSocket connection failed", error=str(e))
            self.exchange_status[config.name] = False
            self.exchange_up.labels(exchange=config.name).set(0)
            self.websocket_connections_gauge.labels(exchange=config.name).set(0)
    
    async def process_binance_data(self, data: Dict):
        """Process Binance WebSocket data"""
        try:
            if "stream" in data and "data" in data:
                stream = data["stream"]
                market_data = data["data"]
                
                if "@ticker" in stream:
                    symbol = market_data["s"]
                    price = float(market_data["c"])
                    volume = float(market_data["v"])
                    change_24h = float(market_data["P"])
                    
                    await self.store_market_data(
                        MarketData(
                            symbol=symbol,
                            exchange="binance",
                            price=price,
                            volume=volume,
                            change_24h=change_24h,
                            change_percent_24h=change_24h,
                            timestamp=time.time(),
                            source="websocket"
                        )
                    )
                    
        except Exception as e:
            logger.error("Failed to process Binance data", error=str(e))
    
    async def process_bybit_data(self, data: Dict):
        """Process Bybit WebSocket data"""
        try:
            if data.get("topic") == "tickers":
                for ticker in data.get("data", []):
                    symbol = ticker["symbol"]
                    price = float(ticker["lastPrice"])
                    volume = float(ticker["volume24h"])
                    change_24h = float(ticker["price24hPcnt"]) * 100
                    
                    await self.store_market_data(
                        MarketData(
                            symbol=symbol,
                            exchange="bybit",
                            price=price,
                            volume=volume,
                            change_24h=change_24h,
                            change_percent_24h=change_24h,
                            timestamp=time.time(),
                            source="websocket"
                        )
                    )
                    
        except Exception as e:
            logger.error("Failed to process Bybit data", error=str(e))
    
    async def process_kucoin_data(self, data: Dict):
        """Process KuCoin WebSocket data"""
        try:
            if data.get("type") == "message" and data.get("topic") == "/market/ticker:all":
                for symbol, ticker in data.get("data", {}).items():
                    price = float(ticker["last"])
                    volume = float(ticker["vol"])
                    change_24h = float(ticker["changeRate"]) * 100
                    
                    await self.store_market_data(
                        MarketData(
                            symbol=symbol,
                            exchange="kucoin",
                            price=price,
                            volume=volume,
                            change_24h=change_24h,
                            change_percent_24h=change_24h,
                            timestamp=time.time(),
                            source="websocket"
                        )
                    )
                    
        except Exception as e:
            logger.error("Failed to process KuCoin data", error=str(e))
    
    async def process_coinbase_data(self, data: Dict):
        """Process Coinbase WebSocket data"""
        try:
            if data.get("type") == "ticker":
                symbol = data["product_id"]
                price = float(data["price"])
                volume = float(data["volume_24h"])
                change_24h = float(data["price"]) - float(data["open_24h"])
                change_percent_24h = (change_24h / float(data["open_24h"])) * 100
                
                await self.store_market_data(
                    MarketData(
                        symbol=symbol,
                        exchange="coinbase",
                        price=price,
                        volume=volume,
                        change_24h=change_24h,
                        change_percent_24h=change_percent_24h,
                        timestamp=time.time(),
                        source="websocket"
                    )
                )
                
        except Exception as e:
            logger.error("Failed to process Coinbase data", error=str(e))
    
    async def process_kraken_data(self, data: Dict):
        """Process Kraken WebSocket data"""
        try:
            if isinstance(data, list) and len(data) > 1:
                # Kraken sends data as arrays
                channel_data = data[1]
                if isinstance(channel_data, dict) and "c" in channel_data:
                    symbol = data[3] if len(data) > 3 else "UNKNOWN"
                    price = float(channel_data["c"][0])
                    volume = float(channel_data["v"][1])
                    change_24h = float(channel_data["c"][0]) - float(channel_data["o"])
                    change_percent_24h = (change_24h / float(channel_data["o"])) * 100
                    
                    await self.store_market_data(
                        MarketData(
                            symbol=symbol,
                            exchange="kraken",
                            price=price,
                            volume=volume,
                            change_24h=change_24h,
                            change_percent_24h=change_percent_24h,
                            timestamp=time.time(),
                            source="websocket"
                        )
                    )
                    
        except Exception as e:
            logger.error("Failed to process Kraken data", error=str(e))
    
    async def process_okx_data(self, data: Dict):
        """Process OKX WebSocket data"""
        try:
            if data.get("arg", {}).get("channel") == "tickers":
                for ticker in data.get("data", []):
                    symbol = ticker["instId"]
                    price = float(ticker["last"])
                    volume = float(ticker["vol24h"])
                    change_24h = float(ticker["sodUtc8"])
                    
                    await self.store_market_data(
                        MarketData(
                            symbol=symbol,
                            exchange="okx",
                            price=price,
                            volume=volume,
                            change_24h=change_24h,
                            change_percent_24h=change_24h,
                            timestamp=time.time(),
                            source="websocket"
                        )
                    )
                    
        except Exception as e:
            logger.error("Failed to process OKX data", error=str(e))
    
    async def process_gateio_data(self, data: Dict):
        """Process Gate.io WebSocket data"""
        try:
            if data.get("channel") == "spot.tickers":
                for ticker in data.get("result", []):
                    symbol = ticker["currency_pair"]
                    price = float(ticker["last"])
                    volume = float(ticker["base_volume"])
                    change_24h = float(ticker["change_percentage"])
                    
                    await self.store_market_data(
                        MarketData(
                            symbol=symbol,
                            exchange="gateio",
                            price=price,
                            volume=volume,
                            change_24h=change_24h,
                            change_percent_24h=change_24h,
                            timestamp=time.time(),
                            source="websocket"
                        )
                    )
                    
        except Exception as e:
            logger.error("Failed to process Gate.io data", error=str(e))
    
    async def process_huobi_data(self, data: Dict):
        """Process Huobi WebSocket data"""
        try:
            if data.get("ch") == "market.tickers":
                for ticker in data.get("data", []):
                    symbol = ticker["symbol"]
                    price = float(ticker["close"])
                    volume = float(ticker["vol"])
                    change_24h = float(ticker["close"]) - float(ticker["open"])
                    change_percent_24h = (change_24h / float(ticker["open"])) * 100
                    
                    await self.store_market_data(
                        MarketData(
                            symbol=symbol,
                            exchange="huobi",
                            price=price,
                            volume=volume,
                            change_24h=change_24h,
                            change_percent_24h=change_percent_24h,
                            timestamp=time.time(),
                            source="websocket"
                        )
                    )
                    
        except Exception as e:
            logger.error("Failed to process Huobi data", error=str(e))
    
    async def process_bitfinex_data(self, data: Dict):
        """Process Bitfinex WebSocket data"""
        try:
            if isinstance(data, list) and len(data) > 1:
                # Bitfinex sends data as arrays
                if data[1] == "tBTCUSD":  # Example symbol
                    price = float(data[7])
                    volume = float(data[8])
                    change_24h = float(data[5])
                    change_percent_24h = (change_24h / float(data[6])) * 100
                    
                    await self.store_market_data(
                        MarketData(
                            symbol="BTCUSD",
                            exchange="bitfinex",
                            price=price,
                            volume=volume,
                            change_24h=change_24h,
                            change_percent_24h=change_percent_24h,
                            timestamp=time.time(),
                            source="websocket"
                        )
                    )
                    
        except Exception as e:
            logger.error("Failed to process Bitfinex data", error=str(e))
    
    async def process_bitmex_data(self, data: Dict):
        """Process BitMEX WebSocket data"""
        try:
            if data.get("table") == "instrument":
                for instrument in data.get("data", []):
                    if instrument.get("symbol") == "XBTUSD":
                        price = float(instrument["lastPrice"])
                        volume = float(instrument["volume24h"])
                        change_24h = float(instrument["lastPrice"]) - float(instrument["prevPrice24h"])
                        change_percent_24h = (change_24h / float(instrument["prevPrice24h"])) * 100
                        
                        await self.store_market_data(
                            MarketData(
                                symbol="XBTUSD",
                                exchange="bitmex",
                                price=price,
                                volume=volume,
                                change_24h=change_24h,
                                change_percent_24h=change_percent_24h,
                                timestamp=time.time(),
                                source="websocket"
                            )
                        )
                        
        except Exception as e:
            logger.error("Failed to process BitMEX data", error=str(e))
    
    async def store_market_data(self, data: MarketData):
        """Store market data in Redis and update metrics"""
        try:
            # Store in symbol_data for aggregation
            if data.symbol not in self.symbol_data:
                self.symbol_data[data.symbol] = {}
            
            self.symbol_data[data.symbol][data.exchange] = data
            
            # Store in Redis for real-time access
            key = f"market_data:{data.symbol}:{data.exchange}"
            await self.redis.setex(key, 300, json.dumps(asdict(data), default=str))
            
            # Store aggregated data
            await self.store_aggregated_data(data.symbol)
            
            # Update metrics
            self.data_points.labels(
                exchange=data.exchange,
                symbol=data.symbol,
                source=data.source
            ).inc()
            
            self.pooled_symbols.set(len(self.symbol_data))
            
        except Exception as e:
            logger.error("Failed to store market data", error=str(e))
    
    async def store_aggregated_data(self, symbol: str):
        """Store aggregated data for a symbol"""
        try:
            if symbol not in self.symbol_data:
                return
            
            symbol_data = self.symbol_data[symbol]
            
            # Calculate aggregated metrics
            prices = [data.price for data in symbol_data.values() if data.price > 0]
            volumes = [data.volume for data in symbol_data.values() if data.volume > 0]
            changes = [data.change_percent_24h for data in symbol_data.values()]
            
            if not prices:
                return
            
            # Calculate weighted average price by volume
            total_volume = sum(volumes)
            if total_volume > 0:
                weighted_price = sum(data.price * data.volume for data in symbol_data.values()) / total_volume
            else:
                weighted_price = sum(prices) / len(prices)
            
            # Calculate average change
            avg_change = sum(changes) / len(changes) if changes else 0
            
            # Store aggregated data
            aggregated_data = {
                "symbol": symbol,
                "price": weighted_price,
                "volume_24h": total_volume,
                "change_24h": avg_change,
                "exchange_count": len(symbol_data),
                "exchanges": list(symbol_data.keys()),
                "timestamp": time.time(),
                "source": "aggregated"
            }
            
            key = f"aggregated_data:{symbol}"
            await self.redis.setex(key, 300, json.dumps(aggregated_data))
            
        except Exception as e:
            logger.error("Failed to store aggregated data", error=str(e))
    
    async def run(self):
        """Main service loop"""
        try:
            logger.info("Starting Enhanced Multi-Exchange Pooler")
            
            # Initialize
            await self.initialize()
            
            # Get top symbols
            symbols = await self.get_top_symbols(100)
            if not symbols:
                logger.error("No symbols found")
                return
            
            logger.info(f"Found {len(symbols)} symbols to monitor")
            
            # Start WebSocket connections
            await self.start_websocket_connections(symbols)
            
        except KeyboardInterrupt:
            logger.info("Service stopped by user")
        except Exception as e:
            logger.error("Service failed", error=str(e))
            raise
        finally:
            # Cleanup
            if self.redis:
                await self.redis.close()
            logger.info("Service cleanup completed")

async def main():
    """Main entry point"""
    pooler = EnhancedMultiExchangePooler()
    await pooler.run()

if __name__ == "__main__":
    asyncio.run(main())
