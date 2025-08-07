from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime


class ContactPersonCreate(BaseModel):
    contact_person_position: str
    contact_person_name: str
    contact_person_email: str

class ContactPersonResponse(BaseModel):
    contact_person_id: int
    contact_person_position: str
    contact_person_name: str
    contact_person_email: str
    partner_id: int
    
    class Config:
        from_attributes = True

class RemarkCreate(BaseModel):
    remark_text: str

class RemarkResponse(BaseModel):
    remark_id: int
    agreement_id: int
    user_id: int
    remark_text: str
    remark_timestamp: datetime
    
    class Config:
        from_attributes = True

class PartnerCreate(BaseModel):
    #Partnet info 
    name: str = Field(..., max_length=150)
    entity_type: Optional[str] = Field(None, max_length=50)
    country: Optional[str] = Field(None, max_length=75)
    region: Optional[str] = Field(None, max_length=75)
    address: Optional[str] = Field(None, max_length=255)
    website_url: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    logo_path: Optional[str] = Field(None, max_length=255)
    status: str = Field(default="active", max_length=20)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    contact_persons: Optional[List[ContactPersonCreate]] = []

class AgreementCreate(BaseModel):
    # IDs
    partner_id: Optional[int] = None
    partner_data: Optional[PartnerCreate] = None
    source_unit_id: int  #which dept/college

    # Agreement info
    dts_number: str = Field(..., max_length=50)
    dts_status: str = Field(..., max_length=20)
    entry_date: date
    date_received: Optional[date] = None  
    date_endorsed_to_ulco: Optional[date] = None
    date_ulco_approved: Optional[date] = None
    date_signed_by_pup: Optional[date] = None
    date_signed: Optional[date] = None
    date_expiry: Optional[date] = None
    document_type: str = Field(..., max_length=10)  # "MOU" or "MOA" 
    partnership_type: Optional[str] = Field(None, max_length=100) 
    validity_period: Optional[str] = Field(None, max_length=50) 
    event_info: Optional[str] = Field(None, max_length=255)
    signatories_list: Optional[str] = None
    point_persons_list: Optional[str] = None
    agreement_status: str = Field(..., max_length=20) 
    hardcopy_location: Optional[str] = Field(None, max_length=100)
    entry_type: str = Field(..., max_length=10)
    renewed_from_agreement_id: Optional[int] = None
    MOU_to_MOA_id: Optional[int] = None
    initial_remarks: Optional[List[RemarkCreate]] = []

class AgreementResponse(BaseModel):
    # IDs
    agreement_id: int
    partner_id: int

    source_unit_id: int
    
    # Partner info 
    name: str  # Partner name
    country: Optional[str]
    region: Optional[str]
    address: Optional[str]
    entity_type: Optional[str]
    website_url: Optional[str]
    description: Optional[str]
    logo_path: Optional[str] 
    
    # Source info 
    unit_name: str  # College/department name
    
    # Agreement info 
    dts_number: str
    dts_status: str
    entry_date: date
    date_received: Optional[date]
    date_endorsed_to_ulco: Optional[date]
    date_ulco_approved: Optional[date]
    date_signed_by_pup: Optional[date]
    date_signed: Optional[date]
    date_expiry: Optional[date]
    document_type: str
    partnership_type: Optional[str]
    validity_period: Optional[str]
    event_info: Optional[str]
    signatories_list: Optional[str]
    point_persons_list: Optional[str]
    agreement_status: str
    hardcopy_location: Optional[str]
    entry_type: str
    renewed_from_agreement_id: Optional[int]
    MOU_to_MOA_id: Optional[int]
    contact_persons: List[ContactPersonResponse] = [] 
    remarks: List[RemarkResponse] = [] 
    
    # Metadata (for filtering)
    created_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class PartnerResponse(BaseModel):
    partner_id: int
    name: str
    country: Optional[str]
    entity_type: Optional[str]
    status: str
    
    class Config:
        from_attributes = True

class DashboardSummary(BaseModel):
    total_agreements: int
    total_mou: int
    total_moa: int
    active_agreements: int
    expired_agreements: int
    pending_approval: int
    signed_agreements: int
    by_status: dict
    by_country: dict
    recent_agreements: list