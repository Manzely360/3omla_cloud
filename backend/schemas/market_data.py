"""
Pydantic schemas for market data API responses
"""

from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime


class SymbolResponse(BaseModel):
    id: int
    symbol: str
    base_asset: str
    quote_asset: str
    exchange: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class KlineResponse(BaseModel):
    id: int
    symbol: str
    exchange: str
    interval: str
    open_time: datetime
    close_time: datetime
    open_price: float
    high_price: float
    low_price: float
    close_price: float
    volume: float
    quote_volume: float
    trades_count: int
    taker_buy_volume: float
    taker_buy_quote_volume: float
    created_at: datetime


class TradeResponse(BaseModel):
    id: int
    symbol: str
    exchange: str
    trade_id: str
    price: float
    quantity: float
    quote_quantity: float
    is_buyer_maker: bool
    timestamp: datetime
    created_at: datetime


class OrderBookResponse(BaseModel):
    id: int
    symbol: str
    exchange: str
    timestamp: datetime
    bids: List[List[float]]
    asks: List[List[float]]
    best_bid: float
    best_ask: float
    spread: float
    mid_price: float
    created_at: datetime


class MarketMetricsResponse(BaseModel):
    id: int
    symbol: str
    exchange: str
    interval: str
    timestamp: datetime
    price: float
    returns: float
    volatility: float
    volume_ratio: float
    bid_ask_spread: float
    order_book_imbalance: float
    depth_ratio: float
    rsi: Optional[float]
    macd: Optional[float]
    bollinger_upper: Optional[float]
    bollinger_lower: Optional[float]
    created_at: datetime
