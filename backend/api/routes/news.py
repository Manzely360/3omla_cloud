"""News and trending endpoints."""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
import aiohttp

from core.database import get_db
from services.news import NewsService
from services.market_data import MarketDataService

router = APIRouter()


async def get_news_service() -> NewsService:
    session = aiohttp.ClientSession()
    return NewsService(session)


@router.get("/headlines")
async def headlines(limit: int = Query(20, ge=1, le=100)):
    try:
        async with aiohttp.ClientSession() as session:
            service = NewsService(session)
            data = await service.fetch_headlines(limit=limit)
            return {"generated_at": datetime.utcnow().isoformat(), "headlines": data}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/trending")
async def trending(db: AsyncSession = Depends(get_db)):
    try:
        async with aiohttp.ClientSession() as session:
            service = NewsService(session)
            market_service = MarketDataService(db)
            data = await service.fetch_trending(market_service)
            return {"generated_at": datetime.utcnow().isoformat(), "coins": data}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
