from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.partners import Partners
from app.models.agreements import Agreements
from app.schemas.partners_schemas import PartnerResponse

router = APIRouter(prefix="/partners", tags=["Partners"])

@router.get("/", response_model=List[PartnerResponse])
def get_partners(db: Session = Depends(get_db)):
    partners = (
        db.query(
            Partners.partner_id,
            Partners.name,
            Partners.country,
            Partners.region,
            Partners.entity_type,
            Partners.address,
            Partners.website_url,
            Partners.description,
            Partners.logo_path,
            Agreements.dts_number,
            Agreements.date_expiry,
        )
        .join(Agreements, Agreements.partner_id == Partners.partner_id)
        .filter(Agreements.document_type == "MOU")
        .filter(Agreements.agreement_status == "Active")
        .all()
    )

    return [
        {
            "partner_id": p.partner_id,
            "name": p.name,
            "country": p.country,
            "region": p.region,
            "entity_type": p.entity_type,
            "address": p.address,
            "website_url": p.website_url,
            "description": p.description,
            "logo_path": p.logo_path,
            "dts_number": p.dts_number,
            "date_expiry": p.date_expiry,
        }
        for p in partners
    ]
