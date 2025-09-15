"""
CoinMarketCap API routes for market data and rankings
"""

from typing import Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query
from services.coinmarketcap import CoinMarketCapService

router = APIRouter()

# Global CMC service instance
cmc_service = CoinMarketCapService()


@router.get("/listings", response_model=List[Dict])
async def get_latest_listings(
    limit: int = Query(100, le=5000),
    start: int = Query(1, ge=1)
):
    """Get latest cryptocurrency listings from CoinMarketCap"""
    try:
        listings = await cmc_service.get_latest_listings(limit=limit, start=start)
        
        # Format the response
        formatted_listings = []
        for coin in listings:
            quote = coin.get("quote", {}).get("USD", {})
            formatted_listings.append({
                "id": coin.get("id"),
                "name": coin.get("name"),
                "symbol": coin.get("symbol"),
                "slug": coin.get("slug"),
                "rank": coin.get("cmc_rank"),
                "market_cap": quote.get("market_cap"),
                "price": quote.get("price"),
                "volume_24h": quote.get("volume_24h"),
                "percent_change_1h": quote.get("percent_change_1h"),
                "percent_change_24h": quote.get("percent_change_24h"),
                "percent_change_7d": quote.get("percent_change_7d"),
                "market_cap_dominance": quote.get("market_cap_dominance"),
                "circulating_supply": coin.get("circulating_supply"),
                "total_supply": coin.get("total_supply"),
                "max_supply": coin.get("max_supply"),
                "last_updated": quote.get("last_updated")
            })
            
        return formatted_listings
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/quotes", response_model=Dict)
async def get_quotes(
    symbols: str = Query(..., description="Comma-separated list of symbols (e.g., BTC,ETH,ADA)")
):
    """Get quotes for specific cryptocurrency symbols"""
    try:
        symbol_list = [s.strip().upper() for s in symbols.split(",")]
        quotes = await cmc_service.get_quotes(symbol_list)
        
        # Format the response
        formatted_quotes = {}
        for symbol, data in quotes.items():
            quote = data.get("quote", {}).get("USD", {})
            formatted_quotes[symbol] = {
                "id": data.get("id"),
                "name": data.get("name"),
                "symbol": data.get("symbol"),
                "rank": data.get("cmc_rank"),
                "market_cap": quote.get("market_cap"),
                "price": quote.get("price"),
                "volume_24h": quote.get("volume_24h"),
                "percent_change_1h": quote.get("percent_change_1h"),
                "percent_change_24h": quote.get("percent_change_24h"),
                "percent_change_7d": quote.get("percent_change_7d"),
                "market_cap_dominance": quote.get("market_cap_dominance"),
                "last_updated": quote.get("last_updated")
            }
            
        return formatted_quotes
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/global-metrics", response_model=Dict)
async def get_global_metrics():
    """Get global cryptocurrency market metrics"""
    try:
        metrics = await cmc_service.get_global_metrics()
        
        if not metrics:
            raise HTTPException(status_code=404, detail="Global metrics not available")
            
        quote = metrics.get("quote", {}).get("USD", {})
        
        return {
            "total_market_cap": quote.get("total_market_cap"),
            "total_volume_24h": quote.get("total_volume_24h"),
            "bitcoin_dominance": quote.get("bitcoin_dominance"),
            "ethereum_dominance": quote.get("ethereum_dominance"),
            "active_cryptocurrencies": metrics.get("active_cryptocurrencies"),
            "active_exchanges": metrics.get("active_exchanges"),
            "active_market_pairs": metrics.get("active_market_pairs"),
            "last_updated": quote.get("last_updated")
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/rankings", response_model=List[Dict])
async def get_market_cap_rankings(
    limit: int = Query(50, le=5000)
):
    """Get market cap rankings"""
    try:
        rankings = await cmc_service.get_market_cap_rankings(limit=limit)
        return rankings
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/trending", response_model=List[Dict])
async def get_trending():
    """Get trending cryptocurrencies"""
    try:
        trending = await cmc_service.get_trending()
        return trending
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/whale-activity/{symbol}", response_model=Dict)
async def get_whale_activity(symbol: str):
    """Get whale activity for a specific symbol"""
    try:
        activity = await cmc_service.get_whale_activity(symbol.upper())
        return activity
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/fear-greed-index", response_model=Dict)
async def get_fear_greed_index():
    """Get fear and greed index"""
    try:
        index = await cmc_service.get_fear_greed_index()
        return index
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/social-sentiment/{symbol}", response_model=Dict)
async def get_social_sentiment(symbol: str):
    """Get social sentiment for a specific symbol"""
    try:
        sentiment = await cmc_service.get_social_sentiment(symbol.upper())
        return sentiment
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/market-overview", response_model=Dict)
async def get_market_overview():
    """Get comprehensive market overview"""
    try:
        # Get multiple data sources in parallel
        import asyncio
        
        global_metrics, rankings, fear_greed = await asyncio.gather(
            cmc_service.get_global_metrics(),
            cmc_service.get_market_cap_rankings(limit=10),
            cmc_service.get_fear_greed_index(),
            return_exceptions=True
        )
        
        return {
            "global_metrics": global_metrics if not isinstance(global_metrics, Exception) else {},
            "top_cryptocurrencies": rankings if not isinstance(rankings, Exception) else [],
            "fear_greed_index": fear_greed if not isinstance(fear_greed, Exception) else {},
            "timestamp": "2024-01-01T00:00:00Z"
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
