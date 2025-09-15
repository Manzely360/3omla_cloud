"""
Advanced Risk Management System
"""

import asyncio
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Dict, List, Optional

import structlog
from sqlalchemy import and_, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_async_session
from models.trading import Order, Position, RiskMetrics, Strategy

logger = structlog.get_logger()


class RiskManager:
    """Advanced risk management system with position sizing and limits"""
    
    def __init__(self):
        self.max_portfolio_risk = Decimal('0.02')  # 2% max portfolio risk per trade
        self.max_daily_loss = Decimal('0.05')      # 5% max daily loss
        self.max_correlation = Decimal('0.7')      # Max correlation between positions
        self.max_leverage = Decimal('10.0')        # Max leverage
        self.min_confidence = Decimal('0.6')       # Min signal confidence
        
    async def check_order_risk(self, signal: Dict, strategy: Strategy) -> bool:
        """Check if order passes risk management rules"""
        try:
            # Check signal confidence
            confidence = signal.get('confidence', 0)
            if confidence < self.min_confidence:
                logger.warning(f"Signal confidence too low: {confidence}")
                return False
                
            # Check position size
            if not await self._check_position_size(signal, strategy):
                return False
                
            # Check correlation limits
            if not await self._check_correlation_limits(signal):
                return False
                
            # Check daily loss limits
            if not await self._check_daily_limits():
                return False
                
            # Check leverage limits
            if not await self._check_leverage_limits(signal):
                return False
                
            return True
            
        except Exception as e:
            logger.error(f"Error checking order risk: {e}")
            return False
            
    async def _check_position_size(self, signal: Dict, strategy: Strategy) -> bool:
        """Check if position size is within limits"""
        try:
            # Get current portfolio value
            portfolio_value = await self._get_portfolio_value()
            
            # Calculate proposed position size
            position_size = signal.get('quantity', 0)
            position_value = position_size * signal.get('price', 1)
            
            # Check against max position size
            max_position_value = portfolio_value * strategy.max_position_size
            if position_value > max_position_value:
                logger.warning(f"Position size exceeds limit: {position_value} > {max_position_value}")
                return False
                
            # Check against portfolio risk
            max_risk_value = portfolio_value * self.max_portfolio_risk
            if position_value > max_risk_value:
                logger.warning(f"Position exceeds portfolio risk limit: {position_value} > {max_risk_value}")
                return False
                
            return True
            
        except Exception as e:
            logger.error(f"Error checking position size: {e}")
            return False
            
    async def _check_correlation_limits(self, signal: Dict) -> bool:
        """Check correlation limits with existing positions"""
        try:
            symbol = signal['symbol']
            
            # Get existing positions
            async with get_async_session() as session:
                result = await session.execute(
                    select(Position).where(
                        and_(
                            Position.is_active == True,
                            Position.symbol != symbol
                        )
                    )
                )
                existing_positions = result.scalars().all()
                
                if not existing_positions:
                    return True
                    
                # Calculate correlation (simplified - would use actual correlation data)
                for position in existing_positions:
                    correlation = await self._calculate_correlation(symbol, position.symbol)
                    if correlation > self.max_correlation:
                        logger.warning(f"Correlation too high: {symbol} vs {position.symbol} = {correlation}")
                        return False
                        
            return True
            
        except Exception as e:
            logger.error(f"Error checking correlation limits: {e}")
            return False
            
    async def _check_daily_limits(self) -> bool:
        """Check daily loss limits"""
        try:
            # Get today's PnL
            today = datetime.utcnow().date()
            start_of_day = datetime.combine(today, datetime.min.time())
            
            async with get_async_session() as session:
                result = await session.execute(
                    select(func.sum(Position.realized_pnl + Position.unrealized_pnl))
                    .where(Position.updated_at >= start_of_day)
                )
                daily_pnl = result.scalar() or Decimal('0')
                
                # Get portfolio value
                portfolio_value = await self._get_portfolio_value()
                
                # Check daily loss limit
                daily_loss_pct = abs(daily_pnl) / portfolio_value
                if daily_loss_pct > self.max_daily_loss:
                    logger.warning(f"Daily loss limit exceeded: {daily_loss_pct:.2%}")
                    return False
                    
            return True
            
        except Exception as e:
            logger.error(f"Error checking daily limits: {e}")
            return False
            
    async def _check_leverage_limits(self, signal: Dict) -> bool:
        """Check leverage limits"""
        try:
            leverage = signal.get('leverage', 1)
            if leverage > self.max_leverage:
                logger.warning(f"Leverage exceeds limit: {leverage} > {self.max_leverage}")
                return False
                
            return True
            
        except Exception as e:
            logger.error(f"Error checking leverage limits: {e}")
            return False
            
    async def _get_portfolio_value(self) -> Decimal:
        """Get current portfolio value"""
        # This would integrate with exchange API
        # For now, return a default value
        return Decimal('10000')
        
    async def _calculate_correlation(self, symbol1: str, symbol2: str) -> Decimal:
        """Calculate correlation between two symbols"""
        # This would use actual price data to calculate correlation
        # For now, return a random value for demonstration
        import random
        return Decimal(str(random.uniform(0.1, 0.9)))
        
    async def calculate_position_size(self, signal: Dict, strategy: Strategy) -> Decimal:
        """Calculate optimal position size based on risk parameters"""
        try:
            # Get portfolio value
            portfolio_value = await self._get_portfolio_value()
            
            # Base position size from strategy
            base_size = portfolio_value * strategy.max_position_size
            
            # Adjust for signal confidence
            confidence = signal.get('confidence', 0.5)
            confidence_adjusted = base_size * Decimal(str(confidence))
            
            # Adjust for risk score
            risk_score = signal.get('risk_score', 50)
            risk_adjusted = confidence_adjusted * (Decimal(str(risk_score)) / Decimal('100'))
            
            # Apply Kelly Criterion (simplified)
            win_rate = strategy.winning_trades / strategy.total_trades if strategy.total_trades > 0 else 0.5
            avg_win = strategy.total_pnl / strategy.winning_trades if strategy.winning_trades > 0 else 0.02
            avg_loss = abs(strategy.total_pnl / (strategy.total_trades - strategy.winning_trades)) if strategy.total_trades > strategy.winning_trades else 0.01
            
            if avg_loss > 0:
                kelly_fraction = (win_rate * avg_win - (1 - win_rate) * avg_loss) / avg_win
                kelly_fraction = max(0, min(kelly_fraction, 0.25))  # Cap at 25%
                kelly_adjusted = risk_adjusted * Decimal(str(kelly_fraction))
            else:
                kelly_adjusted = risk_adjusted
                
            # Convert to quantity
            price = signal.get('price', 1)
            quantity = kelly_adjusted / Decimal(str(price))
            
            return max(quantity, Decimal('0'))
            
        except Exception as e:
            logger.error(f"Error calculating position size: {e}")
            return Decimal('0')
            
    async def get_risk_metrics(self) -> Dict:
        """Get current risk metrics"""
        try:
            async with get_async_session() as session:
                # Get latest risk metrics
                result = await session.execute(
                    select(RiskMetrics).order_by(desc(RiskMetrics.calculated_at)).limit(1)
                )
                metrics = result.scalar_one_or_none()
                
                if not metrics:
                    return {}
                    
                # Get position count
                result = await session.execute(
                    select(func.count(Position.id)).where(Position.is_active == True)
                )
                position_count = result.scalar() or 0
                
                # Get open orders count
                result = await session.execute(
                    select(func.count(Order.id)).where(Order.status == 'pending')
                )
                open_orders = result.scalar() or 0
                
                return {
                    "total_equity": float(metrics.total_equity),
                    "available_margin": float(metrics.available_margin),
                    "used_margin": float(metrics.used_margin),
                    "daily_pnl": float(metrics.daily_pnl),
                    "daily_trades": metrics.daily_trades,
                    "position_count": position_count,
                    "open_orders": open_orders,
                    "portfolio_var": float(metrics.portfolio_var) if metrics.portfolio_var else 0,
                    "max_drawdown": float(metrics.max_drawdown) if metrics.max_drawdown else 0,
                    "sharpe_ratio": float(metrics.sharpe_ratio) if metrics.sharpe_ratio else 0
                }
                
        except Exception as e:
            logger.error(f"Error getting risk metrics: {e}")
            return {}
            
    async def update_risk_parameters(self, params: Dict):
        """Update risk management parameters"""
        try:
            if 'max_portfolio_risk' in params:
                self.max_portfolio_risk = Decimal(str(params['max_portfolio_risk']))
                
            if 'max_daily_loss' in params:
                self.max_daily_loss = Decimal(str(params['max_daily_loss']))
                
            if 'max_correlation' in params:
                self.max_correlation = Decimal(str(params['max_correlation']))
                
            if 'max_leverage' in params:
                self.max_leverage = Decimal(str(params['max_leverage']))
                
            if 'min_confidence' in params:
                self.min_confidence = Decimal(str(params['min_confidence']))
                
            logger.info(f"Risk parameters updated: {params}")
            
        except Exception as e:
            logger.error(f"Error updating risk parameters: {e}")
            
    async def emergency_stop_all(self):
        """Emergency stop - close all positions and cancel all orders"""
        logger.critical("EMERGENCY STOP - Closing all positions and orders")
        
        try:
            async with get_async_session() as session:
                # Cancel all pending orders
                result = await session.execute(
                    select(Order).where(Order.status == 'pending')
                )
                orders = result.scalars().all()
                
                for order in orders:
                    order.status = 'cancelled'
                    
                # Close all positions
                result = await session.execute(
                    select(Position).where(Position.is_active == True)
                )
                positions = result.scalars().all()
                
                for position in positions:
                    position.is_active = False
                    position.closed_at = datetime.utcnow()
                    
                await session.commit()
                logger.info("Emergency stop completed")
                
        except Exception as e:
            logger.error(f"Error in emergency stop: {e}")
            
    async def get_portfolio_heatmap(self) -> Dict:
        """Get portfolio risk heatmap"""
        try:
            async with get_async_session() as session:
                # Get all positions with their risk metrics
                result = await session.execute(
                    select(Position).where(Position.is_active == True)
                )
                positions = result.scalars().all()
                
                heatmap_data = {}
                for position in positions:
                    # Calculate position risk metrics
                    position_value = position.quantity * position.current_price
                    portfolio_value = await self._get_portfolio_value()
                    weight = position_value / portfolio_value
                    
                    # Calculate VaR (simplified)
                    volatility = Decimal('0.02')  # 2% daily volatility
                    var_95 = position_value * volatility * Decimal('1.645')  # 95% VaR
                    
                    heatmap_data[position.symbol] = {
                        "weight": float(weight),
                        "value": float(position_value),
                        "var_95": float(var_95),
                        "unrealized_pnl": float(position.unrealized_pnl),
                        "pnl_percentage": float((position.current_price - position.entry_price) / position.entry_price * 100)
                    }
                    
                return heatmap_data
                
        except Exception as e:
            logger.error(f"Error getting portfolio heatmap: {e}")
            return {}
