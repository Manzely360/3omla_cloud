"""
Advanced Strategy Engine with Multiple Trading Strategies
"""

import asyncio
import json
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
import structlog
from sqlalchemy import and_, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_async_session
from models.market_data import Kline, Trade
from models.trading import Strategy, StrategyType

logger = structlog.get_logger()


class StrategyEngine:
    """Advanced strategy engine with multiple trading strategies"""
    
    def __init__(self):
        self.strategies = {
            StrategyType.LEAD_LAG: self._lead_lag_strategy,
            StrategyType.MOMENTUM: self._momentum_strategy,
            StrategyType.MEAN_REVERSION: self._mean_reversion_strategy,
            StrategyType.BREAKOUT: self._breakout_strategy,
            StrategyType.ARBITRAGE: self._arbitrage_strategy,
            StrategyType.COPY_TRADE: self._copy_trade_strategy
        }
        
    async def generate_signals(self, strategy: Strategy) -> List[Dict]:
        """Generate trading signals for a strategy"""
        try:
            strategy_func = self.strategies.get(strategy.strategy_type)
            if not strategy_func:
                logger.warning(f"Unknown strategy type: {strategy.strategy_type}")
                return []
                
            signals = await strategy_func(strategy)
            return signals
            
        except Exception as e:
            logger.error(f"Error generating signals for {strategy.name}: {e}")
            return []
            
    async def _lead_lag_strategy(self, strategy: Strategy) -> List[Dict]:
        """Lead-lag momentum strategy"""
        try:
            signals = []
            
            # Get market data for lead and lag symbols
            config = strategy.config
            lead_symbol = config.get('lead_symbol', 'BTCUSDT')
            lag_symbol = config.get('lag_symbol', 'ETHUSDT')
            lookback_periods = config.get('lookback_periods', 20)
            correlation_threshold = config.get('correlation_threshold', 0.7)
            
            async with get_async_session() as session:
                # Get recent klines for both symbols
                end_time = datetime.utcnow()
                start_time = end_time - timedelta(hours=lookback_periods)
                
                # Lead symbol data
                lead_result = await session.execute(
                    select(Kline).where(
                        and_(
                            Kline.symbol == lead_symbol,
                            Kline.timestamp >= start_time,
                            Kline.timestamp <= end_time
                        )
                    ).order_by(Kline.timestamp)
                )
                lead_klines = lead_result.scalars().all()
                
                # Lag symbol data
                lag_result = await session.execute(
                    select(Kline).where(
                        and_(
                            Kline.symbol == lag_symbol,
                            Kline.timestamp >= start_time,
                            Kline.timestamp <= end_time
                        )
                    ).order_by(Kline.timestamp)
                )
                lag_klines = lag_result.scalars().all()
                
                if len(lead_klines) < lookback_periods or len(lag_klines) < lookback_periods:
                    return signals
                    
                # Calculate returns
                lead_returns = [float(k.close_price) / float(k.open_price) - 1 for k in lead_klines[-lookback_periods:]]
                lag_returns = [float(k.close_price) / float(k.open_price) - 1 for k in lag_klines[-lookback_periods:]]
                
                # Calculate correlation
                correlation = np.corrcoef(lead_returns, lag_returns)[0, 1]
                
                if abs(correlation) < correlation_threshold:
                    return signals
                    
                # Calculate momentum
                lead_momentum = np.mean(lead_returns[-5:])  # Last 5 periods
                lag_momentum = np.mean(lag_returns[-5:])
                
                # Generate signal
                if lead_momentum > 0.01 and lag_momentum < 0.005:  # Lead up, lag flat
                    confidence = min(abs(correlation) * abs(lead_momentum) * 10, 1.0)
                    signals.append({
                        'symbol': lag_symbol,
                        'exchange': 'binance',
                        'action': 'buy',
                        'confidence': confidence,
                        'risk_score': 70,
                        'price': float(lag_klines[-1].close_price),
                        'strategy': 'lead_lag',
                        'metadata': {
                            'lead_symbol': lead_symbol,
                            'correlation': correlation,
                            'lead_momentum': lead_momentum,
                            'lag_momentum': lag_momentum
                        }
                    })
                elif lead_momentum < -0.01 and lag_momentum > -0.005:  # Lead down, lag flat
                    confidence = min(abs(correlation) * abs(lead_momentum) * 10, 1.0)
                    signals.append({
                        'symbol': lag_symbol,
                        'exchange': 'binance',
                        'action': 'sell',
                        'confidence': confidence,
                        'risk_score': 70,
                        'price': float(lag_klines[-1].close_price),
                        'strategy': 'lead_lag',
                        'metadata': {
                            'lead_symbol': lead_symbol,
                            'correlation': correlation,
                            'lead_momentum': lead_momentum,
                            'lag_momentum': lag_momentum
                        }
                    })
                    
            return signals
            
        except Exception as e:
            logger.error(f"Error in lead-lag strategy: {e}")
            return []
            
    async def _momentum_strategy(self, strategy: Strategy) -> List[Dict]:
        """Momentum strategy based on price and volume"""
        try:
            signals = []
            
            config = strategy.config
            symbols = config.get('symbols', ['BTCUSDT', 'ETHUSDT'])
            lookback_periods = config.get('lookback_periods', 20)
            momentum_threshold = config.get('momentum_threshold', 0.02)
            
            async with get_async_session() as session:
                for symbol in symbols:
                    # Get recent klines
                    end_time = datetime.utcnow()
                    start_time = end_time - timedelta(hours=lookback_periods)
                    
                    result = await session.execute(
                        select(Kline).where(
                            and_(
                                Kline.symbol == symbol,
                                Kline.timestamp >= start_time,
                                Kline.timestamp <= end_time
                            )
                        ).order_by(Kline.timestamp)
                    )
                    klines = result.scalars().all()
                    
                    if len(klines) < lookback_periods:
                        continue
                        
                    # Calculate momentum indicators
                    prices = [float(k.close_price) for k in klines]
                    volumes = [float(k.volume) for k in klines]
                    
                    # Price momentum
                    price_momentum = (prices[-1] - prices[-lookback_periods]) / prices[-lookback_periods]
                    
                    # Volume momentum
                    avg_volume = np.mean(volumes[-lookback_periods:])
                    recent_volume = np.mean(volumes[-5:])
                    volume_momentum = (recent_volume - avg_volume) / avg_volume
                    
                    # RSI
                    rsi = self._calculate_rsi(prices, 14)
                    
                    # Generate signals
                    if (price_momentum > momentum_threshold and 
                        volume_momentum > 0.2 and 
                        rsi < 70):  # Not overbought
                        
                        confidence = min(abs(price_momentum) * 5 + min(volume_momentum, 1) * 0.3, 1.0)
                        signals.append({
                            'symbol': symbol,
                            'exchange': 'binance',
                            'action': 'buy',
                            'confidence': confidence,
                            'risk_score': 60,
                            'price': prices[-1],
                            'strategy': 'momentum',
                            'metadata': {
                                'price_momentum': price_momentum,
                                'volume_momentum': volume_momentum,
                                'rsi': rsi
                            }
                        })
                        
                    elif (price_momentum < -momentum_threshold and 
                          volume_momentum > 0.2 and 
                          rsi > 30):  # Not oversold
                        
                        confidence = min(abs(price_momentum) * 5 + min(volume_momentum, 1) * 0.3, 1.0)
                        signals.append({
                            'symbol': symbol,
                            'exchange': 'binance',
                            'action': 'sell',
                            'confidence': confidence,
                            'risk_score': 60,
                            'price': prices[-1],
                            'strategy': 'momentum',
                            'metadata': {
                                'price_momentum': price_momentum,
                                'volume_momentum': volume_momentum,
                                'rsi': rsi
                            }
                        })
                        
            return signals
            
        except Exception as e:
            logger.error(f"Error in momentum strategy: {e}")
            return []
            
    async def _mean_reversion_strategy(self, strategy: Strategy) -> List[Dict]:
        """Mean reversion strategy based on Bollinger Bands"""
        try:
            signals = []
            
            config = strategy.config
            symbols = config.get('symbols', ['BTCUSDT', 'ETHUSDT'])
            lookback_periods = config.get('lookback_periods', 20)
            std_dev = config.get('std_dev', 2)
            
            async with get_async_session() as session:
                for symbol in symbols:
                    # Get recent klines
                    end_time = datetime.utcnow()
                    start_time = end_time - timedelta(hours=lookback_periods)
                    
                    result = await session.execute(
                        select(Kline).where(
                            and_(
                                Kline.symbol == symbol,
                                Kline.timestamp >= start_time,
                                Kline.timestamp <= end_time
                            )
                        ).order_by(Kline.timestamp)
                    )
                    klines = result.scalars().all()
                    
                    if len(klines) < lookback_periods:
                        continue
                        
                    # Calculate Bollinger Bands
                    prices = [float(k.close_price) for k in klines]
                    sma = np.mean(prices)
                    price_std = np.std(prices)
                    
                    upper_band = sma + (std_dev * price_std)
                    lower_band = sma - (std_dev * price_std)
                    
                    current_price = prices[-1]
                    
                    # Generate signals
                    if current_price <= lower_band:  # Oversold
                        confidence = min((lower_band - current_price) / price_std * 0.5, 1.0)
                        signals.append({
                            'symbol': symbol,
                            'exchange': 'binance',
                            'action': 'buy',
                            'confidence': confidence,
                            'risk_score': 50,
                            'price': current_price,
                            'strategy': 'mean_reversion',
                            'metadata': {
                                'sma': sma,
                                'upper_band': upper_band,
                                'lower_band': lower_band,
                                'current_price': current_price,
                                'deviation': (current_price - sma) / price_std
                            }
                        })
                        
                    elif current_price >= upper_band:  # Overbought
                        confidence = min((current_price - upper_band) / price_std * 0.5, 1.0)
                        signals.append({
                            'symbol': symbol,
                            'exchange': 'binance',
                            'action': 'sell',
                            'confidence': confidence,
                            'risk_score': 50,
                            'price': current_price,
                            'strategy': 'mean_reversion',
                            'metadata': {
                                'sma': sma,
                                'upper_band': upper_band,
                                'lower_band': lower_band,
                                'current_price': current_price,
                                'deviation': (current_price - sma) / price_std
                            }
                        })
                        
            return signals
            
        except Exception as e:
            logger.error(f"Error in mean reversion strategy: {e}")
            return []
            
    async def _breakout_strategy(self, strategy: Strategy) -> List[Dict]:
        """Breakout strategy based on support/resistance levels"""
        try:
            signals = []
            
            config = strategy.config
            symbols = config.get('symbols', ['BTCUSDT', 'ETHUSDT'])
            lookback_periods = config.get('lookback_periods', 50)
            breakout_threshold = config.get('breakout_threshold', 0.01)
            
            async with get_async_session() as session:
                for symbol in symbols:
                    # Get recent klines
                    end_time = datetime.utcnow()
                    start_time = end_time - timedelta(hours=lookback_periods)
                    
                    result = await session.execute(
                        select(Kline).where(
                            and_(
                                Kline.symbol == symbol,
                                Kline.timestamp >= start_time,
                                Kline.timestamp <= end_time
                            )
                        ).order_by(Kline.timestamp)
                    )
                    klines = result.scalars().all()
                    
                    if len(klines) < lookback_periods:
                        continue
                        
                    # Calculate support and resistance levels
                    highs = [float(k.high_price) for k in klines]
                    lows = [float(k.low_price) for k in klines]
                    closes = [float(k.close_price) for k in klines]
                    
                    # Find recent highs and lows
                    recent_high = max(highs[-20:])
                    recent_low = min(lows[-20:])
                    current_price = closes[-1]
                    
                    # Check for breakouts
                    if current_price > recent_high * (1 + breakout_threshold):
                        # Bullish breakout
                        confidence = min((current_price - recent_high) / recent_high * 10, 1.0)
                        signals.append({
                            'symbol': symbol,
                            'exchange': 'binance',
                            'action': 'buy',
                            'confidence': confidence,
                            'risk_score': 80,
                            'price': current_price,
                            'strategy': 'breakout',
                            'metadata': {
                                'resistance_level': recent_high,
                                'current_price': current_price,
                                'breakout_percentage': (current_price - recent_high) / recent_high * 100
                            }
                        })
                        
                    elif current_price < recent_low * (1 - breakout_threshold):
                        # Bearish breakout
                        confidence = min((recent_low - current_price) / recent_low * 10, 1.0)
                        signals.append({
                            'symbol': symbol,
                            'exchange': 'binance',
                            'action': 'sell',
                            'confidence': confidence,
                            'risk_score': 80,
                            'price': current_price,
                            'strategy': 'breakout',
                            'metadata': {
                                'support_level': recent_low,
                                'current_price': current_price,
                                'breakout_percentage': (recent_low - current_price) / recent_low * 100
                            }
                        })
                        
            return signals
            
        except Exception as e:
            logger.error(f"Error in breakout strategy: {e}")
            return []
            
    async def _arbitrage_strategy(self, strategy: Strategy) -> List[Dict]:
        """Arbitrage strategy between exchanges"""
        try:
            signals = []
            
            config = strategy.config
            symbols = config.get('symbols', ['BTCUSDT', 'ETHUSDT'])
            min_spread = config.get('min_spread', 0.005)  # 0.5% minimum spread
            
            async with get_async_session() as session:
                for symbol in symbols:
                    # Get latest prices from different exchanges
                    end_time = datetime.utcnow()
                    start_time = end_time - timedelta(minutes=5)
                    
                    # Binance price
                    binance_result = await session.execute(
                        select(Kline).where(
                            and_(
                                Kline.symbol == symbol,
                                Kline.exchange == 'binance',
                                Kline.timestamp >= start_time
                            )
                        ).order_by(desc(Kline.timestamp)).limit(1)
                    )
                    binance_kline = binance_result.scalar_one_or_none()
                    
                    # Bybit price
                    bybit_result = await session.execute(
                        select(Kline).where(
                            and_(
                                Kline.symbol == symbol,
                                Kline.exchange == 'bybit',
                                Kline.timestamp >= start_time
                            )
                        ).order_by(desc(Kline.timestamp)).limit(1)
                    )
                    bybit_kline = bybit_result.scalar_one_or_none()
                    
                    if not binance_kline or not bybit_kline:
                        continue
                        
                    binance_price = float(binance_kline.close_price)
                    bybit_price = float(bybit_kline.close_price)
                    
                    # Calculate spread
                    spread = abs(binance_price - bybit_price) / min(binance_price, bybit_price)
                    
                    if spread > min_spread:
                        if binance_price > bybit_price:
                            # Buy on Bybit, sell on Binance
                            confidence = min(spread * 20, 1.0)
                            signals.extend([
                                {
                                    'symbol': symbol,
                                    'exchange': 'bybit',
                                    'action': 'buy',
                                    'confidence': confidence,
                                    'risk_score': 90,
                                    'price': bybit_price,
                                    'strategy': 'arbitrage',
                                    'metadata': {
                                        'binance_price': binance_price,
                                        'bybit_price': bybit_price,
                                        'spread': spread,
                                        'arbitrage_type': 'buy_bybit_sell_binance'
                                    }
                                },
                                {
                                    'symbol': symbol,
                                    'exchange': 'binance',
                                    'action': 'sell',
                                    'confidence': confidence,
                                    'risk_score': 90,
                                    'price': binance_price,
                                    'strategy': 'arbitrage',
                                    'metadata': {
                                        'binance_price': binance_price,
                                        'bybit_price': bybit_price,
                                        'spread': spread,
                                        'arbitrage_type': 'buy_bybit_sell_binance'
                                    }
                                }
                            ])
                        else:
                            # Buy on Binance, sell on Bybit
                            confidence = min(spread * 20, 1.0)
                            signals.extend([
                                {
                                    'symbol': symbol,
                                    'exchange': 'binance',
                                    'action': 'buy',
                                    'confidence': confidence,
                                    'risk_score': 90,
                                    'price': binance_price,
                                    'strategy': 'arbitrage',
                                    'metadata': {
                                        'binance_price': binance_price,
                                        'bybit_price': bybit_price,
                                        'spread': spread,
                                        'arbitrage_type': 'buy_binance_sell_bybit'
                                    }
                                },
                                {
                                    'symbol': symbol,
                                    'exchange': 'bybit',
                                    'action': 'sell',
                                    'confidence': confidence,
                                    'risk_score': 90,
                                    'price': bybit_price,
                                    'strategy': 'arbitrage',
                                    'metadata': {
                                        'binance_price': binance_price,
                                        'bybit_price': bybit_price,
                                        'spread': spread,
                                        'arbitrage_type': 'buy_binance_sell_bybit'
                                    }
                                }
                            ])
                            
            return signals
            
        except Exception as e:
            logger.error(f"Error in arbitrage strategy: {e}")
            return []
            
    async def _copy_trade_strategy(self, strategy: Strategy) -> List[Dict]:
        """Copy trading strategy based on whale movements"""
        try:
            signals = []
            
            config = strategy.config
            trader_addresses = config.get('trader_addresses', [])
            min_trade_size = config.get('min_trade_size', 10000)  # $10k minimum
            copy_ratio = config.get('copy_ratio', 0.1)  # Copy 10% of their position
            
            # This would integrate with blockchain data or exchange APIs
            # to track large trades and copy them
            # For now, return empty signals
            
            return signals
            
        except Exception as e:
            logger.error(f"Error in copy trade strategy: {e}")
            return []
            
    def _calculate_rsi(self, prices: List[float], period: int = 14) -> float:
        """Calculate RSI indicator"""
        try:
            if len(prices) < period + 1:
                return 50.0
                
            deltas = [prices[i] - prices[i-1] for i in range(1, len(prices))]
            gains = [d if d > 0 else 0 for d in deltas]
            losses = [-d if d < 0 else 0 for d in deltas]
            
            avg_gain = np.mean(gains[-period:])
            avg_loss = np.mean(losses[-period:])
            
            if avg_loss == 0:
                return 100.0
                
            rs = avg_gain / avg_loss
            rsi = 100 - (100 / (1 + rs))
            
            return rsi
            
        except Exception as e:
            logger.error(f"Error calculating RSI: {e}")
            return 50.0
            
    async def backtest_strategy(self, strategy: Strategy, start_date: datetime, end_date: datetime, initial_capital: float) -> Dict:
        """Backtest a strategy"""
        try:
            # This would implement comprehensive backtesting
            # For now, return mock results
            
            return {
                "total_return": 0.15,  # 15% return
                "sharpe_ratio": 1.2,
                "max_drawdown": 0.08,  # 8% max drawdown
                "win_rate": 0.65,      # 65% win rate
                "total_trades": 150,
                "equity_curve": [],
                "trade_history": [],
                "metrics": {
                    "annual_return": 0.15,
                    "volatility": 0.12,
                    "calmar_ratio": 1.875,
                    "sortino_ratio": 1.8
                }
            }
            
        except Exception as e:
            logger.error(f"Error backtesting strategy: {e}")
            return {}
