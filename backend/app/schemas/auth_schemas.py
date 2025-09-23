from pydantic import BaseModel

class UserInfo(BaseModel):
    user_id: int
    user_email: str
    user_role: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserInfo 
