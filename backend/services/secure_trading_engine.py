"""
Secure Trading Engine
Handles secure trading operations using encrypted credentials
"""

import asyncio
import json
import time
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
import structlog
import redis.asyncio as redis
from prometheus_client import Counter, Gauge, Histogram
import ccxt.async_support as ccxt
from .secure_credential_manager import credential_manager, ExchangeCredentials

logger = structlog.get_logger()

@dataclass
class OrderRequest:
    user_id: str
    exchange: str
    symbol: str
    side: str  # 'buy' or 'sell'
    type: str  # 'market', 'limit', 'stop'
    amount: float
    price: Optional[float] = None
    stop_price: Optional[float] = None
    time_in_force: str = 'GTC'  # Good Till Cancelled
    client_order_id: Optional[str] = None

@dataclass
class OrderResult:
    order_id: str
    symbol: str
    side: str
    type: str
    amount: float
    price: float
    filled: float
    remaining: float
    status: str
    timestamp: float
    exchange: str
    client_order_id: Optional[str] = None
    fees: Optional[Dict[str, float]] = None
    error: Optional[str] = None

@dataclass
class Balance:
    exchange: str
    currency: str
    free: float
    used: float
    total: float
    timestamp: float

@dataclass
class Position:
    exchange: str
    symbol: str
    side: str
    amount: float
    entry_price: float
    current_price: float
    unrealized_pnl: float
    timestamp: float

