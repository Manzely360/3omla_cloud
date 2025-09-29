"""
Market data service with live public data fallbacks (Binance primary, Bybit secondary)
"""

from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, timedelta
import aiohttp
import asyncio
import statistics

import structlog

from services.coinmarketcap import CoinMarketCapService


BINANCE_BASE = "https://api.binance.com"
BYBIT_BASE = "https://api.bybit.com"

# compact in-memory cache for hot endpoints (per exchange scope)
_CACHE: Dict[Tuple[str, Tuple[Tuple[str, Any], ...] | None], Tuple[float, Any]] = {}
_CACHE_TTL = {
	"binance:/api/v3/ticker/24hr": 15.0,
	"binance:/api/v3/ticker/price": 10.0,
	"bybit:/v5/market/tickers": 5.0,
}

_MARKET_OVERVIEW_CACHE: Dict[str, Tuple[float, Dict[str, Any]]] = {}
_MARKET_OVERVIEW_TTL = 45.0

_cmc_service = CoinMarketCapService()

logger = structlog.get_logger()

BYBIT_INTERVAL_MAP = {
	"1m": "1",
	"3m": "3",
	"5m": "5",
	"15m": "15",
	"30m": "30",
	"1h": "60",
	"2h": "120",
	"4h": "240",
	"6h": "360",
	"12h": "720",
	"1d": "D",
}


