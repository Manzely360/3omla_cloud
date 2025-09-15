import asyncio, websockets, json
url='wss://stream.binance.com:9443/stream?streams=btcusdt@depth20@100ms'
async def main():
  async with websockets.connect(url) as ws:
    print('connected')
    msg = await asyncio.wait_for(ws.recv(), timeout=10)
    print('got keys:', list(json.loads(msg).get('data',{}).keys()))
    print('sample:', json.loads(msg)['data'])
asyncio.run(main())
