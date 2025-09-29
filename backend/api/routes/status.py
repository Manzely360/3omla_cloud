"""System status API returning live component health information."""

from datetime import datetime
from typing import Any, Dict, List

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.market_data import MarketDataService
from services.coinmarketcap import CoinMarketCapService
from services.ultra_price_oracle import ultra_oracle

router = APIRouter()


def _service_entry(name: str, status: str, detail: str | None = None, latency_ms: float | None = None) -> Dict[str, Any]:
    entry: Dict[str, Any] = {
        "name": name,
        "status": status,
    }
    if detail:
        entry["detail"] = detail
    if latency_ms is not None:
        entry["latency_ms"] = round(latency_ms, 2)
    return entry


@router.get("", response_model=Dict[str, Any])
async def get_system_status(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """Return snapshot of core service health."""
    entries: List[Dict[str, Any]] = []
    start = datetime.utcnow()

    # API itself
    entries.append(_service_entry("API", "operational"))

    # Market data aggregation (Binance public endpoint)
    md_service = MarketDataService(db)
    try:
        md_start = datetime.utcnow()
        agg = await md_service.get_aggregated_price("BTCUSDT")
        md_latency = (datetime.utcnow() - md_start).total_seconds() * 1000
        if isinstance(agg, dict) and agg.get("average_price"):
            entries.append(_service_entry("Market Data", "operational", latency_ms=md_latency))
        else:
            entries.append(_service_entry("Market Data", "degraded", detail="No aggregated price available", latency_ms=md_latency))
    except Exception as exc:  # noqa: BLE001
        entries.append(_service_entry("Market Data", "outage", detail=str(exc)))

    # CoinMarketCap connectivity
    cmc_service = CoinMarketCapService()
    if not cmc_service.api_key:
        entries.append(_service_entry("CoinMarketCap", "degraded", detail="API key not configured"))
    else:
        try:
            cmc_start = datetime.utcnow()
            metrics = await cmc_service.get_global_metrics()
            cmc_latency = (datetime.utcnow() - cmc_start).total_seconds() * 1000
            if metrics:
                entries.append(_service_entry("CoinMarketCap", "operational", latency_ms=cmc_latency))
            else:
                entries.append(_service_entry("CoinMarketCap", "degraded", detail="No metrics returned", latency_ms=cmc_latency))
        except Exception as exc:  # noqa: BLE001
            entries.append(_service_entry("CoinMarketCap", "outage", detail=str(exc)))

    # Ultra price oracle heartbeat
    oracle_status = "outage"
    oracle_detail = ""
    oracle_latency: float | None = None
    try:
        prices = ultra_oracle.current_prices
        if prices:
            latest_ts = max((agg.timestamp for agg in prices.values() if getattr(agg, "timestamp", None)), default=None)
            if latest_ts:
                age = (datetime.utcnow() - latest_ts).total_seconds()
                oracle_latency = age * 1000
                if age <= ultra_oracle.stale_after:
                    oracle_status = "operational"
                else:
                    oracle_status = "degraded"
                    oracle_detail = f"Last refresh {int(age)}s ago"
        if ultra_oracle.last_refresh_error:
            oracle_status = "degraded"
            oracle_detail = ultra_oracle.last_refresh_error
        if not prices and not oracle_detail:
            oracle_detail = "No exchange snapshots yet"
    except Exception as exc:  # noqa: BLE001
        oracle_detail = str(exc)
    finally:
        entries.append(_service_entry("Ultra Oracle", oracle_status, oracle_detail or None, oracle_latency))

    return {
        "timestamp": start.isoformat(),
        "services": entries,
    }
