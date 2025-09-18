from pydantic import BaseModel, Field, EmailStr
from typing import Optional

# Cr
class UserCreate(BaseModel):
    user_name: str = Field(..., max_length=50)
    user_email: EmailStr # added to be able to send email confirmation
    user_pass: str = Field(..., max_length=255)  # will hash later
    user_position: str = Field(..., max_length=50)
    user_role: str = Field(default='staff', max_length=20) 
    user_profile_img: Optional[str] = None

# R
class UserResponse(BaseModel):
    user_id: int
    user_name: str
    user_email: EmailStr
    user_profile_img: Optional[str] = None
    user_position: str  # Job title
    user_role: str  # User role
    user_status: str

    class Config:
        from_attributes = True

# U
class UserUpdate(BaseModel):
    user_name: Optional[str] = None
    user_email: Optional[EmailStr] = None  # added to be able to update email
    user_pass: Optional[str] = None
    user_profile_img: Optional[str] = None
    user_position: Optional[str] = None  
    user_role: Optional[str] = None  

class RoleAssignment:
    
    @staticmethod
    def get_role_from_position(position: str) -> str:
        "access role based on job position"
        admin_positions = [
            "Director",
            "Partnership and Linkages Section"
        ]
        return "admin" if position in admin_positions else "staff"