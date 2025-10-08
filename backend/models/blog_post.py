"""
Blog post model for the marketing and insights section.
"""

from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text
from sqlalchemy.sql import func

from core.database import Base


class BlogPost(Base):
    __tablename__ = "blog_posts"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(200), unique=True, nullable=False, index=True)
    title = Column(String(200), nullable=False)
    excerpt = Column(String(500), nullable=True)
    content = Column(Text, nullable=False)
    cover_image_url = Column(String(500), nullable=True)
    language = Column(String(5), nullable=False, default="en")
    author_name = Column(String(120), nullable=True)
    seo_description = Column(String(255), nullable=True)
    is_published = Column(Boolean, nullable=False, default=False)
    published_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    def mark_published(self, when: datetime | None = None) -> None:
        """Helper to publish the post immediately or at the provided datetime."""
        self.is_published = True
        self.published_at = when or datetime.utcnow()