class MarketDataService:
	def __init__(self, db: AsyncSession):
		self.db = db
		from services.exchanges import multi_exchange_connector
		self.exchange_connector = multi_exchange_connector

	async def _get_http(self, base: str, path: str, params: Optional[Dict[str, Any]], scope: str):
		url = f"{base}{path}"
		cache_key = None
		now = asyncio.get_event_loop().time()
		ttl_key = f"{scope}:{path}"
		if ttl_key in _CACHE_TTL:
			key_params = tuple(sorted((params or {}).items())) if params else None
			cache_key = (ttl_key, key_params)
			entry = _CACHE.get(cache_key)
			if entry and (now - entry[0]) < _CACHE_TTL[ttl_key]:
				return entry[1]

		async with aiohttp.ClientSession() as session:
			async with session.get(url, params=params, timeout=20) as resp:
				resp.raise_for_status()
				data = await resp.json()
				if cache_key is not None:
					_CACHE[cache_key] = (now, data)
				return data

	async def _get(self, path: str, params: Optional[Dict[str, Any]] = None):
		return await self._get_http(BINANCE_BASE, path, params, scope="binance")

	async def _get_bybit(self, path: str, params: Optional[Dict[str, Any]] = None):
		return await self._get_http(BYBIT_BASE, path, params, scope="bybit")

	async def get_symbols(self, exchange: str = "binance", is_active: bool = True, quote_asset: Optional[str] = None, limit: int = 100):
		info = await self._get('/api/v3/exchangeInfo')
		syms = []
		for s in info.get('symbols', []):
			if s.get('status') != 'TRADING':
				continue
			if quote_asset and s.get('quoteAsset') != quote_asset:
				continue
			syms.append({
				"id": len(syms)+1,
				"symbol": s['symbol'],
				"base_asset": s['baseAsset'],
				"quote_asset": s['quoteAsset'],
				"exchange": exchange,
				"is_active": True,
				"created_at": datetime.utcnow(),
				"updated_at": datetime.utcnow(),
			})
		return syms[:limit]

	async def get_top_symbols_by_volume(
		self,
		quote_asset: str = "USDT",
		limit: int = 20,
		min_quote_volume: float = 0.0,
	) -> List[str]:
		"""Return top symbols by 24h quote volume for the requested quote asset."""
		try:
			stats = await self._get('/api/v3/ticker/24hr')
			filtered: List[Tuple[str, float]] = []
			for entry in stats:
				if not isinstance(entry, dict):
					continue
				symbol = str(entry.get('symbol') or '')
				if not symbol.endswith(quote_asset.upper()):
					continue
				try:
					quote_volume = float(entry.get('quoteVolume') or 0.0)
				except Exception:
					quote_volume = 0.0
				if quote_volume < min_quote_volume:
					continue
				filtered.append((symbol, quote_volume))
			filtered.sort(key=lambda item: item[1], reverse=True)
			return [sym for sym, _ in filtered[:limit]]
		except Exception:
			return []

	async def get_klines(self, symbol: str, interval: str = "15m", start_time: Optional[datetime] = None, end_time: Optional[datetime] = None, limit: int = 500):
		params: Dict[str, Any] = {"symbol": symbol, "interval": interval, "limit": min(limit, 1000)}
		if start_time:
			params["startTime"] = int(start_time.timestamp() * 1000)
		if end_time:
			params["endTime"] = int(end_time.timestamp() * 1000)

		binance_rows: Optional[List[Any]] = None
		try:
			binance_rows = await self._get('/api/v3/klines', params)
		except Exception:
			binance_rows = None

		out: List[Dict[str, Any]] = []
		if binance_rows:
			for i, r in enumerate(binance_rows):
				out.append({
					"id": i + 1,
					"symbol": symbol,
					"exchange": "binance",
					"interval": interval,
					"open_time": datetime.utcfromtimestamp(r[0] / 1000),
					"close_time": datetime.utcfromtimestamp(r[6] / 1000),
					"open_price": float(r[1]),
					"high_price": float(r[2]),
					"low_price": float(r[3]),
					"close_price": float(r[4]),
					"volume": float(r[5]),
					"quote_volume": float(r[7]),
					"trades_count": int(r[8]),
					"taker_buy_volume": float(r[9]),
					"taker_buy_quote_volume": float(r[10]),
					"created_at": datetime.utcnow(),
				})
			return out

		# Fallback to Bybit spot market
		bybit_interval = BYBIT_INTERVAL_MAP.get(interval, BYBIT_INTERVAL_MAP.get('15m', '15'))
		bybit_params = {
			"category": "spot",
			"symbol": symbol,
			"interval": bybit_interval,
			"limit": min(limit, 1000),
		}
		if start_time:
			bybit_params["start"] = int(start_time.timestamp() * 1000)
		if end_time:
			bybit_params["end"] = int(end_time.timestamp() * 1000)

		try:
			rows = await self._get_bybit('/v5/market/kline', bybit_params)
		except Exception:
			return []

		items = rows.get('result', {}).get('list', []) if isinstance(rows, dict) else []
		if not items:
			return []

		items_sorted = sorted(items, key=lambda entry: int(entry[0]))
		for i, r in enumerate(items_sorted):
			start_ms = int(r[0])
			open_price = float(r[1])
			high_price = float(r[2])
			low_price = float(r[3])
			close_price = float(r[4])
			volume = float(r[5])
			turnover = float(r[6]) if len(r) > 6 else volume * close_price
			open_time = datetime.utcfromtimestamp(start_ms / 1000)
			close_time = open_time + timedelta(seconds=self._interval_to_seconds(interval))
			out.append({
				"id": i + 1,
				"symbol": symbol,
				"exchange": "bybit",
				"interval": interval,
				"open_time": open_time,
				"close_time": close_time,
				"open_price": open_price,
				"high_price": high_price,
				"low_price": low_price,
				"close_price": close_price,
				"volume": volume,
				"quote_volume": turnover,
				"trades_count": 0,
				"taker_buy_volume": 0.0,
				"taker_buy_quote_volume": 0.0,
				"created_at": datetime.utcnow(),
			})
		return out

	async def get_trades(self, symbol: str, start_time: Optional[datetime] = None, end_time: Optional[datetime] = None, limit: int = 1000):
		rows = await self._get('/api/v3/trades', {"symbol": symbol, "limit": min(limit, 1000)})
		now = datetime.utcnow()
		out = []
		for r in rows:
			out.append({
				"id": r['id'],
				"symbol": symbol,
				"exchange": "binance",
				"trade_id": str(r['id']),
				"price": float(r['price']),
				"quantity": float(r['qty']),
				"quote_quantity": float(r['price']) * float(r['qty']),
				"is_buyer_maker": bool(r['isBuyerMaker']),
				"timestamp": datetime.utcfromtimestamp(r['time']/1000) if 'time' in r else now,
				"created_at": now,
			})
		return out

	async def get_orderbook(self, symbol: str, depth: int = 20):
		rows = await self._get('/api/v3/depth', {"symbol": symbol, "limit": min(depth*2, 1000)})
		bids = [[float(p), float(q)] for p, q in rows.get('bids', [])[:depth]]
		asks = [[float(p), float(q)] for p, q in rows.get('asks', [])[:depth]]
		best_bid = bids[0][0] if bids else 0.0
		best_ask = asks[0][0] if asks else 0.0
		mid = (best_bid + best_ask)/2 if best_bid and best_ask else 0.0
		return {
			"id": 1,
			"symbol": symbol,
			"exchange": "binance",
			"timestamp": datetime.utcnow(),
			"bids": bids,
			"asks": asks,
			"best_bid": best_bid,
			"best_ask": best_ask,
			"spread": best_ask - best_bid,
			"mid_price": mid,
			"created_at": datetime.utcnow(),
		}

	async def get_market_metrics(self, symbols: List[str], interval: str = "15m", start_time: Optional[datetime] = None, end_time: Optional[datetime] = None, limit: int = 100):
		return []

	async def get_current_price(self, symbol: str):
		prices = await self.exchange_connector.fetch_prices(symbol)
		if prices:
			# Prefer most recent price
			primary = max(prices, key=lambda p: p.timestamp or datetime.utcnow())
			serialized = [
				{
					"name": p.name,
					"symbol": p.symbol,
					"price": p.price,
					"bid": p.bid,
					"ask": p.ask,
					"timestamp": p.timestamp.isoformat() if p.timestamp else None,
				}
				for p in prices
			]
			return {
				"symbol": symbol,
				"price": primary.price,
				"exchanges": serialized,
			}
		return {"symbol": symbol, "price": 0.0, "exchanges": []}

	async def get_current_prices(self, symbols: List[str]):
		results: Dict[str, float] = {}
		for symbol in symbols:
			data = await self.get_current_price(symbol)
			if data.get("price"):
				results[symbol] = data["price"]
		return results

	async def get_aggregated_price(self, symbol: str) -> Dict[str, Any]:
		"""Aggregate current spot price across supported exchanges using ccxt.

		Returns a dict with per-exchange prices, average, and estimated latency.
		"""
		prices = await self.exchange_connector.fetch_prices(symbol)
		response: Dict[str, Any] = {
			"symbol": symbol,
			"exchanges": [
				{
					"name": p.name,
					"symbol": p.symbol,
					"price": p.price,
					"bid": p.bid,
					"ask": p.ask,
					"timestamp": p.timestamp.isoformat() if p.timestamp else None,
				}
				for p in prices
			],
			"average_price": None,
			"min_price": None,
			"min_exchange": None,
			"max_price": None,
			"max_exchange": None,
		}
		if prices:
			valid = [p.price for p in prices if p.price > 0]
			if valid:
				response["average_price"] = sum(valid) / len(valid)
				min_p = min(prices, key=lambda p: p.price)
				max_p = max(prices, key=lambda p: p.price)
				response["min_price"] = min_p.price
				response["min_exchange"] = min_p.name
				response["max_price"] = max_p.price
				response["max_exchange"] = max_p.name
		return response

	async def unified_symbol_search(self, query: str, limit: int = 20) -> List[Dict[str, Any]]:
		from services.exchanges import multi_exchange_connector
		q = (query or "").strip().upper()
		rows = await multi_exchange_connector.fetch_symbols("USDT")
		if not q:
			out = rows[:limit]
		else:
			out = [r for r in rows if q in r.get("symbol","" ) or q in r.get("base_asset","" )][:limit]
		return out

	async def get_volume_stats(self, symbols: List[str], interval: str = "1h", period_hours: int = 24):
		return []

	def _interval_to_seconds(self, interval: str) -> int:
		try:
			if interval.endswith('m'):
				return int(interval[:-1]) * 60
			if interval.endswith('h'):
				return int(interval[:-1]) * 3600
			if interval.endswith('d'):
				return int(interval[:-1]) * 86400
		except Exception:
			pass
		return 900

	async def get_orderbook_imbalance(self, symbols: List[str], depth_percent: float = 0.1):
		return []

	async def get_market_overview(self, exchange: str = "binance", limit: int = 50):
		cache_key = f"{exchange}:{limit}"
		now = asyncio.get_event_loop().time()
		cached = _MARKET_OVERVIEW_CACHE.get(cache_key)
		if cached and (now - cached[0]) < _MARKET_OVERVIEW_TTL:
			return cached[1]

		rows = await self._get('/api/v3/ticker/24hr')
		assets: List[Dict[str, Any]] = []
		for raw in rows:
			if not isinstance(raw, dict):
				continue
			symbol = str(raw.get('symbol') or '')
			if not symbol.endswith('USDT'):
				continue
			try:
				price = float(raw.get('lastPrice') or raw.get('weightedAvgPrice') or 0.0)
				change_pct = float(raw.get('priceChangePercent') or 0.0)
				quote_volume = float(raw.get('quoteVolume') or 0.0)
				base_volume = float(raw.get('volume') or 0.0)
			except Exception:
				continue
			assets.append({
				"symbol": symbol,
				"price": price,
				"change_percent": change_pct,
				"quote_volume": quote_volume,
				"base_volume": base_volume,
			})

		if not assets:
			result = {
				"regime": "unknown",
				"volatility": 0.0,
				"top_gainers": [],
				"top_losers": [],
				"total_volume": 0.0,
				"market_cap": None,
				"bitcoin_dominance": None,
				"last_updated": datetime.utcnow().isoformat(),
			}
			_MARKET_OVERVIEW_CACHE[cache_key] = (now, result)
			return result

		assets.sort(key=lambda item: item['change_percent'], reverse=True)
		top_gainers = [
			{
				"symbol": item['symbol'],
				"price": item['price'],
				"change_percent": item['change_percent'],
			}
			for item in assets[: min(5, limit)]
		]

		losers = sorted(assets, key=lambda item: item['change_percent'])
		top_losers = [
			{
				"symbol": item['symbol'],
				"price": item['price'],
				"change_percent": item['change_percent'],
			}
			for item in losers[: min(5, limit)]
		]

		sample = assets[: max(10, min(len(assets), limit))]
		changes = [item['change_percent'] for item in sample if item['change_percent'] is not None]
		avg_change = statistics.fmean(changes) if changes else 0.0
		volatility = statistics.pstdev(changes) / 100 if len(changes) > 1 else 0.0

		if avg_change >= 1.5:
			regime = "risk_on"
		elif avg_change <= -1.5:
			regime = "risk_off"
		elif volatility * 100 >= 4:
			regime = "trending"
		else:
			regime = "choppy"

		summed_volume = sum(item['quote_volume'] for item in assets[: limit])

		market_cap = None
		total_volume = summed_volume
		btc_dom = None

		try:
			if _cmc_service.api_key:
				metrics = await _cmc_service.get_global_metrics()
				if metrics:
					quote = metrics.get('quote', {}).get('USD', {})
					market_cap = float(quote.get('total_market_cap') or 0.0)
					total_volume = float(quote.get('total_volume_24h') or total_volume)
					btc_dom = float(metrics.get('btc_dominance') or quote.get('bitcoin_dominance') or 0.0)
		except Exception as exc:
			logger.warning("coinmarketcap metrics fetch failed", error=str(exc))

		result = {
			"regime": regime,
			"regime_score": avg_change,
			"volatility": max(volatility, 0.0),
			"top_gainers": top_gainers,
			"top_losers": top_losers,
			"total_volume": total_volume,
			"market_cap": market_cap,
			"bitcoin_dominance": btc_dom,
			"traded_symbols": len(assets),
			"last_updated": datetime.utcnow().isoformat(),
		}

		_MARKET_OVERVIEW_CACHE[cache_key] = (now, result)
		return result

	async def get_whale_activity(self, symbols: Optional[List[str]] = None, min_trade_size: float = 100000, start_time: Optional[datetime] = None, end_time: Optional[datetime] = None, limit: int = 100):
		"""Detect large public trades (whales) from Binance recent trades.

		Args:
			symbols: Optional list of symbols to scan (e.g., ["BTCUSDT", "ETHUSDT"]).
			min_trade_size: Minimum USD notional to qualify as a whale trade.
			start_time/end_time: Not used for Binance recent trades; kept for API parity.
			limit: Max number of whale events to return across all symbols.

		Returns:
			List of whale trade dicts sorted by most recent first.
		"""
		# Determine the symbols to scan: use provided or pick top USDT pairs by 24h volume
		out: List[Dict[str, Any]] = []
		try:
			chosen: List[str] = []
			if symbols:
				chosen = list({s.upper() for s in symbols})
			else:
				# Pull 24h stats and choose top USDT pairs by quoteVolume
				stats = await self._get('/api/v3/ticker/24hr')
				usdt = [r for r in stats if isinstance(r, dict) and str(r.get('symbol','')).endswith('USDT')]
				for r in usdt:
					# normalize volumes
					try:
						r['q'] = float(r.get('quoteVolume') or 0.0)
					except Exception:
						r['q'] = 0.0
				usdt.sort(key=lambda r: r.get('q', 0.0), reverse=True)
				chosen = [r['symbol'] for r in usdt[:20]]

			# Fetch recent trades per symbol and collect whales
			for sym in chosen:
				try:
					rows = await self._get('/api/v3/trades', {"symbol": sym, "limit": 1000})
					now = datetime.utcnow()
					for r in rows:
						price = float(r.get('price') or 0.0)
						qty = float(r.get('qty') or 0.0)
						notional = price * qty
						if notional >= float(min_trade_size or 0):
							ts = datetime.utcfromtimestamp((r.get('time') or 0)/1000) if 'time' in r else now
							out.append({
								"symbol": sym,
								"exchange": "binance",
								"price": price,
								"quantity": qty,
								"usd_notional": notional,
								"side": "sell" if r.get('isBuyerMaker') else "buy",
								"trade_id": str(r.get('id')),
								"timestamp": ts,
							})
				except Exception:
					# skip symbol on error; continue others
					continue

			# Sort and trim
			out.sort(key=lambda x: x.get('timestamp') or datetime.utcnow(), reverse=True)
			return out[: max(0, min(int(limit or 0), len(out))) or len(out)]
		except Exception:
			# On failure, return empty list to avoid breaking UI
			return []
