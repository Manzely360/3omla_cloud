import asyncio, websockets, json
url='wss://stream.binance.com:9443/stream?streams=btcusdt@trade'
async def main():
  async with websockets.connect(url) as ws:
    print('connected')
    msg = await asyncio.wait_for(ws.recv(), timeout=10)
    print('got:', msg[:120])
asyncio.run(main())
