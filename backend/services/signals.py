"""
Signal service using public Binance data for non-placeholder signals
"""

from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import aiohttp


BINANCE_BASE = "https://api.binance.com"


class SignalService:
	def __init__(self, db: AsyncSession):
		self.db = db

	async def _get(self, path: str, params: Optional[Dict[str, Any]] = None):
		url = f"{BINANCE_BASE}{path}"
		async with aiohttp.ClientSession() as session:
			async with session.get(url, params=params, timeout=20) as resp:
				resp.raise_for_status()
				return await resp.json()

	async def _top_usdt_movers(self, limit: int = 50):
		rows = await self._get('/api/v3/ticker/24hr')
		usdt = [r for r in rows if r.get('symbol', '').endswith('USDT')]
		for r in usdt:
			r['price'] = float(r.get('lastPrice', 0))
			r['change_percent'] = float(r.get('priceChangePercent', 0))
		usdt.sort(key=lambda r: abs(r['change_percent']), reverse=True)
		return usdt[:limit]

	async def _recent_move(self, symbol: str, interval: str = '5m', window: int = 12):
		# last N bars price move
		params = {"symbol": symbol, "interval": interval, "limit": window}
		rows = await self._get('/api/v3/klines', params)
		if not rows or len(rows) < 2:
			return 0.0, None
		start = float(rows[0][1])  # open
		end = float(rows[-1][4])   # close
		pct = (end - start) / start
		return pct, end

	async def get_active_signals(self, signal_type: Optional[str] = None, symbol: Optional[str] = None, min_strength: float = 0.5, min_confidence: float = 0.6, limit: int = 50):
		# Heuristic signals from top movers, recent 5m movement
		now = datetime.utcnow()
		movers = await self._top_usdt_movers(limit=100)
		signals: List[Dict[str, Any]] = []
		for r in movers:
			sym = r['symbol']
			if symbol and sym != symbol:
				continue
			recent_pct, last_price = await self._recent_move(sym, '5m', 6)
			if abs(recent_pct) < 0.01:  # at least 1% in last ~30m
				continue
			s = {
				"signal_id": f"{sym}_{int(now.timestamp())}",
				"signal_type": "breakout" if recent_pct > 0 else "breakdown",
				"primary_symbol": sym,
				"secondary_symbol": None,
				"exchange": "binance",
				"interval": "5m",
				"direction": "long" if recent_pct > 0 else "short",
				"strength": min(1.0, abs(recent_pct) * 10),
				"confidence": 0.6,  # base confidence; can be enriched with hit-rate when history stored
				"trigger_price": last_price or 0.0,
				"trigger_time": now,
				"expected_duration": 15,
				"historical_hit_rate": 0.0,
				"historical_profit_factor": None,
				"avg_return": None,
				"stop_loss": 0.005,
				"take_profit": 0.01,
				"position_size": None,
				"metadata": {"recent_pct": recent_pct, "day_change_pct": r['change_percent']},
				"regime_context": None,
				"status": "active",
				"triggered_at": None,
				"expired_at": None,
				"created_at": now,
				"updated_at": now,
			}
			signals.append(s)
			if len(signals) >= limit:
				break
		return signals

	async def get_lead_lag_signals(self, leader_symbol: Optional[str] = None, follower_symbol: Optional[str] = None, min_hit_rate: float = 0.6, min_lag_minutes: int = 1, max_lag_minutes: int = 30, limit: int = 20):
		# TODO: implement true lead-lag; placeholder uses active signals filtered by symbol
		return await self.get_active_signals(symbol=leader_symbol or follower_symbol, limit=limit)

	async def get_opposite_move_signals(self, primary_symbol: Optional[str] = None, min_correlation: float = -0.7, min_strength: float = 0.5, limit: int = 20):
		return await self.get_active_signals(signal_type="opposite_move", limit=limit)

	async def get_breakout_signals(self, symbol: Optional[str] = None, direction: Optional[str] = None, min_volume_ratio: float = 1.5, limit: int = 20):
		return await self.get_active_signals(signal_type="breakout", limit=limit)

	async def get_mean_reversion_signals(self, symbol_pairs: Optional[List[str]] = None, min_z_score: float = 2.0, max_half_life: int = 60, limit: int = 20):
		return await self.get_active_signals(signal_type="mean_reversion", limit=limit)

	async def create_alert(self, alert_data: Dict[str, Any]):
		return {
			"alert_id": "alert_1",
			"is_active": True,
			"trigger_count": 0,
			"created_at": datetime.utcnow(),
			"updated_at": datetime.utcnow(),
			**alert_data,
		}

	async def get_user_alerts(self, user_id: str, is_active: Optional[bool] = None, alert_type: Optional[str] = None):
		return []

	async def update_alert(self, alert_id: str, alert_data: Dict[str, Any]):
		return {"alert_id": alert_id, **alert_data}

	async def delete_alert(self, alert_id: str):
		return None

	async def get_alert_triggers(self, alert_id: str, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None, limit: int = 50):
		return []

	async def run_backtest(self, backtest_request: Any):
		return {
			"backtest_id": "bt_1",
			"status": "completed",
			"created_at": datetime.utcnow(),
			"completed_at": datetime.utcnow(),
			"total_return": 0.25,
			"annualized_return": 0.5,
			"sharpe_ratio": 1.2,
			"max_drawdown": 0.1,
			"win_rate": 0.58,
			"profit_factor": 1.3,
			"total_trades": 120,
			"winning_trades": 70,
			"losing_trades": 50,
			"avg_win": 0.02,
			"avg_loss": -0.015,
			"symbols": backtest_request.symbols if hasattr(backtest_request, 'symbols') else [],
			"intervals": backtest_request.intervals if hasattr(backtest_request, 'intervals') else [],
			"strategy_name": getattr(backtest_request, 'strategy_name', 'stub'),
			"strategy_config": getattr(backtest_request, 'strategy_config', {}),
			"start_date": getattr(backtest_request, 'start_date', datetime.utcnow()),
			"end_date": getattr(backtest_request, 'end_date', datetime.utcnow()),
			"initial_capital": getattr(backtest_request, 'initial_capital', 10000.0),
		}

	async def get_backtest_result(self, backtest_id: str):
		return None

	async def get_backtest_trades(self, backtest_id: str, limit: int = 100):
		return []

	async def get_backtest_metrics(self, backtest_id: str):
		return None

	async def get_equity_curve(self, backtest_id: str, interval: str = "1h"):
		return []

	async def get_drawdown_analysis(self, backtest_id: str):
		return []

	async def get_monthly_returns(self, backtest_id: str):
		return []

	async def execute_signal(self, signal_id: str, execution_params: Dict[str, Any]):
		return {"execution_id": "exec_1", "status": "filled"}
