"""
Binance account integration using ccxt for live balances, positions, orders, and trades
"""

from typing import Dict, List, Optional
import ccxt
import asyncio

from core.config import settings


class BinanceAccountService:
    def __init__(self) -> None:
        api_key = settings.BINANCE_API_KEY
        secret = settings.BINANCE_SECRET_KEY
        if not api_key or not secret:
            self.client = None
            return

        self.client = ccxt.binance({
            'apiKey': api_key,
            'secret': secret,
            'enableRateLimit': True,
            'options': {
                'defaultType': 'future',  # or 'spot' based on preference
            },
        })

    def _ensure(self):
        if not self.client:
            raise RuntimeError("Binance API keys not configured")

    async def get_balance(self) -> Dict:
        self._ensure()
        return await asyncio.to_thread(self.client.fetch_balance)

    async def get_positions(self, symbols: Optional[List[str]] = None) -> List[Dict]:
        self._ensure()
        # ccxt unified fetchPositions may vary; fallback to fetchBalance positions if missing
        if hasattr(self.client, 'fetch_positions'):
            positions = await asyncio.to_thread(self.client.fetch_positions, symbols)
        else:
            positions = []
        norm = []
        for p in positions:
            norm.append({
                'symbol': p.get('symbol'),
                'side': p.get('side'),
                'contracts': p.get('contracts'),
                'entryPrice': p.get('entryPrice'),
                'markPrice': p.get('markPrice'),
                'notional': p.get('notional'),
                'unrealizedPnl': p.get('unrealizedPnl'),
                'leverage': p.get('leverage'),
                'timestamp': p.get('timestamp'),
                'info': p.get('info'),
            })
        return norm

    async def get_open_orders(self, symbol: Optional[str] = None, limit: Optional[int] = None) -> List[Dict]:
        self._ensure()
        return await asyncio.to_thread(self.client.fetch_open_orders, symbol, None, limit)

    async def get_orders(self, symbol: Optional[str] = None, since: Optional[int] = None, limit: Optional[int] = 50) -> List[Dict]:
        self._ensure()
        return await asyncio.to_thread(self.client.fetch_orders, symbol, since, limit)

    async def get_my_trades(self, symbol: Optional[str] = None, since: Optional[int] = None, limit: Optional[int] = 50) -> List[Dict]:
        self._ensure()
        return await asyncio.to_thread(self.client.fetch_my_trades, symbol, since, limit)

