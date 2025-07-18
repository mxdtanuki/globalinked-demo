from sqlalchemy import Column, Integer, String, Text
from app.database import Base

class EmailTemplates(Base):
    __tablename__ = "email_templates"

    template_id = Column(Integer, primary_key=True, index=True)
    template_name = Column(String, nullable=False)
    body_html = Column(Text, nullable=False)
