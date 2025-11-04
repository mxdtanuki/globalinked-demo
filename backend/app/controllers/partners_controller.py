from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session
from contextlib import contextmanager
from app.database import SessionLocal
from typing import List
from app.models.partners import Partners
from app.models.agreements import Agreements
from app.schemas.partners_schemas import PartnerResponse
import logging

logger = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/partners", tags=["Partners"])

@contextmanager
def _open_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

@router.get("/")
def get_all_partners():
    with _open_session() as db:
        try:
            partners = db.query(Partners).all()
            return partners
        except Exception as e:
            logger.error(f"Error fetching all partners: {e}")
            raise HTTPException(status_code=500, detail=str(e))

@router.get("/active", response_model=List[PartnerResponse])
def get_active_partners():
    with _open_session() as db:
        try:
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
        except Exception as e:
            logger.error(f"Error fetching active partners: {e}")
            raise HTTPException(status_code=500, detail=str(e))

@router.get("/{partner_id}")
def get_partner(partner_id: int):
    with _open_session() as db:
        try:
            partner = db.query(Partners).filter(Partners.partner_id == partner_id).first()
            if not partner:
                raise HTTPException(status_code=404, detail="Partner not found")
            return partner
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error fetching partner {partner_id}: {e}")
            raise HTTPException(status_code=500, detail=str(e))

@router.get("/{partner_id}/agreements")
def get_partner_agreements(partner_id: int):
    with _open_session() as db:
        try:
            partner = db.query(Partners).filter(Partners.partner_id == partner_id).first()
            if not partner:
                raise HTTPException(status_code=404, detail="Partner not found")
            
            agreements = db.query(Agreements).filter(Agreements.partner_id == partner_id).all()
            return {
                "partner": partner,
                "agreements": agreements,
                "total": len(agreements)
            }
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error fetching agreements for partner {partner_id}: {e}")
            raise HTTPException(status_code=500, detail=str(e))

@router.get("/search/{query}")
def search_partners(query: str):
    with _open_session() as db:
        try:
            search_term = f"%{query}%"
            partners = db.query(Partners).filter(
                Partners.name.ilike(search_term) | 
                Partners.country.ilike(search_term)
            ).all()
            return partners
        except Exception as e:
            logger.error(f"Error searching partners with query '{query}': {e}")
            raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
def create_partner(partner_data: dict):
    with _open_session() as db:
        try:
            new_partner = Partners(**partner_data)
            db.add(new_partner)
            db.commit()
            db.refresh(new_partner)
            logger.info(f"Partner created: {new_partner.partner_id}")
            return new_partner
        except Exception as e:
            db.rollback()
            logger.error(f"Error creating partner: {e}")
            raise HTTPException(status_code=500, detail=str(e))

@router.put("/{partner_id}")
def update_partner(partner_id: int, partner_data: dict):
    with _open_session() as db:
        try:
            partner = db.query(Partners).filter(Partners.partner_id == partner_id).first()
            if not partner:
                raise HTTPException(status_code=404, detail="Partner not found")
            
            for key, value in partner_data.items():
                if hasattr(partner, key):
                    setattr(partner, key, value)
            
            db.commit()
            db.refresh(partner)
            logger.info(f"Partner updated: {partner_id}")
            return partner
        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            logger.error(f"Error updating partner {partner_id}: {e}")
            raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{partner_id}")
def delete_partner(partner_id: int):
    with _open_session() as db:
        try:
            partner = db.query(Partners).filter(Partners.partner_id == partner_id).first()
            if not partner:
                raise HTTPException(status_code=404, detail="Partner not found")
            
            db.delete(partner)
            db.commit()
            logger.info(f"Partner deleted: {partner_id}")
            return {"message": "Partner deleted successfully"}
        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            logger.error(f"Error deleting partner {partner_id}: {e}")
            raise HTTPException(status_code=500, detail=str(e))

@router.post("/batch/create")
def create_multiple_partners(partners_data: List[dict]):
    with _open_session() as db:
        try:
            new_partners = []
            for partner_data in partners_data:
                new_partner = Partners(**partner_data)
                db.add(new_partner)
                new_partners.append(new_partner)
            
            db.commit()
            for partner in new_partners:
                db.refresh(partner)
            
            logger.info(f"Created {len(new_partners)} partners")
            return new_partners
        except Exception as e:
            db.rollback()
            logger.error(f"Error creating multiple partners: {e}")
            raise HTTPException(status_code=500, detail=str(e))

@router.get("/filter/by-country/{country}")
def get_partners_by_country(country: str):
    with _open_session() as db:
        try:
            partners = db.query(Partners).filter(Partners.country == country).all()
            return partners
        except Exception as e:
            logger.error(f"Error fetching partners from {country}: {e}")
            raise HTTPException(status_code=500, detail=str(e))

@router.get("/filter/by-region/{region}")
def get_partners_by_region(region: str):
    with _open_session() as db:
        try:
            partners = db.query(Partners).filter(Partners.region == region).all()
            return partners
        except Exception as e:
            logger.error(f"Error fetching partners from region {region}: {e}")
            raise HTTPException(status_code=500, detail=str(e))