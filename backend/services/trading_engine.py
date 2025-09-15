"""
Advanced Trading Engine with Risk Management and Strategy Execution
"""

import asyncio
import json
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Dict, List, Optional, Tuple

import structlog
from sqlalchemy import and_, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from core.database import get_async_session
from models.trading import (
    Backtest, CopyTrade, Order, OrderFill, OrderSide, OrderStatus, 
    OrderType, Position, PositionSide, RiskMetrics, Strategy, TradeMode
)
from services.risk_manager import RiskManager
from services.strategy_engine import StrategyEngine

logger = structlog.get_logger()


class TradingEngine:
    """Advanced trading engine with risk management and strategy execution"""
    
    def __init__(self):
        self.risk_manager = RiskManager()
        self.strategy_engine = StrategyEngine()
        self.active_strategies: Dict[int, Strategy] = {}
        self.running = False
        
    async def start(self):
        """Start the trading engine"""
        logger.info("Starting trading engine")
        self.running = True
        
        # Load active strategies
        await self._load_active_strategies()
        
        # Start strategy execution loop
        asyncio.create_task(self._strategy_execution_loop())
        
        # Start risk monitoring loop
        asyncio.create_task(self._risk_monitoring_loop())
        
        # Start position monitoring loop
        asyncio.create_task(self._position_monitoring_loop())
        
    async def stop(self):
        """Stop the trading engine"""
        logger.info("Stopping trading engine")
        self.running = False
        
    async def _load_active_strategies(self):
        """Load all active strategies"""
        async with get_async_session() as session:
            result = await session.execute(
                select(Strategy).where(Strategy.is_active == True)
            )
            strategies = result.scalars().all()
            
            for strategy in strategies:
                self.active_strategies[strategy.id] = strategy
                logger.info(f"Loaded strategy: {strategy.name}")
                
    async def _strategy_execution_loop(self):
        """Main strategy execution loop"""
        while self.running:
            try:
                for strategy_id, strategy in self.active_strategies.items():
                    await self._execute_strategy(strategy)
                    
                await asyncio.sleep(1)  # Execute every second
                
            except Exception as e:
                logger.error(f"Error in strategy execution loop: {e}")
                await asyncio.sleep(5)
                
    async def _risk_monitoring_loop(self):
        """Risk monitoring and position sizing loop"""
        while self.running:
            try:
                await self._update_risk_metrics()
                await self._check_risk_limits()
                await asyncio.sleep(30)  # Check every 30 seconds
                
            except Exception as e:
                logger.error(f"Error in risk monitoring loop: {e}")
                await asyncio.sleep(60)
                
    async def _position_monitoring_loop(self):
        """Position monitoring and management loop"""
        while self.running:
            try:
                await self._monitor_positions()
                await asyncio.sleep(10)  # Check every 10 seconds
                
            except Exception as e:
                logger.error(f"Error in position monitoring loop: {e}")
                await asyncio.sleep(30)
                
    async def _execute_strategy(self, strategy: Strategy):
        """Execute a single strategy"""
        try:
            # Get market data and generate signals
            signals = await self.strategy_engine.generate_signals(strategy)
            
            for signal in signals:
                # Check risk limits before placing order
                if await self.risk_manager.check_order_risk(signal, strategy):
                    await self._place_order(signal, strategy)
                else:
                    logger.warning(f"Order rejected by risk manager: {signal}")
                    
        except Exception as e:
            logger.error(f"Error executing strategy {strategy.name}: {e}")
            
    async def _place_order(self, signal: Dict, strategy: Strategy):
        """Place an order based on signal"""
        async with get_async_session() as session:
            try:
                # Calculate position size based on risk parameters
                position_size = await self._calculate_position_size(signal, strategy)
                
                if position_size <= 0:
                    return
                    
                # Create order
                order = Order(
                    symbol=signal['symbol'],
                    exchange=signal['exchange'],
                    order_type=OrderType.MARKET,
                    side=OrderSide.BUY if signal['action'] == 'buy' else OrderSide.SELL,
                    quantity=position_size,
                    price=signal.get('price'),
                    mode=TradeMode.PAPER,  # Start with paper trading
                    strategy_id=strategy.id,
                    risk_score=signal.get('risk_score', 50),
                    extra_metadata=signal
                )
                
                session.add(order)
                await session.commit()
                
                # Simulate order execution for paper trading
                if order.mode == TradeMode.PAPER:
                    await self._simulate_order_execution(order)
                    
                logger.info(f"Order placed: {order.symbol} {order.side} {order.quantity}")
                
            except Exception as e:
                logger.error(f"Error placing order: {e}")
                await session.rollback()
                
    async def _calculate_position_size(self, signal: Dict, strategy: Strategy) -> Decimal:
        """Calculate position size based on risk parameters"""
        try:
            # Get current portfolio value
            portfolio_value = await self._get_portfolio_value()
            
            # Calculate base position size
            base_size = portfolio_value * strategy.max_position_size
            
            # Adjust for signal confidence
            confidence = signal.get('confidence', 0.5)
            adjusted_size = base_size * Decimal(str(confidence))
            
            # Adjust for risk score
            risk_score = signal.get('risk_score', 50)
            risk_multiplier = Decimal(str(risk_score / 100))
            final_size = adjusted_size * risk_multiplier
            
            # Convert to quantity based on price
            price = signal.get('price', 1)
            quantity = final_size / Decimal(str(price))
            
            return max(quantity, Decimal('0'))
            
        except Exception as e:
            logger.error(f"Error calculating position size: {e}")
            return Decimal('0')
            
    async def _get_portfolio_value(self) -> Decimal:
        """Get current portfolio value"""
        async with get_async_session() as session:
            # This would integrate with exchange API to get actual balance
            # For now, return a default value
            return Decimal('10000')  # $10,000 starting capital
            
    async def _simulate_order_execution(self, order: Order):
        """Simulate order execution for paper trading"""
        async with get_async_session() as session:
            try:
                # Simulate immediate fill
                order.status = OrderStatus.FILLED
                order.filled_quantity = order.quantity
                order.average_price = order.price or Decimal('1')  # Use signal price
                order.filled_at = datetime.utcnow()
                
                # Create fill record
                fill = OrderFill(
                    order_id=order.id,
                    quantity=order.quantity,
                    price=order.average_price,
                    commission=Decimal('0'),  # No commission for paper trading
                    filled_at=datetime.utcnow()
                )
                
                session.add(fill)
                
                # Create or update position
                await self._update_position(order)
                
                await session.commit()
                
            except Exception as e:
                logger.error(f"Error simulating order execution: {e}")
                await session.rollback()
                
    async def _update_position(self, order: Order):
        """Create or update position after order fill"""
        async with get_async_session() as session:
            try:
                # Check if position exists
                result = await session.execute(
                    select(Position).where(
                        and_(
                            Position.symbol == order.symbol,
                            Position.exchange == order.exchange,
                            Position.mode == order.mode,
                            Position.is_active == True
                        )
                    )
                )
                position = result.scalar_one_or_none()
                
                if position:
                    # Update existing position
                    if order.side == OrderSide.BUY:
                        # Add to position
                        total_quantity = position.quantity + order.filled_quantity
                        total_value = (position.quantity * position.entry_price + 
                                     order.filled_quantity * order.average_price)
                        position.entry_price = total_value / total_quantity
                        position.quantity = total_quantity
                    else:
                        # Reduce position
                        position.quantity -= order.filled_quantity
                        if position.quantity <= 0:
                            position.is_active = False
                            position.closed_at = datetime.utcnow()
                            
                else:
                    # Create new position
                    position = Position(
                        symbol=order.symbol,
                        exchange=order.exchange,
                        side=PositionSide.LONG if order.side == OrderSide.BUY else PositionSide.SHORT,
                        quantity=order.filled_quantity,
                        entry_price=order.average_price,
                        current_price=order.average_price,
                        mode=order.mode,
                        strategy_id=order.strategy_id
                    )
                    session.add(position)
                    
                await session.commit()
                
            except Exception as e:
                logger.error(f"Error updating position: {e}")
                await session.rollback()
                
    async def _monitor_positions(self):
        """Monitor and manage open positions"""
        async with get_async_session() as session:
            try:
                # Get all active positions
                result = await session.execute(
                    select(Position).where(Position.is_active == True)
                )
                positions = result.scalars().all()
                
                for position in positions:
                    # Update current price (would get from market data)
                    # For now, simulate price movement
                    await self._update_position_price(position)
                    
                    # Check stop loss and take profit
                    await self._check_exit_conditions(position)
                    
            except Exception as e:
                logger.error(f"Error monitoring positions: {e}")
                
    async def _update_position_price(self, position: Position):
        """Update position current price and PnL"""
        # This would integrate with real-time market data
        # For now, simulate small price movements
        import random
        price_change = random.uniform(-0.02, 0.02)  # ±2% price change
        new_price = position.current_price * (1 + Decimal(str(price_change)))
        
        position.current_price = new_price
        
        # Calculate unrealized PnL
        if position.side == PositionSide.LONG:
            position.unrealized_pnl = (new_price - position.entry_price) * position.quantity
        else:
            position.unrealized_pnl = (position.entry_price - new_price) * position.quantity
            
    async def _check_exit_conditions(self, position: Position):
        """Check if position should be closed based on stop loss/take profit"""
        try:
            # Get strategy for this position
            if not position.strategy_id:
                return
                
            async with get_async_session() as session:
                result = await session.execute(
                    select(Strategy).where(Strategy.id == position.strategy_id)
                )
                strategy = result.scalar_one_or_none()
                
                if not strategy:
                    return
                    
                # Calculate PnL percentage
                if position.side == PositionSide.LONG:
                    pnl_pct = (position.current_price - position.entry_price) / position.entry_price
                else:
                    pnl_pct = (position.entry_price - position.current_price) / position.entry_price
                    
                # Check stop loss
                if pnl_pct <= -strategy.stop_loss_pct:
                    await self._close_position(position, "stop_loss")
                    
                # Check take profit
                elif pnl_pct >= strategy.take_profit_pct:
                    await self._close_position(position, "take_profit")
                    
        except Exception as e:
            logger.error(f"Error checking exit conditions: {e}")
            
    async def _close_position(self, position: Position, reason: str):
        """Close a position"""
        async with get_async_session() as session:
            try:
                # Create closing order
                side = OrderSide.SELL if position.side == PositionSide.LONG else OrderSide.BUY
                
                order = Order(
                    symbol=position.symbol,
                    exchange=position.exchange,
                    order_type=OrderType.MARKET,
                    side=side,
                    quantity=position.quantity,
                    price=position.current_price,
                    mode=position.mode,
                    strategy_id=position.strategy_id,
                    extra_metadata={"close_reason": reason}
                )
                
                session.add(order)
                await session.commit()
                
                # Simulate execution
                if order.mode == TradeMode.PAPER:
                    await self._simulate_order_execution(order)
                    
                logger.info(f"Position closed: {position.symbol} - {reason}")
                
            except Exception as e:
                logger.error(f"Error closing position: {e}")
                await session.rollback()
                
    async def _update_risk_metrics(self):
        """Update portfolio risk metrics"""
        async with get_async_session() as session:
            try:
                # Calculate current metrics
                portfolio_value = await self._get_portfolio_value()
                
                # Get all positions
                result = await session.execute(
                    select(Position).where(Position.is_active == True)
                )
                positions = result.scalars().all()
                
                total_unrealized_pnl = sum(pos.unrealized_pnl for pos in positions)
                total_realized_pnl = sum(pos.realized_pnl for pos in positions)
                
                # Create risk metrics record
                risk_metrics = RiskMetrics(
                    total_equity=portfolio_value + total_unrealized_pnl,
                    available_margin=portfolio_value * Decimal('0.8'),  # 80% available
                    used_margin=portfolio_value * Decimal('0.2'),       # 20% used
                    daily_pnl=total_unrealized_pnl + total_realized_pnl,
                    daily_trades=len(positions)
                )
                
                session.add(risk_metrics)
                await session.commit()
                
            except Exception as e:
                logger.error(f"Error updating risk metrics: {e}")
                await session.rollback()
                
    async def _check_risk_limits(self):
        """Check if any risk limits are breached"""
        try:
            # Get latest risk metrics
            async with get_async_session() as session:
                result = await session.execute(
                    select(RiskMetrics).order_by(desc(RiskMetrics.calculated_at)).limit(1)
                )
                metrics = result.scalar_one_or_none()
                
                if not metrics:
                    return
                    
                # Check daily loss limit
                if metrics.daily_pnl < -metrics.total_equity * Decimal('0.05'):  # 5% daily loss
                    logger.warning("Daily loss limit breached - stopping trading")
                    await self._emergency_stop()
                    
        except Exception as e:
            logger.error(f"Error checking risk limits: {e}")
            
    async def _emergency_stop(self):
        """Emergency stop - close all positions and stop trading"""
        logger.critical("EMERGENCY STOP ACTIVATED")
        
        # Close all positions
        async with get_async_session() as session:
            result = await session.execute(
                select(Position).where(Position.is_active == True)
            )
            positions = result.scalars().all()
            
            for position in positions:
                await self._close_position(position, "emergency_stop")
                
        # Stop all strategies
        self.running = False
        
    # Public API methods
    async def get_portfolio_summary(self) -> Dict:
        """Get portfolio summary"""
        async with get_async_session() as session:
            # Get positions
            result = await session.execute(
                select(Position).where(Position.is_active == True)
            )
            positions = result.scalars().all()
            
            # Get latest risk metrics
            result = await session.execute(
                select(RiskMetrics).order_by(desc(RiskMetrics.calculated_at)).limit(1)
            )
            metrics = result.scalar_one_or_none()
            
            return {
                "positions": [
                    {
                        "symbol": pos.symbol,
                        "side": pos.side,
                        "quantity": float(pos.quantity),
                        "entry_price": float(pos.entry_price),
                        "current_price": float(pos.current_price),
                        "unrealized_pnl": float(pos.unrealized_pnl),
                        "pnl_percentage": float((pos.current_price - pos.entry_price) / pos.entry_price * 100)
                    }
                    for pos in positions
                ],
                "risk_metrics": {
                    "total_equity": float(metrics.total_equity) if metrics else 0,
                    "daily_pnl": float(metrics.daily_pnl) if metrics else 0,
                    "daily_trades": metrics.daily_trades if metrics else 0
                } if metrics else {}
            }
            
    async def toggle_auto_trade(self, enabled: bool):
        """Toggle auto trading mode"""
        self.running = enabled
        logger.info(f"Auto trading {'enabled' if enabled else 'disabled'}")
        
    async def get_strategy_performance(self) -> List[Dict]:
        """Get performance metrics for all strategies"""
        async with get_async_session() as session:
            result = await session.execute(select(Strategy))
            strategies = result.scalars().all()
            
            return [
                {
                    "id": strategy.id,
                    "name": strategy.name,
                    "type": strategy.strategy_type,
                    "total_trades": strategy.total_trades,
                    "winning_trades": strategy.winning_trades,
                    "win_rate": float(strategy.winning_trades / strategy.total_trades * 100) if strategy.total_trades > 0 else 0,
                    "total_pnl": float(strategy.total_pnl),
                    "sharpe_ratio": float(strategy.sharpe_ratio) if strategy.sharpe_ratio else 0,
                    "is_active": strategy.is_active
                }
                for strategy in strategies
            ]
