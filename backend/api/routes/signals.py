"""
Signals API endpoints for trading signals and alerts
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import structlog

from core.database import get_db
from services.signals import SignalService
from schemas.signals import (
    SignalResponse,
    AlertCreate,
    AlertResponse,
    AlertTriggerResponse,
    BacktestRequest,
    BacktestResponse
)

logger = structlog.get_logger()
router = APIRouter()


@router.get("/active", response_model=List[SignalResponse])
async def get_active_signals(
    signal_type: Optional[str] = Query(None, description="Filter by signal type"),
    symbol: Optional[str] = Query(None, description="Filter by symbol"),
    min_strength: float = Query(0.5, description="Minimum signal strength"),
    min_confidence: float = Query(0.6, description="Minimum confidence level"),
    limit: int = Query(50, description="Maximum number of results"),
    db: AsyncSession = Depends(get_db)
):
    """Get active trading signals"""
    try:
        signal_service = SignalService(db)
        result = await signal_service.get_active_signals(
            signal_type=signal_type,
            symbol=symbol,
            min_strength=min_strength,
            min_confidence=min_confidence,
            limit=limit
        )
        return result
    except Exception as e:
        logger.error("Failed to get active signals", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/lead-lag-signals", response_model=List[SignalResponse])
async def get_lead_lag_signals(
    leader_symbol: Optional[str] = Query(None, description="Filter by leader symbol"),
    follower_symbol: Optional[str] = Query(None, description="Filter by follower symbol"),
    min_hit_rate: float = Query(0.6, description="Minimum historical hit rate"),
    min_lag_minutes: int = Query(1, description="Minimum lag in minutes"),
    max_lag_minutes: int = Query(30, description="Maximum lag in minutes"),
    limit: int = Query(20, description="Maximum number of results"),
    db: AsyncSession = Depends(get_db)
):
    """Get lead-lag trading signals"""
    try:
        signal_service = SignalService(db)
        result = await signal_service.get_lead_lag_signals(
            leader_symbol=leader_symbol,
            follower_symbol=follower_symbol,
            min_hit_rate=min_hit_rate,
            min_lag_minutes=min_lag_minutes,
            max_lag_minutes=max_lag_minutes,
            limit=limit
        )
        return result
    except Exception as e:
        logger.error("Failed to get lead-lag signals", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/opposite-move-signals", response_model=List[SignalResponse])
async def get_opposite_move_signals(
    primary_symbol: Optional[str] = Query(None, description="Filter by primary symbol"),
    min_correlation: float = Query(-0.7, description="Minimum negative correlation"),
    min_strength: float = Query(0.5, description="Minimum signal strength"),
    limit: int = Query(20, description="Maximum number of results"),
    db: AsyncSession = Depends(get_db)
):
    """Get opposite move trading signals"""
    try:
        signal_service = SignalService(db)
        result = await signal_service.get_opposite_move_signals(
            primary_symbol=primary_symbol,
            min_correlation=min_correlation,
            min_strength=min_strength,
            limit=limit
        )
        return result
    except Exception as e:
        logger.error("Failed to get opposite move signals", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/breakout-signals", response_model=List[SignalResponse])
async def get_breakout_signals(
    symbol: Optional[str] = Query(None, description="Filter by symbol"),
    direction: Optional[str] = Query(None, description="Filter by direction: breakout, breakdown"),
    min_volume_ratio: float = Query(1.5, description="Minimum volume ratio"),
    limit: int = Query(20, description="Maximum number of results"),
    db: AsyncSession = Depends(get_db)
):
    """Get breakout/breakdown signals"""
    try:
        signal_service = SignalService(db)
        result = await signal_service.get_breakout_signals(
            symbol=symbol,
            direction=direction,
            min_volume_ratio=min_volume_ratio,
            limit=limit
        )
        return result
    except Exception as e:
        logger.error("Failed to get breakout signals", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/mean-reversion-signals", response_model=List[SignalResponse])
async def get_mean_reversion_signals(
    symbol_pairs: Optional[List[str]] = Query(None, description="Filter by symbol pairs"),
    min_z_score: float = Query(2.0, description="Minimum absolute z-score"),
    max_half_life: int = Query(60, description="Maximum half-life in minutes"),
    limit: int = Query(20, description="Maximum number of results"),
    db: AsyncSession = Depends(get_db)
):
    """Get mean reversion signals for cointegrated pairs"""
    try:
        signal_service = SignalService(db)
        result = await signal_service.get_mean_reversion_signals(
            symbol_pairs=symbol_pairs,
            min_z_score=min_z_score,
            max_half_life=max_half_life,
            limit=limit
        )
        return result
    except Exception as e:
        logger.error("Failed to get mean reversion signals", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/alerts", response_model=AlertResponse)
async def create_alert(
    alert_data: AlertCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new alert"""
    try:
        signal_service = SignalService(db)
        result = await signal_service.create_alert(alert_data)
        return result
    except Exception as e:
        logger.error("Failed to create alert", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/alerts", response_model=List[AlertResponse])
async def get_user_alerts(
    user_id: str = Query(..., description="User ID"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    alert_type: Optional[str] = Query(None, description="Filter by alert type"),
    db: AsyncSession = Depends(get_db)
):
    """Get user's alerts"""
    try:
        signal_service = SignalService(db)
        result = await signal_service.get_user_alerts(
            user_id=user_id,
            is_active=is_active,
            alert_type=alert_type
        )
        return result
    except Exception as e:
        logger.error("Failed to get user alerts", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/alerts/{alert_id}", response_model=AlertResponse)
async def update_alert(
    alert_id: str,
    alert_data: Dict[str, Any] = Body(...),
    db: AsyncSession = Depends(get_db)
):
    """Update an existing alert"""
    try:
        signal_service = SignalService(db)
        result = await signal_service.update_alert(alert_id, alert_data)
        return result
    except Exception as e:
        logger.error("Failed to update alert", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/alerts/{alert_id}")
async def delete_alert(
    alert_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Delete an alert"""
    try:
        signal_service = SignalService(db)
        await signal_service.delete_alert(alert_id)
        return {"message": "Alert deleted successfully"}
    except Exception as e:
        logger.error("Failed to delete alert", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/alerts/{alert_id}/triggers", response_model=List[AlertTriggerResponse])
async def get_alert_triggers(
    alert_id: str,
    start_date: Optional[datetime] = Query(None, description="Start date filter"),
    end_date: Optional[datetime] = Query(None, description="End date filter"),
    limit: int = Query(50, description="Maximum number of results"),
    db: AsyncSession = Depends(get_db)
):
    """Get alert trigger history"""
    try:
        signal_service = SignalService(db)
        result = await signal_service.get_alert_triggers(
            alert_id=alert_id,
            start_date=start_date,
            end_date=end_date,
            limit=limit
        )
        return result
    except Exception as e:
        logger.error("Failed to get alert triggers", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/backtest", response_model=BacktestResponse)
async def run_backtest(
    backtest_request: BacktestRequest,
    db: AsyncSession = Depends(get_db)
):
    """Run a backtest for a trading strategy"""
    try:
        signal_service = SignalService(db)
        result = await signal_service.run_backtest(backtest_request)
        return result
    except Exception as e:
        logger.error("Failed to run backtest", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/backtest/{backtest_id}", response_model=BacktestResponse)
async def get_backtest_result(
    backtest_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get backtest results"""
    try:
        signal_service = SignalService(db)
        result = await signal_service.get_backtest_result(backtest_id)
        return result
    except Exception as e:
        logger.error("Failed to get backtest result", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/backtest/{backtest_id}/trades")
async def get_backtest_trades(
    backtest_id: str,
    limit: int = Query(100, description="Maximum number of trades"),
    db: AsyncSession = Depends(get_db)
):
    """Get individual trades from a backtest"""
    try:
        signal_service = SignalService(db)
        result = await signal_service.get_backtest_trades(backtest_id, limit)
        return result
    except Exception as e:
        logger.error("Failed to get backtest trades", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/signals/{signal_id}/execute")
async def execute_signal(
    signal_id: str,
    execution_params: Dict[str, Any] = Body(...),
    db: AsyncSession = Depends(get_db)
):
    """Execute a trading signal (paper trading)"""
    try:
        signal_service = SignalService(db)
        result = await signal_service.execute_signal(signal_id, execution_params)
        return result
    except Exception as e:
        logger.error("Failed to execute signal", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))
