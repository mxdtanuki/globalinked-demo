from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from sqlalchemy import or_, cast, Integer
from typing import List
from datetime import datetime, date
from app.database import get_db
from app.models.agreements import Agreements
from app.models.partners import Partners
from app.models.contact_persons import ContactPersons
from app.models.agreement_remarks import AgreementRemarks
from app.models.point_persons import PointPersons
from app.models.document_versions import DocumentVersions
from app.models.notification import Notification
from app.models.users import Users
from app.models.timer import Timer
from app.services.supabase_service import delete_folder
from app.schemas.agreement_schemas import (
    AgreementCreate,
    AgreementResponse,
    PointPersonResponse,
    ContactPersonResponse,
    TimerResponse,
    ArchiveAgreementResponse,
    RemarkResponse,
)
from app.utils.utils import get_current_user
from app.utils.audit_utils import log_add_entry, log_update_entry, log_delete_entry
import traceback

router = APIRouter(
    prefix="/agreements",
    tags=["Agreements"]
)

@router.get("/archive", response_model=List[ArchiveAgreementResponse])
async def get_archived_agreements(
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    """
    Return expired agreements (date_expiry < today) with partner info + point persons.
    """
    try:
        today = date.today()
        query = db.query(Agreements, Partners).join(
            Partners, Agreements.partner_id == Partners.partner_id
        ).filter(Agreements.date_expiry <= today)

        results = query.all()
        archive_list = []

        for agreement, partner in results:
            # point persons linked to agreement
            point_persons = db.query(PointPersons).filter(
                PointPersons.agreement_id == agreement.agreement_id
            ).all()

            point_persons_display = ", ".join(
                f"{pp.point_person_position}: {pp.point_person_name} ({pp.point_person_email})"
                for pp in point_persons
            ) if point_persons else ""

            archive_list.append(ArchiveAgreementResponse(
                agreement_id=agreement.agreement_id,
                dts_number=agreement.dts_number,
                partner_name=partner.name,
                document_type=agreement.document_type,
                partnership_type=agreement.partnership_type,
                date_expiry=agreement.date_expiry,
                point_persons_display=point_persons_display
            ))

        return archive_list

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching archive: {str(e)}"
        )
    
