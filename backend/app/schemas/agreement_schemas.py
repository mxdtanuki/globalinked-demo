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
    agreement_id: int

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
    # Partner info 
    name: str = Field(..., max_length=150)
    entity_type: Optional[str] = Field(None, max_length=50)
    country: Optional[str] = Field(None, max_length=75)
    region: Optional[str] = Field(None, max_length=75)
    address: Optional[str] = Field(None, max_length=255)
    website_url: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    logo_path: Optional[str] = None  
    status: str = Field(default="active", max_length=20)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    contact_persons: List[ContactPersonCreate] = Field(default_factory=list)


class PointPersonCreate(BaseModel):
    point_person_position: str
    point_person_name: str
    point_person_email: str


class PointPersonResponse(BaseModel):
    point_person_id: int
    point_person_position: str
    point_person_name: str
    point_person_email: str
    agreement_id: int

    class Config:
        from_attributes = True


class TimerCreate(BaseModel):
    deadline: Optional[datetime] = None
    days: Optional[int] = None
    hours: Optional[int] = None
    minutes: Optional[int] = None

class TimerResponse(BaseModel):
    deadline: Optional[date] = None
    days: Optional[int] = None
    hours: Optional[int] = None
    minutes: Optional[int] = None

    class Config:
        from_attributes = True

class AgreementCreate(BaseModel):
    # IDs
    partner_id: Optional[int] = None
    partner_data: Optional[PartnerCreate] = None
    source_unit: Optional[str] = None  # now a plain string field
    timer: Optional[TimerCreate] = None

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
    point_persons: List[PointPersonCreate] = Field(default_factory=list)
    agreement_status: str = Field(..., max_length=20) 
    hardcopy_location: Optional[str] = Field(None, max_length=100)
    entry_type: str = Field(..., max_length=10)
    renewed_from_agreement_id: Optional[str] = None
    MOU_to_MOA_id: Optional[int] = None
    contact_persons: List[ContactPersonCreate] = Field(default_factory=list)
    initial_remarks: List[RemarkCreate] = Field(default_factory=list)


class AgreementResponse(BaseModel):
    # IDs
    agreement_id: int
    partner_id: int
    source_unit: Optional[str] = None   # now string, not ID

    # Partner info 
    name: str
    country: Optional[str]
    region: Optional[str]
    address: Optional[str]
    entity_type: Optional[str]
    website_url: Optional[str]
    description: Optional[str]
    logo_path: Optional[str] = None 

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
    
    # Persons
    point_persons: List[PointPersonResponse] = Field(default_factory=list)
    contact_persons: List[ContactPersonResponse] = Field(default_factory=list)
    
    # Pre-concatenated overview fields
    point_persons_display: Optional[str] = None
    contact_persons_display: Optional[str] = None

    # Status/extra
    agreement_status: str
    hardcopy_location: Optional[str]
    entry_type: str
    renewed_from_agreement_id: Optional[str] 
    MOU_to_MOA_id: Optional[int]
    remarks: List[RemarkResponse] = Field(default_factory=list)
    
    # Metadata
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


class AgreementUpdateSimple(BaseModel):
    # Basic agreement fields that can be updated directly
    entry_date: Optional[date] = None
    source_unit: Optional[str] = None  # string instead of unit_name
    dts_number: Optional[str] = None
    dts_status: Optional[str] = None
    name: Optional[str] = None
    entity_type: Optional[str] = None
    country: Optional[str] = None
    region: Optional[str] = None
    address: Optional[str] = None
    signatories_list: Optional[str] = None
    contact_persons: Optional[List[dict]] = None
    document_type: Optional[str] = None
    partnership_type: Optional[str] = None
    event_info: Optional[str] = None
    validity_period: Optional[str] = None
    date_signed: Optional[date] = None
    date_expiry: Optional[date] = None
    date_received: Optional[date] = None
    date_endorsed_to_ulco: Optional[date] = None
    date_ulco_approved: Optional[date] = None
    date_signed_by_pup: Optional[date] = None
    agreement_status: Optional[str] = None
    website_url: Optional[str] = None
    description: Optional[str] = None
    hardcopy_location: Optional[str] = None
    remarks: Optional[List[dict]] = None


class PartnerResponse(BaseModel):
    partner_id: int
    name: str
    country: Optional[str]
    entity_type: Optional[str]
    status: str
    
    class Config:
        from_attributes = True


class DashboardSummary(BaseModel):  # for analytics
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
    
class ArchiveAgreementResponse(BaseModel):
    agreement_id: int
    dts_number: str
    partner_name: str
    document_type: str
    partnership_type: str
    date_expiry: date
    point_persons_display: str

    class Config:
        orm_mode = True
