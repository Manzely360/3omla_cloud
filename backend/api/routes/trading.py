"""
Trading API routes for orders, positions, and strategies
"""

from datetime import datetime
from typing import Dict, List, Optional, Any
import asyncio

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import and_, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_async_session
from models.trading import (
    Backtest, CopyTrade, Order, OrderFill, OrderSide, OrderStatus, 
    OrderType, Position, PositionSide, RiskMetrics, Strategy, StrategyType, TradeMode
)
from services.trading_engine import TradingEngine
from services.bybit_account import BybitAccountService
from services.binance_account import BinanceAccountService
from services.market_data import MarketDataService

router = APIRouter()

# Global trading engine instance
trading_engine = TradingEngine()
bybit_service = BybitAccountService()
binance_service = BinanceAccountService()


# Pydantic models
class OrderCreate(BaseModel):
    symbol: str
    exchange: str
    order_type: OrderType
    side: OrderSide
    quantity: float
    price: Optional[float] = None
    stop_price: Optional[float] = None
    mode: TradeMode = TradeMode.PAPER
    strategy_id: Optional[int] = None
    extra_metadata: Optional[Dict[str, Any]] = None


class StrategyCreate(BaseModel):
    name: str
    strategy_type: StrategyType
    config: Dict
    max_position_size: float = 0.1
    max_daily_loss: float = 0.05
    stop_loss_pct: float = 0.02
    take_profit_pct: float = 0.04


class StrategyUpdate(BaseModel):
    name: Optional[str] = None
    config: Optional[Dict] = None
    is_active: Optional[bool] = None
    max_position_size: Optional[float] = None
    max_daily_loss: Optional[float] = None
    stop_loss_pct: Optional[float] = None
    take_profit_pct: Optional[float] = None


class BacktestRequest(BaseModel):
    strategy_id: int
    name: str
    start_date: datetime
    end_date: datetime
    initial_capital: float


class AutoTradeToggle(BaseModel):
    enabled: bool


