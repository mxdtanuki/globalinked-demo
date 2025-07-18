from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class DocumentVersions(Base):
    __tablename__ = "document_versions"

    version_id = Column(Integer, primary_key=True, index=True)
    agreement_id = Column(Integer, ForeignKey("agreements.agreement_id"), nullable=False)
    version_number = Column(Integer, nullable=False)
    file_path = Column(String, nullable=False)
    uploaded_at = Column(DateTime, nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    version_comment = Column(String, nullable=True)
    status_at_upload = Column(String, nullable=True)
