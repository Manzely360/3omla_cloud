"""Pydantic schemas for blog endpoints."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class BlogPostBase(BaseModel):
    slug: str
    title: str
    excerpt: Optional[str] = None
    cover_image_url: Optional[str] = Field(default=None, alias="coverImageUrl")
    language: str = "en"
    author_name: Optional[str] = Field(default=None, alias="authorName")
    seo_description: Optional[str] = Field(default=None, alias="seoDescription")
    is_published: bool = Field(default=False, alias="isPublished")
    published_at: Optional[datetime] = Field(default=None, alias="publishedAt")
    created_at: Optional[datetime] = Field(default=None, alias="createdAt")
    updated_at: Optional[datetime] = Field(default=None, alias="updatedAt")

    class Config:
        populate_by_name = True


class BlogPostListItem(BlogPostBase):
    class Config:
        populate_by_name = True


class BlogPostDetail(BlogPostBase):
    content: str

    class Config:
        populate_by_name = True


class BlogPostCreate(BaseModel):
    slug: str
    title: str
    content: str
    excerpt: Optional[str] = None
    cover_image_url: Optional[str] = Field(default=None, alias="coverImageUrl")
    language: str = "en"
    author_name: Optional[str] = Field(default=None, alias="authorName")
    seo_description: Optional[str] = Field(default=None, alias="seoDescription")
    is_published: bool = Field(default=True, alias="isPublished")
    published_at: Optional[datetime] = Field(default=None, alias="publishedAt")

    class Config:
        populate_by_name = True


class BlogPostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    excerpt: Optional[str] = None
    cover_image_url: Optional[str] = Field(default=None, alias="coverImageUrl")
    language: Optional[str] = None
    author_name: Optional[str] = Field(default=None, alias="authorName")
    seo_description: Optional[str] = Field(default=None, alias="seoDescription")
    is_published: Optional[bool] = Field(default=None, alias="isPublished")
    published_at: Optional[datetime] = Field(default=None, alias="publishedAt")

    class Config:
        populate_by_name = True


class BlogPostListResponse(BaseModel):
    items: List[BlogPostListItem]
    total: int
    page: int
    pageSize: int = Field(alias="pageSize")

    class Config:
        populate_by_name = True
