from sqlalchemy import Column, Date, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Timer(Base):
    __tablename__ = "timer"

    agreement_id = Column(Integer, ForeignKey("agreements.agreement_id", ondelete="CASCADE"), primary_key=True)
    deadline = Column(Date, nullable=True)
    days = Column(Integer)
    hours = Column(Integer)
    minutes = Column(Integer)

    # relationships
    agreement = relationship("Agreements", back_populates="timer")