class SecureTradingEngine:
    def __init__(self):
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        self.redis = redis.from_url(self.redis_url, decode_responses=True)
        
        # Metrics
        self.orders_placed = Counter("orders_placed_total", "Orders placed", ["exchange", "symbol", "side"])
        self.orders_filled = Counter("orders_filled_total", "Orders filled", ["exchange", "symbol", "side"])
        self.orders_cancelled = Counter("orders_cancelled_total", "Orders cancelled", ["exchange", "symbol", "side"])
        self.trading_volume = Counter("trading_volume_total", "Trading volume", ["exchange", "symbol"])
        self.trading_fees = Counter("trading_fees_total", "Trading fees paid", ["exchange", "currency"])
        self.trading_latency = Histogram("trading_latency_seconds", "Trading operation latency", ["exchange", "operation"])
        self.active_orders = Gauge("active_orders", "Active orders", ["exchange"])
        
        # Exchange instances cache
        self.exchange_instances: Dict[str, ccxt.Exchange] = {}
        
        # Rate limiting
        self.rate_limits: Dict[str, Dict[str, float]] = {}
    
    async def initialize(self):
        """Initialize the trading engine"""
        try:
            await self.redis.ping()
            logger.info("Secure trading engine initialized")
        except Exception as e:
            logger.error("Failed to initialize trading engine", error=str(e))
            raise
    
    async def _get_exchange_instance(self, credentials: ExchangeCredentials) -> ccxt.Exchange:
        """Get or create exchange instance with credentials"""
        try:
            cache_key = f"{credentials.exchange}_{credentials.user_id}"
            
            if cache_key in self.exchange_instances:
                return self.exchange_instances[cache_key]
            
            # Create exchange instance
            exchange_class = getattr(ccxt, credentials.exchange)
            
            config = {
                'apiKey': credentials.api_key,
                'secret': credentials.secret_key,
                'sandbox': credentials.sandbox,
                'enableRateLimit': True,
                'timeout': 30000,
            }
            
            if credentials.passphrase:
                config['passphrase'] = credentials.passphrase
            
            exchange = exchange_class(config)
            
            # Cache the instance
            self.exchange_instances[cache_key] = exchange
            
            return exchange
            
        except Exception as e:
            logger.error(f"Failed to create exchange instance for {credentials.exchange}", error=str(e))
            raise
    
    async def _check_rate_limit(self, exchange: str, operation: str) -> bool:
        """Check if we can perform an operation without hitting rate limits"""
        try:
            current_time = time.time()
            
            if exchange not in self.rate_limits:
                self.rate_limits[exchange] = {}
            
            last_operation = self.rate_limits[exchange].get(operation, 0)
            
            # Simple rate limiting - 1 operation per second per exchange
            if current_time - last_operation < 1.0:
                await asyncio.sleep(1.0 - (current_time - last_operation))
            
            self.rate_limits[exchange][operation] = time.time()
            return True
            
        except Exception as e:
            logger.error("Rate limit check failed", error=str(e))
            return False
    
    async def place_order(self, order_request: OrderRequest) -> OrderResult:
        """Place a trading order"""
        try:
            start_time = time.time()
            
            # Get credentials
            credentials = await credential_manager.get_credentials(
                order_request.user_id, 
                order_request.exchange
            )
            
            if not credentials:
                return OrderResult(
                    order_id="",
                    symbol=order_request.symbol,
                    side=order_request.side,
                    type=order_request.type,
                    amount=order_request.amount,
                    price=order_request.price or 0,
                    filled=0,
                    remaining=order_request.amount,
                    status="error",
                    timestamp=time.time(),
                    exchange=order_request.exchange,
                    error="Credentials not found"
                )
            
            # Check rate limit
            await self._check_rate_limit(order_request.exchange, "place_order")
            
            # Get exchange instance
            exchange = await self._get_exchange_instance(credentials)
            
            # Prepare order parameters
            order_params = {
                'symbol': order_request.symbol,
                'side': order_request.side,
                'type': order_request.type,
                'amount': order_request.amount,
                'timeInForce': order_request.time_in_force,
            }
            
            if order_request.price:
                order_params['price'] = order_request.price
            
            if order_request.stop_price:
                order_params['stopPrice'] = order_request.stop_price
            
            if order_request.client_order_id:
                order_params['clientOrderId'] = order_request.client_order_id
            
            # Place order
            order = await exchange.create_order(**order_params)
            
            # Update metrics
            self.orders_placed.labels(
                exchange=order_request.exchange,
                symbol=order_request.symbol,
                side=order_request.side
            ).inc()
            
            self.trading_volume.labels(
                exchange=order_request.exchange,
                symbol=order_request.symbol
            ).inc(order_request.amount)
            
            self.trading_latency.labels(
                exchange=order_request.exchange,
                operation="place_order"
            ).observe(time.time() - start_time)
            
            # Update last used timestamp
            await credential_manager.update_last_used(
                order_request.user_id, 
                order_request.exchange
            )
            
            # Create result
            result = OrderResult(
                order_id=order.get('id', ''),
                symbol=order.get('symbol', order_request.symbol),
                side=order.get('side', order_request.side),
                type=order.get('type', order_request.type),
                amount=order.get('amount', order_request.amount),
                price=order.get('price', order_request.price or 0),
                filled=order.get('filled', 0),
                remaining=order.get('remaining', order_request.amount),
                status=order.get('status', 'unknown'),
                timestamp=order.get('timestamp', time.time()),
                exchange=order_request.exchange,
                client_order_id=order.get('clientOrderId'),
                fees=order.get('fees')
            )
            
            # Store order in Redis for tracking
            await self._store_order(result)
            
            logger.info(f"Order placed: {result.order_id} on {order_request.exchange}")
            return result
            
        except Exception as e:
            logger.error("Failed to place order", error=str(e))
            return OrderResult(
                order_id="",
                symbol=order_request.symbol,
                side=order_request.side,
                type=order_request.type,
                amount=order_request.amount,
                price=order_request.price or 0,
                filled=0,
                remaining=order_request.amount,
                status="error",
                timestamp=time.time(),
                exchange=order_request.exchange,
                error=str(e)
            )
    
    async def cancel_order(self, user_id: str, exchange: str, order_id: str) -> bool:
        """Cancel an order"""
        try:
            start_time = time.time()
            
            # Get credentials
            credentials = await credential_manager.get_credentials(user_id, exchange)
            if not credentials:
                return False
            
            # Check rate limit
            await self._check_rate_limit(exchange, "cancel_order")
            
            # Get exchange instance
            exchange_instance = await self._get_exchange_instance(credentials)
            
            # Cancel order
            await exchange_instance.cancel_order(order_id)
            
            # Update metrics
            self.orders_cancelled.labels(
                exchange=exchange,
                symbol="unknown",  # Would need to get from order
                side="unknown"
            ).inc()
            
            self.trading_latency.labels(
                exchange=exchange,
                operation="cancel_order"
            ).observe(time.time() - start_time)
            
            # Update last used timestamp
            await credential_manager.update_last_used(user_id, exchange)
            
            logger.info(f"Order cancelled: {order_id} on {exchange}")
            return True
            
        except Exception as e:
            logger.error("Failed to cancel order", error=str(e))
            return False
    
    async def get_order_status(self, user_id: str, exchange: str, order_id: str) -> Optional[OrderResult]:
        """Get order status"""
        try:
            # Get credentials
            credentials = await credential_manager.get_credentials(user_id, exchange)
            if not credentials:
                return None
            
            # Check rate limit
            await self._check_rate_limit(exchange, "get_order")
            
            # Get exchange instance
            exchange_instance = await self._get_exchange_instance(credentials)
            
            # Get order
            order = await exchange_instance.fetch_order(order_id)
            
            # Update last used timestamp
            await credential_manager.update_last_used(user_id, exchange)
            
            # Create result
            result = OrderResult(
                order_id=order.get('id', order_id),
                symbol=order.get('symbol', ''),
                side=order.get('side', ''),
                type=order.get('type', ''),
                amount=order.get('amount', 0),
                price=order.get('price', 0),
                filled=order.get('filled', 0),
                remaining=order.get('remaining', 0),
                status=order.get('status', 'unknown'),
                timestamp=order.get('timestamp', time.time()),
                exchange=exchange,
                client_order_id=order.get('clientOrderId'),
                fees=order.get('fees')
            )
            
            return result
            
        except Exception as e:
            logger.error("Failed to get order status", error=str(e))
            return None
    
    async def get_balance(self, user_id: str, exchange: str) -> List[Balance]:
        """Get account balance"""
        try:
            # Get credentials
            credentials = await credential_manager.get_credentials(user_id, exchange)
            if not credentials:
                return []
            
            # Check rate limit
            await self._check_rate_limit(exchange, "get_balance")
            
            # Get exchange instance
            exchange_instance = await self._get_exchange_instance(credentials)
            
            # Get balance
            balance = await exchange_instance.fetch_balance()
            
            # Update last used timestamp
            await credential_manager.update_last_used(user_id, exchange)
            
            # Convert to Balance objects
            balances = []
            for currency, data in balance.items():
                if isinstance(data, dict) and 'free' in data:
                    balances.append(Balance(
                        exchange=exchange,
                        currency=currency,
                        free=data.get('free', 0),
                        used=data.get('used', 0),
                        total=data.get('total', 0),
                        timestamp=time.time()
                    ))
            
            return balances
            
        except Exception as e:
            logger.error("Failed to get balance", error=str(e))
            return []
    
    async def get_positions(self, user_id: str, exchange: str) -> List[Position]:
        """Get open positions"""
        try:
            # Get credentials
            credentials = await credential_manager.get_credentials(user_id, exchange)
            if not credentials:
                return []
            
            # Check rate limit
            await self._check_rate_limit(exchange, "get_positions")
            
            # Get exchange instance
            exchange_instance = await self._get_exchange_instance(credentials)
            
            # Get positions (if supported)
            if hasattr(exchange_instance, 'fetch_positions'):
                positions = await exchange_instance.fetch_positions()
                
                # Update last used timestamp
                await credential_manager.update_last_used(user_id, exchange)
                
                # Convert to Position objects
                position_list = []
                for pos in positions:
                    if pos.get('contracts', 0) != 0:  # Only non-zero positions
                        position_list.append(Position(
                            exchange=exchange,
                            symbol=pos.get('symbol', ''),
                            side=pos.get('side', ''),
                            amount=pos.get('contracts', 0),
                            entry_price=pos.get('entryPrice', 0),
                            current_price=pos.get('markPrice', 0),
                            unrealized_pnl=pos.get('unrealizedPnl', 0),
                            timestamp=time.time()
                        ))
                
                return position_list
            
            return []
            
        except Exception as e:
            logger.error("Failed to get positions", error=str(e))
            return []
    
    async def get_open_orders(self, user_id: str, exchange: str, symbol: Optional[str] = None) -> List[OrderResult]:
        """Get open orders"""
        try:
            # Get credentials
            credentials = await credential_manager.get_credentials(user_id, exchange)
            if not credentials:
                return []
            
            # Check rate limit
            await self._check_rate_limit(exchange, "get_orders")
            
            # Get exchange instance
            exchange_instance = await self._get_exchange_instance(credentials)
            
            # Get open orders
            orders = await exchange_instance.fetch_open_orders(symbol)
            
            # Update last used timestamp
            await credential_manager.update_last_used(user_id, exchange)
            
            # Convert to OrderResult objects
            order_results = []
            for order in orders:
                order_results.append(OrderResult(
                    order_id=order.get('id', ''),
                    symbol=order.get('symbol', ''),
                    side=order.get('side', ''),
                    type=order.get('type', ''),
                    amount=order.get('amount', 0),
                    price=order.get('price', 0),
                    filled=order.get('filled', 0),
                    remaining=order.get('remaining', 0),
                    status=order.get('status', 'open'),
                    timestamp=order.get('timestamp', time.time()),
                    exchange=exchange,
                    client_order_id=order.get('clientOrderId'),
                    fees=order.get('fees')
                ))
            
            return order_results
            
        except Exception as e:
            logger.error("Failed to get open orders", error=str(e))
            return []
    
    async def _store_order(self, order: OrderResult):
        """Store order in Redis for tracking"""
        try:
            key = f"order:{order.exchange}:{order.order_id}"
            data = asdict(order)
            await self.redis.setex(key, 86400, json.dumps(data))  # 24 hours
            
        except Exception as e:
            logger.error("Failed to store order", error=str(e))
    
    async def get_order_history(self, user_id: str, exchange: str, symbol: Optional[str] = None, limit: int = 100) -> List[OrderResult]:
        """Get order history"""
        try:
            # Get credentials
            credentials = await credential_manager.get_credentials(user_id, exchange)
            if not credentials:
                return []
            
            # Check rate limit
            await self._check_rate_limit(exchange, "get_orders")
            
            # Get exchange instance
            exchange_instance = await self._get_exchange_instance(credentials)
            
            # Get order history
            orders = await exchange_instance.fetch_orders(symbol, limit=limit)
            
            # Update last used timestamp
            await credential_manager.update_last_used(user_id, exchange)
            
            # Convert to OrderResult objects
            order_results = []
            for order in orders:
                order_results.append(OrderResult(
                    order_id=order.get('id', ''),
                    symbol=order.get('symbol', ''),
                    side=order.get('side', ''),
                    type=order.get('type', ''),
                    amount=order.get('amount', 0),
                    price=order.get('price', 0),
                    filled=order.get('filled', 0),
                    remaining=order.get('remaining', 0),
                    status=order.get('status', 'unknown'),
                    timestamp=order.get('timestamp', time.time()),
                    exchange=exchange,
                    client_order_id=order.get('clientOrderId'),
                    fees=order.get('fees')
                ))
            
            return order_results
            
        except Exception as e:
            logger.error("Failed to get order history", error=str(e))
            return []
    
    async def close(self):
        """Close all exchange connections"""
        try:
            for exchange in self.exchange_instances.values():
                if hasattr(exchange, 'close'):
                    await exchange.close()
            
            self.exchange_instances.clear()
            
            if self.redis:
                await self.redis.close()
                
        except Exception as e:
            logger.error("Failed to close trading engine", error=str(e))

# Global instance
trading_engine = SecureTradingEngine()

