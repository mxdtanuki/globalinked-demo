from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.partners import Partners
from app.schemas.partners_schemas import PartnerResponse

router = APIRouter(prefix="/partners", tags=["Partners"])

@router.get("/", response_model=List[PartnerResponse])
def get_partners(db: Session = Depends(get_db)):
    return db.query(Partners).all()
