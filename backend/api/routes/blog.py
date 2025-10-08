"""Blog API routes exposing marketing content stored in Postgres."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.security import get_current_user
from models.user import User
from schemas.blog import (
    BlogPostCreate,
    BlogPostDetail,
    BlogPostListItem,
    BlogPostListResponse,
    BlogPostUpdate,
)
from services.blog import BlogService

router = APIRouter()


def _serialize_list_item(post) -> BlogPostListItem:
    return BlogPostListItem(
        slug=post.slug,
        title=post.title,
        excerpt=post.excerpt,
        coverImageUrl=post.cover_image_url,
        language=post.language,
        authorName=post.author_name,
        seoDescription=post.seo_description,
        isPublished=post.is_published,
        publishedAt=post.published_at,
        createdAt=post.created_at,
        updatedAt=post.updated_at,
    )


def _serialize_detail(post) -> BlogPostDetail:
    return BlogPostDetail(
        slug=post.slug,
        title=post.title,
        excerpt=post.excerpt,
        content=post.content,
        coverImageUrl=post.cover_image_url,
        language=post.language,
        authorName=post.author_name,
        seoDescription=post.seo_description,
        isPublished=post.is_published,
        publishedAt=post.published_at,
        createdAt=post.created_at,
        updatedAt=post.updated_at,
    )


@router.get("/", response_model=BlogPostListResponse)
async def list_posts(
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100, alias="pageSize"),
    language: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Return paginated published blog posts."""
    service = BlogService(db)
    offset = (page - 1) * page_size
    items, total = await service.list_posts(
        limit=page_size,
        offset=offset,
        language=language,
        search=search,
    )
    response_items = [_serialize_list_item(item) for item in items]
    return BlogPostListResponse(
        items=response_items,
        total=total,
        page=page,
        pageSize=page_size,
    )


@router.get("/{slug}", response_model=BlogPostDetail)
async def get_post(slug: str, db: AsyncSession = Depends(get_db)):
    service = BlogService(db)
    post = await service.get_by_slug(slug)
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blog post not found")
    return _serialize_detail(post)


@router.post("/", response_model=BlogPostDetail, status_code=status.HTTP_201_CREATED)
async def create_post(
    payload: BlogPostCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Create a blog post. Requires an authenticated user."""
    service = BlogService(db)
    existing = await service.get_by_slug(payload.slug, include_unpublished=True)
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Slug already exists")

    post = await service.create_post(
        slug=payload.slug,
        title=payload.title,
        content=payload.content,
        excerpt=payload.excerpt,
        cover_image_url=payload.cover_image_url,
        language=payload.language,
        author_name=payload.author_name or user.username or user.email,
        seo_description=payload.seo_description,
        is_published=payload.is_published,
        published_at=payload.published_at,
    )
    return _serialize_detail(post)


@router.put("/{slug}", response_model=BlogPostDetail)
async def update_post(
    slug: str,
    payload: BlogPostUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    service = BlogService(db)
    post = await service.get_by_slug(slug, include_unpublished=True)
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blog post not found")

    update_data = payload.model_dump(exclude_unset=True)
    updated = await service.update_post(post, **update_data)
    # Fill author when missing
    if not updated.author_name:
        updated.author_name = user.username or user.email
        await db.commit()
        await db.refresh(updated)

    return _serialize_detail(updated)


# FastAPI expects an empty response body for 204 responses
@router.delete("/{slug}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    slug: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    service = BlogService(db)
    post = await service.get_by_slug(slug, include_unpublished=True)
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blog post not found")

    await service.delete_post(post)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