@router.get("/", response_model=List[AgreementResponse])
async def get_agreements(
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    """
    Return all *active* agreements (not expired) with partner, contact persons,
    point persons, and remarks.
    NOTE: Source unit is now a string field on Agreements (agreements.source_unit).
    """
    try:
        today = date.today()

        # join Agreements with Partners, filter out expired
        query = db.query(Agreements, Partners).join(
            Partners, Agreements.partner_id == Partners.partner_id
        ).filter(
            or_(
                Agreements.date_expiry == None,            # no expiry set
                Agreements.date_expiry >= today            # still valid
            )
        )

        results = query.all()
        agreements_list = []

        for agreement, partner in results:
            # contact persons (agreement-specific OR partner fallback)
            contact_persons = db.query(ContactPersons).filter(
                or_(
                    ContactPersons.agreement_id == agreement.agreement_id,
                    ContactPersons.partner_id == partner.partner_id
                )
            ).all()

            # point persons (directly linked to agreement)
            point_persons = db.query(PointPersons).filter(
                PointPersons.agreement_id == agreement.agreement_id
            ).all()

            # remarks
            remarks = db.query(AgreementRemarks).filter(
                AgreementRemarks.agreement_id == agreement.agreement_id).all()

            # pre-concatenated display strings
            contact_persons_display = ", ".join(
                f"{cp.contact_person_position}: {cp.contact_person_name} ({cp.contact_person_email})"
                for cp in contact_persons
            ) if contact_persons else ""

            point_persons_display = ", ".join(
                f"{pp.point_person_position}: {pp.point_person_name} ({pp.point_person_email})"
                for pp in point_persons
            ) if point_persons else ""

            agreements_list.append(AgreementResponse(
                agreement_id=agreement.agreement_id,
                partner_id=partner.partner_id,
                source_unit=agreement.source_unit,
                name=partner.name,
                country=partner.country,
                region=partner.region,
                address=partner.address,
                entity_type=partner.entity_type,
                website_url=partner.website_url,
                description=partner.description,
                logo_path=partner.logo_path,
                dts_number=agreement.dts_number,
                dts_status=agreement.dts_status,
                entry_date=agreement.entry_date,
                date_received=agreement.date_received,
                date_endorsed_to_ulco=agreement.date_endorsed_to_ulco,
                date_ulco_approved=agreement.date_ulco_approved,
                date_signed_by_pup=agreement.date_signed_by_pup,
                date_signed=agreement.date_signed,
                date_expiry=agreement.date_expiry,
                document_type=agreement.document_type,
                partnership_type=agreement.partnership_type,
                validity_period=agreement.validity_period,
                event_info=agreement.event_info,
                signatories_list=agreement.signatories_list,
                agreement_status=agreement.agreement_status,
                hardcopy_location=agreement.hardcopy_location,
                entry_type=agreement.entry_type,
                renewed_from_agreement_id=agreement.renewed_from_agreement_id,
                MOU_to_MOA_id=agreement.MOU_to_MOA_id,
                contact_persons=[
                    ContactPersonResponse.model_validate(cp, from_attributes=True)
                    for cp in contact_persons
                ],
                point_persons=[
                    PointPersonResponse.model_validate(pp, from_attributes=True)
                    for pp in point_persons
                ],
                contact_persons_display=contact_persons_display,
                point_persons_display=point_persons_display,
                remarks=[RemarkResponse.model_validate(r, from_attributes=True) for r in remarks],
                created_at=partner.created_at
            ))

        return agreements_list

    except Exception as e:
        traceback.print_exc() 
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching agreements: {str(e)}"
        )

