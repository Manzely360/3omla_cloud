"""
Backtesting API endpoints for strategy testing and validation
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import structlog

from core.database import get_db
from services.backtesting import BacktestingService
from schemas.backtesting import (
    BacktestRequest,
    BacktestResponse,
    BacktestTrade,
    BacktestMetrics,
    StrategyConfig
)

logger = structlog.get_logger()
router = APIRouter()


@router.post("/run", response_model=BacktestResponse)
async def run_backtest(
    backtest_request: BacktestRequest,
    db: AsyncSession = Depends(get_db)
):
    """Run a comprehensive backtest"""
    try:
        backtesting_service = BacktestingService(db)
        result = await backtesting_service.run_backtest(backtest_request)
        return result
    except Exception as e:
        logger.error("Failed to run backtest", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/strategies", response_model=List[StrategyConfig])
async def get_available_strategies(
    db: AsyncSession = Depends(get_db)
):
    """Get available trading strategies"""
    try:
        backtesting_service = BacktestingService(db)
        result = await backtesting_service.get_available_strategies()
        return result
    except Exception as e:
        logger.error("Failed to get available strategies", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/results", response_model=List[BacktestResponse])
async def get_backtest_results(
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    strategy_name: Optional[str] = Query(None, description="Filter by strategy name"),
    start_date: Optional[datetime] = Query(None, description="Filter by start date"),
    end_date: Optional[datetime] = Query(None, description="Filter by end date"),
    min_sharpe: Optional[float] = Query(None, description="Minimum Sharpe ratio"),
    limit: int = Query(50, description="Maximum number of results"),
    db: AsyncSession = Depends(get_db)
):
    """Get backtest results with filters"""
    try:
        backtesting_service = BacktestingService(db)
        result = await backtesting_service.get_backtest_results(
            user_id=user_id,
            strategy_name=strategy_name,
            start_date=start_date,
            end_date=end_date,
            min_sharpe=min_sharpe,
            limit=limit
        )
        return result
    except Exception as e:
        logger.error("Failed to get backtest results", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/results/{backtest_id}", response_model=BacktestResponse)
async def get_backtest_result(
    backtest_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get specific backtest result"""
    try:
        backtesting_service = BacktestingService(db)
        result = await backtesting_service.get_backtest_result(backtest_id)
        if not result:
            raise HTTPException(status_code=404, detail="Backtest not found")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get backtest result", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/results/{backtest_id}/trades", response_model=List[BacktestTrade])
async def get_backtest_trades(
    backtest_id: str,
    start_date: Optional[datetime] = Query(None, description="Filter by start date"),
    end_date: Optional[datetime] = Query(None, description="Filter by end date"),
    symbol: Optional[str] = Query(None, description="Filter by symbol"),
    limit: int = Query(1000, description="Maximum number of trades"),
    db: AsyncSession = Depends(get_db)
):
    """Get individual trades from a backtest"""
    try:
        backtesting_service = BacktestingService(db)
        result = await backtesting_service.get_backtest_trades(
            backtest_id=backtest_id,
            start_date=start_date,
            end_date=end_date,
            symbol=symbol,
            limit=limit
        )
        return result
    except Exception as e:
        logger.error("Failed to get backtest trades", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/results/{backtest_id}/metrics", response_model=BacktestMetrics)
async def get_backtest_metrics(
    backtest_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get detailed metrics for a backtest"""
    try:
        backtesting_service = BacktestingService(db)
        result = await backtesting_service.get_backtest_metrics(backtest_id)
        if not result:
            raise HTTPException(status_code=404, detail="Backtest not found")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get backtest metrics", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/results/{backtest_id}/equity-curve")
async def get_equity_curve(
    backtest_id: str,
    interval: str = Query("1h", description="Data interval"),
    db: AsyncSession = Depends(get_db)
):
    """Get equity curve data for a backtest"""
    try:
        backtesting_service = BacktestingService(db)
        result = await backtesting_service.get_equity_curve(
            backtest_id=backtest_id,
            interval=interval
        )
        return result
    except Exception as e:
        logger.error("Failed to get equity curve", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/results/{backtest_id}/drawdown")
async def get_drawdown_analysis(
    backtest_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get drawdown analysis for a backtest"""
    try:
        backtesting_service = BacktestingService(db)
        result = await backtesting_service.get_drawdown_analysis(backtest_id)
        return result
    except Exception as e:
        logger.error("Failed to get drawdown analysis", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/results/{backtest_id}/monthly-returns")
async def get_monthly_returns(
    backtest_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get monthly returns breakdown for a backtest"""
    try:
        backtesting_service = BacktestingService(db)
        result = await backtesting_service.get_monthly_returns(backtest_id)
        return result
    except Exception as e:
        logger.error("Failed to get monthly returns", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/optimize")
async def optimize_strategy(
    strategy_config: StrategyConfig,
    optimization_params: Dict[str, Any] = Body(...),
    db: AsyncSession = Depends(get_db)
):
    """Run strategy optimization"""
    try:
        backtesting_service = BacktestingService(db)
        result = await backtesting_service.optimize_strategy(
            strategy_config=strategy_config,
            optimization_params=optimization_params
        )
        return result
    except Exception as e:
        logger.error("Failed to optimize strategy", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/walk-forward")
async def run_walk_forward_analysis(
    strategy_config: StrategyConfig,
    walk_forward_params: Dict[str, Any] = Body(...),
    db: AsyncSession = Depends(get_db)
):
    """Run walk-forward analysis"""
    try:
        backtesting_service = BacktestingService(db)
        result = await backtesting_service.run_walk_forward_analysis(
            strategy_config=strategy_config,
            walk_forward_params=walk_forward_params
        )
        return result
    except Exception as e:
        logger.error("Failed to run walk-forward analysis", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/monte-carlo")
async def run_monte_carlo_simulation(
    backtest_id: str,
    num_simulations: int = Query(1000, description="Number of simulations"),
    confidence_level: float = Query(0.95, description="Confidence level"),
    db: AsyncSession = Depends(get_db)
):
    """Run Monte Carlo simulation on backtest results"""
    try:
        backtesting_service = BacktestingService(db)
        result = await backtesting_service.run_monte_carlo_simulation(
            backtest_id=backtest_id,
            num_simulations=num_simulations,
            confidence_level=confidence_level
        )
        return result
    except Exception as e:
        logger.error("Failed to run Monte Carlo simulation", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/results/{backtest_id}")
async def delete_backtest(
    backtest_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Delete a backtest result"""
    try:
        backtesting_service = BacktestingService(db)
        await backtesting_service.delete_backtest(backtest_id)
        return {"message": "Backtest deleted successfully"}
    except Exception as e:
        logger.error("Failed to delete backtest", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))
