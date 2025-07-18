from sqlalchemy import Column, Integer, DateTime, JSON
from app.database import Base

class AnalyticsSnapshots(Base):
    __tablename__ = "analytics_snapshots"

    snapshot_id = Column(Integer, primary_key=True, index=True)
    generated_at = Column(DateTime, nullable=False)
    total_agreements = Column(Integer, nullable=False)
    total_active_agreements = Column(Integer, nullable=False)
    total_expired_agreements = Column(Integer, nullable=False)
    mou_per_country = Column(JSON, nullable=False)
    moa_per_country = Column(JSON, nullable=False)
    moa_per_activity_program = Column(JSON, nullable=False)
    partners_per_country = Column(JSON, nullable=False)
