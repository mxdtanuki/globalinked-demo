from xmlrpc.client import DateTime
from sqlalchemy import Column, Integer, String, DateTime
from app.database import Base

class Users(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    user_name = Column(String(50), nullable=False)
    user_pass = Column(String(255), nullable=False)
    user_profile_img = Column(String(255), nullable=True)
    user_position = Column(String(100), nullable=False) # e.g., user -- Director, Mobility
    user_role = Column(String(20), nullable=False, default='staff') # e.g., role -- admin, staff
    forgot_pass_token = Column(String(255), nullable=True) # token for password reset
    user_email = Column(String(255), nullable=False, unique=True) # added to be able to send email confirmation
    user_status = Column(String(10), nullable=True)  # e.g., approved, pending, rejected
    # Note: add user_status to your db, and if not done yet, drop point_person_list in agreements table 
    reset_token_expiry = Column(DateTime, nullable=True)