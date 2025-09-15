import asyncio
from services.binance_websocket import BinanceWebSocketService
async def main():
    svc = BinanceWebSocketService()
    await svc.initialize()
    await svc.subscribe_to_streams(['btcusdt@trade'])
asyncio.run(main())
