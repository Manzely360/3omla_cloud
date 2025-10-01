"""
Real-Time Analysis Engine
Computes technical indicators and trading signals in real-time
"""

import asyncio
import json
import time
import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
import structlog
import redis.asyncio as redis
from prometheus_client import Counter, Gauge, Histogram
import os

logger = structlog.get_logger()

@dataclass
class TechnicalIndicator:
    symbol: str
    indicator_type: str
    value: float
    timestamp: float
    parameters: Dict[str, Any]

@dataclass
class TradingSignal:
    symbol: str
    signal_type: str
    strength: float  # 0-1
    direction: str  # 'buy', 'sell', 'hold'
    price: float
    timestamp: float
    indicators: Dict[str, float]
    description: str

class RealTimeAnalysisEngine:
    def __init__(self):
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        self.redis = redis.from_url(self.redis_url, decode_responses=True)
        
        # Analysis parameters
        self.price_window = 100  # Number of price points for analysis
        self.analysis_interval = 5  # Analysis interval in seconds
        self.signal_threshold = 0.6  # Minimum signal strength
        
        # Metrics
        self.indicators_computed = Counter("indicators_computed_total", "Technical indicators computed", ["symbol", "indicator_type"])
        self.signals_generated = Counter("signals_generated_total", "Trading signals generated", ["symbol", "signal_type"])
        self.analysis_latency = Histogram("analysis_latency_seconds", "Analysis processing time", ["symbol"])
        self.active_symbols = Gauge("active_analysis_symbols", "Number of symbols being analyzed")
        
        # Data storage
        self.price_data: Dict[str, List[float]] = {}
        self.indicators: Dict[str, Dict[str, float]] = {}
        self.signals: Dict[str, List[TradingSignal]] = {}
        
    async def initialize(self):
        """Initialize the analysis engine"""
        try:
            await self.redis.ping()
            logger.info("Real-time analysis engine initialized")
        except Exception as e:
            logger.error("Failed to initialize analysis engine", error=str(e))
            raise
    
    async def get_price_data(self, symbol: str, window: int = None) -> List[float]:
        """Get recent price data for a symbol"""
        try:
            if window is None:
                window = self.price_window
            
            # Get data from all exchanges
            exchanges = ["binance", "bybit", "kucoin", "coinbase", "kraken", "okx", "gateio", "huobi"]
            all_prices = []
            
            for exchange in exchanges:
                key = f"rt:prices:{symbol}:{exchange}"
                data = await self.redis.lrange(key, 0, window - 1)
                
                for item in data:
                    try:
                        price_data = json.loads(item)
                        all_prices.append((price_data['timestamp'], price_data['price']))
                    except:
                        continue
            
            # Sort by timestamp and extract prices
            all_prices.sort(key=lambda x: x[0])
            prices = [price for _, price in all_prices[-window:]]
            
            return prices
            
        except Exception as e:
            logger.error(f"Failed to get price data for {symbol}", error=str(e))
            return []
    
    def calculate_sma(self, prices: List[float], period: int) -> float:
        """Calculate Simple Moving Average"""
        if len(prices) < period:
            return 0.0
        return sum(prices[-period:]) / period
    
    def calculate_ema(self, prices: List[float], period: int) -> float:
        """Calculate Exponential Moving Average"""
        if len(prices) < period:
            return 0.0
        
        multiplier = 2 / (period + 1)
        ema = prices[0]
        
        for price in prices[1:]:
            ema = (price * multiplier) + (ema * (1 - multiplier))
        
        return ema
    
    def calculate_rsi(self, prices: List[float], period: int = 14) -> float:
        """Calculate Relative Strength Index"""
        if len(prices) < period + 1:
            return 50.0
        
        deltas = [prices[i] - prices[i-1] for i in range(1, len(prices))]
        gains = [d if d > 0 else 0 for d in deltas]
        losses = [-d if d < 0 else 0 for d in deltas]
        
        avg_gain = sum(gains[-period:]) / period
        avg_loss = sum(losses[-period:]) / period
        
        if avg_loss == 0:
            return 100.0
        
        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))
        
        return rsi
    
    def calculate_macd(self, prices: List[float], fast: int = 12, slow: int = 26, signal: int = 9) -> Dict[str, float]:
        """Calculate MACD (Moving Average Convergence Divergence)"""
        if len(prices) < slow:
            return {"macd": 0.0, "signal": 0.0, "histogram": 0.0}
        
        ema_fast = self.calculate_ema(prices, fast)
        ema_slow = self.calculate_ema(prices, slow)
        
        macd = ema_fast - ema_slow
        
        # For signal line, we need MACD values over time
        # This is simplified - in practice, you'd store MACD history
        signal_line = macd  # Simplified
        histogram = macd - signal_line
        
        return {
            "macd": macd,
            "signal": signal_line,
            "histogram": histogram
        }
    
    def calculate_bollinger_bands(self, prices: List[float], period: int = 20, std_dev: float = 2) -> Dict[str, float]:
        """Calculate Bollinger Bands"""
        if len(prices) < period:
            return {"upper": 0.0, "middle": 0.0, "lower": 0.0}
        
        sma = self.calculate_sma(prices, period)
        recent_prices = prices[-period:]
        
        variance = sum((price - sma) ** 2 for price in recent_prices) / period
        std = np.sqrt(variance)
        
        return {
            "upper": sma + (std * std_dev),
            "middle": sma,
            "lower": sma - (std * std_dev)
        }
    
    def calculate_stochastic(self, prices: List[float], k_period: int = 14, d_period: int = 3) -> Dict[str, float]:
        """Calculate Stochastic Oscillator"""
        if len(prices) < k_period:
            return {"k": 50.0, "d": 50.0}
        
        recent_prices = prices[-k_period:]
        highest_high = max(recent_prices)
        lowest_low = min(recent_prices)
        current_price = prices[-1]
        
        if highest_high == lowest_low:
            k = 50.0
        else:
            k = ((current_price - lowest_low) / (highest_high - lowest_low)) * 100
        
        # For %D, we'd need %K values over time
        # This is simplified
        d = k  # Simplified
        
        return {"k": k, "d": d}
    
    def calculate_atr(self, prices: List[float], period: int = 14) -> float:
        """Calculate Average True Range"""
        if len(prices) < period + 1:
            return 0.0
        
        true_ranges = []
        for i in range(1, len(prices)):
            high = prices[i]  # Simplified - in practice, you'd have OHLC data
            low = prices[i-1]
            close = prices[i-1]
            
            tr1 = high - low
            tr2 = abs(high - close)
            tr3 = abs(low - close)
            
            true_range = max(tr1, tr2, tr3)
            true_ranges.append(true_range)
        
        if len(true_ranges) < period:
            return 0.0
        
        return sum(true_ranges[-period:]) / period
    
    def calculate_indicators(self, symbol: str, prices: List[float]) -> Dict[str, float]:
        """Calculate all technical indicators for a symbol"""
        if len(prices) < 20:  # Minimum data required
            return {}
        
        indicators = {}
        
        try:
            # Moving Averages
            indicators["sma_20"] = self.calculate_sma(prices, 20)
            indicators["sma_50"] = self.calculate_sma(prices, 50)
            indicators["ema_12"] = self.calculate_ema(prices, 12)
            indicators["ema_26"] = self.calculate_ema(prices, 26)
            
            # RSI
            indicators["rsi_14"] = self.calculate_rsi(prices, 14)
            
            # MACD
            macd_data = self.calculate_macd(prices)
            indicators.update(macd_data)
            
            # Bollinger Bands
            bb_data = self.calculate_bollinger_bands(prices)
            indicators.update(bb_data)
            
            # Stochastic
            stoch_data = self.calculate_stochastic(prices)
            indicators.update(stoch_data)
            
            # ATR
            indicators["atr_14"] = self.calculate_atr(prices)
            
            # Price-based indicators
            current_price = prices[-1]
            indicators["price"] = current_price
            indicators["price_change_1h"] = ((current_price - prices[-12]) / prices[-12] * 100) if len(prices) >= 12 else 0
            indicators["price_change_4h"] = ((current_price - prices[-48]) / prices[-48] * 100) if len(prices) >= 48 else 0
            indicators["price_change_24h"] = ((current_price - prices[-288]) / prices[-288] * 100) if len(prices) >= 288 else 0
            
            # Volume indicators (simplified)
            indicators["volume_sma_20"] = 0  # Would need volume data
            indicators["volume_ratio"] = 1.0  # Would need volume data
            
        except Exception as e:
            logger.error(f"Failed to calculate indicators for {symbol}", error=str(e))
            return {}
        
        return indicators
    
    def generate_trading_signals(self, symbol: str, indicators: Dict[str, float]) -> List[TradingSignal]:
        """Generate trading signals based on technical indicators"""
        signals = []
        
        try:
            current_price = indicators.get("price", 0)
            if current_price == 0:
                return signals
            
            # RSI signals
            rsi = indicators.get("rsi_14", 50)
            if rsi < 30:
                signals.append(TradingSignal(
                    symbol=symbol,
                    signal_type="rsi_oversold",
                    strength=min(1.0, (30 - rsi) / 30),
                    direction="buy",
                    price=current_price,
                    timestamp=time.time(),
                    indicators={"rsi": rsi},
                    description=f"RSI oversold at {rsi:.2f}"
                ))
            elif rsi > 70:
                signals.append(TradingSignal(
                    symbol=symbol,
                    signal_type="rsi_overbought",
                    strength=min(1.0, (rsi - 70) / 30),
                    direction="sell",
                    price=current_price,
                    timestamp=time.time(),
                    indicators={"rsi": rsi},
                    description=f"RSI overbought at {rsi:.2f}"
                ))
            
            # MACD signals
            macd = indicators.get("macd", 0)
            signal_line = indicators.get("signal", 0)
            histogram = indicators.get("histogram", 0)
            
            if macd > signal_line and histogram > 0:
                signals.append(TradingSignal(
                    symbol=symbol,
                    signal_type="macd_bullish",
                    strength=min(1.0, abs(histogram) / current_price * 1000),
                    direction="buy",
                    price=current_price,
                    timestamp=time.time(),
                    indicators={"macd": macd, "signal": signal_line, "histogram": histogram},
                    description="MACD bullish crossover"
                ))
            elif macd < signal_line and histogram < 0:
                signals.append(TradingSignal(
                    symbol=symbol,
                    signal_type="macd_bearish",
                    strength=min(1.0, abs(histogram) / current_price * 1000),
                    direction="sell",
                    price=current_price,
                    timestamp=time.time(),
                    indicators={"macd": macd, "signal": signal_line, "histogram": histogram},
                    description="MACD bearish crossover"
                ))
            
            # Bollinger Bands signals
            upper_bb = indicators.get("upper", 0)
            lower_bb = indicators.get("lower", 0)
            middle_bb = indicators.get("middle", 0)
            
            if current_price < lower_bb:
                signals.append(TradingSignal(
                    symbol=symbol,
                    signal_type="bb_oversold",
                    strength=min(1.0, (lower_bb - current_price) / (upper_bb - lower_bb)),
                    direction="buy",
                    price=current_price,
                    timestamp=time.time(),
                    indicators={"upper_bb": upper_bb, "lower_bb": lower_bb, "middle_bb": middle_bb},
                    description="Price below lower Bollinger Band"
                ))
            elif current_price > upper_bb:
                signals.append(TradingSignal(
                    symbol=symbol,
                    signal_type="bb_overbought",
                    strength=min(1.0, (current_price - upper_bb) / (upper_bb - lower_bb)),
                    direction="sell",
                    price=current_price,
                    timestamp=time.time(),
                    indicators={"upper_bb": upper_bb, "lower_bb": lower_bb, "middle_bb": middle_bb},
                    description="Price above upper Bollinger Band"
                ))
            
            # Moving Average signals
            sma_20 = indicators.get("sma_20", 0)
            sma_50 = indicators.get("sma_50", 0)
            
            if sma_20 > sma_50 and current_price > sma_20:
                signals.append(TradingSignal(
                    symbol=symbol,
                    signal_type="ma_bullish",
                    strength=min(1.0, (sma_20 - sma_50) / sma_50),
                    direction="buy",
                    price=current_price,
                    timestamp=time.time(),
                    indicators={"sma_20": sma_20, "sma_50": sma_50},
                    description="Price above rising moving averages"
                ))
            elif sma_20 < sma_50 and current_price < sma_20:
                signals.append(TradingSignal(
                    symbol=symbol,
                    signal_type="ma_bearish",
                    strength=min(1.0, (sma_50 - sma_20) / sma_50),
                    direction="sell",
                    price=current_price,
                    timestamp=time.time(),
                    indicators={"sma_20": sma_20, "sma_50": sma_50},
                    description="Price below falling moving averages"
                ))
            
            # Stochastic signals
            stoch_k = indicators.get("k", 50)
            stoch_d = indicators.get("d", 50)
            
            if stoch_k < 20 and stoch_d < 20:
                signals.append(TradingSignal(
                    symbol=symbol,
                    signal_type="stoch_oversold",
                    strength=min(1.0, (20 - stoch_k) / 20),
                    direction="buy",
                    price=current_price,
                    timestamp=time.time(),
                    indicators={"stoch_k": stoch_k, "stoch_d": stoch_d},
                    description="Stochastic oversold"
                ))
            elif stoch_k > 80 and stoch_d > 80:
                signals.append(TradingSignal(
                    symbol=symbol,
                    signal_type="stoch_overbought",
                    strength=min(1.0, (stoch_k - 80) / 20),
                    direction="sell",
                    price=current_price,
                    timestamp=time.time(),
                    indicators={"stoch_k": stoch_k, "stoch_d": stoch_d},
                    description="Stochastic overbought"
                ))
            
        except Exception as e:
            logger.error(f"Failed to generate signals for {symbol}", error=str(e))
        
        return signals
    
    async def analyze_symbol(self, symbol: str):
        """Analyze a single symbol"""
        try:
            start_time = time.time()
            
            # Get price data
            prices = await self.get_price_data(symbol)
            if len(prices) < 20:
                return
            
            # Calculate indicators
            indicators = self.calculate_indicators(symbol, prices)
            if not indicators:
                return
            
            # Store indicators
            self.indicators[symbol] = indicators
            
            # Generate signals
            signals = self.generate_trading_signals(symbol, indicators)
            
            # Store signals
            if symbol not in self.signals:
                self.signals[symbol] = []
            
            # Keep only recent signals
            self.signals[symbol] = [s for s in self.signals[symbol] if time.time() - s.timestamp < 3600]  # 1 hour
            
            # Add new signals
            for signal in signals:
                if signal.strength >= self.signal_threshold:
                    self.signals[symbol].append(signal)
            
            # Store in Redis
            await self.store_analysis_data(symbol, indicators, signals)
            
            # Update metrics
            for indicator_type in indicators.keys():
                self.indicators_computed.labels(symbol=symbol, indicator_type=indicator_type).inc()
            
            for signal in signals:
                if signal.strength >= self.signal_threshold:
                    self.signals_generated.labels(symbol=symbol, signal_type=signal.signal_type).inc()
            
            self.analysis_latency.labels(symbol=symbol).observe(time.time() - start_time)
            
        except Exception as e:
            logger.error(f"Failed to analyze {symbol}", error=str(e))
    
    async def store_analysis_data(self, symbol: str, indicators: Dict[str, float], signals: List[TradingSignal]):
        """Store analysis data in Redis"""
        try:
            # Store indicators
            indicators_key = f"indicators:{symbol}"
            await self.redis.setex(indicators_key, 300, json.dumps(indicators))
            
            # Store signals
            signals_key = f"signals:{symbol}"
            signals_data = [asdict(signal) for signal in signals if signal.strength >= self.signal_threshold]
            await self.redis.setex(signals_key, 300, json.dumps(signals_data))
            
            # Store aggregated analysis
            analysis_data = {
                "symbol": symbol,
                "indicators": indicators,
                "signals": signals_data,
                "timestamp": time.time(),
                "signal_count": len(signals_data)
            }
            
            analysis_key = f"analysis:{symbol}"
            await self.redis.setex(analysis_key, 300, json.dumps(analysis_data))
            
        except Exception as e:
            logger.error(f"Failed to store analysis data for {symbol}", error=str(e))
    
    async def get_active_symbols(self) -> List[str]:
        """Get list of active symbols to analyze"""
        try:
            # Get symbols from aggregated data
            pattern = "aggregated_data:*"
            keys = await self.redis.keys(pattern)
            
            symbols = []
            for key in keys:
                data = await self.redis.get(key)
                if data:
                    symbol_data = json.loads(data)
                    symbols.append(symbol_data["symbol"])
            
            return symbols[:50]  # Limit to top 50 symbols
            
        except Exception as e:
            logger.error("Failed to get active symbols", error=str(e))
            return []
    
    async def run(self):
        """Main analysis loop"""
        try:
            logger.info("Starting Real-Time Analysis Engine")
            
            # Initialize
            await self.initialize()
            
            while True:
                start_time = time.time()
                
                # Get active symbols
                symbols = await self.get_active_symbols()
                self.active_symbols.set(len(symbols))
                
                if symbols:
                    # Analyze all symbols in parallel
                    tasks = [self.analyze_symbol(symbol) for symbol in symbols]
                    await asyncio.gather(*tasks, return_exceptions=True)
                
                # Wait for next analysis cycle
                elapsed = time.time() - start_time
                sleep_time = max(0, self.analysis_interval - elapsed)
                if sleep_time > 0:
                    await asyncio.sleep(sleep_time)
                
        except KeyboardInterrupt:
            logger.info("Analysis engine stopped by user")
        except Exception as e:
            logger.error("Analysis engine failed", error=str(e))
            raise
        finally:
            if self.redis:
                await self.redis.close()
            logger.info("Analysis engine cleanup completed")

async def main():
    """Main entry point"""
    engine = RealTimeAnalysisEngine()
    await engine.run()

if __name__ == "__main__":
    asyncio.run(main())

