"""
Multi-Exchange Data Poller - Fetches ALL coin pairs from multiple exchanges
Supports: Binance, KuCoin, Bybit, Coinbase, Kraken, OKX, Gate.io
"""

import asyncio
import os
import time
import json
from typing import List, Dict, Set
from datetime import datetime

import redis.asyncio as redis
import structlog
from prometheus_client import start_http_server, Counter, Gauge, Histogram
import ccxt.async_support as ccxt

logger = structlog.get_logger()

# Exchange configurations
EXCHANGES = {
    'binance': {
        'class': ccxt.binance,
        'symbols_key': 'binance_symbols',
        'rate_limit': 1200,  # requests per minute
        'min_volume': 100000,  # minimum 24h volume in USDT
    },
    'kucoin': {
        'class': ccxt.kucoin,
        'symbols_key': 'kucoin_symbols', 
        'rate_limit': 1800,
        'min_volume': 50000,
    },
    'bybit': {
        'class': ccxt.bybit,
        'symbols_key': 'bybit_symbols',
        'rate_limit': 1200,
        'min_volume': 100000,
    },
    'coinbase': {
        'class': ccxt.coinbasepro,
        'symbols_key': 'coinbase_symbols',
        'rate_limit': 1000,
        'min_volume': 50000,
    },
    'kraken': {
        'class': ccxt.kraken,
        'symbols_key': 'kraken_symbols',
        'rate_limit': 1000,
        'min_volume': 50000,
    },
    'okx': {
        'class': ccxt.okx,
        'symbols_key': 'okx_symbols',
        'rate_limit': 1200,
        'min_volume': 100000,
    },
    'gateio': {
        'class': ccxt.gateio,
        'symbols_key': 'gateio_symbols',
        'rate_limit': 1200,
        'min_volume': 50000,
    }
}

