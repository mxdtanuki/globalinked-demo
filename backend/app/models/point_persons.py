from sqlalchemy import Column, Integer, String
from app.database import Base

class PointPersons(Base):
    __tablename__ = "point_persons"

    point_person_id = Column(Integer, primary_key=True, index=True)
    point_person_position = Column(String, nullable=False)
    point_person_name = Column(String, nullable=False)
    point_person_email = Column(String, nullable=False)
