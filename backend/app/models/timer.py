from sqlalchemy import Column, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base

class Timer(Base):
    __tablename__ = "timer"

    agreement_id = Column(Integer, ForeignKey("agreements.agreement_id", ondelete="CASCADE"), primary_key=True)
    last_status_change = Column(DateTime, nullable=True)

    # relationships
    agreement = relationship("Agreements", back_populates="timer")
