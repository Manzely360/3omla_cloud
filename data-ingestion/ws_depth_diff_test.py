import asyncio, websockets, json
url='wss://stream.binance.com:9443/stream?streams=btcusdt@depth@100ms'
async def main():
  async with websockets.connect(url) as ws:
    print('connected')
    msg = await asyncio.wait_for(ws.recv(), timeout=10)
    d=json.loads(msg)['data']
    print('keys:', list(d.keys()))
    print('sample keys present:', 's' in d, 'E' in d, 'b' in d, 'a' in d)
asyncio.run(main())
