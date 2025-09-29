"""
Analytics models for storing correlation, lead-lag, and clustering results
"""

from sqlalchemy import Column, String, Float, Integer, DateTime, Boolean, Text, Index
from sqlalchemy.dialects.postgresql import JSONB
from core.database import Base
from datetime import datetime


class CorrelationMatrix(Base):
    """Rolling correlation matrix between pairs"""
    __tablename__ = "correlation_matrices"
    
    id = Column(Integer, primary_key=True, index=True)
    symbol1 = Column(String(20), nullable=False, index=True)
    symbol2 = Column(String(20), nullable=False, index=True)
    exchange = Column(String(20), nullable=False)
    interval = Column(String(10), nullable=False)
    window_size = Column(Integer, nullable=False)  # Number of periods
    correlation_type = Column(String(20), nullable=False)  # 'pearson', 'spearman', 'kendall'
    
    # Correlation metrics
    correlation = Column(Float, nullable=False)
    p_value = Column(Float, nullable=True)
    confidence_interval_lower = Column(Float, nullable=True)
    confidence_interval_upper = Column(Float, nullable=True)
    
    # Metadata
    sample_size = Column(Integer, nullable=False)
    start_time = Column(DateTime, nullable=False, index=True)
    end_time = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_symbols_interval_time', 'symbol1', 'symbol2', 'interval', 'start_time'),
        Index('idx_correlation_type', 'correlation_type', 'interval'),
    )


class LeadLagRelationship(Base):
    """Lead-lag relationships between pairs"""
    __tablename__ = "lead_lag_relationships"
    
    id = Column(Integer, primary_key=True, index=True)
    leader_symbol = Column(String(20), nullable=False, index=True)
    follower_symbol = Column(String(20), nullable=False, index=True)
    exchange = Column(String(20), nullable=False)
    interval = Column(String(10), nullable=False)
    
    # Lead-lag metrics
    lag_minutes = Column(Integer, nullable=False)  # Average lag in minutes
    lag_std = Column(Float, nullable=False)  # Standard deviation of lag
    cross_correlation = Column(Float, nullable=False)  # Maximum cross-correlation
    granger_causality_pvalue = Column(Float, nullable=True)
    transfer_entropy = Column(Float, nullable=True)
    
    # Performance metrics
    hit_rate = Column(Float, nullable=False)  # Percentage of correct predictions
    profit_factor = Column(Float, nullable=True)
    sharpe_ratio = Column(Float, nullable=True)
    max_drawdown = Column(Float, nullable=True)
    
    # Metadata
    sample_size = Column(Integer, nullable=False)
    start_time = Column(DateTime, nullable=False, index=True)
    end_time = Column(DateTime, nullable=False, index=True)
    last_updated = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_leader_follower', 'leader_symbol', 'follower_symbol', 'interval'),
        Index('idx_hit_rate', 'hit_rate', 'interval'),
    )


class CointegrationPair(Base):
    """Cointegrated pairs for statistical arbitrage"""
    __tablename__ = "cointegration_pairs"
    
    id = Column(Integer, primary_key=True, index=True)
    symbol1 = Column(String(20), nullable=False, index=True)
    symbol2 = Column(String(20), nullable=False, index=True)
    exchange = Column(String(20), nullable=False)
    interval = Column(String(10), nullable=False)
    
    # Cointegration metrics
    adf_statistic = Column(Float, nullable=False)
    adf_pvalue = Column(Float, nullable=False)
    johansen_trace_stat = Column(Float, nullable=True)
    johansen_trace_pvalue = Column(Float, nullable=True)
    johansen_max_eigen_stat = Column(Float, nullable=True)
    johansen_max_eigen_pvalue = Column(Float, nullable=True)
    
    # Spread metrics
    hedge_ratio = Column(Float, nullable=False)
    spread_mean = Column(Float, nullable=False)
    spread_std = Column(Float, nullable=False)
    half_life = Column(Float, nullable=True)  # Mean reversion half-life
    
    # Performance metrics
    sharpe_ratio = Column(Float, nullable=True)
    max_drawdown = Column(Float, nullable=True)
    total_return = Column(Float, nullable=True)
    
    # Metadata
    sample_size = Column(Integer, nullable=False)
    start_time = Column(DateTime, nullable=False, index=True)
    end_time = Column(DateTime, nullable=False, index=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_cointegration_pairs', 'symbol1', 'symbol2', 'interval'),
        Index('idx_adf_pvalue', 'adf_pvalue', 'interval'),
    )