# Order endpoints
@router.post("/orders", response_model=Dict)
async def create_order(
    order_data: OrderCreate,
    session: AsyncSession = Depends(get_async_session)
):
    """Create a new order"""
    try:
        order = Order(
            symbol=order_data.symbol,
            exchange=order_data.exchange,
            order_type=order_data.order_type,
            side=order_data.side,
            quantity=order_data.quantity,
            price=order_data.price,
            stop_price=order_data.stop_price,
            mode=order_data.mode,
            strategy_id=order_data.strategy_id,
            extra_metadata=order_data.extra_metadata or {},
        )
        
        session.add(order)
        await session.commit()
        await session.refresh(order)

        # Instant paper fill for market orders to improve UX
        try:
            if order.mode == TradeMode.PAPER and order.order_type == OrderType.MARKET:
                md = MarketDataService(session)
                px = await md.get_current_price(order.symbol)
                fill_price = float(px.get('price')) if isinstance(px, dict) else float(px)

                # create fill
                fill = OrderFill(
                    order_id=order.id,
                    quantity=order.quantity,
                    price=fill_price,
                )
                session.add(fill)

                # update order
                order.filled_quantity = order.quantity
                order.average_price = fill_price
                order.status = OrderStatus.FILLED
                order.filled_at = datetime.utcnow()

                # upsert simple position
                existing = await session.execute(
                    select(Position).where(
                        Position.symbol == order.symbol,
                        Position.exchange == order.exchange,
                        Position.is_active == True,
                        Position.mode == TradeMode.PAPER,
                    ).limit(1)
                )
                pos = existing.scalar_one_or_none()
                qty = float(order.quantity)
                if not pos:
                    pos = Position(
                        symbol=order.symbol,
                        exchange=order.exchange,
                        side=PositionSide.LONG if order.side == OrderSide.BUY else PositionSide.SHORT,
                        quantity=qty,
                        entry_price=fill_price,
                        current_price=fill_price,
                        unrealized_pnl=0.0,
                        realized_pnl=0.0,
                        mode=TradeMode.PAPER,
                        is_active=True,
                    )
                    session.add(pos)
                else:
                    # naive position update: adjust quantity and current price
                    new_qty = float(pos.quantity) + (qty if order.side == OrderSide.BUY else -qty)
                    if new_qty <= 0:
                        pos.is_active = False
                        pos.closed_at = datetime.utcnow()
                        pos.current_price = fill_price
                    else:
                        pos.quantity = new_qty
                        pos.current_price = fill_price

                await session.commit()
                await session.refresh(order)
        except Exception:
            # do not fail the API if auto-fill fails
            await session.rollback()

        return {
            "id": order.id,
            "symbol": order.symbol,
            "side": order.side,
            "quantity": float(order.quantity),
            "status": order.status,
            "created_at": order.created_at
        }
        
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/orders", response_model=List[Dict])
async def get_orders(
    status: Optional[OrderStatus] = Query(None),
    mode: Optional[TradeMode] = Query(None),
    limit: int = Query(100, le=1000),
    session: AsyncSession = Depends(get_async_session)
):
    """Get orders with optional filtering"""
    try:
        query = select(Order)
        
        if status:
            query = query.where(Order.status == status)
        if mode:
            query = query.where(Order.mode == mode)
            
        query = query.order_by(desc(Order.created_at)).limit(limit)
        
        result = await session.execute(query)
        orders = result.scalars().all()
        
        return [
            {
                "id": order.id,
                "symbol": order.symbol,
                "exchange": order.exchange,
                "side": order.side,
                "order_type": order.order_type,
                "quantity": float(order.quantity),
                "price": float(order.price) if order.price else None,
                "status": order.status,
                "filled_quantity": float(order.filled_quantity),
                "average_price": float(order.average_price) if order.average_price else None,
                "mode": order.mode,
                "created_at": order.created_at,
                "filled_at": order.filled_at
            }
            for order in orders
        ]
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/orders/{order_id}", response_model=Dict)
async def get_order(
    order_id: int,
    session: AsyncSession = Depends(get_async_session)
):
    """Get a specific order by ID"""
    try:
        result = await session.execute(
            select(Order).where(Order.id == order_id)
        )
        order = result.scalar_one_or_none()
        
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
            
        return {
            "id": order.id,
            "symbol": order.symbol,
            "exchange": order.exchange,
            "side": order.side,
            "order_type": order.order_type,
            "quantity": float(order.quantity),
            "price": float(order.price) if order.price else None,
            "status": order.status,
            "filled_quantity": float(order.filled_quantity),
            "average_price": float(order.average_price) if order.average_price else None,
            "mode": order.mode,
            "strategy_id": order.strategy_id,
            "risk_score": float(order.risk_score) if order.risk_score else None,
            "created_at": order.created_at,
            "filled_at": order.filled_at,
            "extra_metadata": order.extra_metadata
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/orders/{order_id}")
async def cancel_order(
    order_id: int,
    session: AsyncSession = Depends(get_async_session)
):
    """Cancel an order"""
    try:
        result = await session.execute(
            select(Order).where(Order.id == order_id)
        )
        order = result.scalar_one_or_none()
        
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
            
        if order.status not in [OrderStatus.PENDING, OrderStatus.PARTIALLY_FILLED]:
            raise HTTPException(status_code=400, detail="Order cannot be cancelled")
            
        order.status = OrderStatus.CANCELLED
        await session.commit()
        
        return {"message": "Order cancelled successfully"}
        
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=400, detail=str(e))


