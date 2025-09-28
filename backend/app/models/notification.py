from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime
from zoneinfo import ZoneInfo

PH_TZ = ZoneInfo("Asia/Manila")

class Notification(Base):
    __tablename__ = "notifications"

    notification_id = Column(Integer, primary_key=True, index=True)
    agreement_id = Column(
        Integer,
        ForeignKey("agreements.agreement_id", ondelete="CASCADE"),
        nullable=True
    )
    user_id = Column(
        Integer,
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=True
    )  # who should see it
    category = Column(String(50), nullable=False)  # e.g., 'expiring', 'pending', 'renewal'
    message = Column(Text, nullable=False)
    recommended_action = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.now(PH_TZ))
    is_read = Column(Boolean, default=False)

    agreement = relationship("Agreements")
    user = relationship("Users")
