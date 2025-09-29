"""Advisor endpoints delivering multi-timeframe analytics, trends, and PDF reports."""

from __future__ import annotations

import io
from datetime import datetime
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.market_data import MarketDataService
from services.analytics import AnalyticsService
from services.trends import TrendsService

try:
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
except Exception:  # pragma: no cover - optional dependency guard
    canvas = None  # type: ignore

router = APIRouter()


async def _compute_interval_snapshot(
    market_service: MarketDataService,
    symbol: str,
    interval: str,
    limit: int = 120,
) -> Dict[str, float]:
    klines = await market_service.get_klines(symbol=symbol, interval=interval, limit=limit)
    if not klines:
        return {"close": 0.0, "change_pct": 0.0, "volume": 0.0}
    closes = [float(k['close_price']) for k in klines]
    volumes = [float(k['volume']) for k in klines]
    open_price = float(klines[0]['open_price'])
    last_price = float(klines[-1]['close_price'])
    change_pct = ((last_price - open_price) / open_price) if open_price else 0.0
    return {
        "close": last_price,
        "change_pct": change_pct,
        "volume": float(sum(volumes) / max(len(volumes), 1)),
    }


def _build_advice(snapshot: Dict[str, Dict[str, float]], trends: Optional[Dict[str, any]]) -> Dict[str, any]:
    score = 0.0
    weights = {"5m": 0.4, "15m": 0.35, "30m": 0.25}
    for key, weight in weights.items():
        change = snapshot.get(key, {}).get('change_pct', 0.0)
        score += change * weight
    trend_bias = 0.0
    if trends and trends.get('horizons'):
        horizons = trends['horizons']
        for key in ('past_hour', 'past_day', 'past_week', 'past_year'):
            data = horizons.get(key)
            if not data:
                continue
            last = data.get('last', 0)
            mean = data.get('mean', 1) or 1
            deviation = (last - mean) / mean
            trend_bias += deviation
        trend_bias /= 4.0
    adjusted = score + (trend_bias * 0.05)
    recommendation = 'hold'
    if adjusted > 0.01:
        recommendation = 'long'
    elif adjusted < -0.01:
        recommendation = 'short'
    confidence = min(0.95, max(0.05, abs(adjusted) * 12))
    return {
        "score": adjusted,
        "recommendation": recommendation,
        "confidence": round(confidence, 3),
        "notes": "Signals incorporate price momentum, relative trend interest, and cross-interval weighting.",
    }


@router.get("/insights")
async def advisor_insights(
    symbol: str = Query(..., description="Target symbol, e.g. BTCUSDT"),
    companions: Optional[List[str]] = Query(None, description="Optional comparison symbols"),
    db: AsyncSession = Depends(get_db),
):
    try:
        market_service = MarketDataService(db)
        analytics_service = AnalyticsService(db)
        trends_service = TrendsService()

        intervals = ['5m', '15m', '30m']
        snapshots = {}
        for interval in intervals:
            snapshots[interval] = await _compute_interval_snapshot(market_service, symbol.upper(), interval)

        trends = await trends_service.get_interest(symbol.upper())

        companion_metrics: List[Dict[str, any]] = []
        if companions:
            universe = [symbol.upper()] + [c.upper() for c in companions]
            results = await analytics_service.get_symbol_universe(limit=len(universe))
            available = [s for s in universe if s in results or s == symbol.upper()]
            for comp in available:
                if comp == symbol.upper():
                    continue
                metrics = await analytics_service.compute_lead_lag_metrics(symbol.upper(), comp, interval='15m', max_lag=12)
                if metrics.get('error'):
                    continue
                companion_metrics.append(metrics)

        advice = _build_advice(snapshots, trends)

        return {
            "symbol": symbol.upper(),
            "generated_at": datetime.utcnow().isoformat(),
            "snapshots": snapshots,
            "trends": trends,
            "companions": companion_metrics,
            "advice": advice,
        }
    except Exception as exc:  # pragma: no cover - runtime guard
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/trends")
async def advisor_trends(symbol: str = Query(...), db: AsyncSession = Depends(get_db)):
    _ = db  # unused but keeps dependency for future caching
    try:
        trends_service = TrendsService()
        return await trends_service.get_interest(symbol.upper())
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/report")
async def advisor_report(
    symbol: str = Query(...),
    companions: Optional[List[str]] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    if canvas is None:  # pragma: no cover
        raise HTTPException(status_code=500, detail="PDF generation dependencies not installed")

    insights = await advisor_insights(symbol=symbol, companions=companions, db=db)
    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    pdf.setTitle(f"{symbol.upper()} Advisor Report")
    pdf.setFont("Helvetica-Bold", 20)
    pdf.drawString(40, height - 60, f"3OMLA Advisor Report: {symbol.upper()}")
    pdf.setFont("Helvetica", 12)
    y = height - 100
    pdf.drawString(40, y, f"Generated: {datetime.utcnow().isoformat()} UTC")
    y -= 30
    pdf.drawString(40, y, "Interval Snapshots:")
    y -= 20
    for interval, data in insights['snapshots'].items():
        pdf.drawString(55, y, f"{interval}: close={data['close']:.4f} | change={data['change_pct']*100:.2f}% | volume={data['volume']:.2f}")
        y -= 18

    y -= 10
    pdf.drawString(40, y, "Google Trends (last vs mean):")
    y -= 20
    for horizon, data in insights['trends']['horizons'].items():
        pdf.drawString(55, y, f"{horizon}: last={data['last']:.2f} mean={data['mean']:.2f}")
        y -= 18

    y -= 10
    pdf.drawString(40, y, "Advisor Recommendation:")
    y -= 20
    pdf.drawString(55, y, f"Action: {insights['advice']['recommendation'].upper()} | Confidence: {insights['advice']['confidence']*100:.1f}%")
    y -= 18
    pdf.drawString(55, y, f"Score: {insights['advice']['score']:.4f}")

    if insights['companions']:
        y -= 30
        pdf.drawString(40, y, "Companion Lead/Lag Pairs:")
        y -= 20
        for comp in insights['companions'][:6]:
            pdf.drawString(55, y, f"{comp['leader_symbol']} -> {comp['follower_symbol']} | lag={comp['best_lag']} | corr={comp['best_abs_corr']:.2f}")
            y -= 18
            if y < 80:
                pdf.showPage()
                y = height - 60

    pdf.showPage()
    pdf.save()
    buffer.seek(0)
    filename = f"{symbol.upper()}_3omla_report.pdf"
    return StreamingResponse(buffer, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename={filename}"})
