"""
Real-time market data API endpoints
Provides live data from multiple exchanges with failover
"""

from fastapi import APIRouter, HTTPException, Query, WebSocket, WebSocketDisconnect
from typing import List, Dict, Optional, Any
import json
import asyncio
import redis.asyncio as redis
import structlog
from datetime import datetime, timezone
import os

logger = structlog.get_logger()

router = APIRouter()

# Redis connection
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
redis_client = redis.from_url(redis_url, decode_responses=True)

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.symbol_subscriptions: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        
        # Remove from symbol subscriptions
        for symbol, connections in self.symbol_subscriptions.items():
            if websocket in connections:
                connections.remove(websocket)

    async def subscribe_to_symbol(self, websocket: WebSocket, symbol: str):
        if symbol not in self.symbol_subscriptions:
            self.symbol_subscriptions[symbol] = []
        
        if websocket not in self.symbol_subscriptions[symbol]:
            self.symbol_subscriptions[symbol].append(websocket)

    async def unsubscribe_from_symbol(self, websocket: WebSocket, symbol: str):
        if symbol in self.symbol_subscriptions:
            if websocket in self.symbol_subscriptions[symbol]:
                self.symbol_subscriptions[symbol].remove(websocket)

    async def send_to_symbol(self, symbol: str, data: Dict):
        if symbol in self.symbol_subscriptions:
            for connection in self.symbol_subscriptions[symbol]:
                try:
                    await connection.send_text(json.dumps(data))
                except:
                    # Remove dead connections
                    self.disconnect(connection)

    async def send_to_all(self, data: Dict):
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(data))
            except:
                # Remove dead connections
                self.disconnect(connection)

manager = ConnectionManager()

@router.get("/market-data/{symbol}")
async def get_market_data(symbol: str):
    """Get current market data for a symbol from all exchanges"""
    try:
        # Get data from all exchanges
        exchange_data = {}
        exchanges = ["binance", "bybit", "kucoin", "coinbase", "kraken", "okx", "gateio", "huobi"]
        
        for exchange in exchanges:
            key = f"market_data:{symbol}:{exchange}"
            data = await redis_client.get(key)
            if data:
                exchange_data[exchange] = json.loads(data)
        
        # Get aggregated data
        aggregated_key = f"aggregated_data:{symbol}"
        aggregated_data = await redis_client.get(aggregated_key)
        
        if not exchange_data and not aggregated_data:
            raise HTTPException(status_code=404, detail="Symbol not found")
        
        return {
            "symbol": symbol,
            "exchanges": exchange_data,
            "aggregated": json.loads(aggregated_data) if aggregated_data else None,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error("Failed to get market data", error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/market-data")
async def get_all_market_data(
    limit: int = Query(50, ge=1, le=200),
    sort_by: str = Query("volume", regex="^(price|volume|change)$")
):
    """Get market data for all symbols"""
    try:
        # Get all aggregated data
        pattern = "aggregated_data:*"
        keys = await redis_client.keys(pattern)
        
        if not keys:
            return {"symbols": [], "total": 0}
        
        # Get data for all symbols
        symbols_data = []
        for key in keys[:limit]:
            data = await redis_client.get(key)
            if data:
                symbol_data = json.loads(data)
                symbols_data.append(symbol_data)
        
        # Sort by requested field
        if sort_by == "volume":
            symbols_data.sort(key=lambda x: x.get("volume_24h", 0), reverse=True)
        elif sort_by == "price":
            symbols_data.sort(key=lambda x: x.get("price", 0), reverse=True)
        elif sort_by == "change":
            symbols_data.sort(key=lambda x: x.get("change_24h", 0), reverse=True)
        
        return {
            "symbols": symbols_data,
            "total": len(symbols_data),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error("Failed to get all market data", error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/exchanges/status")
async def get_exchange_status():
    """Get status of all exchanges"""
    try:
        exchanges = ["binance", "bybit", "kucoin", "coinbase", "kraken", "okx", "gateio", "huobi"]
        status = {}
        
        for exchange in exchanges:
            # Check if exchange has recent data
            pattern = f"market_data:*:{exchange}"
            keys = await redis_client.keys(pattern)
            
            if keys:
                # Get most recent data
                latest_key = None
                latest_timestamp = 0
                
                for key in keys:
                    data = await redis_client.get(key)
                    if data:
                        symbol_data = json.loads(data)
                        timestamp = symbol_data.get("timestamp", 0)
                        if timestamp > latest_timestamp:
                            latest_timestamp = timestamp
                            latest_key = key
                
                if latest_key:
                    data = await redis_client.get(latest_key)
                    if data:
                        symbol_data = json.loads(data)
                        status[exchange] = {
                            "status": "online",
                            "last_update": datetime.fromtimestamp(latest_timestamp, timezone.utc).isoformat(),
                            "latency": datetime.now(timezone.utc).timestamp() - latest_timestamp
                        }
                    else:
                        status[exchange] = {"status": "offline"}
                else:
                    status[exchange] = {"status": "offline"}
            else:
                status[exchange] = {"status": "offline"}
        
        return {
            "exchanges": status,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error("Failed to get exchange status", error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/search")
async def search_symbols(
    query: str = Query(..., min_length=1),
    limit: int = Query(20, ge=1, le=100)
):
    """Search for symbols across all exchanges"""
    try:
        query = query.upper()
        
        # Get all aggregated data
        pattern = "aggregated_data:*"
        keys = await redis_client.keys(pattern)
        
        matching_symbols = []
        for key in keys:
            data = await redis_client.get(key)
            if data:
                symbol_data = json.loads(data)
                symbol = symbol_data.get("symbol", "")
                
                if query in symbol:
                    matching_symbols.append(symbol_data)
        
        # Sort by volume and limit results
        matching_symbols.sort(key=lambda x: x.get("volume_24h", 0), reverse=True)
        matching_symbols = matching_symbols[:limit]
        
        return {
            "symbols": matching_symbols,
            "query": query,
            "total": len(matching_symbols),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error("Failed to search symbols", error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time data"""
    await manager.connect(websocket)
    
    try:
        while True:
            # Wait for client message
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "subscribe":
                symbol = message.get("symbol")
                if symbol:
                    await manager.subscribe_to_symbol(websocket, symbol)
                    await websocket.send_text(json.dumps({
                        "type": "subscribed",
                        "symbol": symbol
                    }))
            
            elif message.get("type") == "unsubscribe":
                symbol = message.get("symbol")
                if symbol:
                    await manager.unsubscribe_from_symbol(websocket, symbol)
                    await websocket.send_text(json.dumps({
                        "type": "unsubscribed",
                        "symbol": symbol
                    }))
            
            elif message.get("type") == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error("WebSocket error", error=str(e))
        manager.disconnect(websocket)

async def broadcast_market_data(symbol: str, data: Dict):
    """Broadcast market data to subscribed clients"""
    await manager.send_to_symbol(symbol, {
        "type": "market_data",
        "symbol": symbol,
        "data": data,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

async def broadcast_exchange_status(exchange: str, status: Dict):
    """Broadcast exchange status to all clients"""
    await manager.send_to_all({
        "type": "exchange_status",
        "exchange": exchange,
        "status": status,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

