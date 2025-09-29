"""Remote access link API endpoints"""

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from core.config import settings
from core.database import get_db
from core.security import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    create_access_token,
    decrypt_value,
    get_current_user,
)
from services.remote_access import RemoteAccessError, RemoteAccessService
from schemas.access import (
    RemoteAccessExchangeRequest,
    RemoteAccessExchangeResponse,
    RemoteAccessLinkCreateRequest,
    RemoteAccessLinkCreatedResponse,
    RemoteAccessLinkListResponse,
    RemoteAccessLinkResponse,
)
from models.user import User

router = APIRouter()


def _serialize_link(service: RemoteAccessService, link, reveal_token: bool = False) -> RemoteAccessLinkResponse:
    token = decrypt_value(link.encrypted_token) if reveal_token else None
    share_url = service.build_share_url(token) if token else None
    token_preview = None
    if token:
        token_preview = f"••••{token[-6:]}" if len(token) > 6 else token
    return RemoteAccessLinkResponse(
        id=link.id,
        label=link.label,
        created_at=link.created_at,
        expires_at=link.expires_at,
        max_uses=link.max_uses,
        uses_left=link.uses_left,
        forward_url=link.forward_url,
        last_used_at=link.last_used_at,
        last_used_ip=link.last_used_ip,
        share_url=share_url,
        token_preview=token_preview,
    )


@router.get("/links", response_model=RemoteAccessLinkListResponse)
async def list_remote_links(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RemoteAccessLinkListResponse:
    service = RemoteAccessService(db)
    links = await service.list_links(current_user.id)
    serialized = [_serialize_link(service, link, reveal_token=True) for link in links]
    return RemoteAccessLinkListResponse(links=serialized)


@router.post(
    "/links",
    response_model=RemoteAccessLinkCreatedResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_remote_link(
    payload: RemoteAccessLinkCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RemoteAccessLinkCreatedResponse:
    service = RemoteAccessService(db)
    link, token = await service.create_link(
        user=current_user,
        label=payload.label,
        expires_in_minutes=payload.expires_in_minutes,
        max_uses=payload.max_uses,
        forward_url=payload.forward_url,
    )
    share_url = service.build_share_url(token)
    response = RemoteAccessLinkCreatedResponse(
        id=link.id,
        label=link.label,
        created_at=link.created_at,
        expires_at=link.expires_at,
        max_uses=link.max_uses,
        uses_left=link.uses_left,
        forward_url=link.forward_url,
        last_used_at=link.last_used_at,
        last_used_ip=link.last_used_ip,
        share_url=share_url,
        token_preview=f"••••{token[-6:]}" if len(token) > 6 else token,
        token=token,
    )
    return response


@router.delete("/links/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_remote_link(
    link_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    service = RemoteAccessService(db)
    deleted = await service.delete_link(link_id=link_id, user_id=current_user.id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Link not found")


@router.post("/exchange", response_model=RemoteAccessExchangeResponse)
async def exchange_remote_token(
    payload: RemoteAccessExchangeRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> RemoteAccessExchangeResponse:
    service = RemoteAccessService(db)
    try:
        link = await service.consume_token(payload.token, request.client.host if request.client else None)
    except RemoteAccessError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    result = await db.execute(select(User).where(User.id == link.created_by))
    creator = result.scalar_one_or_none()
    if not creator:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Link owner no longer exists")

    expires_delta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token({
        "sub": creator.email,
        "scope": "remote",
        "link_id": link.id,
    }, expires_delta=expires_delta)

    return RemoteAccessExchangeResponse(
        access_token=access_token,
        expires_at=datetime.utcnow() + expires_delta,
        link_label=link.label,
        forward_url=link.forward_url or settings.REMOTE_ACCESS_DEFAULT_FORWARD,
        creator_email=creator.email,
    )
