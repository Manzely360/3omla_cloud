"""Background correlation engine for 3OMLA.

Calculates rolling Pearson correlations, lagged correlations, and
granger causality metrics across a dynamic universe of symbols.
Designed to be invoked on a schedule (e.g., every 30 seconds) and
persist results for API consumption.
"""

from __future__ import annotations

from collections import defaultdict
from typing import Dict, List, Optional, Tuple

from sqlalchemy.ext.asyncio import AsyncSession

from services.analytics import AnalyticsService


class CorrelationEngine:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.analytics_service = AnalyticsService(db)

    async def run(self, symbols: List[str], intervals: List[str]) -> Dict[str, Dict[str, float]]:
        results: Dict[str, Dict[str, float]] = defaultdict(dict)
        tasks: List[asyncio.Future[Optional[Tuple[str, Dict[str, float]]]]] = []
        for interval in intervals:
            for i in range(len(symbols)):
                for j in range(i + 1, len(symbols)):
                    tasks.append(self._process_pair(symbols[i], symbols[j], interval))

        responses = await asyncio.gather(*tasks, return_exceptions=True)
        for response in responses:
            if isinstance(response, tuple):
                key, payload = response
                results[key] = payload
        return results

    async def _process_pair(self, a: str, b: str, interval: str) -> Optional[Tuple[str, Dict[str, float]]]:
        try:
            metrics = await self.analytics_service.compute_lead_lag_metrics(a, b, interval, max_lag=20, window_size=500)
            key = f"{a}->{b}:{interval}"
            if metrics.get('error'):
                await self.analytics_service.store_live_correlation(a, b, interval, None, None, None, None)
                return key, {"error": 1.0}

            payload = {
                "best_lag": metrics.get('best_lag'),
                "correlation": metrics.get('best_abs_corr'),
                "hit_rate": metrics.get('hit_rate'),
            }
            await self.analytics_service.store_live_correlation(
                leader_symbol=metrics.get('leader_symbol', a),
                follower_symbol=metrics.get('follower_symbol', b),
                interval=interval,
                correlation=metrics.get('best_abs_corr'),
                lag_bars=metrics.get('lag_bars') or metrics.get('best_lag'),
                hit_rate=metrics.get('hit_rate'),
                sample_size=metrics.get('sample_size'),
            )
            return key, payload
        except Exception:
            return None


async def run_correlation_cycle(db: AsyncSession, symbols: Optional[List[str]] = None, intervals: Optional[List[str]] = None) -> Dict[str, Dict[str, float]]:
    service = AnalyticsService(db)
    universe = symbols or await service.get_symbol_universe(limit=12)
    interval_list = intervals or ['5m', '15m', '30m']
    engine = CorrelationEngine(db)
    return await engine.run(universe, interval_list)
