from pydantic import BaseModel, Field
from typing import Optional

# Cr
class UserCreate(BaseModel):
    user_name: str = Field(..., max_length=50)
    user_pass: str = Field(..., max_length=255)  # will hash later
    user_position: str = Field(..., max_length=50)
    user_profile_img: Optional[str] = None

# R
class UserResponse(BaseModel):
    user_id: int
    user_name: str
    user_profile_img: Optional[str] = None
    user_position: str
    user_status: str

    class Config:
        from_attributes = True

# U
class UserUpdate(BaseModel):
    user_name: Optional[str] = None
    user_pass: Optional[str] = None
    user_profile_img: Optional[str] = None
    user_position: Optional[str] = None
