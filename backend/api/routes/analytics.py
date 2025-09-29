"""
Analytics API endpoints for correlation, lead-lag, and clustering analysis
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import structlog

from core.database import get_db
from services.analytics import AnalyticsService
from services.patterns import detect_patterns
from services.market_data import MarketDataService
from services.fast_analytics import fast_correlation, fast_lead_lag
from services.correlation_engine import run_correlation_cycle
from schemas.analytics import (
    CorrelationMatrixResponse,
    LeadLagResponse,
    ClusterResponse,
    MarketRegimeResponse,
    SpreadZScoreResponse
)

logger = structlog.get_logger()
router = APIRouter()


@router.get("/correlation-matrix", response_model=Dict[str, Any])
async def get_correlation_matrix(
    symbols: List[str] = Query(..., description="List of symbols to analyze"),
    interval: str = Query("15m", description="Time interval"),
    window_size: int = Query(100, description="Rolling window size"),
    correlation_type: str = Query("pearson", description="Correlation type: pearson, spearman, kendall"),
    db: AsyncSession = Depends(get_db)
):
    """Get correlation matrix for specified symbols"""
    try:
        analytics_service = AnalyticsService(db)
        result = await analytics_service.get_correlation_matrix(
            symbols=symbols,
            interval=interval,
            window_size=window_size,
            correlation_type=correlation_type
        )
        return result
    except Exception as e:
        logger.error("Failed to get correlation matrix", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/correlation/live")
async def live_correlation(
    symbols: Optional[List[str]] = Query(None, description="Optional set of symbols"),
    intervals: Optional[str] = Query(None, description="Comma-separated intervals (default 5m,15m,30m)"),
    refresh: bool = Query(True, description="Recompute correlations before returning results"),
    min_hit_rate: float = Query(0.0, description="Minimum hit rate filter"),
    limit: int = Query(100, description="Maximum number of rows"),
    db: AsyncSession = Depends(get_db)
):
    try:
        analytics_service = AnalyticsService(db)
        universe = [sym.upper() for sym in symbols] if symbols else await analytics_service.get_symbol_universe(limit=12)
        interval_list = [item.strip() for item in intervals.split(',')] if intervals else ['5m', '15m', '30m']
        interval_list = [i for i in interval_list if i]
        if not interval_list:
            interval_list = ['5m', '15m', '30m']

        if refresh:
            await run_correlation_cycle(db, symbols=universe, intervals=interval_list)

        interval_filter = interval_list[0] if len(interval_list) == 1 else None
        records = await analytics_service.get_live_correlations(
            symbols=universe,
            interval=interval_filter,
            min_hit_rate=min_hit_rate,
            limit=limit
        )
        return {
            "generated_at": datetime.utcnow().isoformat(),
            "universe": universe,
            "intervals": interval_list,
            "results": records
        }
    except Exception as e:
        logger.error("Failed to compute live correlation", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/lead-lag", response_model=List[LeadLagResponse])
async def get_lead_lag_relationships(
    symbol: Optional[str] = Query(None, description="Specific symbol to analyze"),
    min_hit_rate: float = Query(0.6, description="Minimum hit rate threshold"),
    min_correlation: float = Query(0.3, description="Minimum correlation threshold"),
    interval: str = Query("15m", description="Time interval"),
    limit: int = Query(50, description="Maximum number of results"),
    db: AsyncSession = Depends(get_db)
):
    """Get lead-lag relationships between symbols"""
    try:
        analytics_service = AnalyticsService(db)
        result = await analytics_service.get_lead_lag_relationships(
            symbol=symbol,
            min_hit_rate=min_hit_rate,
            min_correlation=min_correlation,
            interval=interval,
            limit=limit
        )
        return result
    except Exception as e:
        logger.error("Failed to get lead-lag relationships", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/patterns")
async def get_candlestick_patterns(
    symbol: str = Query(...),
    interval: str = Query("15m"),
    limit: int = Query(200),
    db: AsyncSession = Depends(get_db)
):
    """Detect basic candlestick patterns for a symbol/interval."""
    try:
        md = MarketDataService(db)
        kl = await md.get_klines(symbol=symbol, interval=interval, limit=limit)
        pats = detect_patterns([
            {
                'open_price': k['open_price'],
                'high_price': k['high_price'],
                'low_price': k['low_price'],
                'close_price': k['close_price'],
                'open_time': k['open_time'],
                'close_time': k['close_time'],
            } for k in kl
        ])
        return {"symbol": symbol, "interval": interval, "patterns": pats}
    except Exception as e:
        logger.error("Failed to get patterns", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/lead-lag-metrics")
async def lead_lag_metrics(
    symbol1: str = Query(...),
    symbol2: str = Query(...),
    interval: str = Query("15m"),
    max_lag: int = Query(20),
    db: AsyncSession = Depends(get_db)
):
    try:
        analytics_service = AnalyticsService(db)
        res = await analytics_service.compute_lead_lag_metrics(symbol1, symbol2, interval, max_lag)
        return res
    except Exception as e:
        logger.error("Failed to compute lead-lag metrics", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/cointegration-scan")
async def cointegration_scan(
    symbols: List[str] = Query(...),
    interval: str = Query("1h"),
    pvalue_threshold: float = Query(0.05),
    limit: int = Query(50),
    db: AsyncSession = Depends(get_db)
):
    try:
        analytics_service = AnalyticsService(db)
        res = await analytics_service.cointegration_scan(symbols, interval=interval, pvalue_threshold=pvalue_threshold, limit=limit)
        return res
    except Exception as e:
        logger.error("Failed to run cointegration scan", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sentiment")
async def sentiment(
    symbol: str = Query(...),
    interval: str = Query("15m"),
    db: AsyncSession = Depends(get_db)
):
    try:
        analytics_service = AnalyticsService(db)
        return await analytics_service.compute_sentiment(symbol, interval=interval)
    except Exception as e:
        logger.error("Failed to compute sentiment", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/live-leadlag")
async def live_leadlag(
    symbols: Optional[List[str]] = Query(None, description="Symbols to evaluate; use 'auto' for dynamic selection"),
    interval: str = Query("15m"),
    intervals: Optional[str] = Query(None, description="Comma-separated intervals (e.g. 1m,5m,15m)"),
    max_lag: int = Query(10),
    limit: int = Query(20),
    db: AsyncSession = Depends(get_db)
):
    try:
        analytics_service = AnalyticsService(db)

        interval_list = [interval]
        if intervals:
            interval_list = [item.strip() for item in intervals.split(',') if item.strip()]
            if not interval_list:
                interval_list = [interval]

        requested_symbols: List[str] = []
        if symbols:
            for sym in symbols:
                if sym is None:
                    continue
                if sym.lower() == 'auto':
                    continue
                requested_symbols.append(sym.upper())
        if not requested_symbols:
            requested_symbols = await analytics_service.get_symbol_universe(limit=12)

        # Deduplicate and keep manageable universe
        unique_symbols = []
        seen = set()
        for sym in requested_symbols:
            if sym in seen:
                continue
            seen.add(sym)
            unique_symbols.append(sym)

        # Cap combinations to avoid explosion
        if len(unique_symbols) > 16:
            unique_symbols = unique_symbols[:16]

        pairs: List[Dict[str, Any]] = []
        for current_interval in interval_list:
            for i in range(len(unique_symbols)):
                for j in range(i + 1, len(unique_symbols)):
                    s1, s2 = unique_symbols[i], unique_symbols[j]
                    metrics = await analytics_service.compute_lead_lag_metrics(s1, s2, current_interval, max_lag)
                    if not metrics:
                        continue
                    if metrics.get('best_lag') is None or not metrics.get('best_abs_corr'):
                        continue
                    metrics['interval'] = current_interval
                    pairs.append(metrics)

        def pair_score(item: Dict[str, Any]) -> float:
            corr = item.get('best_abs_corr') or 0.0
            hit = item.get('hit_rate') or 0.0
            whale = item.get('whale_alignment', {}).get('score', 0.0) if isinstance(item.get('whale_alignment'), dict) else 0.0
            return (corr * 0.5) + (hit * 0.4) + (whale * 0.1)

        pairs.sort(key=pair_score, reverse=True)
        return pairs[:limit]
    except Exception as e:
        logger.error("Failed to compute live lead-lag", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/rolling-beta")
async def rolling_beta(
    symbols: List[str] = Query(..., description="Symbols to compute beta for"),
    benchmark: str = Query("BTCUSDT"),
    interval: str = Query("15m"),
    window: int = Query(200, ge=50, le=2000),
    db: AsyncSession = Depends(get_db)
):
    try:
        analytics_service = AnalyticsService(db)
        res = await analytics_service.rolling_beta(symbols, benchmark=benchmark, interval=interval, window=window)
        return res
    except Exception as e:
        logger.error("Failed to compute rolling beta", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/fast-correlation")
async def fast_correlation_endpoint(
    symbols: List[str] = Query(..., description="Symbols for fast correlation (e.g., BTCUSDT,ETHUSDT)"),
    window_secs: int = Query(300, ge=30, le=3600),
):
    try:
        return await fast_correlation(symbols, window_secs=window_secs)
    except Exception as e:
        logger.error("Failed fast correlation", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/fast-leadlag")
async def fast_leadlag_endpoint(
    symbol1: str = Query(...),
    symbol2: str = Query(...),
    window_secs: int = Query(600, ge=60, le=7200),
    max_lag_secs: int = Query(60, ge=1, le=600),
):
    try:
        return await fast_lead_lag(symbol1, symbol2, window_secs=window_secs, max_lag_secs=max_lag_secs)
    except Exception as e:
        logger.error("Failed fast lead-lag", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/screener")
async def screener(
    symbols: Optional[List[str]] = Query(None),
    interval: str = Query("15m"),
    limit: int = Query(12, ge=1, le=50),
    risk_budget: Optional[float] = Query(None, description="Approximate USD risk budget per idea for sizing"),
    db: AsyncSession = Depends(get_db)
):
    try:
        analytics_service = AnalyticsService(db)
        res = await analytics_service.screener(symbols=symbols, interval=interval, limit=limit, risk_budget=risk_budget)
        return res
    except Exception as e:
        logger.error("Failed to build screener", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/clusters", response_model=List[ClusterResponse])
async def get_clusters(
    algorithm: str = Query("spectral", description="Clustering algorithm"),
    interval: str = Query("1h", description="Time interval"),
    min_cluster_size: int = Query(3, description="Minimum cluster size"),
    db: AsyncSession = Depends(get_db)
):
    """Get asset clusters using specified algorithm"""
    try:
        analytics_service = AnalyticsService(db)
        result = await analytics_service.get_clusters(
            algorithm=algorithm,
            interval=interval,
            min_cluster_size=min_cluster_size
        )
        return result
    except Exception as e:
        logger.error("Failed to get clusters", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/market-regime", response_model=MarketRegimeResponse)
async def get_current_market_regime(
    exchange: str = Query("binance", description="Exchange"),
    interval: str = Query("1h", description="Time interval"),
    db: AsyncSession = Depends(get_db)
):
    """Get current market regime classification"""
    try:
        analytics_service = AnalyticsService(db)
        result = await analytics_service.get_current_market_regime(
            exchange=exchange,
            interval=interval
        )
        return result
    except Exception as e:
        logger.error("Failed to get market regime", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/spread-zscores", response_model=List[SpreadZScoreResponse])
async def get_spread_z_scores(
    symbols: Optional[List[str]] = Query(None, description="Specific symbol pairs"),
    min_z_score: float = Query(2.0, description="Minimum absolute z-score"),
    interval: str = Query("15m", description="Time interval"),
    limit: int = Query(20, description="Maximum number of results"),
    db: AsyncSession = Depends(get_db)
):
    """Get spread z-scores for cointegrated pairs"""
    try:
        analytics_service = AnalyticsService(db)
        result = await analytics_service.get_spread_z_scores(
            symbols=symbols,
            min_z_score=min_z_score,
            interval=interval,
            limit=limit
        )
        return result
    except Exception as e:
        logger.error("Failed to get spread z-scores", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/similar-assets")
async def get_similar_assets(
    symbol: str = Query(..., description="Base symbol to find similar assets for"),
    correlation_threshold: float = Query(0.7, description="Minimum correlation threshold"),
    interval: str = Query("1h", description="Time interval"),
    limit: int = Query(10, description="Maximum number of results"),
    db: AsyncSession = Depends(get_db)
):
    """Get assets similar to the specified symbol"""
    try:
        analytics_service = AnalyticsService(db)
        result = await analytics_service.get_similar_assets(
            symbol=symbol,
            correlation_threshold=correlation_threshold,
            interval=interval,
            limit=limit
        )
        return result
    except Exception as e:
        logger.error("Failed to get similar assets", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/opposite-assets")
async def get_opposite_assets(
    symbol: str = Query(..., description="Base symbol to find opposite assets for"),
    correlation_threshold: float = Query(-0.7, description="Maximum correlation threshold (negative)"),
    interval: str = Query("1h", description="Time interval"),
    limit: int = Query(10, description="Maximum number of results"),
    db: AsyncSession = Depends(get_db)
):
    """Get assets with opposite movements to the specified symbol"""
    try:
        analytics_service = AnalyticsService(db)
        result = await analytics_service.get_opposite_assets(
            symbol=symbol,
            correlation_threshold=correlation_threshold,
            interval=interval,
            limit=limit
        )
        return result
    except Exception as e:
        logger.error("Failed to get opposite assets", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/compute-correlations")
async def compute_correlations(
    symbols: List[str],
    intervals: List[str] = ["5m", "15m", "1h", "4h"],
    correlation_types: List[str] = ["pearson", "spearman"],
    window_sizes: List[int] = [50, 100, 200],
    db: AsyncSession = Depends(get_db)
):
    """Trigger correlation computation for specified symbols and parameters"""
    try:
        analytics_service = AnalyticsService(db)
        task_id = await analytics_service.compute_correlations_async(
            symbols=symbols,
            intervals=intervals,
            correlation_types=correlation_types,
            window_sizes=window_sizes
        )
        return {"task_id": task_id, "status": "started"}
    except Exception as e:
        logger.error("Failed to start correlation computation", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/compute-lead-lag")
async def compute_lead_lag(
    symbol_pairs: List[Dict[str, str]],
    intervals: List[str] = ["5m", "15m", "1h"],
    max_lag: int = 60,
    db: AsyncSession = Depends(get_db)
):
    """Trigger lead-lag computation for specified symbol pairs"""
    try:
        analytics_service = AnalyticsService(db)
        task_id = await analytics_service.compute_lead_lag_async(
            symbol_pairs=symbol_pairs,
            intervals=intervals,
            max_lag=max_lag
        )
        return {"task_id": task_id, "status": "started"}
    except Exception as e:
        logger.error("Failed to start lead-lag computation", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/entry-suggestion")
async def entry_suggestion(
    symbol: str = Query(...),
    risk: str = Query('default'),
    budget: float = Query(None),
    interval: str = Query('15m'),
    db: AsyncSession = Depends(get_db)
):
    try:
        analytics_service = AnalyticsService(db)
        return await analytics_service.entry_suggestion(symbol, risk=risk, budget=budget, interval=interval)
    except Exception as e:
        logger.error("Failed to compute entry suggestion", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))
