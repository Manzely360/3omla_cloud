"""Google Trends utilities for advisor insights."""

from __future__ import annotations

import asyncio
from datetime import datetime
from typing import Dict, Any

from pytrends.request import TrendReq


class TrendsService:
    """Fetch Google Trends interest for a keyword across multiple horizons."""

    def __init__(self) -> None:
        self._client = TrendReq(retries=2, backoff_factor=0.2, tz=360)  # Africa/Cairo (UTC+2) approx

    async def get_interest(self, keyword: str) -> Dict[str, Any]:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._fetch_interest, keyword.upper())

    def _fetch_interest(self, keyword: str) -> Dict[str, Any]:
        horizons = {
            "past_hour": "now 1-H",
            "past_day": "now 1-d",
            "past_week": "now 7-d",
            "past_year": "today 12-m",
        }
        snapshots: Dict[str, Any] = {}
        for key, timeframe in horizons.items():
            try:
                self._client.build_payload([keyword], timeframe=timeframe)
                df = self._client.interest_over_time()
                if df.empty:
                    snapshots[key] = {"mean": 0, "last": 0}
                    continue
                series = df[keyword]
                snapshots[key] = {
                    "mean": float(series.mean()),
                    "last": float(series.iloc[-1]),
                    "timestamp": df.index[-1].isoformat(),
                }
            except Exception:
                snapshots[key] = {"mean": 0, "last": 0, "error": "trend_fetch_failed"}
        return {
            "keyword": keyword,
            "fetched_at": datetime.utcnow().isoformat(),
            "horizons": snapshots,
        }
