"""
Market data API endpoints for price, volume, and order book data
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import structlog

from core.database import get_db
from services.market_data import MarketDataService
from services.orderbook_metrics import compute_imbalance
from services.ultra_price_oracle import ultra_oracle
from schemas.market_data import (
    KlineResponse,
    TradeResponse,
    OrderBookResponse,
    SymbolResponse,
    MarketMetricsResponse
)

logger = structlog.get_logger()
router = APIRouter()


@router.get("/symbols", response_model=List[SymbolResponse])
async def get_symbols(
    exchange: str = Query("binance", description="Exchange name"),
    is_active: bool = Query(True, description="Filter by active status"),
    quote_asset: Optional[str] = Query(None, description="Filter by quote asset"),
    limit: int = Query(100, description="Maximum number of results"),
    db: AsyncSession = Depends(get_db)
):
    """Get available trading symbols"""
    try:
        market_data_service = MarketDataService(db)
        result = await market_data_service.get_symbols(
            exchange=exchange,
            is_active=is_active,
            quote_asset=quote_asset,
            limit=limit
        )
        return result
    except Exception as e:
        logger.error("Failed to get symbols", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/klines", response_model=List[KlineResponse])
async def get_klines(
    symbol: str = Query(..., description="Trading symbol"),
    interval: str = Query("15m", description="Time interval"),
    start_time: Optional[datetime] = Query(None, description="Start time"),
    end_time: Optional[datetime] = Query(None, description="End time"),
    limit: int = Query(500, description="Maximum number of klines"),
    db: AsyncSession = Depends(get_db)
):
    """Get OHLCV candlestick data"""
    try:
        market_data_service = MarketDataService(db)
        result = await market_data_service.get_klines(
            symbol=symbol,
            interval=interval,
            start_time=start_time,
            end_time=end_time,
            limit=limit
        )
        return result
    except Exception as e:
        logger.error("Failed to get klines", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/trades", response_model=List[TradeResponse])
async def get_trades(
    symbol: str = Query(..., description="Trading symbol"),
    start_time: Optional[datetime] = Query(None, description="Start time"),
    end_time: Optional[datetime] = Query(None, description="End time"),
    limit: int = Query(1000, description="Maximum number of trades"),
    db: AsyncSession = Depends(get_db)
):
    """Get recent trades"""
    try:
        market_data_service = MarketDataService(db)
        result = await market_data_service.get_trades(
            symbol=symbol,
            start_time=start_time,
            end_time=end_time,
            limit=limit
        )
        return result
    except Exception as e:
        logger.error("Failed to get trades", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/orderbook", response_model=OrderBookResponse)
async def get_orderbook(
    symbol: str = Query(..., description="Trading symbol"),
    depth: int = Query(20, description="Order book depth"),
    db: AsyncSession = Depends(get_db)
):
    """Get current order book"""
    try:
        market_data_service = MarketDataService(db)
        result = await market_data_service.get_orderbook(
            symbol=symbol,
            depth=depth
        )
        return result
    except Exception as e:
        logger.error("Failed to get order book", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/market-metrics", response_model=List[MarketMetricsResponse])
async def get_market_metrics(
    symbols: List[str] = Query(..., description="List of symbols"),
    interval: str = Query("15m", description="Time interval"),
    start_time: Optional[datetime] = Query(None, description="Start time"),
    end_time: Optional[datetime] = Query(None, description="End time"),
    limit: int = Query(100, description="Maximum number of results"),
    db: AsyncSession = Depends(get_db)
):
    """Get market metrics for symbols"""
    try:
        market_data_service = MarketDataService(db)
        result = await market_data_service.get_market_metrics(
            symbols=symbols,
            interval=interval,
            start_time=start_time,
            end_time=end_time,
            limit=limit
        )
        return result
    except Exception as e:
        logger.error("Failed to get market metrics", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/price/{symbol}")
async def get_current_price(
    symbol: str,
    db: AsyncSession = Depends(get_db)
):
    """Get current price for a symbol"""
    try:
        market_data_service = MarketDataService(db)
        result = await market_data_service.get_current_price(symbol)
        return result
    except Exception as e:
        logger.error("Failed to get current price", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/prices")
async def get_current_prices(
    symbols: List[str] = Query(..., description="List of symbols"),
    db: AsyncSession = Depends(get_db)
):
    """Get current prices for multiple symbols"""
    try:
        market_data_service = MarketDataService(db)
        result = await market_data_service.get_current_prices(symbols)
        return result
    except Exception as e:
        logger.error("Failed to get current prices", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/aggregate/price")
async def get_aggregate_price(
    symbol: str = Query(..., description="Trading symbol (e.g., BTCUSDT)"),
    db: AsyncSession = Depends(get_db)
):
    """Get aggregated current price across supported exchanges (Binance, Bybit, KuCoin)."""
    try:
        market_data_service = MarketDataService(db)
        result = await market_data_service.get_aggregated_price(symbol)
        return result
    except Exception as e:
        logger.error("Failed to get aggregated price", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/volume-stats")
async def get_volume_stats(
    symbols: List[str] = Query(..., description="List of symbols"),
    interval: str = Query("1h", description="Time interval"),
    period_hours: int = Query(24, description="Period in hours"),
    db: AsyncSession = Depends(get_db)
):
    """Get volume statistics for symbols"""
    try:
        market_data_service = MarketDataService(db)
        result = await market_data_service.get_volume_stats(
            symbols=symbols,
            interval=interval,
            period_hours=period_hours
        )
        return result
    except Exception as e:
        logger.error("Failed to get volume stats", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/orderbook-imbalance")
async def get_orderbook_imbalance(
    symbols: List[str] = Query(..., description="List of symbols"),
    depth_percent: float = Query(0.1, description="Depth percentage (0.1%, 0.5%, 1.0%)"),
    db: AsyncSession = Depends(get_db)
):
    """Get order book imbalance for symbols"""
    try:
        market_data_service = MarketDataService(db)
        result = await market_data_service.get_orderbook_imbalance(
            symbols=symbols,
            depth_percent=depth_percent
        )
        return result
    except Exception as e:
        logger.error("Failed to get order book imbalance", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/market-overview")
async def get_market_overview(
    exchange: str = Query("binance", description="Exchange name"),
    limit: int = Query(50, description="Number of top symbols"),
    db: AsyncSession = Depends(get_db)
):
    """Get market overview with top symbols by volume"""
    try:
        market_data_service = MarketDataService(db)
        result = await market_data_service.get_market_overview(
            exchange=exchange,
            limit=limit
        )
        return result
    except Exception as e:
        logger.error("Failed to get market overview", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/symbols/unified-search")
async def unified_symbol_search(
    q: str = Query("", description="Search query, e.g., BTC or BTCUSDT"),
    limit: int = Query(20, ge=1, le=200),
    db: AsyncSession = Depends(get_db)
):
    """Unified symbol search across supported spot exchanges (USDT quote)."""
    try:
        market_data_service = MarketDataService(db)
        return await market_data_service.unified_symbol_search(q, limit=limit)
    except Exception as e:
        logger.error("Failed unified symbol search", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/aggregate/compare")
async def compare_exchanges(
    symbol: str = Query(..., description="Unified symbol, e.g., BTCUSDT"),
    db: AsyncSession = Depends(get_db)
):
    """Compare current price of a symbol across exchanges and identify min/max.

    Returns list of exchanges with bid/ask/last and flags cheapest/highest.
    """
    try:
        market_data_service = MarketDataService(db)
        agg = await market_data_service.get_aggregated_price(symbol)
        exchanges = agg.get("exchanges", [])
        if not exchanges:
            return {"symbol": symbol, "exchanges": [], "cheapest": None, "highest": None}
        # determine cheapest/highest by price
        cheapest = min(exchanges, key=lambda e: float(e.get("price") or 0))
        highest = max(exchanges, key=lambda e: float(e.get("price") or 0))
        return {
            "symbol": symbol,
            "exchanges": exchanges,
            "average_price": agg.get("average_price"),
            "cheapest": {"exchange": cheapest.get("name"), "price": cheapest.get("price")},
            "highest": {"exchange": highest.get("name"), "price": highest.get("price")},
        }
    except Exception as e:
        logger.error("Failed to compare exchanges", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/whale-activity")
async def get_whale_activity(
    symbols: Optional[List[str]] = Query(None, description="Filter by symbols"),
    min_trade_size: float = Query(100000, description="Minimum trade size in USD"),
    start_time: Optional[datetime] = Query(None, description="Start time"),
    end_time: Optional[datetime] = Query(None, description="End time"),
    limit: int = Query(100, description="Maximum number of results"),
    db: AsyncSession = Depends(get_db)
):
    """Get large trade activity (whale trades)"""
    try:
        market_data_service = MarketDataService(db)
        result = await market_data_service.get_whale_activity(
            symbols=symbols,
            min_trade_size=min_trade_size,
            start_time=start_time,
            end_time=end_time,
            limit=limit
        )
        return result
    except Exception as e:
        logger.error("Failed to get whale activity", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/orderbook/imbalance-detail")
async def orderbook_imbalance_detail(
    symbol: str = Query(...),
    exchange: str = Query("binance"),
    bands: str = Query("0.001,0.005,0.01"),
    db: AsyncSession = Depends(get_db)
):
    """Depth imbalance across bands with spoof flags and deltas."""
    band_list = [float(x.strip()) for x in bands.split(',') if x.strip()]
    res = await compute_imbalance(db, symbol, exchange, band_list)
    return res


@router.get("/ultra/price/{symbol}")
async def get_ultra_price(symbol: str):
    """Get ultra-aggregated price from 10+ exchanges - 10x better than Binance Oracle"""
    try:
        result = await ultra_oracle.get_ultra_price(symbol.upper())
        if not result:
            raise HTTPException(status_code=404, detail=f"No price data found for {symbol}")
        return result
    except Exception as e:
        logger.error("Failed to get ultra price", symbol=symbol, error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/ultra/movements")
async def get_price_movements(
    threshold_pct: float = Query(0.1, description="Minimum movement percentage to detect"),
):
    """Get real-time significant price movements across all exchanges"""
    try:
        movements = await ultra_oracle.get_price_movements(threshold_pct)
        return {
            "movements": movements,
            "threshold_pct": threshold_pct,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error("Failed to get price movements", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/ultra/arbitrage")
async def get_arbitrage_opportunities(
    min_spread_pct: float = Query(0.05, description="Minimum spread percentage for arbitrage"),
):
    """Detect arbitrage opportunities across exchanges"""
    try:
        opportunities = await ultra_oracle.detect_arbitrage_opportunities(min_spread_pct)
        return {
            "opportunities": opportunities,
            "min_spread_pct": min_spread_pct,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error("Failed to get arbitrage opportunities", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/ultra/symbols")
async def get_ultra_symbols():
    """Get all symbols tracked by the ultra price oracle"""
    try:
        symbols = await ultra_oracle.get_all_symbols()
        return {
            "symbols": sorted(symbols),
            "count": len(symbols),
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error("Failed to get ultra symbols", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))
