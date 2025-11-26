from sqlalchemy import Column, Integer, DateTime, Text, ForeignKey
from app.database import Base

class AuditLogging(Base):
    __tablename__ = "audit_logging"

    audit_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    audit_timestamp = Column(DateTime, nullable=False)
    audit_description = Column(Text, nullable=False)
