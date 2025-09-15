"""
Trading models for positions, orders, and strategies
"""

from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional

from sqlalchemy import (
    Boolean, Column, DateTime, Enum as SQLEnum, ForeignKey, 
    Integer, Numeric, String, Text, Index
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from core.database import Base


class OrderType(str, Enum):
    MARKET = "market"
    LIMIT = "limit"
    STOP = "stop"
    STOP_LIMIT = "stop_limit"


class OrderSide(str, Enum):
    BUY = "buy"
    SELL = "sell"


class OrderStatus(str, Enum):
    PENDING = "pending"
    FILLED = "filled"
    PARTIALLY_FILLED = "partially_filled"
    CANCELLED = "cancelled"
    REJECTED = "rejected"


class PositionSide(str, Enum):
    LONG = "long"
    SHORT = "short"


class StrategyType(str, Enum):
    LEAD_LAG = "lead_lag"
    MOMENTUM = "momentum"
    MEAN_REVERSION = "mean_reversion"
    BREAKOUT = "breakout"
    ARBITRAGE = "arbitrage"
    COPY_TRADE = "copy_trade"


class TradeMode(str, Enum):
    PAPER = "paper"
    LIVE = "live"


class Order(Base):
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), nullable=False, index=True)
    exchange = Column(String(20), nullable=False, index=True)
    order_type = Column(SQLEnum(OrderType), nullable=False)
    side = Column(SQLEnum(OrderSide), nullable=False)
    status = Column(SQLEnum(OrderStatus), default=OrderStatus.PENDING)
    
    # Quantities and prices
    quantity = Column(Numeric(20, 8), nullable=False)
    price = Column(Numeric(20, 8), nullable=True)
    stop_price = Column(Numeric(20, 8), nullable=True)
    filled_quantity = Column(Numeric(20, 8), default=0)
    average_price = Column(Numeric(20, 8), nullable=True)
    
    # Trading mode
    mode = Column(SQLEnum(TradeMode), default=TradeMode.PAPER)
    
    # Strategy and risk
    strategy_id = Column(Integer, ForeignKey("strategies.id"), nullable=True)
    risk_score = Column(Numeric(5, 2), nullable=True)  # 0-100
    
    # Exchange order ID
    exchange_order_id = Column(String(100), nullable=True, unique=True)
    
    # Metadata
    extra_metadata = Column(JSONB, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    filled_at = Column(DateTime, nullable=True)
    
    # Relationships
    strategy = relationship("Strategy", back_populates="orders")
    fills = relationship("OrderFill", back_populates="order")
    
    __table_args__ = (
        Index('idx_orders_symbol_exchange', 'symbol', 'exchange'),
        Index('idx_orders_status_mode', 'status', 'mode'),
        Index('idx_orders_created_at', 'created_at'),
    )


class OrderFill(Base):
    __tablename__ = "order_fills"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    
    # Fill details
    quantity = Column(Numeric(20, 8), nullable=False)
    price = Column(Numeric(20, 8), nullable=False)
    commission = Column(Numeric(20, 8), default=0)
    commission_asset = Column(String(10), nullable=True)
    
    # Exchange fill ID
    exchange_fill_id = Column(String(100), nullable=True, unique=True)
    
    # Timestamp
    filled_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    order = relationship("Order", back_populates="fills")


class Position(Base):
    __tablename__ = "positions"
    
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), nullable=False, index=True)
    exchange = Column(String(20), nullable=False, index=True)
    side = Column(SQLEnum(PositionSide), nullable=False)
    
    # Position details
    quantity = Column(Numeric(20, 8), nullable=False)
    entry_price = Column(Numeric(20, 8), nullable=False)
    current_price = Column(Numeric(20, 8), nullable=True)
    unrealized_pnl = Column(Numeric(20, 8), default=0)
    realized_pnl = Column(Numeric(20, 8), default=0)
    
    # Leverage and margin
    leverage = Column(Numeric(5, 2), default=1.0)
    margin_used = Column(Numeric(20, 8), nullable=True)
    
    # Trading mode
    mode = Column(SQLEnum(TradeMode), default=TradeMode.PAPER)
    
    # Strategy
    strategy_id = Column(Integer, ForeignKey("strategies.id"), nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    opened_at = Column(DateTime, default=datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    strategy = relationship("Strategy", back_populates="positions")
    
    __table_args__ = (
        Index('idx_positions_symbol_exchange', 'symbol', 'exchange'),
        Index('idx_positions_active_mode', 'is_active', 'mode'),
    )


class Strategy(Base):
    __tablename__ = "strategies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    strategy_type = Column(SQLEnum(StrategyType), nullable=False)
    
    # Configuration
    config = Column(JSONB, nullable=False, default=dict)
    is_active = Column(Boolean, default=True)
    
    # Performance metrics
    total_trades = Column(Integer, default=0)
    winning_trades = Column(Integer, default=0)
    total_pnl = Column(Numeric(20, 8), default=0)
    max_drawdown = Column(Numeric(20, 8), default=0)
    sharpe_ratio = Column(Numeric(10, 4), nullable=True)
    
    # Risk parameters
    max_position_size = Column(Numeric(10, 4), default=0.1)  # 10% of portfolio
    max_daily_loss = Column(Numeric(10, 4), default=0.05)   # 5% daily loss limit
    stop_loss_pct = Column(Numeric(5, 4), default=0.02)     # 2% stop loss
    take_profit_pct = Column(Numeric(5, 4), default=0.04)   # 4% take profit
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    orders = relationship("Order", back_populates="strategy")
    positions = relationship("Position", back_populates="strategy")
    backtests = relationship("Backtest", back_populates="strategy")


class Backtest(Base):
    __tablename__ = "backtests"
    
    id = Column(Integer, primary_key=True, index=True)
    strategy_id = Column(Integer, ForeignKey("strategies.id"), nullable=False)
    name = Column(String(100), nullable=False)
    
    # Backtest parameters
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    initial_capital = Column(Numeric(20, 8), nullable=False)
    
    # Results
    total_return = Column(Numeric(10, 4), nullable=True)  # Percentage
    sharpe_ratio = Column(Numeric(10, 4), nullable=True)
    max_drawdown = Column(Numeric(10, 4), nullable=True)
    win_rate = Column(Numeric(5, 4), nullable=True)
    total_trades = Column(Integer, default=0)
    
    # Detailed results
    equity_curve = Column(JSONB, nullable=True)
    trade_history = Column(JSONB, nullable=True)
    metrics = Column(JSONB, nullable=True)
    
    # Status
    status = Column(String(20), default="pending")  # pending, running, completed, failed
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    strategy = relationship("Strategy", back_populates="backtests")


class CopyTrade(Base):
    __tablename__ = "copy_trades"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Target trader
    trader_address = Column(String(100), nullable=False, index=True)
    trader_name = Column(String(100), nullable=True)
    
    # Copy settings
    copy_ratio = Column(Numeric(5, 4), default=0.1)  # Copy 10% of their position size
    max_position_size = Column(Numeric(20, 8), nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Performance tracking
    total_copied_trades = Column(Integer, default=0)
    total_pnl = Column(Numeric(20, 8), default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class RiskMetrics(Base):
    __tablename__ = "risk_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Portfolio metrics
    total_equity = Column(Numeric(20, 8), nullable=False)
    available_margin = Column(Numeric(20, 8), nullable=False)
    used_margin = Column(Numeric(20, 8), nullable=False)
    
    # Risk metrics
    portfolio_var = Column(Numeric(10, 4), nullable=True)  # Value at Risk
    max_drawdown = Column(Numeric(10, 4), nullable=True)
    sharpe_ratio = Column(Numeric(10, 4), nullable=True)
    
    # Daily metrics
    daily_pnl = Column(Numeric(20, 8), default=0)
    daily_trades = Column(Integer, default=0)
    
    # Timestamp
    calculated_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_risk_metrics_calculated_at', 'calculated_at'),
    )
