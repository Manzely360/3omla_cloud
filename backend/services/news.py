"""3OMLA news and trending coin service."""

from __future__ import annotations

import os
from datetime import datetime
from typing import Any, Dict, List, Optional

import aiohttp

from services.market_data import MarketDataService


class NewsService:
    def __init__(self, session: aiohttp.ClientSession):
        self.session = session
        self.cryptopanic_token = os.getenv('CRYPTOPANIC_TOKEN')

    async def fetch_headlines(self, limit: int = 20) -> List[Dict[str, Any]]:
        if not self.cryptopanic_token:
            return []
        url = "https://api.cryptopanic.com/v1/posts/"
        params = {
            "auth_token": self.cryptopanic_token,
            "public": "true",
            "kind": "news",
            "currencies": "BTC,ETH",
        }
        async with self.session.get(url, params=params, timeout=10) as resp:
            resp.raise_for_status()
            data = await resp.json()
        items = data.get('results', [])
        headlines: List[Dict[str, Any]] = []
        for item in items[:limit]:
            headlines.append({
                "title": item.get('title'),
                "url": item.get('url'),
                "published_at": item.get('published_at'),
                "source": item.get('source', {}).get('title'),
                "currencies": [c.get('code') for c in item.get('currencies', []) if c.get('code')],
                "sentiment": item.get('votes', {}),
            })
        return headlines

    async def fetch_trending(self, market_service: MarketDataService) -> List[Dict[str, Any]]:
        url = "https://api.coingecko.com/api/v3/search/trending"
        async with self.session.get(url, timeout=10) as resp:
            resp.raise_for_status()
            data = await resp.json()
        coins = data.get('coins', [])
        trending: List[Dict[str, Any]] = []
        for entry in coins:
            item = entry.get('item', {})
            symbol = (item.get('symbol') or '').upper() + 'USDT'
            price_data = await market_service.get_aggregated_price(symbol)
            trending.append({
                "name": item.get('name'),
                "symbol": symbol,
                "market_cap_rank": item.get('market_cap_rank'),
                "score": entry.get('score'),
                "price": price_data.get('average_price'),
                "exchanges": price_data.get('exchanges', []),
            })
        return trending


async def get_news_service() -> NewsService:
    session = aiohttp.ClientSession()
    return NewsService(session)
