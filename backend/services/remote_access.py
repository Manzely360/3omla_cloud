"""Remote access link management service"""

from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta
from typing import List, Optional, Tuple

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.security import encrypt_value
from models.access import RemoteAccessLink
from models.user import User

logger = structlog.get_logger()


class RemoteAccessError(Exception):
    """Base remote access exception"""


class RemoteAccessService:
    """Service layer for managing remote access links"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_link(
        self,
        *,
        user: User,
        label: Optional[str] = None,
        expires_in_minutes: Optional[int] = None,
        max_uses: Optional[int] = None,
        forward_url: Optional[str] = None,
    ) -> Tuple[RemoteAccessLink, str]:
        """Create a new remote access link and return (link, plaintext token)."""

        secret = secrets.token_urlsafe(32)
        token_hash = self._hash_token(secret)
        safe_max_uses = max(1, min(max_uses or 1, settings.REMOTE_ACCESS_MAX_USES))

        expires_at: Optional[datetime] = None
        if expires_in_minutes:
            bounded_minutes = max(1, min(expires_in_minutes, settings.REMOTE_ACCESS_MAX_MINUTES))
            expires_at = datetime.utcnow() + timedelta(minutes=bounded_minutes)

        link = RemoteAccessLink(
            token_hash=token_hash,
            encrypted_token=encrypt_value(secret),
            label=label,
            created_by=user.id,
            expires_at=expires_at,
            max_uses=safe_max_uses,
            uses_left=safe_max_uses,
            forward_url=forward_url or settings.REMOTE_ACCESS_DEFAULT_FORWARD,
        )

        self.db.add(link)
        await self.db.commit()
        await self.db.refresh(link)

        logger.info(
            "remote_access.link_created",
            link_id=link.id,
            created_by=user.id,
            label=label,
            expires_at=expires_at.isoformat() if expires_at else None,
            max_uses=safe_max_uses,
        )

        return link, secret

    async def list_links(self, user_id: int) -> List[RemoteAccessLink]:
        """List links created by the user."""
        result = await self.db.execute(
            select(RemoteAccessLink)
            .where(RemoteAccessLink.created_by == user_id)
            .order_by(RemoteAccessLink.created_at.desc())
        )
        return list(result.scalars().all())

    async def delete_link(self, link_id: int, user_id: int) -> bool:
        """Delete a link if owned by the user."""
        result = await self.db.execute(
            select(RemoteAccessLink).where(
                RemoteAccessLink.id == link_id,
                RemoteAccessLink.created_by == user_id,
            )
        )
        link = result.scalar_one_or_none()
        if not link:
            return False

        await self.db.delete(link)
        await self.db.commit()

        logger.info("remote_access.link_deleted", link_id=link_id, user_id=user_id)
        return True

    async def consume_token(self, token: str, request_ip: Optional[str] = None) -> RemoteAccessLink:
        """Validate and consume a remote access token."""
        token_hash = self._hash_token(token)
        result = await self.db.execute(
            select(RemoteAccessLink)
            .where(RemoteAccessLink.token_hash == token_hash)
            .with_for_update()
        )
        link = result.scalar_one_or_none()
        if not link:
            raise RemoteAccessError("Invalid or expired access token")

        if link.expires_at and link.expires_at < datetime.utcnow():
            raise RemoteAccessError("This link has expired")

        if link.uses_left <= 0:
            raise RemoteAccessError("This link has no remaining uses")

        link.uses_left -= 1
        link.last_used_at = datetime.utcnow()
        if request_ip:
            link.last_used_ip = request_ip

        await self.db.commit()
        await self.db.refresh(link)

        logger.info(
            "remote_access.link_consumed",
            link_id=link.id,
            remaining=link.uses_left,
            ip=request_ip,
        )

        return link

    def build_share_url(self, token: str) -> str:
        """Construct the public share URL for a token."""
        base_url = (
            settings.REMOTE_ACCESS_BASE_URL
            or settings.PUBLIC_FRONTEND_URL
            or settings.FRONTEND_URL
            or "http://localhost:3000"
        )
        return f"{base_url.rstrip('/')}/remote/{token}"

    @staticmethod
    def _hash_token(token: str) -> str:
        return hashlib.sha256(token.encode("utf-8")).hexdigest()
