"""
Application configuration settings
"""

from pydantic_settings import BaseSettings
from typing import List, Optional
import os


class Settings(BaseSettings):
    """Application settings"""
    
    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/coinmatcher"
    REDIS_URL: str = "redis://localhost:6379"
    
    # Binance API
    BINANCE_API_KEY: Optional[str] = None
    BINANCE_SECRET_KEY: Optional[str] = None
    BINANCE_TESTNET: bool = True

    # Bybit API
    BYBIT_API_KEY: Optional[str] = None
    BYBIT_SECRET_KEY: Optional[str] = None
    BYBIT_TESTNET: bool = False

    # CoinMarketCap API
    CMC_API_KEY: Optional[str] = None
    
    # Application
    SECRET_KEY: str = "your-secret-key-here"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"
    
    # API
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    FRONTEND_URL: str = "http://localhost:3000"
    PUBLIC_API_URL: str = "http://localhost:8000"
    
    # Auth
    REQUIRE_EMAIL_VERIFICATION: bool = False
    
    # WebSocket
    WS_HEARTBEAT_INTERVAL: int = 30
    WS_RECONNECT_DELAY: int = 5
    
    # Analytics
    CORRELATION_WINDOWS: List[str] = ["5m", "15m", "1h", "4h", "1d"]
    LEAD_LAG_MAX_LAG: int = 60
    MIN_CORRELATION_THRESHOLD: float = 0.3
    MIN_HIT_RATE_THRESHOLD: float = 0.6
    
    # Risk Management
    MAX_POSITION_SIZE: float = 0.1
    MAX_DAILY_LOSS: float = 0.05
    COOLDOWN_AFTER_LOSSES: int = 3
    
    # Feature Flags
    ENABLE_WHALE_ANALYSIS: bool = False
    ENABLE_REGIME_DETECTION: bool = True
    ENABLE_SPOOF_DETECTION: bool = True

    # Remote Access Links
    REMOTE_ACCESS_BASE_URL: Optional[str] = None
    REMOTE_ACCESS_MAX_MINUTES: int = 24 * 60  # 24 hours
    REMOTE_ACCESS_MAX_USES: int = 20
    REMOTE_ACCESS_DEFAULT_FORWARD: str = "/"

    # Networking / Hosts
    # Comma-separated list of allowed hosts for FastAPI TrustedHostMiddleware
    # Use '*' to allow all hosts (development / container networking)
    ALLOWED_HOSTS: List[str] = ["*"]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
