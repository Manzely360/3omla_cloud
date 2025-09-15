import asyncio
import os
from services.binance_websocket import BinanceWebSocketService

svc = BinanceWebSocketService()
print('use_testnet=', svc.use_testnet)
print('spot_base_url=', svc.spot_base_url)
print('futures_base_url=', svc.futures_base_url)

symbols=['BTCUSDT']
streams=[]
for symbol in symbols:
    s=symbol.lower()
    for interval in ['1m','5m']:
        streams.append(f"{s}@kline_{interval}")
    streams.append(f"{s}@trade")
    streams.append(f"{s}@depth20@100ms")

base_url = svc.testnet_spot_url if svc.use_testnet else svc.spot_base_url
print('Computed spot URL:', f"{base_url}{'/'.join(streams)}")
