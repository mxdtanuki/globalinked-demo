from sqlalchemy import Column, Integer, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from app.database import Base

class AgreementRemarks(Base):
    __tablename__ = "agreement_remarks"

    remark_id = Column(Integer, primary_key=True, index=True)
    agreement_id = Column(Integer, ForeignKey("agreements.agreement_id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    remark_text = Column(Text, nullable=False)
    remark_timestamp = Column(DateTime, nullable=False)

    # relationships
    agreement = relationship("Agreement")
    user = relationship("User")
