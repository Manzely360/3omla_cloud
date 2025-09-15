"""
Service helpers for API credentials
"""

from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.credentials import ApiCredential
from core.security import encrypt_value, decrypt_value


async def upsert_credential(db: AsyncSession, user_id: int | None, provider: str, api_key: str, api_secret: str | None) -> ApiCredential:
    result = await db.execute(select(ApiCredential).where(ApiCredential.user_id == user_id, ApiCredential.provider == provider))
    cred = result.scalar_one_or_none()
    if cred is None:
        cred = ApiCredential(user_id=user_id, provider=provider)
        db.add(cred)
    cred.encrypted_api_key = encrypt_value(api_key)
    cred.encrypted_api_secret = encrypt_value(api_secret) if api_secret else ''
    cred.is_active = True
    await db.commit()
    await db.refresh(cred)
    return cred


async def get_credential(db: AsyncSession, user_id: int | None, provider: str) -> Optional[ApiCredential]:
    result = await db.execute(select(ApiCredential).where(ApiCredential.user_id == user_id, ApiCredential.provider == provider))
    return result.scalar_one_or_none()


def reveal_credential(cred: ApiCredential) -> tuple[str, Optional[str]]:
    key = decrypt_value(cred.encrypted_api_key) if cred.encrypted_api_key else ''
    secret = decrypt_value(cred.encrypted_api_secret) if cred.encrypted_api_secret else None
    return key, secret

