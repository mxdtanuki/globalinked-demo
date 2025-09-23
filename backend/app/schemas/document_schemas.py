from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class DocumentVersionCreate(BaseModel):
    dts_number: str = Field(..., max_length=50)
    version_comment: Optional[str] = None
    status_at_upload: Optional[str] = None

class DocumentVersionResponse(BaseModel):
    version_id: int
    dts_number: str
    version_number: int
    file_path: str
    download_url: Optional[str] = None
    uploaded_at: datetime
    user_id: int
    version_comment: Optional[str] = None
    status_at_upload: Optional[str] = None

    class Config:
        from_attributes = True

class DocumentVersionUpdate(BaseModel):
    version_comment: Optional[str] = None
    status_at_upload: Optional[str] = None
    # If a file is uploaded during update we handle it as multipart in endpoint, not here.
