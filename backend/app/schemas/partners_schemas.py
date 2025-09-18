from pydantic import BaseModel, Field

class PartnerResponse(BaseModel):
    partner_id: int
    name: str

    class Config:
        orm_mode = True
