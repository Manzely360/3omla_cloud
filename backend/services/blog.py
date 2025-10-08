"""Service layer for blog operations."""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional, Tuple

from sqlalchemy import Select, and_, desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.blog_post import BlogPost


class BlogService:
    """Encapsulates read/write blog access."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list_posts(
        self,
        *,
        limit: int = 12,
        offset: int = 0,
        language: Optional[str] = None,
        search: Optional[str] = None,
        include_unpublished: bool = False,
    ) -> Tuple[List[BlogPost], int]:
        """Return paginated posts and total count."""
        filters = []
        if not include_unpublished:
            filters.append(BlogPost.is_published.is_(True))
        if language:
            filters.append(BlogPost.language == language)
        if search:
            like = f"%{search.lower()}%"
            filters.append(
                or_(
                    func.lower(BlogPost.title).like(like),
                    func.lower(BlogPost.excerpt).like(like),
                    func.lower(BlogPost.content).like(like),
                )
            )

        stmt: Select = select(BlogPost).order_by(desc(BlogPost.published_at.nullslast()))
        if filters:
            stmt = stmt.where(and_(*filters))
        stmt = stmt.offset(offset).limit(limit)

        count_stmt = select(func.count()).select_from(BlogPost)
        if filters:
            count_stmt = count_stmt.where(and_(*filters))

        result = await self.db.execute(stmt)
        posts = result.scalars().all()

        total = await self.db.scalar(count_stmt)
        total_count = int(total or 0)

        return posts, total_count

    async def get_by_slug(
        self,
        slug: str,
        *,
        include_unpublished: bool = False,
    ) -> Optional[BlogPost]:
        filters = [BlogPost.slug == slug]
        if not include_unpublished:
            filters.append(BlogPost.is_published.is_(True))

        stmt = select(BlogPost).where(and_(*filters))
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def create_post(
        self,
        *,
        slug: str,
        title: str,
        content: str,
        excerpt: Optional[str] = None,
        cover_image_url: Optional[str] = None,
        language: str = "en",
        author_name: Optional[str] = None,
        seo_description: Optional[str] = None,
        is_published: bool = True,
        published_at: Optional[datetime] = None,
    ) -> BlogPost:
        post = BlogPost(
            slug=slug,
            title=title,
            content=content,
            excerpt=excerpt,
            cover_image_url=cover_image_url,
            language=language,
            author_name=author_name,
            seo_description=seo_description,
            is_published=is_published,
            published_at=published_at,
        )
        if is_published and published_at is None:
            post.mark_published()
        self.db.add(post)
        await self.db.commit()
        await self.db.refresh(post)
        return post

    async def update_post(self, post: BlogPost, **fields) -> BlogPost:
        if not fields:
            return post
        for key, value in fields.items():
            if value is None and key not in {"is_published"}:
                continue
            if hasattr(post, key) and value is not None:
                setattr(post, key, value)

        if fields.get("is_published") and post.published_at is None:
            post.mark_published()

        await self.db.commit()
        await self.db.refresh(post)
        return post

    async def delete_post(self, post: BlogPost) -> None:
        await self.db.delete(post)
        await self.db.commit()
