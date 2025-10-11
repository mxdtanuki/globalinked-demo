from sqlalchemy import Column, Integer, String, Text, DateTime, LargeBinary
from app.database import Base
from sqlalchemy.orm import relationship

class Partners(Base):
    __tablename__ = "partners"

    partner_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    entity_type = Column(String(50), nullable=True)
    country = Column(String(75), nullable=True)
    region = Column(String(75), nullable=True)
    address = Column(String(255), nullable=True)
    website_url = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    logo_path = Column(Text, nullable=True)
    status = Column(String(20), nullable=False)
    created_at = Column(DateTime, nullable=False)

    agreements = relationship("Agreements", back_populates="partner", cascade="all, delete")
    contact_persons = relationship("ContactPersons", back_populates="partner", cascade="all, delete")
