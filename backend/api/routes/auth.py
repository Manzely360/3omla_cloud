"""
Auth API: register, login, me
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import secrets
from datetime import datetime

from core.database import get_db
from core.security import create_access_token, get_current_user
from services.auth import authenticate_user, create_user, get_user_by_email, get_user_by_username
from services.emailer import send_welcome_email, send_verification_email
from models.user import User
from core.config import settings


router = APIRouter()


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    username: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/register")
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Password strength checks
    pw = payload.password or ""
    if len(pw) < 8 or pw.lower() == pw or pw.upper() == pw or not any(ch.isdigit() for ch in pw):
        raise HTTPException(status_code=400, detail="Password must be 8+ chars and include upper, lower, and number")
    exists = await get_user_by_email(db, payload.email)
    if exists:
        raise HTTPException(status_code=400, detail="Email already registered")
    if payload.username:
        ue = await get_user_by_username(db, payload.username)
        if ue:
            raise HTTPException(status_code=400, detail="Username already taken")
    user = await create_user(db, payload.email, payload.password, payload.username)
    # create verification token and email
    token = secrets.token_urlsafe(32)
    res = await db.execute(select(User).where(User.id == user.id))
    u = res.scalar_one()
    u.email_verification_token = token
    await db.commit()
    try:
        api_base = settings.PUBLIC_API_URL or "http://localhost:8000"
        verify_link = f"{api_base}/api/v1/auth/verify?token={token}"
        send_welcome_email(payload.email, payload.username or payload.email)
        send_verification_email(payload.email, payload.username or payload.email, verify_link)
    except Exception:
        pass
    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}


@router.post("/login")
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(db, payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    # Enforce email verification in production or when explicitly enabled
    if (settings.ENVIRONMENT == 'production' or settings.REQUIRE_EMAIL_VERIFICATION) and not getattr(user, 'is_email_verified', False):
        raise HTTPException(status_code=403, detail="Email not verified")
    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer", "email_verified": getattr(user, 'is_email_verified', False)}


@router.get("/me")
async def me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "username": current_user.username,
        "is_active": current_user.is_active,
        "email_verified": getattr(current_user, 'is_email_verified', False)
    }


@router.get("/verify")
async def verify_email(token: str = Query(...), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(User).where(User.email_verification_token == token))
    u = res.scalar_one_or_none()
    if not u:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    u.is_email_verified = True
    u.email_verified_at = datetime.utcnow()
    u.email_verification_token = None
    await db.commit()
    return {"message": "Email verified"}


@router.post("/resend-verification")
async def resend_verification(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if getattr(current_user, 'is_email_verified', False):
        return {"message": "Already verified"}
    token = secrets.token_urlsafe(32)
    res = await db.execute(select(User).where(User.id == current_user.id))
    u = res.scalar_one()
    u.email_verification_token = token
    await db.commit()
    try:
        api_base = settings.PUBLIC_API_URL or "http://localhost:8000"
        verify_link = f"{api_base}/api/v1/auth/verify?token={token}"
        send_verification_email(current_user.email, current_user.username or current_user.email, verify_link)
    except Exception:
        pass
    return {"message": "Verification email sent"}


@router.post("/profile/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    import os
    from sqlalchemy import select
    uploads_dir = os.getenv('UPLOADS_DIR', 'uploads')
    os.makedirs(uploads_dir, exist_ok=True)
    filename = f"avatar_{current_user.id}_{int(__import__('time').time())}.png"
    path = os.path.join(uploads_dir, filename)
    with open(path, 'wb') as f:
        f.write(await file.read())
    # Update user
    from models.user import User as UserModel
    res = await db.execute(select(UserModel).where(UserModel.id == current_user.id))
    u = res.scalar_one()
    u.avatar_url = f"/static/{filename}"
    await db.commit()
    return {"avatar_url": u.avatar_url}
