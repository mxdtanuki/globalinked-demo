from pydantic import BaseModel
from typing import Optional

class PartnerResponse(BaseModel):
    partner_id: int
    name: str
    entity_type: Optional[str] = None
    country: Optional[str] = None
    region: Optional[str] = None
    address: Optional[str] = None
    website_url: Optional[str] = None
    description: Optional[str] = None
    logo_path: Optional[str] = None  

    class Config:
        orm_mode = True
