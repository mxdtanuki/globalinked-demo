from sqlalchemy import Column, Integer, String
from app.database import Base

class Users(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    user_name = Column(String(50), nullable=False)
    user_pass = Column(String(255), nullable=False)
    user_profile_img = Column(String(255), nullable=True)
    user_position = Column(String(50), nullable=False)
    forgot_pass_token = Column(String(255), nullable=True)
