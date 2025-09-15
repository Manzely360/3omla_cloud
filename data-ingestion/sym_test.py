import asyncio
from services.binance_websocket import BinanceWebSocketService
async def main():
    svc=BinanceWebSocketService()
    await svc.initialize()
    syms=await svc.get_active_symbols()
    print('SYMS', syms)
asyncio.run(main())
