from sqlalchemy import Column, Integer, String, ForeignKey
from app.database import Base
from sqlalchemy.orm import relationship

class ContactPersons(Base):
    __tablename__ = "contact_persons"

    contact_person_id = Column(Integer, primary_key=True, index=True)
    contact_person_position = Column(String, nullable=False)
    contact_person_name = Column(String, nullable=False)
    contact_person_email = Column(String, nullable=False)
    partner_id = Column(Integer, ForeignKey("partners.partner_id", ondelete="CASCADE"))
    agreement_id = Column(Integer, ForeignKey("agreements.agreement_id", ondelete="CASCADE"))

    # relationships
    partner = relationship("Partners", back_populates="contact_persons")
    agreement = relationship("Agreements", back_populates="contact_persons")

