"""
Database configuration and connection management
"""

from datetime import datetime

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text
from sqlalchemy.orm import declarative_base
from core.config import settings
import structlog

logger = structlog.get_logger()

# Create async engine
engine = create_async_engine(
    settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://"),
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_recycle=300,
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Create declarative base
Base = declarative_base()


async def get_db() -> AsyncSession:
    """Dependency to get database session"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception as e:
            logger.error("Database session error", error=str(e))
            await session.rollback()
            raise
        finally:
            await session.close()


def get_async_session() -> AsyncSession:
    """Create a new async database session instance.

    Note: This returns an AsyncSession that supports "async with" directly.
    """
    return AsyncSessionLocal()


async def init_db():
    """Initialize database tables"""
    try:
        async with engine.begin() as conn:
            # Import all models to ensure they're registered
            from models import (
                access,
                analytics,
                auto_arbitrage,
                credentials,
                market_data,
                signals,
                trading,
                user,
                blog_post,
            )
            
            # Create all tables
            await conn.run_sync(Base.metadata.create_all)
            logger.info("Database tables created successfully")

            # Lightweight migrations for known schema drifts
            try:
                await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500)"))
                await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT FALSE"))
                await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255)"))
                await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP NULL"))
                await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(100)"))
                await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(100)"))
                await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_country_code VARCHAR(10)"))
                await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(32)"))
            except Exception as e:
                logger.error("Migration failed: users verification columns", error=str(e))

            # Seed blog posts if table is empty to ensure blog section has content
            try:
                result = await conn.execute(text("SELECT COUNT(*) FROM blog_posts"))
                post_count = result.scalar_one() if result is not None else 0
                if post_count == 0:
                    now = datetime.utcnow()
                    seed_posts = [
                        {
                            "slug": "lead-lag-edge-how-3omla-finds-alpha",
                            "title": "Finding the Lead-Lag Edge in Crypto Markets",
                            "excerpt": "We break down how the 3OMLA engine ranks leaders and followers across Binance, Bybit, KuCoin, Kraken, and more using real order flow.",
                            "content": (
                                "## Lead-Lag Signals That Trade Themselves\n\n"
                                "The 3OMLA lead-lag engine listens to real exchange order flow in real-time. "
                                "Our ingestion workers maintain WebSocket connectivity to Binance, Bybit, KuCoin, OKX, Coinbase, Kraken, Gate, Huobi, Bitfinex, and BitMEX. "
                                "Every trade is normalised, deduplicated, and pushed into Redis time-series so the analytics core can compute correlations every few seconds."
                            ),
                            "author_name": "3OMLA Research",
                            "language": "en",
                            "seo_description": "Discover how 3OMLA extracts lead-lag alpha directly from live exchange data.",
                            "cover_image_url": None,
                        },
                        {
                            "slug": "3omla-signal-stack-real-time-architecture",
                            "title": "Inside the 3OMLA Signal Stack",
                            "excerpt": "A technical guide to the ingestion, analytics, and alerting systems powering live trading signals across 10+ exchanges.",
                            "content": (
                                "## Real-Time Architecture Built for Pro Traders\n\n"
                                "We ship redis-backed caches, FastAPI orchestration, and WebSocket fan-out to ensure "+
                                "every signal you see in the dashboard is sourced from verified exchange prints."
                            ),
                            "author_name": "3OMLA Engineering",
                            "language": "en",
                            "seo_description": "Go deep on the streaming architecture that keeps 3OMLA signals live and verified.",
                            "cover_image_url": None,
                        },
                    ]

                    for post in seed_posts:
                        await conn.execute(
                            text(
                                """
                                INSERT INTO blog_posts (
                                    slug, title, excerpt, content, cover_image_url,
                                    language, author_name, seo_description,
                                    is_published, published_at, created_at, updated_at
                                ) VALUES (
                                    :slug, :title, :excerpt, :content, :cover_image_url,
                                    :language, :author_name, :seo_description,
                                    :is_published, :published_at, :created_at, :updated_at
                                )
                                """
                            ),
                            {
                                **post,
                                "is_published": True,
                                "published_at": now,
                                "created_at": now,
                                "updated_at": now,
                            },
                        )
                    logger.info("Seeded default blog posts", count=len(seed_posts))
            except Exception as e:
                logger.error("Failed to seed blog posts", error=str(e))
    except Exception as e:
        logger.error("Failed to initialize database", error=str(e))
        raise
