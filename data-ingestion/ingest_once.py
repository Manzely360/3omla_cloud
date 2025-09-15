import asyncio, json
from services.binance_websocket import BinanceWebSocketService

async def main():
    svc=BinanceWebSocketService()
    await svc.initialize()
    syms=['BTCUSDT']
    streams=[]
    for s in syms:
        l=s.lower()
        for interval in ['1m']:
            streams.append(f"{l}@kline_{interval}")
        streams.append(f"{l}@trade")
        streams.append(f"{l}@depth20@100ms")
    base_url = svc.testnet_spot_url if svc.use_testnet else svc.spot_base_url
    url = f"{base_url}{'/'.join(streams)}"
    import websockets
    async with websockets.connect(url) as ws:
        for _ in range(10):
            msg = await asyncio.wait_for(ws.recv(), timeout=10)
            data = json.loads(msg)
            if 'stream' in data and 'data' in data:
                stream = data['stream']
                d = data['data']
                if '@trade' in stream:
                    await svc._process_trade_data(d, 'spot')
                elif '@kline_' in stream:
                    await svc._process_kline_data(d, 'spot')
                elif '@depth' in stream:
                    await svc._process_orderbook_data(d, 'spot')
    print('done')

asyncio.run(main())
