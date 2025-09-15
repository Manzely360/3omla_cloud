"""
Integrations API: store and fetch API credentials
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.security import get_current_user
from models.user import User
from services.integrations import upsert_credential, get_credential


router = APIRouter()


class CredentialPayload(BaseModel):
    provider: str  # bybit | binance | cmc
    api_key: str
    api_secret: str | None = None


@router.post("/credentials")
async def save_credentials(payload: CredentialPayload, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    if payload.provider.lower() not in {"bybit", "binance", "cmc"}:
        raise HTTPException(status_code=400, detail="Unsupported provider")
    cred = await upsert_credential(db, user.id, payload.provider.lower(), payload.api_key, payload.api_secret)
    return {"provider": cred.provider, "status": "saved"}


@router.get("/credentials/{provider}")
async def fetch_credential(provider: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    cred = await get_credential(db, user.id, provider.lower())
    if not cred:
        raise HTTPException(status_code=404, detail="Not configured")
    # Do not return secrets; only status
    return {"provider": provider.lower(), "configured": True}

