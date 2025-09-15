"""
Crypto Lead-Lag Pattern Radar - FastAPI Backend
Main application entry point
"""

from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
import structlog
import os

from api.routes import analytics, signals, market_data, trading, coinmarketcap, auth, stream, integrations
from fastapi.staticfiles import StaticFiles
from core.database import init_db
from core.config import settings
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST

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
    logger.info("Starting Crypto Lead-Lag Pattern Radar API")
    await init_db()
    logger.info("Database initialized")
    
    yield
    
    # Shutdown
    logger.info("Shutting down API")


# Create FastAPI application
app = FastAPI(
    title="Crypto Lead-Lag Pattern Radar",
    description="Real-time cryptocurrency lead-lag relationship detection and trading signals",
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
app.include_router(stream.router, prefix="/api/v1", tags=["stream"])
app.include_router(integrations.router, prefix="/api/v1/integrations", tags=["integrations"])
# Static files for uploads (avatars)
# Avoid startup crash if directory is absent in fresh deploys
app.mount("/static", StaticFiles(directory="uploads", check_dir=False), name="static")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Crypto Lead-Lag Pattern Radar API",
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
