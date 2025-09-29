"""Remote access link model"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship

from core.database import Base


class RemoteAccessLink(Base):
    __tablename__ = "remote_access_links"

    id = Column(Integer, primary_key=True, index=True)
    token_hash = Column(String(128), nullable=False, unique=True, index=True)
    encrypted_token = Column(String(512), nullable=False)
    label = Column(String(100), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=True)
    max_uses = Column(Integer, default=1, nullable=False)
    uses_left = Column(Integer, default=1, nullable=False)
    last_used_at = Column(DateTime, nullable=True)
    last_used_ip = Column(String(64), nullable=True)
    forward_url = Column(String(255), nullable=True)

    creator = relationship("User")

    __table_args__ = (
        Index('idx_remote_access_creator', 'created_by'),
    )
