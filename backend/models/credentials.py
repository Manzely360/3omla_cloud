"""
API credential storage (encrypted)
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Index, ForeignKey
from sqlalchemy.orm import relationship
from core.database import Base


class ApiCredential(Base):
    __tablename__ = "api_credentials"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    provider = Column(String(50), nullable=False, index=True)  # bybit, binance, cmc
    encrypted_api_key = Column(String(512), nullable=False)
    encrypted_api_secret = Column(String(512), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User")

    __table_args__ = (
        Index('idx_credentials_user_provider', 'user_id', 'provider'),
    )

