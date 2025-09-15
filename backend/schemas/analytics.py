"""
Pydantic schemas for analytics API responses
"""

from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime


class CorrelationMatrixResponse(BaseModel):
    correlation_matrix: Dict[str, Dict[str, float]]
    high_correlations: int
    correlation_pairs: List[Dict[str, Any]]
    symbols: List[str]
    interval: str
    window_size: int
    correlation_type: str


class LeadLagResponse(BaseModel):
    leader_symbol: str
    follower_symbol: str
    lag_minutes: int
    lag_std: float
    cross_correlation: float
    hit_rate: float
    profit_factor: Optional[float]
    sharpe_ratio: Optional[float]
    sample_size: int
    last_updated: Optional[datetime]


class ClusterResponse(BaseModel):
    cluster_id: str
    cluster_name: Optional[str]
    algorithm: str
    num_assets: int
    symbols: List[str]
    silhouette_score: Optional[float]
    modularity: Optional[float]
    avg_correlation: float
    created_at: datetime


class MarketRegimeResponse(BaseModel):
    regime_type: str
    regime_probability: float
    volatility: float
    trend_strength: float
    market_breadth: Optional[float]
    risk_appetite: Optional[float]
    timestamp: datetime


class SpreadZScoreResponse(BaseModel):
    symbol1: str
    symbol2: str
    spread: float
    z_score: float
    hedge_ratio: float
    signal_strength: float
    signal_direction: str
    mean_reversion_prob: Optional[float]
    timestamp: datetime