# Position endpoints
@router.post("/positions/{position_id}/close", response_model=Dict)
async def close_position(
    position_id: int,
    session: AsyncSession = Depends(get_async_session)
):
    """Close a paper position immediately at current price."""
    try:
        result = await session.execute(select(Position).where(Position.id == position_id))
        position = result.scalar_one_or_none()
        if not position:
            raise HTTPException(status_code=404, detail="Position not found")
        if position.mode != TradeMode.PAPER:
            raise HTTPException(status_code=400, detail="Only paper positions can be closed here")
        if not position.is_active:
            return {"message": "Position already closed"}

        md = MarketDataService(session)
        px = await md.get_current_price(position.symbol)
        current = float(px.get('price') if isinstance(px, dict) else px)

        qty = float(position.quantity)
        entry = float(position.entry_price)
        if position.side == PositionSide.LONG:
            realized = (current - entry) * qty
            close_side = OrderSide.SELL
        else:
            realized = (entry - current) * qty
            close_side = OrderSide.BUY

        position.current_price = current
        position.realized_pnl = float(position.realized_pnl or 0) + realized
        position.is_active = False
        position.closed_at = datetime.utcnow()

        close_order = Order(
            symbol=position.symbol,
            exchange=position.exchange,
            order_type=OrderType.MARKET,
            side=close_side,
            quantity=qty,
            mode=TradeMode.PAPER,
            status=OrderStatus.FILLED,
            average_price=current,
            filled_quantity=qty,
            filled_at=datetime.utcnow(),
        )
        session.add(close_order)
        await session.commit()

        return {"message": "Position closed", "position_id": position.id, "realized_pnl": realized, "close_price": current}
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=400, detail=str(e))
@router.get("/positions", response_model=List[Dict])
async def get_positions(
    active_only: bool = Query(True),
    mode: Optional[TradeMode] = Query(None),
    session: AsyncSession = Depends(get_async_session)
):
    """Get positions with optional filtering"""
    try:
        query = select(Position)
        
        if active_only:
            query = query.where(Position.is_active == True)
        if mode:
            query = query.where(Position.mode == mode)
            
        query = query.order_by(desc(Position.opened_at))
        
        result = await session.execute(query)
        positions = result.scalars().all()
        
        return [
            {
                "id": position.id,
                "symbol": position.symbol,
                "exchange": position.exchange,
                "side": position.side,
                "quantity": float(position.quantity),
                "entry_price": float(position.entry_price),
                "current_price": float(position.current_price) if position.current_price else None,
                "unrealized_pnl": float(position.unrealized_pnl),
                "realized_pnl": float(position.realized_pnl),
                "leverage": float(position.leverage),
                "mode": position.mode,
                "strategy_id": position.strategy_id,
                "is_active": position.is_active,
                "opened_at": position.opened_at,
                "closed_at": position.closed_at
            }
            for position in positions
        ]
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/positions/{position_id}", response_model=Dict)
async def get_position(
    position_id: int,
    session: AsyncSession = Depends(get_async_session)
):
    """Get a specific position by ID"""
    try:
        result = await session.execute(
            select(Position).where(Position.id == position_id)
        )
        position = result.scalar_one_or_none()
        
        if not position:
            raise HTTPException(status_code=404, detail="Position not found")
            
        return {
            "id": position.id,
            "symbol": position.symbol,
            "exchange": position.exchange,
            "side": position.side,
            "quantity": float(position.quantity),
            "entry_price": float(position.entry_price),
            "current_price": float(position.current_price) if position.current_price else None,
            "unrealized_pnl": float(position.unrealized_pnl),
            "realized_pnl": float(position.realized_pnl),
            "leverage": float(position.leverage),
            "margin_used": float(position.margin_used) if position.margin_used else None,
            "mode": position.mode,
            "strategy_id": position.strategy_id,
            "is_active": position.is_active,
            "opened_at": position.opened_at,
            "closed_at": position.closed_at,
            "updated_at": position.updated_at
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# Strategy endpoints
@router.post("/strategies", response_model=Dict)
async def create_strategy(
    strategy_data: StrategyCreate,
    session: AsyncSession = Depends(get_async_session)
):
    """Create a new trading strategy"""
    try:
        strategy = Strategy(
            name=strategy_data.name,
            strategy_type=strategy_data.strategy_type,
            config=strategy_data.config,
            max_position_size=strategy_data.max_position_size,
            max_daily_loss=strategy_data.max_daily_loss,
            stop_loss_pct=strategy_data.stop_loss_pct,
            take_profit_pct=strategy_data.take_profit_pct
        )
        
        session.add(strategy)
        await session.commit()
        await session.refresh(strategy)
        
        return {
            "id": strategy.id,
            "name": strategy.name,
            "strategy_type": strategy.strategy_type,
            "config": strategy.config,
            "is_active": strategy.is_active,
            "created_at": strategy.created_at
        }
        
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/strategies", response_model=List[Dict])
async def get_strategies(
    active_only: bool = Query(False),
    session: AsyncSession = Depends(get_async_session)
):
    """Get all strategies"""
    try:
        query = select(Strategy)
        
        if active_only:
            query = query.where(Strategy.is_active == True)
            
        query = query.order_by(desc(Strategy.created_at))
        
        result = await session.execute(query)
        strategies = result.scalars().all()
        
        return [
            {
                "id": strategy.id,
                "name": strategy.name,
                "strategy_type": strategy.strategy_type,
                "config": strategy.config,
                "is_active": strategy.is_active,
                "total_trades": strategy.total_trades,
                "winning_trades": strategy.winning_trades,
                "total_pnl": float(strategy.total_pnl),
                "max_drawdown": float(strategy.max_drawdown),
                "sharpe_ratio": float(strategy.sharpe_ratio) if strategy.sharpe_ratio else None,
                "max_position_size": float(strategy.max_position_size),
                "max_daily_loss": float(strategy.max_daily_loss),
                "stop_loss_pct": float(strategy.stop_loss_pct),
                "take_profit_pct": float(strategy.take_profit_pct),
                "created_at": strategy.created_at,
                "updated_at": strategy.updated_at
            }
            for strategy in strategies
        ]
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/strategies/{strategy_id}", response_model=Dict)
async def get_strategy(
    strategy_id: int,
    session: AsyncSession = Depends(get_async_session)
):
    """Get a specific strategy by ID"""
    try:
        result = await session.execute(
            select(Strategy).where(Strategy.id == strategy_id)
        )
        strategy = result.scalar_one_or_none()
        
        if not strategy:
            raise HTTPException(status_code=404, detail="Strategy not found")
            
        return {
            "id": strategy.id,
            "name": strategy.name,
            "strategy_type": strategy.strategy_type,
            "config": strategy.config,
            "is_active": strategy.is_active,
            "total_trades": strategy.total_trades,
            "winning_trades": strategy.winning_trades,
            "total_pnl": float(strategy.total_pnl),
            "max_drawdown": float(strategy.max_drawdown),
            "sharpe_ratio": float(strategy.sharpe_ratio) if strategy.sharpe_ratio else None,
            "max_position_size": float(strategy.max_position_size),
            "max_daily_loss": float(strategy.max_daily_loss),
            "stop_loss_pct": float(strategy.stop_loss_pct),
            "take_profit_pct": float(strategy.take_profit_pct),
            "created_at": strategy.created_at,
            "updated_at": strategy.updated_at
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# Trading history analytics
@router.get("/history/summary", response_model=Dict)
async def history_summary(session: AsyncSession = Depends(get_async_session)):
    """Summarize trading history using closed positions (realized PnL)."""
    try:
        result = await session.execute(
            select(Position).where(Position.is_active == False).order_by(Position.closed_at)
        )
        positions = result.scalars().all()
        total = len(positions)
        wins = sum(1 for p in positions if float(p.realized_pnl or 0) > 0)
        losses = sum(1 for p in positions if float(p.realized_pnl or 0) < 0)
        total_realized = float(sum(float(p.realized_pnl or 0) for p in positions))
        avg_realized = float(total_realized / total) if total else 0.0
        eq = []
        cum = 0.0
        peak = 0.0
        max_dd = 0.0
        for p in positions:
            cum += float(p.realized_pnl or 0)
            t = (p.closed_at or p.updated_at or p.created_at)
            eq.append({"t": t.isoformat(), "equity": round(cum, 8)})
            if cum > peak:
                peak = cum
            dd = peak - cum
            if dd > max_dd:
                max_dd = dd
        by_symbol: Dict[str, Dict[str, float]] = {}
        for p in positions:
            d = by_symbol.setdefault(p.symbol, {"count": 0, "realized": 0.0})
            d["count"] += 1
            d["realized"] += float(p.realized_pnl or 0)
        return {
            "trades": total,
            "wins": wins,
            "losses": losses,
            "win_rate": (wins / total) if total else 0.0,
            "total_realized_pnl": total_realized,
            "avg_realized_pnl": avg_realized,
            "max_drawdown": max_dd,
            "equity_curve": eq,
            "by_symbol": by_symbol,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/strategies/{strategy_id}", response_model=Dict)
async def update_strategy(
    strategy_id: int,
    strategy_data: StrategyUpdate,
    session: AsyncSession = Depends(get_async_session)
):
    """Update a strategy"""
    try:
        result = await session.execute(
            select(Strategy).where(Strategy.id == strategy_id)
        )
        strategy = result.scalar_one_or_none()
        
        if not strategy:
            raise HTTPException(status_code=404, detail="Strategy not found")
            
        # Update fields
        if strategy_data.name is not None:
            strategy.name = strategy_data.name
        if strategy_data.config is not None:
            strategy.config = strategy_data.config
        if strategy_data.is_active is not None:
            strategy.is_active = strategy_data.is_active
        if strategy_data.max_position_size is not None:
            strategy.max_position_size = strategy_data.max_position_size
        if strategy_data.max_daily_loss is not None:
            strategy.max_daily_loss = strategy_data.max_daily_loss
        if strategy_data.stop_loss_pct is not None:
            strategy.stop_loss_pct = strategy_data.stop_loss_pct
        if strategy_data.take_profit_pct is not None:
            strategy.take_profit_pct = strategy_data.take_profit_pct
            
        strategy.updated_at = datetime.utcnow()
        
        await session.commit()
        await session.refresh(strategy)
        
        return {
            "id": strategy.id,
            "name": strategy.name,
            "strategy_type": strategy.strategy_type,
            "config": strategy.config,
            "is_active": strategy.is_active,
            "updated_at": strategy.updated_at
        }
        
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/strategies/{strategy_id}")
async def delete_strategy(
    strategy_id: int,
    session: AsyncSession = Depends(get_async_session)
):
    """Delete a strategy"""
    try:
        result = await session.execute(
            select(Strategy).where(Strategy.id == strategy_id)
        )
        strategy = result.scalar_one_or_none()
        
        if not strategy:
            raise HTTPException(status_code=404, detail="Strategy not found")
            
        await session.delete(strategy)
        await session.commit()
        
        return {"message": "Strategy deleted successfully"}
        
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=400, detail=str(e))


# Trading engine endpoints
@router.get("/portfolio", response_model=Dict)
async def get_portfolio():
    """Get portfolio summary"""
    try:
        return await trading_engine.get_portfolio_summary()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# Live account (Bybit) endpoints
@router.get("/live/balance", response_model=Dict)
async def get_live_balance():
    try:
        balance = await bybit_service.get_balance()
        return balance
    except Exception as e:
        if 'not configured' in str(e).lower():
            return {}
        raise HTTPException(status_code=400, detail=str(e))


# Binance live endpoints
@router.get("/live/binance/positions", response_model=List[Dict])
async def get_live_positions_binance():
    try:
        positions = await binance_service.get_positions()
        return positions
    except Exception as e:
        if 'not configured' in str(e).lower():
            return []
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/live/binance/open-orders", response_model=List[Dict])
async def get_live_open_orders_binance(symbol: Optional[str] = Query(None)):
    try:
        orders = await binance_service.get_open_orders(symbol)
        return orders
    except Exception as e:
        if 'not configured' in str(e).lower():
            return []
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/live/binance/trades", response_model=List[Dict])
async def get_live_trades_binance(symbol: Optional[str] = Query(None), limit: int = Query(50, le=200)):
    try:
        trades = await binance_service.get_my_trades(symbol, None, limit)
        return trades
    except Exception as e:
        if 'not configured' in str(e).lower():
            return []
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/live/positions", response_model=List[Dict])
async def get_live_positions():
    try:
        positions = await bybit_service.get_positions()
        return positions
    except Exception as e:
        if 'not configured' in str(e).lower():
            return []
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/live/open-orders", response_model=List[Dict])
async def get_live_open_orders(symbol: Optional[str] = Query(None)):
    try:
        orders = await bybit_service.get_open_orders(symbol)
        return orders
    except Exception as e:
        if 'not configured' in str(e).lower():
            return []
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/live/trades", response_model=List[Dict])
async def get_live_trades(symbol: Optional[str] = Query(None), limit: int = Query(50, le=200)):
    try:
        trades = await bybit_service.get_my_trades(symbol, None, limit)
        return trades
    except Exception as e:
        if 'not configured' in str(e).lower():
            return []
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/performance", response_model=List[Dict])
async def get_strategy_performance():
    """Get strategy performance metrics"""
    try:
        return await trading_engine.get_strategy_performance()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/auto-trade")
async def toggle_auto_trade(toggle: AutoTradeToggle):
    """Toggle auto trading mode"""
    try:
        await trading_engine.toggle_auto_trade(toggle.enabled)
        return {"message": f"Auto trading {'enabled' if toggle.enabled else 'disabled'}"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# Risk management endpoints
@router.get("/risk-metrics", response_model=Dict)
async def get_risk_metrics(session: AsyncSession = Depends(get_async_session)):
    """Get current risk metrics"""
    try:
        result = await session.execute(
            select(RiskMetrics).order_by(desc(RiskMetrics.calculated_at)).limit(1)
        )
        metrics = result.scalar_one_or_none()
        
        if not metrics:
            return {}
            
        return {
            "total_equity": float(metrics.total_equity),
            "available_margin": float(metrics.available_margin),
            "used_margin": float(metrics.used_margin),
            "daily_pnl": float(metrics.daily_pnl),
            "daily_trades": metrics.daily_trades,
            "portfolio_var": float(metrics.portfolio_var) if metrics.portfolio_var else None,
            "max_drawdown": float(metrics.max_drawdown) if metrics.max_drawdown else None,
            "sharpe_ratio": float(metrics.sharpe_ratio) if metrics.sharpe_ratio else None,
            "calculated_at": metrics.calculated_at
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# Backtesting endpoints
@router.post("/backtest", response_model=Dict)
async def create_backtest(
    backtest_data: BacktestRequest,
    session: AsyncSession = Depends(get_async_session)
):
    """Create a new backtest"""
    try:
        backtest = Backtest(
            strategy_id=backtest_data.strategy_id,
            name=backtest_data.name,
            start_date=backtest_data.start_date,
            end_date=backtest_data.end_date,
            initial_capital=backtest_data.initial_capital,
            status="pending"
        )
        
        session.add(backtest)
        await session.commit()
        await session.refresh(backtest)
        
        # Start backtest in background
        # This would trigger the actual backtesting process
        
        return {
            "id": backtest.id,
            "strategy_id": backtest.strategy_id,
            "name": backtest.name,
            "start_date": backtest.start_date,
            "end_date": backtest.end_date,
            "initial_capital": float(backtest.initial_capital),
            "status": backtest.status,
            "created_at": backtest.created_at
        }
        
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/backtests", response_model=List[Dict])
async def get_backtests(
    strategy_id: Optional[int] = Query(None),
    limit: int = Query(50, le=200),
    session: AsyncSession = Depends(get_async_session)
):
    """Get backtests with optional filtering"""
    try:
        query = select(Backtest)
        
        if strategy_id:
            query = query.where(Backtest.strategy_id == strategy_id)
            
        query = query.order_by(desc(Backtest.created_at)).limit(limit)
        
        result = await session.execute(query)
        backtests = result.scalars().all()
        
        return [
            {
                "id": backtest.id,
                "strategy_id": backtest.strategy_id,
                "name": backtest.name,
                "start_date": backtest.start_date,
                "end_date": backtest.end_date,
                "initial_capital": float(backtest.initial_capital),
                "total_return": float(backtest.total_return) if backtest.total_return else None,
                "sharpe_ratio": float(backtest.sharpe_ratio) if backtest.sharpe_ratio else None,
                "max_drawdown": float(backtest.max_drawdown) if backtest.max_drawdown else None,
                "win_rate": float(backtest.win_rate) if backtest.win_rate else None,
                "total_trades": backtest.total_trades,
                "status": backtest.status,
                "created_at": backtest.created_at,
                "completed_at": backtest.completed_at
            }
            for backtest in backtests
        ]
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/backtests/{backtest_id}", response_model=Dict)
async def get_backtest(
    backtest_id: int,
    session: AsyncSession = Depends(get_async_session)
):
    """Get a specific backtest by ID"""
    try:
        result = await session.execute(
            select(Backtest).where(Backtest.id == backtest_id)
        )
        backtest = result.scalar_one_or_none()
        
        if not backtest:
            raise HTTPException(status_code=404, detail="Backtest not found")
            
        return {
            "id": backtest.id,
            "strategy_id": backtest.strategy_id,
            "name": backtest.name,
            "start_date": backtest.start_date,
            "end_date": backtest.end_date,
            "initial_capital": float(backtest.initial_capital),
            "total_return": float(backtest.total_return) if backtest.total_return else None,
            "sharpe_ratio": float(backtest.sharpe_ratio) if backtest.sharpe_ratio else None,
            "max_drawdown": float(backtest.max_drawdown) if backtest.max_drawdown else None,
            "win_rate": float(backtest.win_rate) if backtest.win_rate else None,
            "total_trades": backtest.total_trades,
            "equity_curve": backtest.equity_curve,
            "trade_history": backtest.trade_history,
            "metrics": backtest.metrics,
            "status": backtest.status,
            "created_at": backtest.created_at,
            "completed_at": backtest.completed_at
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
