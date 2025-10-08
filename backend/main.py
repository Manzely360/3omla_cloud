"""
3OMLA Intelligence Hub - FastAPI Backend
Main application entry point
"""

from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
import structlog
import os

from api.routes import (
    access,
    advisor,
    analytics,
    auth,
    coinmarketcap,
    integrations,
    market_data,
    news,
    auto_arb,
    signals,
    status,
    stream,
    trading,
    real_time_data,
    analysis,
    # trading_api,  # Temporarily disabled due to import issues
    blog,
)
from fastapi.staticfiles import StaticFiles
from core.database import init_db
from core.config import settings
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
from services.market_stream_forwarder import MarketStreamForwarder

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("Starting 3OMLA Intelligence Hub API")
    await init_db()
    logger.info("Database initialized")
    
    # Start Ultra Price Oracle
    from services.ultra_price_oracle import ultra_oracle
    await ultra_oracle.start()
    logger.info("🚀 Ultra Price Oracle started - 10x better than Binance!")

    market_forwarder = None
    try:
        market_forwarder = MarketStreamForwarder(
            market_handler=real_time_data.broadcast_market_data,
            status_handler=real_time_data.broadcast_exchange_status,
        )
        await market_forwarder.start()
        logger.info("Market stream forwarder running")
    except Exception as forward_error:
        logger.error("Failed to start market stream forwarder", error=str(forward_error))
    
    yield
    
    # Shutdown
    logger.info("Shutting down API")
    if market_forwarder:
        try:
            await market_forwarder.stop()
        except Exception as forward_error:
            logger.error("Failed to stop market stream forwarder", error=str(forward_error))
    await ultra_oracle.stop()


# Create FastAPI application
app = FastAPI(
    title="3OMLA Intelligence Core",
    description="3OMLA market intelligence, real-time lead-lag analytics, and guided trading workflows",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add trusted host middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS
)

# Include API routes
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["analytics"])
app.include_router(signals.router, prefix="/api/v1/signals", tags=["signals"])
app.include_router(market_data.router, prefix="/api/v1/market", tags=["market-data"])
app.include_router(trading.router, prefix="/api/v1/trading", tags=["trading"])
app.include_router(coinmarketcap.router, prefix="/api/v1/cmc", tags=["coinmarketcap"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(access.router, prefix="/api/v1/access", tags=["remote-access"])
app.include_router(stream.router, prefix="/api/v1", tags=["stream"])
app.include_router(integrations.router, prefix="/api/v1/integrations", tags=["integrations"])
app.include_router(advisor.router, prefix="/api/v1/advisor", tags=["advisor"])
app.include_router(news.router, prefix="/api/v1/news", tags=["news"])
app.include_router(auto_arb.router, prefix="/api/v1/auto_arb", tags=["auto-arbitrage"])
app.include_router(status.router, prefix="/api/v1/status", tags=["status"])
app.include_router(real_time_data.router, prefix="/api/v1/realtime", tags=["real-time-data"])
app.include_router(analysis.router, prefix="/api/v1/analysis", tags=["analysis"])
# app.include_router(trading_api.router, prefix="/api/v1/trading-api", tags=["trading-api"])  # Temporarily disabled
app.include_router(blog.router, prefix="/api/v1/blog", tags=["blog"])
# Static files for uploads (avatars)
# Avoid startup crash if directory is absent in fresh deploys
app.mount("/static", StaticFiles(directory="uploads", check_dir=False), name="static")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "3OMLA Intelligence Core",
        "version": "1.0.0",
        "status": "operational"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": "2024-01-01T00:00:00Z"
    }


@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint"""
    data = generate_latest()
    return Response(content=data, media_type=CONTENT_TYPE_LATEST)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG
    )
