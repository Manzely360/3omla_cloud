"""
CoinMarketCap API integration for market data and rankings
"""

import asyncio
import os
from typing import Dict, List, Optional

import aiohttp
import structlog
from dotenv import load_dotenv

load_dotenv()

logger = structlog.get_logger()


class CoinMarketCapService:
    """CoinMarketCap API service for market data"""
    
    def __init__(self):
        self.api_key = os.getenv("CMC_API_KEY")
        self.base_url = "https://pro-api.coinmarketcap.com/v1"
        self.headers = {
            "Accepts": "application/json",
            "X-CMC_PRO_API_KEY": self.api_key,
        }
        
    async def get_latest_listings(self, limit: int = 100, start: int = 1) -> List[Dict]:
        """Get latest cryptocurrency listings"""
        try:
            if not self.api_key:
                logger.warning("CoinMarketCap API key not configured")
                return []
                
            url = f"{self.base_url}/cryptocurrency/listings/latest"
            params = {
                "start": start,
                "limit": limit,
                "convert": "USD"
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=self.headers, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get("data", [])
                    else:
                        logger.error(f"CMC API error: {response.status}")
                        return []
                        
        except Exception as e:
            logger.error(f"Error fetching CMC listings: {e}")
            return []
            
    async def get_quotes(self, symbols: List[str]) -> Dict[str, Dict]:
        """Get quotes for specific symbols"""
        try:
            if not self.api_key:
                logger.warning("CoinMarketCap API key not configured")
                return {}
                
            url = f"{self.base_url}/cryptocurrency/quotes/latest"
            params = {
                "symbol": ",".join(symbols),
                "convert": "USD"
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=self.headers, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get("data", {})
                    else:
                        logger.error(f"CMC API error: {response.status}")
                        return {}
                        
        except Exception as e:
            logger.error(f"Error fetching CMC quotes: {e}")
            return {}
            
    async def get_global_metrics(self) -> Dict:
        """Get global cryptocurrency metrics"""
        try:
            if not self.api_key:
                logger.warning("CoinMarketCap API key not configured")
                return {}
                
            url = f"{self.base_url}/global-metrics/quotes/latest"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=self.headers) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get("data", {})
                    else:
                        logger.error(f"CMC API error: {response.status}")
                        return {}
                        
        except Exception as e:
            logger.error(f"Error fetching CMC global metrics: {e}")
            return {}
            
    async def get_trending(self) -> List[Dict]:
        """Get trending cryptocurrencies"""
        try:
            if not self.api_key:
                logger.warning("CoinMarketCap API key not configured")
                return []
                
            url = f"{self.base_url}/cryptocurrency/trending/most-visited"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=self.headers) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get("data", [])
                    else:
                        logger.error(f"CMC API error: {response.status}")
                        return []
                        
        except Exception as e:
            logger.error(f"Error fetching CMC trending: {e}")
            return []
            
    async def get_market_cap_rankings(self, limit: int = 50) -> List[Dict]:
        """Get market cap rankings"""
        try:
            listings = await self.get_latest_listings(limit=limit)
            
            rankings = []
            for coin in listings:
                quote = coin.get("quote", {}).get("USD", {})
                rankings.append({
                    "rank": coin.get("cmc_rank"),
                    "name": coin.get("name"),
                    "symbol": coin.get("symbol"),
                    "market_cap": quote.get("market_cap"),
                    "price": quote.get("price"),
                    "volume_24h": quote.get("volume_24h"),
                    "percent_change_1h": quote.get("percent_change_1h"),
                    "percent_change_24h": quote.get("percent_change_24h"),
                    "percent_change_7d": quote.get("percent_change_7d"),
                    "market_cap_dominance": quote.get("market_cap_dominance")
                })
                
            return rankings
            
        except Exception as e:
            logger.error(f"Error getting market cap rankings: {e}")
            return []
            
    async def get_whale_activity(self, symbol: str) -> Dict:
        """Get whale activity for a specific symbol (mock implementation)"""
        try:
            # This would integrate with blockchain data or exchange APIs
            # to track large transactions and whale movements
            # For now, return mock data
            
            return {
                "symbol": symbol,
                "large_transactions_24h": 15,
                "total_volume_whales": 2500000,
                "whale_net_flow": 150000,
                "top_whale_addresses": [
                    {"address": "0x1234...", "balance": 1000, "change_24h": 50},
                    {"address": "0x5678...", "balance": 800, "change_24h": -25},
                ],
                "whale_sentiment": "bullish"
            }
            
        except Exception as e:
            logger.error(f"Error getting whale activity: {e}")
            return {}
            
    async def get_fear_greed_index(self) -> Dict:
        """Get fear and greed index"""
        try:
            # This would integrate with alternative.me API or similar
            # For now, return mock data
            
            return {
                "value": 65,
                "classification": "Greed",
                "timestamp": "2024-01-01T00:00:00Z",
                "time_until_update": "23:45:12"
            }
            
        except Exception as e:
            logger.error(f"Error getting fear greed index: {e}")
            return {}
            
    async def get_social_sentiment(self, symbol: str) -> Dict:
        """Get social sentiment for a symbol"""
        try:
            # This would integrate with social media APIs
            # For now, return mock data
            
            return {
                "symbol": symbol,
                "twitter_sentiment": 0.65,
                "reddit_sentiment": 0.58,
                "telegram_sentiment": 0.72,
                "overall_sentiment": 0.65,
                "sentiment_classification": "Bullish",
                "mentions_24h": 1250,
                "engagement_rate": 0.12
            }
            
        except Exception as e:
            logger.error(f"Error getting social sentiment: {e}")
            return {}
