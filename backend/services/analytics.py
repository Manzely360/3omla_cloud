"""
Analytics service for correlation, lead-lag, and clustering analysis
"""

import asyncio
import numpy as np
import pandas as pd
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select, and_, or_, func, desc
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
import structlog
from scipy import stats
from scipy.stats import pearsonr, spearmanr, kendalltau
from statsmodels.tsa.stattools import coint
from sklearn.cluster import SpectralClustering, KMeans, DBSCAN
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score
import networkx as nx
from statsmodels.tsa.stattools import grangercausalitytests
from statsmodels.tsa.vector_ar.vecm import coint_johansen

from models.market_data import Kline, Symbol
from models.analytics import (
    CorrelationMatrix, LeadLagRelationship, Cluster, 
    MarketRegime, CointegrationPair, SpreadZScore
)

logger = structlog.get_logger()


class AnalyticsService:
    """Analytics service for market analysis"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_correlation_matrix(
        self,
        symbols: List[str],
        interval: str = "15m",
        window_size: int = 100,
        correlation_type: str = "pearson"
    ) -> Dict[str, Any]:
        """Calculate correlation matrix for given symbols"""
        try:
            # Get price data for symbols
            price_data = await self._get_price_data(symbols, interval, window_size)
            
            if price_data.empty:
                return {"correlation_matrix": {}, "high_correlations": 0}
            
            # Calculate returns
            returns = price_data.pct_change().dropna()
            
            # Calculate correlation matrix
            if correlation_type == "pearson":
                corr_matrix = returns.corr()
            elif correlation_type == "spearman":
                corr_matrix = returns.corr(method='spearman')
            elif correlation_type == "kendall":
                corr_matrix = returns.corr(method='kendall')
            else:
                corr_matrix = returns.corr()
            
            # Find high correlations
            high_correlations = 0
            correlation_pairs = []
            
            for i in range(len(corr_matrix.columns)):
                for j in range(i+1, len(corr_matrix.columns)):
                    corr_value = corr_matrix.iloc[i, j]
                    if abs(corr_value) > 0.7:  # High correlation threshold
                        high_correlations += 1
                        correlation_pairs.append({
                            "symbol1": corr_matrix.columns[i],
                            "symbol2": corr_matrix.columns[j],
                            "correlation": float(corr_value),
                            "type": "positive" if corr_value > 0 else "negative"
                        })
            
            return {
                "correlation_matrix": corr_matrix.to_dict(),
                "high_correlations": high_correlations,
                "correlation_pairs": correlation_pairs,
                "symbols": symbols,
                "interval": interval,
                "window_size": window_size,
                "correlation_type": correlation_type
            }
            
        except Exception as e:
            logger.error("Failed to calculate correlation matrix", error=str(e))
            raise
    
    async def get_lead_lag_relationships(
        self,
        symbol: Optional[str] = None,
        min_hit_rate: float = 0.6,
        min_correlation: float = 0.3,
        interval: str = "15m",
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get lead-lag relationships between symbols"""
        try:
            query = select(LeadLagRelationship).where(
                and_(
                    LeadLagRelationship.hit_rate >= min_hit_rate,
                    LeadLagRelationship.cross_correlation >= min_correlation,
                    LeadLagRelationship.interval == interval
                )
            )
            
            if symbol:
                query = query.where(
                    or_(
                        LeadLagRelationship.leader_symbol == symbol,
                        LeadLagRelationship.follower_symbol == symbol
                    )
                )
            
            query = query.order_by(desc(LeadLagRelationship.hit_rate)).limit(limit)
            
            result = await self.db.execute(query)
            relationships = result.scalars().all()
            
            return [
                {
                    "leader_symbol": rel.leader_symbol,
                    "follower_symbol": rel.follower_symbol,
                    "lag_minutes": rel.lag_minutes,
                    "lag_std": rel.lag_std,
                    "cross_correlation": rel.cross_correlation,
                    "hit_rate": rel.hit_rate,
                    "profit_factor": rel.profit_factor,
                    "sharpe_ratio": rel.sharpe_ratio,
                    "sample_size": rel.sample_size,
                    "last_updated": rel.last_updated.isoformat() if rel.last_updated else None
                }
                for rel in relationships
            ]
            
        except Exception as e:
            logger.error("Failed to get lead-lag relationships", error=str(e))
            raise
    
    async def get_clusters(
        self,
        algorithm: str = "spectral",
        interval: str = "1h",
        min_cluster_size: int = 3
    ) -> List[Dict[str, Any]]:
        """Get asset clusters using specified algorithm"""
        try:
            query = select(Cluster).where(
                and_(
                    Cluster.algorithm == algorithm,
                    Cluster.interval == interval,
                    Cluster.num_assets >= min_cluster_size
                )
            ).order_by(desc(Cluster.silhouette_score))
            
            result = await self.db.execute(query)
            clusters = result.scalars().all()
            
            return [
                {
                    "cluster_id": cluster.cluster_id,
                    "cluster_name": cluster.cluster_name,
                    "algorithm": cluster.algorithm,
                    "num_assets": cluster.num_assets,
                    "symbols": cluster.symbols,
                    "silhouette_score": cluster.silhouette_score,
                    "modularity": cluster.modularity,
                    "avg_correlation": cluster.avg_correlation,
                    "created_at": cluster.created_at.isoformat()
                }
                for cluster in clusters
            ]
            
        except Exception as e:
            logger.error("Failed to get clusters", error=str(e))
            raise
    
    async def get_current_market_regime(
        self,
        exchange: str = "binance",
        interval: str = "1h"
    ) -> Dict[str, Any]:
        """Get current market regime classification"""
        try:
            query = select(MarketRegime).where(
                and_(
                    MarketRegime.exchange == exchange,
                    MarketRegime.interval == interval
                )
            ).order_by(desc(MarketRegime.timestamp)).limit(1)
            
            result = await self.db.execute(query)
            regime = result.scalar_one_or_none()
            
            if not regime:
                return {
                    "regime_type": "unknown",
                    "regime_probability": 0.0,
                    "volatility": 0.0,
                    "trend_strength": 0.0,
                    "timestamp": datetime.utcnow().isoformat()
                }
            
            return {
                "regime_type": regime.regime_type,
                "regime_probability": regime.regime_probability,
                "volatility": regime.volatility,
                "trend_strength": regime.trend_strength,
                "market_breadth": regime.market_breadth,
                "risk_appetite": regime.risk_appetite,
                "timestamp": regime.timestamp.isoformat()
            }
            
        except Exception as e:
            logger.error("Failed to get market regime", error=str(e))
            raise
    
    async def get_spread_z_scores(
        self,
        symbols: Optional[List[str]] = None,
        min_z_score: float = 2.0,
        interval: str = "15m",
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Get spread z-scores for cointegrated pairs"""
        try:
            query = select(SpreadZScore).where(
                and_(
                    SpreadZScore.interval == interval,
                    func.abs(SpreadZScore.z_score) >= min_z_score
                )
            )
            
            if symbols:
                symbol_conditions = []
                for symbol_pair in symbols:
                    if isinstance(symbol_pair, str) and '-' in symbol_pair:
                        s1, s2 = symbol_pair.split('-')
                        symbol_conditions.append(
                            and_(
                                SpreadZScore.symbol1 == s1,
                                SpreadZScore.symbol2 == s2
                            )
                        )
                if symbol_conditions:
                    query = query.where(or_(*symbol_conditions))
            
            query = query.order_by(desc(func.abs(SpreadZScore.z_score))).limit(limit)
            
            result = await self.db.execute(query)
            z_scores = result.scalars().all()
            
            return [
                {
                    "symbol1": zs.symbol1,
                    "symbol2": zs.symbol2,
                    "spread": zs.spread,
                    "z_score": zs.z_score,
                    "hedge_ratio": zs.hedge_ratio,
                    "signal_strength": zs.signal_strength,
                    "signal_direction": zs.signal_direction,
                    "mean_reversion_prob": zs.mean_reversion_prob,
                    "timestamp": zs.timestamp.isoformat()
                }
                for zs in z_scores
            ]
            
        except Exception as e:
            logger.error("Failed to get spread z-scores", error=str(e))
            raise
    
    async def get_similar_assets(
        self,
        symbol: str,
        correlation_threshold: float = 0.7,
        interval: str = "1h",
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get assets similar to the specified symbol"""
        try:
            # Get correlation data for the symbol
            query = select(CorrelationMatrix).where(
                and_(
                    or_(
                        CorrelationMatrix.symbol1 == symbol,
                        CorrelationMatrix.symbol2 == symbol
                    ),
                    CorrelationMatrix.interval == interval,
                    CorrelationMatrix.correlation >= correlation_threshold
                )
            ).order_by(desc(CorrelationMatrix.correlation)).limit(limit)
            
            result = await self.db.execute(query)
            correlations = result.scalars().all()
            
            similar_assets = []
            for corr in correlations:
                other_symbol = corr.symbol2 if corr.symbol1 == symbol else corr.symbol1
                similar_assets.append({
                    "symbol": other_symbol,
                    "correlation": corr.correlation,
                    "p_value": corr.p_value,
                    "sample_size": corr.sample_size,
                    "start_time": corr.start_time.isoformat(),
                    "end_time": corr.end_time.isoformat()
                })
            
            return similar_assets
            
        except Exception as e:
            logger.error("Failed to get similar assets", error=str(e))
            raise
    
    async def get_opposite_assets(
        self,
        symbol: str,
        correlation_threshold: float = -0.7,
        interval: str = "1h",
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get assets with opposite movements to the specified symbol"""
        try:
            # Get negative correlation data for the symbol
            query = select(CorrelationMatrix).where(
                and_(
                    or_(
                        CorrelationMatrix.symbol1 == symbol,
                        CorrelationMatrix.symbol2 == symbol
                    ),
                    CorrelationMatrix.interval == interval,
                    CorrelationMatrix.correlation <= correlation_threshold
                )
            ).order_by(CorrelationMatrix.correlation).limit(limit)
            
            result = await self.db.execute(query)
            correlations = result.scalars().all()
            
            opposite_assets = []
            for corr in correlations:
                other_symbol = corr.symbol2 if corr.symbol1 == symbol else corr.symbol1
                opposite_assets.append({
                    "symbol": other_symbol,
                    "correlation": corr.correlation,
                    "p_value": corr.p_value,
                    "sample_size": corr.sample_size,
                    "start_time": corr.start_time.isoformat(),
                    "end_time": corr.end_time.isoformat()
                })
            
            return opposite_assets
            
        except Exception as e:
            logger.error("Failed to get opposite assets", error=str(e))
            raise
    
    async def compute_correlations_async(
        self,
        symbols: List[str],
        intervals: List[str],
        correlation_types: List[str],
        window_sizes: List[int]
    ) -> str:
        """Trigger correlation computation asynchronously"""
        # This would typically start a background task
        # For now, return a mock task ID
        task_id = f"corr_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        logger.info("Started correlation computation", task_id=task_id)
        return task_id
    
    async def compute_lead_lag_async(
        self,
        symbol_pairs: List[Dict[str, str]],
        intervals: List[str],
        max_lag: int
    ) -> str:
        """Trigger lead-lag computation asynchronously"""
        # This would typically start a background task
        # For now, return a mock task ID
        task_id = f"leadlag_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        logger.info("Started lead-lag computation", task_id=task_id)
        return task_id

    async def get_symbol_universe(self, limit: int = 12) -> List[str]:
        """Fetch a diversified set of actively traded symbols using Ultra Oracle."""
        try:
            # Try Ultra Oracle first for real-time symbol discovery
            from services.ultra_price_oracle import ultra_oracle
            oracle_symbols = await ultra_oracle.get_all_symbols()
            if oracle_symbols:
                usdt_symbols = [s for s in oracle_symbols if s.endswith('USDT')]
                return usdt_symbols[:limit]
                
            # Fallback to market data service
            from services.market_data import MarketDataService
            mds = MarketDataService(self.db)
            top_usdt = await mds.get_top_symbols_by_volume(quote_asset="USDT", limit=limit * 2, min_quote_volume=1_000_000)
            if not top_usdt:
                return ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'DOGEUSDT', 'ADAUSDT', 'AVAXUSDT'][:limit]

            universe: List[str] = []
            seen = set()
            for symbol in top_usdt:
                if symbol in seen:
                    continue
                seen.add(symbol)
                universe.append(symbol)
                if len(universe) >= limit:
                    break
            return universe
        except Exception as exc:
            logger.warning("Failed to fetch dynamic symbol universe, using defaults", error=str(exc))
            return ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'DOGEUSDT', 'ADAUSDT', 'AVAXUSDT'][:limit]

    async def store_live_correlation(
        self,
        leader_symbol: str,
        follower_symbol: str,
        interval: str,
        correlation: Optional[float],
        lag_bars: Optional[int],
        hit_rate: Optional[float],
        sample_size: Optional[int]
    ) -> None:
        try:
            query = select(LiveCorrelation).where(
                and_(
                    LiveCorrelation.leader_symbol == leader_symbol,
                    LiveCorrelation.follower_symbol == follower_symbol,
                    LiveCorrelation.interval == interval
                )
            )
            existing = await self.db.execute(query)
            record = existing.scalar_one_or_none()
            now = datetime.utcnow()
            if record:
                record.correlation = correlation
                record.lag_bars = lag_bars
                record.hit_rate = hit_rate
                record.sample_size = sample_size
                record.updated_at = now
            else:
                record = LiveCorrelation(
                    leader_symbol=leader_symbol,
                    follower_symbol=follower_symbol,
                    interval=interval,
                    correlation=correlation,
                    lag_bars=lag_bars,
                    hit_rate=hit_rate,
                    sample_size=sample_size,
                    updated_at=now,
                )
                self.db.add(record)
            await self.db.commit()
        except Exception as exc:
            await self.db.rollback()
            logger.error("Failed to store live correlation", error=str(exc))

    async def get_live_correlations(
        self,
        symbols: Optional[List[str]] = None,
        interval: Optional[str] = None,
        min_hit_rate: float = 0.0,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        try:
            query = select(LiveCorrelation)
            if interval:
                query = query.where(LiveCorrelation.interval == interval)
            if symbols:
                upper = [s.upper() for s in symbols]
                query = query.where(
                    or_(
                        LiveCorrelation.leader_symbol.in_(upper),
                        LiveCorrelation.follower_symbol.in_(upper)
                    )
                )
            if min_hit_rate > 0:
                query = query.where(LiveCorrelation.hit_rate >= min_hit_rate)
            query = query.order_by(desc(LiveCorrelation.updated_at)).limit(limit)
            result = await self.db.execute(query)
            records = result.scalars().all()
            out: List[Dict[str, Any]] = []
            for record in records:
                out.append({
                    "leader_symbol": record.leader_symbol,
                    "follower_symbol": record.follower_symbol,
                    "interval": record.interval,
                    "correlation": record.correlation,
                    "lag_bars": record.lag_bars,
                    "hit_rate": record.hit_rate,
                    "sample_size": record.sample_size,
                    "updated_at": record.updated_at.isoformat() if record.updated_at else None,
                })
            return out
        except Exception as exc:
            logger.error("Failed to fetch live correlations", error=str(exc))
            raise
    
    async def _get_price_data(
        self,
        symbols: List[str],
        interval: str,
        window_size: int
    ) -> pd.DataFrame:
        """Get price data for symbols"""
        try:
            # Calculate start time based on window size
            end_time = datetime.utcnow()
            start_time = end_time - timedelta(
                minutes=window_size * self._interval_to_minutes(interval)
            )
            
            query = select(Kline).where(
                and_(
                    Kline.symbol.in_(symbols),
                    Kline.interval == interval,
                    Kline.open_time >= start_time,
                    Kline.open_time <= end_time
                )
            ).order_by(Kline.symbol, Kline.open_time)
            
            result = await self.db.execute(query)
            klines = result.scalars().all()
            
            if not klines:
                # Fallback to live public data via MarketDataService
                try:
                    from services.market_data import MarketDataService
                    mds = MarketDataService(self.db)
                    data_rows: List[Dict[str, Any]] = []
                    for sym in symbols:
                        rows = await mds.get_klines(symbol=sym, interval=interval, limit=window_size)
                        for r in rows:
                            data_rows.append({
                                'symbol': sym,
                                'timestamp': r['close_time'],
                                'close_price': r['close_price']
                            })
                    if not data_rows:
                        return pd.DataFrame()
                    df = pd.DataFrame(data_rows)
                    price_df = df.pivot(index='timestamp', columns='symbol', values='close_price')
                    return price_df
                except Exception:
                    return pd.DataFrame()
            
            # Convert to DataFrame
            data = []
            for kline in klines:
                data.append({
                    'symbol': kline.symbol,
                    'timestamp': kline.open_time,
                    'close_price': kline.close_price
                })
            
            df = pd.DataFrame(data)
            
            # Pivot to get symbols as columns
            price_df = df.pivot(index='timestamp', columns='symbol', values='close_price')
            
            return price_df
            
        except Exception as e:
            logger.error("Failed to get price data", error=str(e))
            return pd.DataFrame()
    
    def _interval_to_minutes(self, interval: str) -> int:
        """Convert interval string to minutes"""
        interval_map = {
            '1m': 1,
            '5m': 5,
            '15m': 15,
            '30m': 30,
            '1h': 60,
            '4h': 240,
            '1d': 1440
        }
        return interval_map.get(interval, 15)

    # ---- Advanced metrics ----
    async def rolling_beta(
        self,
        symbols: List[str],
        benchmark: str = "BTCUSDT",
        interval: str = "15m",
        window: int = 200,
    ) -> Dict[str, Any]:
        """Compute rolling beta of each symbol against benchmark using simple OLS on returns."""
        cols = [benchmark] + [s for s in symbols if s != benchmark]
        df = await self._get_price_data(cols, interval, window + 5)
        if df.empty or benchmark not in df.columns:
            return {"betas": {}, "interval": interval}
        df = df.dropna()
        rets = df.pct_change().dropna()
        b = {}
        if benchmark not in rets.columns:
            return {"betas": {}, "interval": interval}
        rb = rets[benchmark]
        for s in symbols:
            if s == benchmark or s not in rets.columns:
                continue
            rs = rets[s]
            n = min(len(rb), len(rs))
            if n < max(20, window // 4):
                continue
            rb2 = rb.iloc[-n:]
            rs2 = rs.iloc[-n:]
            try:
                cov = float(np.cov(rb2, rs2)[0, 1])
                var = float(np.var(rb2)) + 1e-12
                beta = cov / var
                b[s] = beta
            except Exception:
                continue
        return {"betas": b, "benchmark": benchmark, "interval": interval}

    async def screener(
        self,
        symbols: Optional[List[str]] = None,
        interval: str = "15m",
        limit: int = 12,
        risk_budget: Optional[float] = None,
    ) -> List[Dict[str, Any]]:
        """Generate simple actionable ideas using sentiment, momentum, and whale activity.
        This is heuristic and uses public data.
        """
        # choose top USDT pairs if none supplied
        if not symbols:
            try:
                from services.market_data import MarketDataService
                mds = MarketDataService(self.db)
                tickers = await mds._get('/api/v3/ticker/24hr')
                usdt = [r for r in tickers if isinstance(r, dict) and str(r.get('symbol','')).endswith('USDT')]
                for r in usdt:
                    try:
                        r['q'] = float(r.get('quoteVolume') or 0.0)
                    except Exception:
                        r['q'] = 0.0
                usdt.sort(key=lambda r: r.get('q', 0.0), reverse=True)
                symbols = [r['symbol'] for r in usdt[:30]]
            except Exception:
                symbols = ["BTCUSDT","ETHUSDT","BNBUSDT","SOLUSDT","XRPUSDT","ADAUSDT"]
        out: List[Dict[str, Any]] = []
        # grab whale events for quick boost
        whales: Dict[str, float] = {}
        try:
            from services.market_data import MarketDataService
            mds = MarketDataService(self.db)
            events = await mds.get_whale_activity(symbols, min_trade_size=200000, limit=100)
            for e in events:
                whales[e['symbol']] = whales.get(e['symbol'], 0.0) + (e.get('usd_notional') or 0.0) * (1 if e.get('side')=='buy' else -1)
        except Exception:
            pass
        # compute per-symbol features
        for s in symbols[:50]:
            try:
                sent = await self.compute_sentiment(s, interval=interval, window_size=300)
                df = await self._get_price_data([s], interval, 250)
                if df.empty or s not in df.columns:
                    continue
                closes = df[s].dropna()
                if len(closes) < 60:
                    continue
                r20 = float((closes.iloc[-1] - closes.iloc[-20]) / (closes.iloc[-20] + 1e-9))
                vol20 = float(closes.pct_change().rolling(20).std().iloc[-1] or 0)
                whale_bias = whales.get(s, 0.0)
                score = 0.0
                rsi = sent.get('rsi') or 50
                mom = sent.get('momentum') or 0
                score += (rsi - 50)/50.0 + mom*2 + r20 + (0.000001*whale_bias)
                direction = 'long' if score >= 0 else 'short'
                conf = max(0.0, min(1.0, 0.5 + score/2))
                rec = {
                    "symbol": s,
                    "direction": direction,
                    "confidence": round(conf, 3),
                    "rsi": rsi,
                    "momentum": mom,
                    "ret20": r20,
                    "whale_bias": whale_bias,
                    "volatility": vol20,
                    "interval": interval,
                    "stop_loss_pct": 0.01 if direction=='long' else 0.012,
                    "take_profit_pct": 0.02 if direction=='long' else 0.018,
                }
                # optional risk-based size (approximate)
                if risk_budget and risk_budget > 0:
                  try:
                    from services.market_data import MarketDataService
                    mds = MarketDataService(self.db)
                    price = (await mds.get_current_price(s) or {}).get('price') or 0
                    price = float(price)
                    if price > 0:
                        # qty ~ risk_budget / (price * (volatility scale))
                        vol_scale = max(0.005, min(0.05, vol20*5))
                        qty = risk_budget / (price * (1 + vol_scale))
                        rec["qty_est"] = max(0.0001, round(qty, 6))
                  except Exception:
                    pass
                out.append(rec)
            except Exception:
                continue
        # mean-reversion pair ideas using spread z-scores
        try:
            zpairs = await self.get_spread_z_scores(symbols=None, min_z_score=2.0, interval=interval, limit=10)
            for z in zpairs:
                d = {
                    "pair": f"{z['symbol1']}-{z['symbol2']}",
                    "type": "mean_reversion",
                    "z_score": z.get('z_score'),
                    "hedge_ratio": z.get('hedge_ratio'),
                    "interval": interval,
                }
                # Trade idea: if z>0, short s1 long s2; if z<0, long s1 short s2
                if (z.get('z_score') or 0) > 0:
                    d["legs"] = [{"symbol": z['symbol1'], "side": "sell"}, {"symbol": z['symbol2'], "side": "buy"}]
                else:
                    d["legs"] = [{"symbol": z['symbol1'], "side": "buy"}, {"symbol": z['symbol2'], "side": "sell"}]
                out.append(d)
        except Exception:
            pass

        out.sort(key=lambda x: abs(x.get('z_score', 0)) if 'z_score' in x else x.get('confidence', 0), reverse=True)
        # keep top by balancing
        singles = [i for i in out if 'symbol' in i][:limit]
        pairs = [i for i in out if 'pair' in i][:max(0, limit - len(singles))]
        return singles + pairs
    async def compute_lead_lag_metrics(
        self,
        symbol1: str,
        symbol2: str,
        interval: str = "15m",
        max_lag: int = 20,
        window_size: int = 400,
    ) -> Dict[str, Any]:
        """Compute rich lead-lag diagnostics including projected follower response."""
        df = await self._get_price_data([symbol1, symbol2], interval, window_size)
        if df.empty or symbol1 not in df.columns or symbol2 not in df.columns:
            return {"error": "insufficient_data", "symbol1": symbol1, "symbol2": symbol2, "interval": interval}

        df = df.dropna()
        r1 = df[symbol1].pct_change().dropna()
        r2 = df[symbol2].pct_change().dropna()
        n = min(len(r1), len(r2))
        if n < 10:
            return {"error": "insufficient_sample", "symbol1": symbol1, "symbol2": symbol2, "interval": interval}

        r1 = r1.iloc[-n:]
        r2 = r2.iloc[-n:]

        lags = list(range(-max_lag, max_lag + 1))
        xcorr: List[Optional[float]] = []
        for lag in lags:
            if lag < 0:
                v1 = r1.iloc[-lag:]
                v2 = r2.iloc[: len(v1)]
            elif lag > 0:
                v2 = r2.iloc[lag:]
                v1 = r1.iloc[: len(v2)]
            else:
                v1 = r1
                v2 = r2
            if len(v1) < 5:
                xcorr.append(None)
                continue
            try:
                xcorr.append(float(np.corrcoef(v1, v2)[0, 1]))
            except Exception:
                xcorr.append(None)

        best_lag: Optional[int] = None
        best_val = -1.0
        for lag, corr in zip(lags, xcorr):
            if corr is None:
                continue
            if abs(corr) > best_val:
                best_val = abs(corr)
                best_lag = lag

        if best_lag is None:
            return {
                "symbol1": symbol1,
                "symbol2": symbol2,
                "interval": interval,
                "lags": lags,
                "xcorr": xcorr,
                "best_lag": None,
                "best_abs_corr": 0.0,
            }

        interval_minutes = self._interval_to_minutes(interval)
        lag_bars = abs(best_lag)
        lag_minutes = lag_bars * interval_minutes
        lag_seconds = lag_minutes * 60

        if best_lag >= 0:
            leader_symbol = symbol1
            lagging_symbol = symbol2
            leader_returns = r1
            follower_returns = r2
        else:
            leader_symbol = symbol2
            lagging_symbol = symbol1
            leader_returns = r2
            follower_returns = r1

        if lag_bars > 0:
            if len(leader_returns) <= lag_bars or len(follower_returns) <= lag_bars:
                return {
                    "symbol1": symbol1,
                    "symbol2": symbol2,
                    "interval": interval,
                    "lags": lags,
                    "xcorr": xcorr,
                    "best_lag": best_lag,
                    "best_abs_corr": best_val,
                    "sample_size": 0,
                }
            lead_aligned = leader_returns.iloc[:-lag_bars]
            follow_aligned = follower_returns.iloc[lag_bars:]
        else:
            count = min(len(leader_returns), len(follower_returns))
            lead_aligned = leader_returns.iloc[-count:]
            follow_aligned = follower_returns.iloc[-count:]

        if len(lead_aligned) != len(follow_aligned) or len(lead_aligned) == 0:
            return {
                "symbol1": symbol1,
                "symbol2": symbol2,
                "interval": interval,
                "lags": lags,
                "xcorr": xcorr,
                "best_lag": best_lag,
                "best_abs_corr": best_val,
                "sample_size": 0,
            }

        lead_array = lead_aligned.values
        follow_array = follow_aligned.values

        # Hit-rate: follower moves same direction after lag
        lead_sign = np.sign(lead_array)
        follow_sign = np.sign(follow_array)
        hit_rate = float(np.mean(lead_sign == follow_sign)) if len(lead_array) else 0.0

        # Magnitude response ratio (OLS slope)
        valid_mask = np.where(np.abs(lead_array) > 1e-5)[0]
        move_ratio = 0.0
        move_r2 = 0.0
        if valid_mask.size >= 5:
            x = lead_array[valid_mask]
            y = follow_array[valid_mask]
            try:
                slope, intercept = np.polyfit(x, y, 1)
                move_ratio = float(slope)
                preds = slope * x + intercept
                ss_res = float(np.sum((y - preds) ** 2))
                ss_tot = float(np.sum((y - np.mean(y)) ** 2) + 1e-9)
                move_r2 = 1.0 - (ss_res / ss_tot)
            except Exception:
                move_ratio = 0.0
                move_r2 = 0.0

        expected_follow_move = move_ratio * 0.05 if move_ratio else 0.0
        move_projection = {
            "leader_move": 0.05,
            "expected_follower_move": expected_follow_move,
            "ratio": move_ratio,
            "r_squared": move_r2,
        }

        # Shock sensitivity: 90th percentile absolute response vs leader
        try:
            shock_response = float(
                (np.percentile(np.abs(follow_array), 90) + 1e-9)
                / (np.percentile(np.abs(lead_array), 90) + 1e-9)
            )
        except Exception:
            shock_response = 0.0

        # Whale alignment metrics (large trades in same direction)
        whale_alignment: Dict[str, Any] = {
            "leader_bias": 0.0,
            "follower_bias": 0.0,
            "events": 0,
            "same_direction": False,
            "score": 0.0,
        }
        try:
            from services.market_data import MarketDataService

            mds = MarketDataService(self.db)
            whale_events = await mds.get_whale_activity(
                symbols=[leader_symbol, lagging_symbol],
                min_trade_size=150_000,
                limit=60,
            )
            leader_bias = 0.0
            follower_bias = 0.0
            for event in whale_events:
                notional = float(event.get('usd_notional') or 0.0)
                direction = 1.0 if event.get('side') == 'buy' else -1.0
                if event.get('symbol') == leader_symbol:
                    leader_bias += notional * direction
                elif event.get('symbol') == lagging_symbol:
                    follower_bias += notional * direction
            whale_alignment["leader_bias"] = leader_bias
            whale_alignment["follower_bias"] = follower_bias
            whale_alignment["events"] = len(whale_events)
            whale_alignment["same_direction"] = (leader_bias * follower_bias) > 0
            magnitude = min(1.0, (abs(leader_bias) + abs(follower_bias)) / 1_000_000.0)
            direction_component = 0.5
            if leader_bias != 0.0 and follower_bias != 0.0:
                direction_component = 0.5 + 0.5 * np.sign(leader_bias * follower_bias)
            whale_alignment["score"] = float(max(0.0, min(1.0, direction_component * magnitude)))
        except Exception as exc:
            whale_alignment["error"] = str(exc)

        # Granger causality p-values (directional predictability)
        def safe_granger(y, x, maxlag):
            try:
                data = np.column_stack([y.values, x.values])
                res = grangercausalitytests(data, maxlag=maxlag, verbose=False)
                pvals = [res[L][0]['ssr_ftest'][1] for L in res]
                return float(np.nanmin(pvals))
            except Exception:
                return None

        max_granger_lag = min(5, max(1, max_lag))
        p_follower_causes_leader = safe_granger(follow_aligned, lead_aligned, max_granger_lag)
        p_leader_causes_follower = safe_granger(lead_aligned, follow_aligned, max_granger_lag)

        best_abs_corr = float(best_val if best_val is not None else 0.0)

        return {
            "symbol1": symbol1,
            "symbol2": symbol2,
            "interval": interval,
            "lags": lags,
            "xcorr": xcorr,
            "best_lag": int(best_lag),
            "best_abs_corr": best_abs_corr,
            "cross_correlation": best_abs_corr,
            "leader_symbol": leader_symbol,
            "follower_symbol": lagging_symbol,
            "lag_bars": lag_bars,
            "lag_minutes": lag_minutes,
            "lag_seconds": lag_seconds,
            "sample_size": len(lead_aligned),
            "hit_rate": hit_rate,
            "move_projection": move_projection,
            "shock_response": shock_response,
            "whale_alignment": whale_alignment,
            "lag_std": None,
            "profit_factor": None,
            "sharpe_ratio": None,
            "granger_p_value_follower_causes_leader": p_follower_causes_leader,
            "granger_p_value_leader_causes_follower": p_leader_causes_follower,
        }

    async def compute_sentiment(self, symbol: str, interval: str = "15m", window_size: int = 200) -> Dict[str, Any]:
        """Compute simple RSI & momentum for sentiment classification."""
        df = await self._get_price_data([symbol], interval, window_size)
        if df.empty or symbol not in df.columns:
            return {"symbol": symbol, "interval": interval, "sentiment": "unknown"}
        closes = df[symbol].dropna()
        if len(closes) < 20:
            return {"symbol": symbol, "interval": interval, "sentiment": "unknown"}
        # RSI(14)
        delta = closes.diff().dropna()
        up = delta.clip(lower=0)
        down = -delta.clip(upper=0)
        roll_up = up.rolling(14).mean()
        roll_down = down.rolling(14).mean()
        rs = roll_up / (roll_down + 1e-9)
        rsi = 100 - (100 / (1 + rs))
        latest_rsi = float(rsi.iloc[-1]) if len(rsi) else None
        # Momentum: last close vs 20-period SMA
        sma20 = closes.rolling(20).mean()
        mom = float((closes.iloc[-1] - sma20.iloc[-1]) / (sma20.iloc[-1] + 1e-9)) if sma20.iloc[-1] else 0.0
        sentiment = "bullish" if (latest_rsi and latest_rsi > 55) or mom > 0 else ("bearish" if (latest_rsi and latest_rsi < 45) or mom < 0 else "neutral")
        return {"symbol": symbol, "interval": interval, "rsi": latest_rsi, "momentum": mom, "sentiment": sentiment}

    async def entry_suggestion(self, symbol: str, risk: str = 'default', budget: float | None = None, interval: str = '15m') -> Dict[str, Any]:
        """Heuristic entry suggestion with probability, SL/TP, timeframe.
        Returns status 'unavailable' if confidence < 0.8.
        """
        # Sentiment
        sent = await self.compute_sentiment(symbol, interval=interval, window_size=300)
        # Recent momentum (last 20 bars)
        df = await self._get_price_data([symbol], interval, 200)
        if df.empty or symbol not in df.columns:
            return {"status": "unavailable", "reason": "insufficient_data"}
        closes = df[symbol].dropna()
        if len(closes) < 40:
            return {"status": "unavailable", "reason": "insufficient_data"}
        ret20 = float((closes.iloc[-1] - closes.iloc[-20]) / (closes.iloc[-20] + 1e-9))
        vol = float(closes.pct_change().rolling(20).std().iloc[-1] or 0)
        # Orderbook imbalance
        from services.orderbook_metrics import compute_imbalance
        from core.database import AsyncSession as _Async
        # Note: we need a session for compute_imbalance; reuse self.db
        ob = await compute_imbalance(self.db, symbol, 'binance', [0.001])
        imb = 0.0
        if ob and ob.get('bands'):
            imb = float(ob['bands'][0]['imbalance'] or 0)
        # Score features
        rsi = sent.get('rsi') or 50
        mom = sent.get('momentum') or 0
        # Simple probability model
        score = 0.0
        score += (rsi - 50) / 100.0  # [-0.5, +0.5]
        score += mom  # around [-?, +?]
        score += imb * 0.5
        score += ret20 * 0.5
        # Normalize crude score to [0,1]
        prob = max(0.0, min(1.0, 0.5 + score))
        # Direction
        direction = 'long' if prob >= 0.5 else 'short'
        # Risk tuning
        risk = risk.lower() if isinstance(risk, str) else 'default'
        if risk == 'low':
            sl = 0.005; tp = 0.01; tf = 30
        elif risk == 'high':
            sl = 0.015; tp = 0.03; tf = 45
        else:
            sl = 0.01; tp = 0.02; tf = 30
        # Require strong confidence
        if prob < 0.8:
            return {
                "status": "unavailable",
                "symbol": symbol,
                "probability": round(prob, 3),
                "reason": "confidence_below_threshold",
                "threshold": 0.8
            }
        suggestion = {
            "status": "ok",
            "symbol": symbol,
            "interval": interval,
            "direction": direction,
            "probability": round(prob, 3),
            "stop_loss_pct": sl,
            "take_profit_pct": tp,
            "timeframe_minutes": tf,
            "features": {
                "rsi": rsi,
                "momentum": mom,
                "imbalance": imb,
                "ret20": ret20,
                "volatility": vol,
            }
        }
        if budget is not None:
            suggestion["budget"] = budget
            # crude expected pnl: tp * budget * probability - sl * budget * (1-prob)
            exp_pnl = tp * budget * prob - sl * budget * (1 - prob)
            suggestion["expected_pnl"] = round(exp_pnl, 2)
        return suggestion

    async def cointegration_scan(
        self,
        symbols: List[str],
        interval: str = "1h",
        window_size: int = 1500,
        pvalue_threshold: float = 0.05,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        """Pairwise Engle–Granger cointegration scan across symbols."""
        df = await self._get_price_data(symbols, interval, window_size)
        if df.empty:
            return []
        df = df.dropna()
        cols = [c for c in df.columns if c in symbols]
        out: List[Dict[str, Any]] = []
        for i in range(len(cols)):
            for j in range(i + 1, len(cols)):
                s1, s2 = cols[i], cols[j]
                x = df[s1].values
                y = df[s2].values
                if len(x) < 50 or len(y) < 50:
                    continue
                try:
                    score, pval, _ = coint(x, y)
                    if pval is not None and pval <= pvalue_threshold:
                        # hedge ratio via simple OLS slope
                        # y ≈ a + b*x => hedge x with ratio b against y
                        b = float(np.polyfit(x, y, 1)[0])
                        out.append({
                            "symbol1": s1,
                            "symbol2": s2,
                            "p_value": float(pval),
                            "score": float(score),
                            "hedge_ratio": b,
                        })
                except Exception:
                    continue
        out.sort(key=lambda d: d["p_value"])
        return out[:limit]