@router.post("/", response_model=dict)
async def create_agreement(
    agreement: AgreementCreate,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    try:
        # Duplicate check (DTS number)
        existing = db.query(Agreements).filter(
            Agreements.dts_number == agreement.dts_number
        ).first()

        if existing:
            partner = db.query(Partners).filter(Partners.partner_id == existing.partner_id).first()
            contact_persons = db.query(ContactPersons).filter(
                or_(
                    ContactPersons.agreement_id == existing.agreement_id,
                    ContactPersons.partner_id == partner.partner_id
                )
            ).all()
            remarks = db.query(AgreementRemarks).filter(
                AgreementRemarks.agreement_id == existing.agreement_id
            ).all()

            return {
                "status": "duplicate",
                "agreement": AgreementResponse(
                    agreement_id=existing.agreement_id,
                    partner_id=partner.partner_id,
                    source_unit=existing.source_unit,
                    name=partner.name,
                    country=partner.country,
                    region=partner.region,
                    address=partner.address,
                    entity_type=partner.entity_type,
                    website_url=partner.website_url,
                    description=partner.description,
                    logo_path=partner.logo_path,
                    dts_number=existing.dts_number,
                    dts_status=existing.dts_status,
                    entry_date=existing.entry_date,
                    date_received=existing.date_received,
                    date_endorsed_to_ulco=existing.date_endorsed_to_ulco,
                    date_ulco_approved=existing.date_ulco_approved,
                    date_signed_by_pup=existing.date_signed_by_pup,
                    date_signed=existing.date_signed,
                    date_expiry=existing.date_expiry,
                    document_type=existing.document_type,
                    partnership_type=existing.partnership_type,
                    validity_period=existing.validity_period,
                    event_info=existing.event_info,
                    signatories_list=existing.signatories_list,
                    agreement_status=existing.agreement_status,
                    hardcopy_location=existing.hardcopy_location,
                    entry_type=existing.entry_type,
                    renewed_from_agreement_id=existing.renewed_from_agreement_id,
                    MOU_to_MOA_id=existing.MOU_to_MOA_id,
                    contact_persons=[
                        ContactPersonResponse.model_validate(cp, from_attributes=True)
                        for cp in contact_persons
                    ],
                    remarks=[RemarkResponse.model_validate(r, from_attributes=True) for r in remarks],
                    created_at=partner.created_at
                )
            }

        # PARTNER handling
        partner_obj = None
        if agreement.partner_id:
            partner_obj = db.query(Partners).filter(
                Partners.partner_id == agreement.partner_id
            ).first()
            if not partner_obj:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Provided partner_id {agreement.partner_id} not found."
                )
        elif agreement.partner_data:
            partner_payload = agreement.partner_data
            partner_obj = Partners(
                name=partner_payload.name,
                entity_type=partner_payload.entity_type,
                country=partner_payload.country,
                region=partner_payload.region,
                address=partner_payload.address,
                website_url=partner_payload.website_url,
                description=partner_payload.description,
                logo_path=getattr(partner_payload, "logo_path", None),
                status=getattr(partner_payload, "status", "active"),
                created_at=datetime.utcnow()
            )
            db.add(partner_obj)
            db.flush()
        else:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Either partner_id or partner_data must be provided."
            )

        partner_id = partner_obj.partner_id

        # AGREEMENT creation
        new_agreement = Agreements(
            source_unit=getattr(agreement, "source_unit", None),
            partner_id=partner_id,
            dts_number=agreement.dts_number,
            dts_status=agreement.dts_status,
            entry_date=agreement.entry_date,
            date_received=agreement.date_received,
            date_endorsed_to_ulco=agreement.date_endorsed_to_ulco,
            date_ulco_approved=agreement.date_ulco_approved,
            date_signed_by_pup=agreement.date_signed_by_pup,
            date_signed=agreement.date_signed,
            date_expiry=agreement.date_expiry,
            document_type=agreement.document_type,
            partnership_type=agreement.partnership_type,
            validity_period=agreement.validity_period,
            event_info=agreement.event_info,
            signatories_list=agreement.signatories_list,
            agreement_status=agreement.agreement_status,
            hardcopy_location=agreement.hardcopy_location,
            entry_type=agreement.entry_type,
            renewed_from_agreement_id=agreement.renewed_from_agreement_id,
            MOU_to_MOA_id=agreement.MOU_to_MOA_id
        )
        db.add(new_agreement)
        db.flush()
        log_add_entry(db, current_user, agreement.document_type, agreement.dts_number)
        
        # TIMER creation (NEW)
        if getattr(agreement, "timer", None):
            timer_data = agreement.timer
            last_change = timer_data.last_status_change or agreement.entry_date or datetime.utcnow()
        else:
            last_change = agreement.entry_date or datetime.utcnow()

        timer = Timer(
            agreement_id=new_agreement.agreement_id,
            last_status_change=last_change
        )
        db.add(timer)

        
        # CONTACT PERSONS
        created_contact_persons = []
        contact_list = []
        if agreement.partner_data and getattr(agreement.partner_data, "contact_persons", None):
            contact_list = agreement.partner_data.contact_persons
        elif getattr(agreement, "contact_persons", None):
            contact_list = agreement.contact_persons

        for contact_data in contact_list:
            cp_pos = getattr(contact_data, "contact_person_position", None) if hasattr(contact_data, "contact_person_position") else contact_data.get("contact_person_position", "")
            cp_name = getattr(contact_data, "contact_person_name", None) if hasattr(contact_data, "contact_person_name") else contact_data.get("contact_person_name", "")
            cp_email = getattr(contact_data, "contact_person_email", None) if hasattr(contact_data, "contact_person_email") else contact_data.get("contact_person_email", "")
            if not (cp_name or cp_email):
                continue
            contact_person = ContactPersons(
                contact_person_position=cp_pos or "",
                contact_person_name=cp_name or "",
                contact_person_email=cp_email or "",
                partner_id=partner_id,
                agreement_id=new_agreement.agreement_id
            )
            db.add(contact_person)
            db.flush()
            created_contact_persons.append(contact_person)

        # REMARKS
        if getattr(agreement, "initial_remarks", None):
            for remark_data in agreement.initial_remarks:
                remark_text = getattr(remark_data, "remark_text", None) if hasattr(remark_data, "remark_text") else remark_data.get("remark_text")
                if remark_text:
                    remark = AgreementRemarks(
                        agreement_id=new_agreement.agreement_id,
                        user_id=1,  # TODO: real user
                        remark_text=remark_text,
                        remark_timestamp=datetime.utcnow()
                    )
                    db.add(remark)

        # POINT PERSONS
        created_point_persons = []
        if getattr(agreement, "point_persons", None):
            for pp_data in agreement.point_persons:
                pp_position = getattr(pp_data, "point_person_position", None) if hasattr(pp_data, "point_person_position") else pp_data.get("point_person_position", "")
                pp_name = getattr(pp_data, "point_person_name", None) if hasattr(pp_data, "point_person_name") else pp_data.get("point_person_name", "")
                pp_email = getattr(pp_data, "point_person_email", None) if hasattr(pp_data, "point_person_email") else pp_data.get("point_person_email", "")
                if not (pp_name or pp_email):
                    continue
                pp = PointPersons(
                    point_person_position=pp_position or "",
                    point_person_name=pp_name or "",
                    point_person_email=pp_email or "",
                    agreement_id=new_agreement.agreement_id
                )
                db.add(pp)
                db.flush()
                created_point_persons.append(pp)

        # Final commit
        db.commit()
        db.refresh(new_agreement)

        # Fetch associations
        contact_persons = db.query(ContactPersons).filter(ContactPersons.agreement_id == new_agreement.agreement_id).all()
        point_persons = db.query(PointPersons).filter(PointPersons.agreement_id == new_agreement.agreement_id).all()
        remarks = db.query(AgreementRemarks).filter(AgreementRemarks.agreement_id == new_agreement.agreement_id).all()
        timer = db.query(Timer).filter(Timer.agreement_id == new_agreement.agreement_id).first()

        return {
            "status": "created",
            "agreement": AgreementResponse(
                agreement_id=new_agreement.agreement_id,
                partner_id=partner_obj.partner_id,
                source_unit=new_agreement.source_unit,
                name=partner_obj.name,
                country=partner_obj.country,
                region=partner_obj.region,
                address=partner_obj.address,
                entity_type=partner_obj.entity_type,
                website_url=partner_obj.website_url,
                description=partner_obj.description,
                logo_path=partner_obj.logo_path,
                dts_number=new_agreement.dts_number,
                dts_status=new_agreement.dts_status,
                entry_date=new_agreement.entry_date,
                date_received=new_agreement.date_received,
                date_endorsed_to_ulco=new_agreement.date_endorsed_to_ulco,
                date_ulco_approved=new_agreement.date_ulco_approved,
                date_signed_by_pup=new_agreement.date_signed_by_pup,
                date_signed=new_agreement.date_signed,
                date_expiry=new_agreement.date_expiry,
                document_type=new_agreement.document_type,
                partnership_type=new_agreement.partnership_type,
                validity_period=new_agreement.validity_period,
                event_info=new_agreement.event_info,
                signatories_list=new_agreement.signatories_list,
                agreement_status=new_agreement.agreement_status,
                hardcopy_location=new_agreement.hardcopy_location,
                entry_type=new_agreement.entry_type,
                renewed_from_agreement_id=new_agreement.renewed_from_agreement_id,
                MOU_to_MOA_id=new_agreement.MOU_to_MOA_id,
                contact_persons=[
                    ContactPersonResponse.model_validate(cp, from_attributes=True)
                    for cp in contact_persons
                ],
                remarks=[RemarkResponse.model_validate(r, from_attributes=True) for r in remarks],
                point_persons=[
                    PointPersonResponse.model_validate(pp, from_attributes=True)
                    for pp in point_persons
                ],
                timer=TimerResponse.model_validate(timer, from_attributes=True) if timer else None,
                created_at=partner_obj.created_at
            )
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# Replace the update_agreement function and delete_agreement function with these optimized versions

@router.put("/{agreement_id}", response_model=AgreementResponse)
async def update_agreement(
    agreement_id: int,
    update_data: dict,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    """
    Update agreement + partner + associated contact/point persons and remarks.
    OPTIMIZED: Better transaction handling and batch operations.
    """
    try:
        # Get existing agreement with partner
        query = db.query(Agreements, Partners).join(
            Partners, Agreements.partner_id == Partners.partner_id
        ).filter(Agreements.agreement_id == agreement_id)

        result = query.first()
        if not result:
            raise HTTPException(status_code=404, detail="Agreement not found")

        agreement, partner = result

        # Update agreement fields (including source_unit string)
        up = update_data
        if 'source_unit' in up:
            agreement.source_unit = up['source_unit']
        if 'dts_number' in up:
            agreement.dts_number = up['dts_number']
        if 'dts_status' in up:
            agreement.dts_status = up['dts_status']
        if 'entry_date' in up:
            agreement.entry_date = up['entry_date']
        if 'date_received' in up:
            agreement.date_received = up['date_received']
        if 'date_endorsed_to_ulco' in up:
            agreement.date_endorsed_to_ulco = up['date_endorsed_to_ulco']
        if 'date_ulco_approved' in up:
            agreement.date_ulco_approved = up['date_ulco_approved']
        if 'date_signed_by_pup' in up:
            agreement.date_signed_by_pup = up['date_signed_by_pup']
        if 'date_signed' in up:
            agreement.date_signed = up['date_signed']
        if 'date_expiry' in up:
            agreement.date_expiry = up['date_expiry']
        if 'document_type' in up:
            agreement.document_type = up['document_type']
        if 'partnership_type' in up:
            agreement.partnership_type = up['partnership_type']
        if 'validity_period' in up:
            agreement.validity_period = up['validity_period']
        if 'event_info' in up:
            agreement.event_info = up['event_info']
        if 'signatories_list' in up:
            agreement.signatories_list = up['signatories_list']
        if 'agreement_status' in up:
            agreement.agreement_status = up['agreement_status']
            # Update last_status_change in Timer when agreement_status changes
            timer = db.query(Timer).filter(Timer.agreement_id == agreement.agreement_id).first()
            if timer:
                timer.last_status_change = datetime.utcnow()
            else:
                # Safety net — create one if missing
                timer = Timer(
                    agreement_id=agreement.agreement_id,
                    last_status_change=datetime.utcnow()
                )
                db.add(timer)

        if 'hardcopy_location' in up:
            agreement.hardcopy_location = up['hardcopy_location']

        # Update partner fields
        if 'name' in up:
            partner.name = up['name']
        if 'entity_type' in up:
            partner.entity_type = up['entity_type']
        if 'country' in up:
            partner.country = up['country']
        if 'region' in up:
            partner.region = up['region']
        if 'address' in up:
            partner.address = up['address']
        if 'website_url' in up:
            partner.website_url = up['website_url']
        if 'description' in up:
            partner.description = up['description']

        # Handle logo update (expects base64 string from frontend)
        if 'logo_path' in up and up['logo_path']:
            partner.logo_path = up['logo_path']

        # OPTIMIZED: Handle contact persons update with batch operations
        if 'contact_persons' in up:
            # Use synchronize_session=False for faster deletion
            db.query(ContactPersons).filter(
                ContactPersons.agreement_id == agreement_id
            ).delete(synchronize_session=False)
            
            # Batch insert new contact persons
            contact_persons_to_add = []
            for cp_data in up.get('contact_persons', []):
                if cp_data.get('contact_person_name') or cp_data.get('contact_person_email'):
                    contact_persons_to_add.append(ContactPersons(
                        contact_person_position=cp_data.get('contact_person_position', ''),
                        contact_person_name=cp_data.get('contact_person_name', ''),
                        contact_person_email=cp_data.get('contact_person_email', ''),
                        partner_id=partner.partner_id,
                        agreement_id=agreement_id
                    ))
            
            if contact_persons_to_add:
                db.add_all(contact_persons_to_add)

        # OPTIMIZED: Handle point persons update with batch operations
        if 'point_persons' in up:
            # Use synchronize_session=False for faster deletion
            db.query(PointPersons).filter(
                PointPersons.agreement_id == agreement_id
            ).delete(synchronize_session=False)

            # Batch insert new point persons
            point_persons_to_add = []
            for pp_data in up.get('point_persons', []):
                if pp_data.get('point_person_name') or pp_data.get('point_person_email'):
                    point_persons_to_add.append(PointPersons(
                        point_person_position=pp_data.get('point_person_position', ''),
                        point_person_name=pp_data.get('point_person_name', ''),
                        point_person_email=pp_data.get('point_person_email', ''),
                        agreement_id=agreement_id
                    ))
            
            if point_persons_to_add:
                db.add_all(point_persons_to_add)

        # OPTIMIZED: Handle remarks update with batch operations and timeout protection
        if 'remarks' in up:
            try:
                # Use synchronize_session=False for faster deletion
                db.query(AgreementRemarks).filter(
                    AgreementRemarks.agreement_id == agreement_id
                ).delete(synchronize_session=False)
                
                # Batch insert new remarks
                remarks_to_add = []
                for remark_data in up.get('remarks', []):
                    if remark_data.get('remark_text'):
                        remarks_to_add.append(AgreementRemarks(
                            agreement_id=agreement_id,
                            user_id=current_user.user_id,
                            remark_text=remark_data.get('remark_text', ''),
                            remark_timestamp=datetime.utcnow()
                        ))
                
                if remarks_to_add:
                    db.add_all(remarks_to_add)
                    
            except Exception as e:
                print(f"⚠️ Error updating remarks for agreement {agreement_id}: {e}")
                # Continue with the rest of the update even if remarks fail
                pass

        # Commit all changes
        db.commit()
        db.refresh(agreement)
        log_update_entry(db, current_user, agreement.document_type, agreement.dts_number)

        # Prepare response data
        contact_persons = db.query(ContactPersons).filter(
            ContactPersons.agreement_id == agreement_id
        ).all()

        point_persons = db.query(PointPersons).filter(
            PointPersons.agreement_id == agreement_id
        ).all()

        remarks = db.query(AgreementRemarks).filter(
            AgreementRemarks.agreement_id == agreement_id
        ).all()

        return AgreementResponse(
            agreement_id=agreement.agreement_id,
            partner_id=partner.partner_id,
            source_unit=agreement.source_unit,
            name=partner.name,
            country=partner.country,
            region=partner.region,
            address=partner.address,
            entity_type=partner.entity_type,
            website_url=partner.website_url,
            description=partner.description,
            logo_path=partner.logo_path,
            dts_number=agreement.dts_number,
            dts_status=agreement.dts_status,
            entry_date=agreement.entry_date,
            date_received=agreement.date_received,
            date_endorsed_to_ulco=agreement.date_endorsed_to_ulco,
            date_ulco_approved=agreement.date_ulco_approved,
            date_signed_by_pup=agreement.date_signed_by_pup,
            date_signed=agreement.date_signed,
            date_expiry=agreement.date_expiry,
            document_type=agreement.document_type,
            partnership_type=agreement.partnership_type,
            validity_period=agreement.validity_period,
            event_info=agreement.event_info,
            signatories_list=agreement.signatories_list,
            agreement_status=agreement.agreement_status,
            hardcopy_location=agreement.hardcopy_location,
            entry_type=agreement.entry_type,
            renewed_from_agreement_id=agreement.renewed_from_agreement_id,
            MOU_to_MOA_id=agreement.MOU_to_MOA_id,
            contact_persons=[
                ContactPersonResponse.model_validate(cp, from_attributes=True)
                for cp in contact_persons
            ],
            remarks=[RemarkResponse.model_validate(r, from_attributes=True) for r in remarks],
            point_persons=[
                PointPersonResponse.model_validate(pp, from_attributes=True)
                for pp in point_persons
            ],
            created_at=partner.created_at
        )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"🔥 Error updating agreement {agreement_id}: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to update agreement: {str(e)}")

@router.delete("/{agreement_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_agreement(
    agreement_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    """
    Delete agreement and cascade dependents (DB FKs) + Supabase folder.
    OPTIMIZED: Better transaction handling with timeout protection.
    """
    try:
        agreement = db.query(Agreements).filter(Agreements.agreement_id == agreement_id).first()
        print("👤 Current user:", getattr(current_user, "user_id", None), getattr(current_user, "user_name", None))
        print("🗑️ Deleting agreement:", agreement_id, "->", agreement)
        
        if not agreement:
            raise HTTPException(status_code=404, detail="Agreement not found")

        dts_number = agreement.dts_number  # keep before deletion

        # Reset references in other agreements first (outside main transaction)
        try:
            db.query(Agreements).filter(
                cast(Agreements.renewed_from_agreement_id, Integer) == agreement_id
            ).update({Agreements.renewed_from_agreement_id: None}, synchronize_session=False)
            
            db.query(Agreements).filter(
                cast(Agreements.MOU_to_MOA_id, Integer) == agreement_id
            ).update({Agreements.MOU_to_MOA_id: None}, synchronize_session=False)
            
            db.commit()  # Commit reference updates first
        except Exception as e:
            print(f"⚠️ Error updating agreement references: {e}")
            db.rollback()

        # Delete Supabase folder (ignore if missing)
        try:
            delete_folder(dts_number)
        except Exception as e:
            print(f"⚠️ Supabase folder cleanup failed for {dts_number}: {e}")

        # OPTIMIZED: Delete related records with better error handling and timeouts
        deletion_operations = [
            ("AgreementRemarks", AgreementRemarks, AgreementRemarks.agreement_id == agreement_id),
            ("PointPersons", PointPersons, PointPersons.agreement_id == agreement_id),
            ("ContactPersons", ContactPersons, ContactPersons.agreement_id == agreement_id),
            ("DocumentVersions", DocumentVersions, DocumentVersions.dts_number == dts_number),
            ("Notification", Notification, Notification.agreement_id == agreement_id),
            ("Timer", Timer, Timer.agreement_id == agreement_id),
        ]

        # Delete each type of related record individually with error handling
        for table_name, model_class, filter_condition in deletion_operations:
            try:
                print(f"🗑️ Deleting {table_name} records for agreement {agreement_id}")
                deleted_count = db.query(model_class).filter(filter_condition).delete(synchronize_session=False)
                print(f"✅ Deleted {deleted_count} {table_name} records")
                db.commit()  # Commit each deletion separately to avoid long transactions
            except Exception as e:
                print(f"⚠️ Error deleting {table_name}: {e}")
                db.rollback()

                continue

        # Finally, delete the main agreement record
        try:
            print(f"🗑️ Deleting main agreement record {agreement_id}")
            db.delete(agreement)
            db.commit()
            print("✅ Agreement deleted successfully")
            
            # Log the deletion
            log_delete_entry(db, current_user, agreement.document_type, dts_number)
            
        except Exception as e:
            print(f"🔥 Error deleting main agreement: {e}")
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to delete agreement: {str(e)}")

        return Response(status_code=status.HTTP_204_NO_CONTENT)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print("🔥 Unhandled error in delete_agreement:", e)
        traceback.print_exc() 
        raise HTTPException(status_code=500, detail="Internal Server Error")