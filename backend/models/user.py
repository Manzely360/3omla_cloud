"""
User model for authentication
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Index
from core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    avatar_url = Column(String(500), nullable=True)
    # Email verification
    is_email_verified = Column(Boolean, default=False)
    email_verification_token = Column(String(255), nullable=True)
    email_verified_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index('idx_users_email', 'email'),
    )
