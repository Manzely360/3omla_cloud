"""
Server-Sent Events stream for signals (live, polled)
"""

import asyncio
import json
from datetime import datetime
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.signals import SignalService
from services.market_data import MarketDataService

router = APIRouter()


async def event_generator(db: AsyncSession):
    svc = SignalService(db)
    while True:
        try:
            signals = await svc.get_active_signals(limit=10)
            for s in signals:
                yield f"data: {json.dumps(s, default=str)}\n\n"
            # heartbeat if no signals
            if not signals:
                yield f"data: {json.dumps({'heartbeat': datetime.utcnow().isoformat()+'Z'})}\n\n"
        except Exception:
            yield f"data: {json.dumps({'error':'stream_error'})}\n\n"
        await asyncio.sleep(20)


@router.get("/signals/stream")
async def signals_stream(db: AsyncSession = Depends(get_db)):
    return StreamingResponse(event_generator(db), media_type="text/event-stream")


async def whale_event_generator(db: AsyncSession, min_trade_size: float = 200000):
    mds = MarketDataService(db)
    while True:
        try:
            whales = await mds.get_whale_activity(symbols=None, min_trade_size=min_trade_size, limit=20)
            for w in whales[:10]:
                payload = {
                    "symbol": w.get("symbol"),
                    "side": w.get("side"),
                    "usd_notional": w.get("usd_notional"),
                    "price": w.get("price"),
                    "timestamp": (w.get("timestamp") or datetime.utcnow()).isoformat()+"Z",
                }
                yield f"data: {json.dumps(payload, default=str)}\n\n"
            if not whales:
                yield f"data: {json.dumps({'heartbeat': datetime.utcnow().isoformat()+'Z'})}\n\n"
        except Exception:
            yield f"data: {json.dumps({'error':'whale_stream_error'})}\n\n"
        await asyncio.sleep(15)


@router.get("/whales/stream")
async def whales_stream(db: AsyncSession = Depends(get_db), min_trade_size: float = 200000):
    return StreamingResponse(whale_event_generator(db, min_trade_size=min_trade_size), media_type="text/event-stream")
