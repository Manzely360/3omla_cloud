"""Pydantic schemas for remote access links"""

from datetime import datetime, timedelta
from typing import Optional

from pydantic import BaseModel, Field


class RemoteAccessLinkCreateRequest(BaseModel):
    label: Optional[str] = Field(default=None, max_length=100)
    expires_in_minutes: Optional[int] = Field(
        default=None,
        ge=1,
        description="Minutes until the link expires. Leave null for no expiry."
    )
    max_uses: Optional[int] = Field(default=1, ge=1, description="Maximum number of times the link can be used")
    forward_url: Optional[str] = Field(default="/", max_length=255)


class RemoteAccessLinkResponse(BaseModel):
    id: int
    label: Optional[str]
    created_at: datetime
    expires_at: Optional[datetime]
    max_uses: int
    uses_left: int
    forward_url: Optional[str]
    last_used_at: Optional[datetime]
    last_used_ip: Optional[str]
    share_url: Optional[str] = None
    token_preview: Optional[str] = None

    class Config:
        orm_mode = True


class RemoteAccessLinkCreatedResponse(RemoteAccessLinkResponse):
    token: str


class RemoteAccessExchangeRequest(BaseModel):
    token: str = Field(..., min_length=10, description="One-time remote access token")


class RemoteAccessExchangeResponse(BaseModel):
    access_token: str
    expires_at: datetime
    link_label: Optional[str]
    forward_url: str
    creator_email: Optional[str]


class RemoteAccessLinkListResponse(BaseModel):
    links: list[RemoteAccessLinkResponse]
