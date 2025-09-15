import asyncio, websockets, json
url='wss://stream.bybit.com/v5/public/spot'
async def main():
  async with websockets.connect(url) as ws:
    await ws.send(json.dumps({"op":"subscribe","args":["trade.BTCUSDT"]}))
    while True:
      msg = await asyncio.wait_for(ws.recv(), timeout=10)
      d=json.loads(msg)
      if d.get('topic')=='trade.BTCUSDT' and 'data' in d:
        print('ok:', d['data'][0].get('p'), d['data'][0].get('T'))
        break
asyncio.run(main())
