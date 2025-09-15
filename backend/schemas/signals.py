"""
Pydantic schemas for signals API requests and responses
"""

from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime


class SignalResponse(BaseModel):
    signal_id: str
    signal_type: str
    primary_symbol: str
    secondary_symbol: Optional[str]
    exchange: str
    interval: str
    direction: str
    strength: float
    confidence: float
    trigger_price: float
    trigger_time: datetime
    expected_duration: Optional[int]
    historical_hit_rate: float
    historical_profit_factor: Optional[float]
    avg_return: Optional[float]
    stop_loss: Optional[float]
    take_profit: Optional[float]
    position_size: Optional[float]
    metadata: Optional[Dict[str, Any]]
    regime_context: Optional[str]
    status: str
    triggered_at: Optional[datetime]
    expired_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime


class AlertCreate(BaseModel):
    user_id: str
    alert_type: str
    name: str
    description: Optional[str]
    symbols: Optional[List[str]]
    exchanges: Optional[List[str]]
    intervals: Optional[List[str]]
    conditions: Dict[str, Any]
    thresholds: Dict[str, Any]
    notification_methods: List[str]
    webhook_url: Optional[str]
    email_address: Optional[str]
    max_alerts_per_day: Optional[int]
    cooldown_minutes: Optional[int]


class AlertResponse(BaseModel):
    alert_id: str
    user_id: str
    alert_type: str
    name: str
    description: Optional[str]
    symbols: Optional[List[str]]
    exchanges: Optional[List[str]]
    intervals: Optional[List[str]]
    conditions: Dict[str, Any]
    thresholds: Dict[str, Any]
    notification_methods: List[str]
    webhook_url: Optional[str]
    email_address: Optional[str]
    max_alerts_per_day: Optional[int]
    cooldown_minutes: Optional[int]
    is_active: bool
    last_triggered: Optional[datetime]
    trigger_count: int
    created_at: datetime
    updated_at: datetime


class AlertTriggerResponse(BaseModel):
    alert_id: str
    signal_id: Optional[str]
    user_id: str
    trigger_time: datetime
    trigger_data: Dict[str, Any]
    notification_sent: bool
    notification_method: Optional[str]
    notification_status: Optional[str]
    error_message: Optional[str]
    created_at: datetime


class BacktestRequest(BaseModel):
    user_id: str
    strategy_name: str
    strategy_config: Dict[str, Any]
    start_date: datetime
    end_date: datetime
    symbols: List[str]
    intervals: List[str]
    initial_capital: float


class BacktestResponse(BaseModel):
    backtest_id: str
    user_id: str
    strategy_name: str
    strategy_config: Dict[str, Any]
    start_date: datetime
    end_date: datetime
    symbols: List[str]
    intervals: List[str]
    initial_capital: float
    total_return: float
    annualized_return: float
    sharpe_ratio: float
    max_drawdown: float
    win_rate: float
    profit_factor: float
    total_trades: int
    winning_trades: int
    losing_trades: int
    avg_win: float
    avg_loss: float
    metrics: Optional[Dict[str, Any]]
    status: str
    error_message: Optional[str]
    created_at: datetime
    completed_at: Optional[datetime]
