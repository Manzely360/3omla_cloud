"""Persistence models for AUTO-ARBITRAGE audit logging."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String, JSON

from core.database import Base


class AutoArbEvaluationLog(Base):
    __tablename__ = "auto_arb_evaluations"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(32), nullable=False, index=True)
    buy_venue = Column(String(32), nullable=False)
    sell_venue = Column(String(32), nullable=False)
    order_size_quote = Column(Float, nullable=False)
    exec_spread_bps = Column(Float, nullable=False)
    break_even_bps = Column(Float, nullable=False)
    net_pnl_quote = Column(Float, nullable=False)
    decision = Column(String(16), nullable=False)
    payload = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class AutoArbExecutionLog(Base):
    __tablename__ = "auto_arb_executions"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(32), nullable=False, index=True)
    buy_venue = Column(String(32), nullable=False)
    sell_venue = Column(String(32), nullable=False)
    request_quote = Column(Float, nullable=False)
    buy_order_id = Column(String(128), nullable=False)
    sell_order_id = Column(String(128), nullable=False)
    dry_run = Column(String(8), nullable=False)  # 'true' or 'false'
    decision = Column(String(16), nullable=False)
    payload = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
