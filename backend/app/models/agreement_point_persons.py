from sqlalchemy import Column, Integer, ForeignKey
from app.database import Base

class AgreementPointPersons(Base):
    __tablename__ = "agreement_point_persons"

    id = Column(Integer, primary_key=True, index=True)
    agreement_id = Column(Integer, ForeignKey("agreements.agreement_id"), nullable=False)
    point_person_id = Column(Integer, ForeignKey("point_persons.point_person_id"), nullable=False)
