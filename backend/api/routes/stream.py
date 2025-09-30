"""Realtime streaming endpoints (SSE + WebSocket) for the intelligence hub."""

import asyncio
import json
from datetime import datetime
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from fastapi.encoders import jsonable_encoder
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.database import get_async_session, get_db
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


async def _accept_and_stream(websocket: WebSocket):
    """Helper to accept connections with a consistent handshake."""
    await websocket.accept()
    await websocket.send_json({"status": "connected", "timestamp": datetime.utcnow().isoformat() + "Z"})


async def _stream_signals_ws(websocket: WebSocket):
    await _accept_and_stream(websocket)
    session = get_async_session()
    svc = SignalService(session)
    try:
        while True:
            try:
                signals = await svc.get_active_signals(limit=10)
            except Exception:
                await websocket.send_json({"error": "stream_error"})
                await asyncio.sleep(settings.WS_RECONNECT_DELAY)
                continue

            sent_any = False
            for signal in signals:
                await websocket.send_json(jsonable_encoder(signal))
                sent_any = True

            if not sent_any:
                await websocket.send_json({"heartbeat": datetime.utcnow().isoformat() + "Z"})

            await asyncio.sleep(settings.WS_HEARTBEAT_INTERVAL)
    except WebSocketDisconnect:
        return
    finally:
        await session.close()


async def _stream_whales_ws(websocket: WebSocket, min_trade_size: float):
    await _accept_and_stream(websocket)
    session = get_async_session()
    svc = MarketDataService(session)
    try:
        while True:
            try:
                whales = await svc.get_whale_activity(min_trade_size=min_trade_size, limit=20)
            except Exception:
                await websocket.send_json({"error": "whale_stream_error"})
                await asyncio.sleep(settings.WS_RECONNECT_DELAY)
                continue

            sent_any = False
            for whale in whales[:10]:
                payload = {
                    "symbol": whale.get("symbol"),
                    "side": whale.get("side"),
                    "usd_notional": whale.get("usd_notional"),
                    "price": whale.get("price"),
                    "timestamp": (whale.get("timestamp") or datetime.utcnow()).isoformat() + "Z",
                }
                await websocket.send_json(jsonable_encoder(payload))
                sent_any = True

            if not sent_any:
                await websocket.send_json({"heartbeat": datetime.utcnow().isoformat() + "Z"})

            await asyncio.sleep(max(5, settings.WS_HEARTBEAT_INTERVAL))
    except WebSocketDisconnect:
        return
    finally:
        await session.close()


@router.websocket("/signals/ws")
async def signals_websocket(websocket: WebSocket):
    await _stream_signals_ws(websocket)


@router.websocket("/whales/ws")
async def whales_websocket(websocket: WebSocket, min_trade_size: float = 200000):
    await _stream_whales_ws(websocket, min_trade_size=min_trade_size)
