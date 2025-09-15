"""
Market data models for storing price, volume, and order book data
"""

from sqlalchemy import Column, String, Float, Integer, DateTime, Boolean, Text, Index
from sqlalchemy.dialects.postgresql import JSONB
from core.database import Base
from datetime import datetime


class Symbol(Base):
    """Trading symbol information"""
    __tablename__ = "symbols"
    
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), unique=True, index=True, nullable=False)
    base_asset = Column(String(10), nullable=False)
    quote_asset = Column(String(10), nullable=False)
    exchange = Column(String(20), nullable=False, default="binance")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Kline(Base):
    """OHLCV candlestick data"""
    __tablename__ = "klines"
    
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), nullable=False, index=True)
    exchange = Column(String(20), nullable=False)
    interval = Column(String(10), nullable=False)  # 1m, 5m, 15m, 1h, 4h, 1d
    open_time = Column(DateTime, nullable=False, index=True)
    close_time = Column(DateTime, nullable=False)
    open_price = Column(Float, nullable=False)
    high_price = Column(Float, nullable=False)
    low_price = Column(Float, nullable=False)
    close_price = Column(Float, nullable=False)
    volume = Column(Float, nullable=False)
    quote_volume = Column(Float, nullable=False)
    trades_count = Column(Integer, nullable=False)
    taker_buy_volume = Column(Float, nullable=False)
    taker_buy_quote_volume = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Composite indexes for efficient querying
    __table_args__ = (
        Index('idx_symbol_interval_time', 'symbol', 'interval', 'open_time'),
        Index('idx_exchange_symbol_interval', 'exchange', 'symbol', 'interval'),
    )


class Trade(Base):
    """Individual trade data"""
    __tablename__ = "trades"
    
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), nullable=False, index=True)
    exchange = Column(String(20), nullable=False)
    trade_id = Column(String(50), unique=True, nullable=False)
    price = Column(Float, nullable=False)
    quantity = Column(Float, nullable=False)
    quote_quantity = Column(Float, nullable=False)
    is_buyer_maker = Column(Boolean, nullable=False)
    timestamp = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_trades_symbol_timestamp', 'symbol', 'timestamp'),
    )


class OrderBook(Base):
    """Order book snapshots"""
    __tablename__ = "order_books"
    
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), nullable=False, index=True)
    exchange = Column(String(20), nullable=False)
    timestamp = Column(DateTime, nullable=False, index=True)
    bids = Column(JSONB, nullable=False)  # [[price, quantity], ...]
    asks = Column(JSONB, nullable=False)  # [[price, quantity], ...]
    best_bid = Column(Float, nullable=False)
    best_ask = Column(Float, nullable=False)
    spread = Column(Float, nullable=False)
    mid_price = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_order_books_symbol_timestamp', 'symbol', 'timestamp'),
    )


class OrderBookDelta(Base):
    """Order book delta updates"""
    __tablename__ = "order_book_deltas"
    
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), nullable=False, index=True)
    exchange = Column(String(20), nullable=False)
    timestamp = Column(DateTime, nullable=False, index=True)
    delta_type = Column(String(10), nullable=False)  # 'update', 'delete'
    side = Column(String(4), nullable=False)  # 'bid', 'ask'
    price = Column(Float, nullable=False)
    quantity = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_order_book_deltas_symbol_timestamp', 'symbol', 'timestamp'),
    )


class MarketMetrics(Base):
    """Pre-computed market metrics for performance"""
    __tablename__ = "market_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), nullable=False, index=True)
    exchange = Column(String(20), nullable=False)
    interval = Column(String(10), nullable=False)
    timestamp = Column(DateTime, nullable=False, index=True)
    
    # Price metrics
    price = Column(Float, nullable=False)
    returns = Column(Float, nullable=False)
    volatility = Column(Float, nullable=False)
    volume_ratio = Column(Float, nullable=False)
    
    # Order book metrics
    bid_ask_spread = Column(Float, nullable=False)
    order_book_imbalance = Column(Float, nullable=False)
    depth_ratio = Column(Float, nullable=False)
    
    # Technical indicators
    rsi = Column(Float, nullable=True)
    macd = Column(Float, nullable=True)
    bollinger_upper = Column(Float, nullable=True)
    bollinger_lower = Column(Float, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_symbol_interval_timestamp', 'symbol', 'interval', 'timestamp'),
    )