class MultiExchangePoller:
    def __init__(self):
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        self.redis = redis.from_url(self.redis_url, decode_responses=True)
        self.metrics_port = int(os.getenv("METRICS_PORT", 8001))
        self.poll_interval = float(os.getenv("POLL_INTERVAL", "2.0"))
        self.max_symbols_per_exchange = int(os.getenv("MAX_SYMBOLS_PER_EXCHANGE", "500"))
        
        # Metrics
        try:
            start_http_server(self.metrics_port)
        except Exception:
            pass
            
        self.samples = Counter("exchange_samples_total", "Samples collected", ["exchange", "symbol"])
        self.up = Gauge("multi_exchange_poller_up", "Service up")
        self.price_histogram = Histogram("exchange_price_seconds", "Price fetch time", ["exchange"])
        self.symbol_count = Gauge("exchange_symbols_total", "Total symbols per exchange", ["exchange"])
        self.up.set(1)
        
        self.exchanges = {}
        self.all_symbols = set()
        
    async def _get_all_symbols(self, exchange_name: str, exchange_class) -> List[str]:
        """Get all available symbols from an exchange"""
        try:
            exchange = exchange_class()
            await exchange.load_markets()
            
            symbols = []
            markets = exchange.markets
            
            for symbol, market in markets.items():
                # Filter for USDT pairs with sufficient volume
                if (market.get('quote') == 'USDT' and 
                    market.get('active', True) and 
                    market.get('type') == 'spot' and
                    market.get('info', {}).get('volume', 0) > EXCHANGES[exchange_name]['min_volume']):
                    symbols.append(symbol)
            
            # Sort by volume and limit
            symbols = sorted(symbols, key=lambda x: markets[x].get('info', {}).get('volume', 0), reverse=True)
            symbols = symbols[:self.max_symbols_per_exchange]
            
            logger.info(f"Found {len(symbols)} symbols for {exchange_name}")
            await exchange.close()
            return symbols
            
        except Exception as e:
            logger.error(f"Failed to get symbols from {exchange_name}", error=str(e))
            return []
    
    async def _update_price_series(self, exchange: str, symbol: str, price: float, volume: float = 0) -> None:
        """Update price series in Redis"""
        try:
            key = f"rt:prices:{symbol}:{exchange}"
            timestamp = int(time.time())
            data = {
                'price': price,
                'volume': volume,
                'timestamp': timestamp,
                'exchange': exchange
            }
            
            pipe = self.redis.pipeline()
            pipe.lpush(key, json.dumps(data))
            pipe.ltrim(key, 0, 3600)  # Keep 1 hour of data
            pipe.expire(key, 7200)  # Expire after 2 hours
            await pipe.execute()
            
        except Exception as e:
            logger.error(f"Failed to update price series for {symbol} on {exchange}", error=str(e))
    
    async def _fetch_exchange_prices(self, exchange_name: str, symbols: List[str]) -> None:
        """Fetch prices for all symbols from a specific exchange"""
        try:
            exchange_class = EXCHANGES[exchange_name]['class']
            exchange = exchange_class()
            
            # Rate limiting
            rate_limit = EXCHANGES[exchange_name]['rate_limit']
            delay = 60.0 / rate_limit
            
            for symbol in symbols:
                try:
                    start_time = time.time()
                    ticker = await exchange.fetch_ticker(symbol)
                    
                    price = float(ticker.get('last', 0))
                    volume = float(ticker.get('baseVolume', 0))
                    
                    if price > 0:
                        await self._update_price_series(exchange_name, symbol, price, volume)
                        self.samples.labels(exchange=exchange_name, symbol=symbol).inc()
                    
                    # Rate limiting
                    elapsed = time.time() - start_time
                    if elapsed < delay:
                        await asyncio.sleep(delay - elapsed)
                        
                except Exception as e:
                    logger.error(f"Failed to fetch {symbol} from {exchange_name}", error=str(e))
                    continue
            
            await exchange.close()
            self.price_histogram.labels(exchange=exchange_name).observe(time.time() - start_time)
            
        except Exception as e:
            logger.error(f"Failed to fetch prices from {exchange_name}", error=str(e))
    
    async def _update_correlation_data(self) -> None:
        """Update correlation matrix data for all symbols"""
        try:
            # Get all unique symbols across exchanges
            all_symbols = set()
            for exchange_name in EXCHANGES.keys():
                symbols = await self.redis.smembers(f"{exchange_name}_symbols")
                all_symbols.update(symbols)
            
            # Store correlation data
            correlation_data = {
                'symbols': list(all_symbols),
                'timestamp': int(time.time()),
                'total_symbols': len(all_symbols)
            }
            
            await self.redis.set('correlation_data', json.dumps(correlation_data), ex=3600)
            logger.info(f"Updated correlation data with {len(all_symbols)} symbols")
            
        except Exception as e:
            logger.error("Failed to update correlation data", error=str(e))
    
    async def initialize_exchanges(self) -> None:
        """Initialize all exchanges and get their symbols"""
        for exchange_name, config in EXCHANGES.items():
            try:
                symbols = await self._get_all_symbols(exchange_name, config['class'])
                if symbols:
                    # Store symbols in Redis
                    await self.redis.sadd(f"{exchange_name}_symbols", *symbols)
                    self.symbol_count.labels(exchange=exchange_name).set(len(symbols))
                    self.all_symbols.update(symbols)
                    logger.info(f"Initialized {exchange_name} with {len(symbols)} symbols")
                else:
                    logger.warning(f"No symbols found for {exchange_name}")
                    
            except Exception as e:
                logger.error(f"Failed to initialize {exchange_name}", error=str(e))
    
    async def run(self) -> None:
        """Main polling loop"""
        logger.info("Starting Multi-Exchange Poller")
        
        # Initialize all exchanges
        await self.initialize_exchanges()
        
        # Update correlation data
        await self._update_correlation_data()
        
        logger.info(f"Total unique symbols across all exchanges: {len(self.all_symbols)}")
        
        while True:
            start_time = time.time()
            
            # Fetch prices from all exchanges in parallel
            tasks = []
            for exchange_name in EXCHANGES.keys():
                symbols = await self.redis.smembers(f"{exchange_name}_symbols")
                if symbols:
                    task = self._fetch_exchange_prices(exchange_name, list(symbols))
                    tasks.append(task)
            
            if tasks:
                await asyncio.gather(*tasks, return_exceptions=True)
            
            # Update correlation data every 5 minutes
            if int(time.time()) % 300 == 0:
                await self._update_correlation_data()
            
            # Rate limiting
            elapsed = time.time() - start_time
            sleep_time = max(0, self.poll_interval - elapsed)
            if sleep_time > 0:
                await asyncio.sleep(sleep_time)

async def main():
    poller = MultiExchangePoller()
    await poller.run()

if __name__ == "__main__":
    asyncio.run(main())
