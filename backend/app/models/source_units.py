from sqlalchemy import Column, Integer, String
from app.database import Base

class SourceUnits(Base):
    __tablename__ = "source_units"

    unit_id = Column(Integer, primary_key=True, index=True)
    unit_name = Column(String(150), nullable=False)
