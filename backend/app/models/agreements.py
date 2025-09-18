from sqlalchemy import Column, Integer, String, Date, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Agreements(Base):
    __tablename__ = "agreements"

    agreement_id = Column(Integer, primary_key=True, index=True)
    source_unit = Column(String(100), nullable=True)
    dts_number = Column(String(50), nullable=False)
    dts_status = Column(String(20), nullable=False)
    entry_date = Column(Date, nullable=False)
    date_received = Column(Date, nullable=True)
    date_endorsed_to_ulco = Column(Date, nullable=True)
    date_ulco_approved = Column(Date, nullable=True)
    date_signed_by_pup = Column(Date, nullable=True)
    date_signed = Column(Date, nullable=True)
    date_expiry = Column(Date, nullable=True)
    validity_period = Column(String(50), nullable=True)
    document_type = Column(String(10), nullable=False)
    partnership_type = Column(String(100), nullable=True)
    event_info = Column(String(255), nullable=True)
    signatories_list = Column(Text, nullable=True)
    agreement_status = Column(String(20), nullable=False)
    hardcopy_location = Column(String(100), nullable=True)
    entry_type = Column(String(10), nullable=False)
    renewed_from_agreement_id = Column(String, nullable=True)
    MOU_to_MOA_id = Column(Integer, ForeignKey("agreements.agreement_id"), nullable=True)

    # relationships
    partner_id = Column(Integer, ForeignKey("partners.partner_id"))
    partner = relationship("Partners", back_populates="agreements")

    contact_persons = relationship("ContactPersons", back_populates="agreement", cascade="all, delete")
    point_persons = relationship("PointPersons", back_populates="agreement", cascade="all, delete")
    timer = relationship("Timer", uselist=False, back_populates="agreement", cascade="all, delete-orphan")

