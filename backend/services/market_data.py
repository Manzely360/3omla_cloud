"""
Market data service with live public Binance fallback (no API key)
"""

from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, timedelta
import aiohttp
import asyncio


BINANCE_BASE = "https://api.binance.com"

# very light in-memory cache for hot endpoints
_CACHE: Dict[Tuple[str, Tuple[Tuple[str, Any], ...] | None], Tuple[float, Any]] = {}
_CACHE_TTL = {
    "/api/v3/ticker/24hr": 15.0,
    "/api/v3/ticker/price": 10.0,
}


class MarketDataService:
	def __init__(self, db: AsyncSession):
		self.db = db

	async def _get(self, path: str, params: Optional[Dict[str, Any]] = None):
		url = f"{BINANCE_BASE}{path}"
		# cache where safe
		cache_key = None
		now = asyncio.get_event_loop().time()
		if path in _CACHE_TTL:
			key_params = tuple(sorted((params or {}).items())) if params else None
			cache_key = (path, key_params)
			entry = _CACHE.get(cache_key)
			if entry and (now - entry[0]) < _CACHE_TTL[path]:
				return entry[1]

		async with aiohttp.ClientSession() as session:
			async with session.get(url, params=params, timeout=20) as resp:
				resp.raise_for_status()
				data = await resp.json()
				if cache_key is not None:
					_CACHE[cache_key] = (now, data)
				return data

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

	async def get_klines(self, symbol: str, interval: str = "15m", start_time: Optional[datetime] = None, end_time: Optional[datetime] = None, limit: int = 500):
		params: Dict[str, Any] = {"symbol": symbol, "interval": interval, "limit": min(limit, 1000)}
		if start_time:
			params["startTime"] = int(start_time.timestamp() * 1000)
		if end_time:
			params["endTime"] = int(end_time.timestamp() * 1000)
		rows = await self._get('/api/v3/klines', params)
		out = []
		for i, r in enumerate(rows):
			# [ openTime, open, high, low, close, volume, closeTime, quoteVolume, trades, takerBase, takerQuote, ignore ]
			out.append({
				"id": i+1,
				"symbol": symbol,
				"exchange": "binance",
				"interval": interval,
				"open_time": datetime.utcfromtimestamp(r[0]/1000),
				"close_time": datetime.utcfromtimestamp(r[6]/1000),
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
		row = await self._get('/api/v3/ticker/price', {"symbol": symbol})
		return {"symbol": symbol, "price": float(row['price'])}

	async def get_current_prices(self, symbols: List[str]):
		prices = {}
		rows = await self._get('/api/v3/ticker/price')
		wanted = set(symbols)
		for r in rows:
			if r['symbol'] in wanted:
				prices[r['symbol']] = float(r['price'])
		return prices

	async def get_aggregated_price(self, symbol: str) -> Dict[str, Any]:
		"""Aggregate current spot price across supported exchanges using ccxt.

		Returns a dict with per-exchange prices, average, and estimated latency.
		"""
		import ccxt.async_support as ccxt
		from datetime import timezone as _tz
		results: Dict[str, Any] = {"symbol": symbol, "exchanges": [], "average_price": None}
		projections: List[float] = []
		latencies: List[float] = []
		# Map unified to exchange-specific symbols if needed
		unified_symbol = symbol
		# Exchanges to query (spot)
		exchanges = [
			("binance", ccxt.binance()),
			("bybit", ccxt.bybit()),
			("kucoin", ccxt.kucoin()),
		]
		for name, ex in exchanges:
			try:
				# Load markets for symbol mapping if necessary
				await ex.load_markets()
				ex_symbol = unified_symbol if unified_symbol in ex.markets else unified_symbol
				t = await ex.fetch_ticker(ex_symbol)
				price = float(t.get("last") or t.get("close") or 0.0)
				ts_ms = t.get("timestamp") or (t.get("info", {}).get("ts") if isinstance(t.get("info"), dict) else None)
				latency_ms = None
				if ts_ms:
					latency_ms = max(0.0, (datetime.utcnow() - datetime.utcfromtimestamp(ts_ms/1000)).total_seconds()*1000)
				results["exchanges"].append({"name": name, "price": price, "latency_ms": latency_ms})
				if price > 0:
					projections.append(price)
					if latency_ms is not None:
						latencies.append(latency_ms)
			except Exception:
				# ignore this exchange
				pass
			finally:
				try:
					await ex.close()
				except Exception:
					pass
		if projections:
			results["average_price"] = sum(projections)/len(projections)
			if latencies:
				results["avg_latency_ms"] = sum(latencies)/len(latencies)
		return results

	async def get_volume_stats(self, symbols: List[str], interval: str = "1h", period_hours: int = 24):
		return []

	async def get_orderbook_imbalance(self, symbols: List[str], depth_percent: float = 0.1):
		return []

	async def get_market_overview(self, exchange: str = "binance", limit: int = 50):
		# Use 24hr tickers to get top movers
		rows = await self._get('/api/v3/ticker/24hr')
		# filter USDT pairs with volume
		usdt = [r for r in rows if r.get('symbol','').endswith('USDT')]
		# compute gainers/losers
		for r in usdt:
			r['price'] = float(r.get('lastPrice', 0))
			r['change_percent'] = float(r.get('priceChangePercent', 0))
		usdt.sort(key=lambda r: r['change_percent'], reverse=True)
		top_gainers = [{"symbol": r['symbol'], "price": r['price'], "change_percent": r['change_percent']} for r in usdt[:min(5, limit)]]
		losers = sorted(usdt, key=lambda r: r['change_percent'])
		top_losers = [{"symbol": r['symbol'], "price": r['price'], "change_percent": r['change_percent']} for r in losers[:min(5, limit)]]
		return {
			"regime": "unknown",
			"volatility": 0.0,
			"top_gainers": top_gainers,
			"top_losers": top_losers,
		}

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
