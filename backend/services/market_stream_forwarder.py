"""Redis Pub/Sub forwarder for streaming market updates to websocket clients."""

from __future__ import annotations

import asyncio
import json
import os
from typing import Awaitable, Callable, Dict, Optional

import redis.asyncio as redis
import structlog

logger = structlog.get_logger()


MarketHandler = Callable[[str, Dict], Awaitable[None]]
StatusHandler = Callable[[str, Dict], Awaitable[None]]


class MarketStreamForwarder:
    """Listens to Redis channels and relays payloads to FastAPI websocket managers."""

    def __init__(
        self,
        *,
        market_handler: MarketHandler,
        status_handler: Optional[StatusHandler] = None,
        market_channel: Optional[str] = None,
        status_channel: Optional[str] = None,
        redis_url: Optional[str] = None,
    ) -> None:
        self.market_handler = market_handler
        self.status_handler = status_handler
        self.market_channel = market_channel or os.getenv("MARKET_DATA_CHANNEL", "market_data_updates")
        self.status_channel = status_channel or os.getenv("EXCHANGE_STATUS_CHANNEL", "exchange_status_updates")
        self.redis_url = redis_url or os.getenv("REDIS_URL", "redis://localhost:6379")
        self._redis: Optional[redis.Redis] = None
        self._pubsub: Optional[redis.client.PubSub] = None
        self._task: Optional[asyncio.Task] = None
        self._stop = asyncio.Event()

    async def start(self) -> None:
        try:
            self._redis = redis.from_url(self.redis_url, decode_responses=True)
            self._pubsub = self._redis.pubsub()
            channels = [self.market_channel]
            if self.status_handler is not None:
                channels.append(self.status_channel)
            await self._pubsub.subscribe(*channels)
            self._stop.clear()
            self._task = asyncio.create_task(self._listener())
            logger.info("Market stream forwarder subscribed", channels=channels)
        except Exception as error:
            logger.error("Failed to start market stream forwarder", error=str(error))
            await self.stop()
            raise

    async def stop(self) -> None:
        self._stop.set()
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            finally:
                self._task = None
        if self._pubsub:
            try:
                await self._pubsub.unsubscribe()
                await self._pubsub.close()
            except Exception:
                pass
            self._pubsub = None
        if self._redis:
            try:
                await self._redis.close()
            except Exception:
                pass
            self._redis = None

    async def _listener(self) -> None:
        assert self._pubsub is not None
        while not self._stop.is_set():
            try:
                message = await self._pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                if not message:
                    continue
                channel = message.get("channel")
                payload_raw = message.get("data")
                if not payload_raw:
                    continue
                try:
                    payload = json.loads(payload_raw)
                except json.JSONDecodeError:
                    logger.warning("Received non-JSON payload on market channel", channel=channel)
                    continue

                if channel == self.market_channel:
                    symbol = payload.get("symbol")
                    data = payload.get("payload")
                    if symbol and isinstance(data, dict):
                        try:
                            await self.market_handler(symbol, data)
                        except Exception as handler_error:
                            logger.error("Market handler failed", error=str(handler_error))
                elif channel == self.status_channel and self.status_handler:
                    exchange = payload.get("exchange")
                    status = payload.get("status")
                    if exchange and isinstance(payload, dict):
                        try:
                            await self.status_handler(exchange, payload)
                        except Exception as handler_error:
                            logger.error("Status handler failed", error=str(handler_error))
            except asyncio.CancelledError:
                break
            except Exception as error:
                logger.error("Market stream listener error", error=str(error))
                await asyncio.sleep(1)