class Cluster(Base):
    """Asset clusters from graph clustering"""
    __tablename__ = "clusters"
    
    id = Column(Integer, primary_key=True, index=True)
    cluster_id = Column(String(50), nullable=False, index=True)
    cluster_name = Column(String(100), nullable=True)
    exchange = Column(String(20), nullable=False)
    interval = Column(String(10), nullable=False)
    algorithm = Column(String(50), nullable=False)  # 'spectral', 'kmeans', 'dbscan'
    
    # Cluster metrics
    silhouette_score = Column(Float, nullable=True)
    modularity = Column(Float, nullable=True)
    num_assets = Column(Integer, nullable=False)
    avg_correlation = Column(Float, nullable=False)
    
    # Cluster composition
    symbols = Column(JSONB, nullable=False)  # List of symbols in cluster
    cluster_center = Column(JSONB, nullable=True)  # Center coordinates
    
    # Metadata
    start_time = Column(DateTime, nullable=False, index=True)
    end_time = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_cluster_algorithm', 'algorithm', 'interval'),
        Index('idx_cluster_time', 'cluster_id', 'start_time'),
    )


class MarketRegime(Base):
    """Market regime classification"""
    __tablename__ = "market_regimes"
    
    id = Column(Integer, primary_key=True, index=True)
    exchange = Column(String(20), nullable=False)
    interval = Column(String(10), nullable=False)
    timestamp = Column(DateTime, nullable=False, index=True)
    
    # Regime classification
    regime_type = Column(String(20), nullable=False)  # 'risk_on', 'risk_off', 'trending', 'choppy'
    regime_probability = Column(Float, nullable=False)
    algorithm = Column(String(50), nullable=False)  # 'hmm', 'volatility', 'breadth'
    
    # Regime characteristics
    volatility = Column(Float, nullable=False)
    trend_strength = Column(Float, nullable=False)
    market_breadth = Column(Float, nullable=True)
    risk_appetite = Column(Float, nullable=True)
    
    # Additional features
    features = Column(JSONB, nullable=True)  # Additional regime features
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_regime_type_time', 'regime_type', 'timestamp'),
        Index('idx_exchange_interval_time', 'exchange', 'interval', 'timestamp'),
    )


class SpreadZScore(Base):
    """Z-scores for cointegrated pair spreads"""
    __tablename__ = "spread_z_scores"

    id = Column(Integer, primary_key=True, index=True)
    symbol1 = Column(String(20), nullable=False, index=True)
    symbol2 = Column(String(20), nullable=False, index=True)
    exchange = Column(String(20), nullable=False)
    interval = Column(String(10), nullable=False)
    timestamp = Column(DateTime, nullable=False, index=True)
    
    # Spread metrics
    spread = Column(Float, nullable=False)
    z_score = Column(Float, nullable=False)
    hedge_ratio = Column(Float, nullable=False)
    
    # Signal strength
    signal_strength = Column(Float, nullable=False)  # Absolute z-score
    signal_direction = Column(String(10), nullable=False)  # 'long', 'short'
    
    # Mean reversion probability
    mean_reversion_prob = Column(Float, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_spread_symbols_time', 'symbol1', 'symbol2', 'timestamp'),
        Index('idx_z_score', 'z_score', 'interval'),
    )


class LiveCorrelation(Base):
    """Live correlation / lead-lag snapshot."""

    __tablename__ = "live_correlations"

    id = Column(Integer, primary_key=True, index=True)
    leader_symbol = Column(String(20), nullable=False, index=True)
    follower_symbol = Column(String(20), nullable=False, index=True)
    interval = Column(String(10), nullable=False, index=True)
    correlation = Column(Float, nullable=True)
    lag_bars = Column(Integer, nullable=True)
    hit_rate = Column(Float, nullable=True)
    confidence = Column(Float, nullable=True)
    predicted_direction = Column(String(10), nullable=True)
    lookahead_seconds = Column(Integer, nullable=True)
    sample_size = Column(Integer, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, index=True)

    __table_args__ = (
        Index('idx_live_corr_pair', 'leader_symbol', 'follower_symbol', 'interval', unique=True),
    )
