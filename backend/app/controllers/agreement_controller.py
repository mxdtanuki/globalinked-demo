from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.database import get_db
from app.models.agreements import Agreements
from app.models.partners import Partners 
from app.models.source_units import SourceUnits
from app.models.contact_persons import ContactPersons
from app.models.agreement_remarks import AgreementRemarks
from app.schemas.agreement_schemas import AgreementCreate, AgreementResponse, DashboardSummary
from pydantic import BaseModel
from typing import Optional
from app.utils.utils import get_current_user
from app.models.users import Users
from fastapi import Query
from app.schemas.agreement_schemas import AgreementResponse
from app.schemas.agreement_schemas import PointPersonResponse #
from app.schemas.agreement_schemas import ContactPersonResponse #
from app.models.document_versions import DocumentVersions                 
from app.models.notification import Notification  
from app.models.point_persons import PointPersons
from app.models.agreement_point_persons import AgreementPointPersons

router = APIRouter(
    prefix="/agreements",
    tags=["Agreements"]
)

@router.get("/", response_model=List[AgreementResponse])
async def get_agreements(
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    try:
        query = db.query(Agreements, Partners, SourceUnits).join(
            Partners, Agreements.partner_id == Partners.partner_id
        ).join(
            SourceUnits, Agreements.source_unit_id == SourceUnits.unit_id
        )
        
        results = query.all()
        agreements = []

        for agreement, partner, source_unit in results:
            # Get contact persons (direct)
            contact_persons = db.query(ContactPersons).filter(
                ContactPersons.partner_id == partner.partner_id
            ).all()

            # Get point persons (via bridge)
            point_persons = (
                db.query(PointPersons)
                .join(AgreementPointPersons, AgreementPointPersons.point_person_id == PointPersons.point_person_id)
                .filter(AgreementPointPersons.agreement_id == agreement.agreement_id)
                .all()
            )
            
            # Get remarks
            remarks = db.query(AgreementRemarks).filter(
                AgreementRemarks.agreement_id == agreement.agreement_id
            ).all()

            # Concatenate into single strings for dashboard display @chez
            contact_persons_display = ", ".join(
                f"{cp.contact_person_position}: {cp.contact_person_name} ({cp.contact_person_email})"
                for cp in contact_persons
            ) if contact_persons else ""
            # <td>{agreement.contact_persons_display}</td>
            point_persons_display = ", ".join(
                f"{pp.point_person_position}: {pp.point_person_name} ({pp.point_person_email})"
                for pp in point_persons
            ) if point_persons else ""
            # <td>{agreement.point_persons_display}</td>

            agreements.append(AgreementResponse(
                agreement_id=agreement.agreement_id,
                partner_id=partner.partner_id,
                source_unit_id=source_unit.unit_id,
                name=partner.name,
                country=partner.country,
                region=partner.region,
                address=partner.address,
                entity_type=partner.entity_type,
                website_url=partner.website_url,
                description=partner.description,
                logo_path=partner.logo_path, 
                unit_name=source_unit.unit_name,
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
                # NEW: pre-concatenated fields
                contact_persons_display=contact_persons_display,
                point_persons_display=point_persons_display,
                remarks=remarks,
                created_at=partner.created_at
            ))
        
        return agreements
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching agreements: {str(e)}"
        )

@router.post("/", response_model=dict)
async def create_agreement(
    agreement: AgreementCreate,
    db: Session = Depends(get_db)
):
    try:
        existing = db.query(Agreements).filter(
            Agreements.dts_number == agreement.dts_number,
            #Agreements.document_type == agreement.document_type,
            #Agreements.partnership_type == agreement.partnership_type
        ).first()
        
        if existing:
            partner = db.query(Partners).filter(Partners.partner_id == existing.partner_id).first()
            source_unit = db.query(SourceUnits).filter(SourceUnits.unit_id == existing.source_unit_id).first()
            contact_persons = db.query(ContactPersons).filter(ContactPersons.partner_id == partner.partner_id).all()
            remarks = db.query(AgreementRemarks).filter(AgreementRemarks.agreement_id == existing.agreement_id).all()

            return {
                "status": "duplicate",
                "agreement": AgreementResponse(
                    agreement_id=existing.agreement_id,
                    partner_id=partner.partner_id,
                    source_unit_id=source_unit.unit_id,
                    name=partner.name,
                    country=partner.country,
                    region=partner.region,
                    address=partner.address,
                    entity_type=partner.entity_type,
                    website_url=partner.website_url,
                    description=partner.description,
                    logo_path=partner.logo_path,
                    unit_name=source_unit.unit_name,
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
                    remarks=remarks,
                    created_at=partner.created_at
                )
            }

        # Validate source_unit_id exists
        source_unit = db.query(SourceUnits).filter(SourceUnits.unit_id == agreement.source_unit_id).first()
        if not source_unit:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Source unit with ID {agreement.source_unit_id} does not exist."
            )

        # Create partner
        partner = Partners(
            name=agreement.partner_data.name,
            entity_type=agreement.partner_data.entity_type,
            country=agreement.partner_data.country,
            region=agreement.partner_data.region,
            address=agreement.partner_data.address,
            website_url=agreement.partner_data.website_url,
            description=agreement.partner_data.description,
            logo_path=agreement.partner_data.logo_path,
            status=agreement.partner_data.status,
            created_at=datetime.utcnow()
        )
        db.add(partner)
        db.flush()  
        partner_id = partner.partner_id

        # Create contact persons
        created_contact_persons = []
        if agreement.partner_data.contact_persons:
            for contact_data in agreement.partner_data.contact_persons:
                contact_person = ContactPersons(
                    contact_person_position=contact_data.contact_person_position,
                    contact_person_name=contact_data.contact_person_name,
                    contact_person_email=contact_data.contact_person_email,
                    partner_id=partner_id
                )
                db.add(contact_person)
                db.flush()
                created_contact_persons.append(contact_person)

        # Create agreement
        new_agreement = Agreements(
            source_unit_id=agreement.source_unit_id,
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
        db.commit()
        db.refresh(new_agreement)

        # Create remarks
        if agreement.initial_remarks:
            for remark_data in agreement.initial_remarks:
                remark = AgreementRemarks(
                    agreement_id=new_agreement.agreement_id,
                    user_id=1,  # Hardcoded user_id for now
                    remark_text=remark_data.remark_text,
                    remark_timestamp=datetime.utcnow()
                )
                db.add(remark)

        # Create point persons + bridge
        created_point_persons = []
        if agreement.point_persons:
            for pp_data in agreement.point_persons:
                pp = PointPersons(
                    point_person_position=pp_data.point_person_position,
                    point_person_name=pp_data.point_person_name,
                    point_person_email=pp_data.point_person_email,
                )
                db.add(pp)
                db.flush()  # get pp.point_person_id

                bridge = AgreementPointPersons(
                    agreement_id=new_agreement.agreement_id,
                    point_person_id=pp.point_person_id
                )
                db.add(bridge)
                created_point_persons.append(pp)

        db.commit()
        db.refresh(new_agreement)

        # Fetch associated data for response
        source_unit = db.query(SourceUnits).filter(SourceUnits.unit_id == new_agreement.source_unit_id).first()
        contact_persons = db.query(ContactPersons).filter(ContactPersons.partner_id == partner_id).all()
        remarks = db.query(AgreementRemarks).filter(AgreementRemarks.agreement_id == new_agreement.agreement_id).all()

        return {
            "status": "created",
            "agreement": AgreementResponse(
                agreement_id=new_agreement.agreement_id,
                partner_id=partner.partner_id,
                source_unit_id=source_unit.unit_id,
                name=partner.name,
                country=partner.country,
                region=partner.region,
                address=partner.address,
                entity_type=partner.entity_type,
                website_url=partner.website_url,
                description=partner.description,
                logo_path=partner.logo_path,
                unit_name=source_unit.unit_name,
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
                remarks=remarks,
                point_persons=[PointPersonResponse.model_validate(pp, from_attributes=True) for pp in created_point_persons],
                created_at=partner.created_at
            )
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/check-duplicate")
async def check_duplicate(
    dts_number: str = Query(...),
    document_type: str = Query(...),
    partnership_type: str = Query(...),
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    """
    Check if an agreement with the same DTS number, document type, and partnership type already exists.
    """
    try:
        existing = db.query(Agreements, Partners).join(
            Partners, Agreements.partner_id == Partners.partner_id
        ).filter(
            Agreements.dts_number == dts_number,
            Agreements.document_type == document_type,
            Agreements.partnership_type == partnership_type
        ).first()
        
        if not existing:
            raise HTTPException(status_code=404, detail="No duplicate found")
        
        agreement, partner = existing
        
        return {
            "agreement_id": agreement.agreement_id,
            "dts_number": agreement.dts_number,
            "document_type": agreement.document_type,
            "partnership_type": agreement.partnership_type,
            "name": partner.name,
            "country": partner.country,
            "entry_date": agreement.entry_date,
            "agreement_status": agreement.agreement_status
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
@router.put("/{agreement_id}", response_model=AgreementResponse)
async def update_agreement(
    agreement_id: int,
    update_data: dict,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    try:
        # Get existing agreement with related data
        query = db.query(Agreements, Partners, SourceUnits).join(
            Partners, Agreements.partner_id == Partners.partner_id
        ).join(
            SourceUnits, Agreements.source_unit_id == SourceUnits.unit_id
        ).filter(Agreements.agreement_id == agreement_id)
        
        result = query.first()
        if not result:
            raise HTTPException(status_code=404, detail="Agreement not found")
        
        agreement, partner, source_unit = result
        
        # Update agreement fields
        if 'dts_number' in update_data:
            agreement.dts_number = update_data['dts_number']
        if 'dts_status' in update_data:
            agreement.dts_status = update_data['dts_status']
        if 'entry_date' in update_data:
            agreement.entry_date = update_data['entry_date']
        if 'date_received' in update_data:
            agreement.date_received = update_data['date_received']
        if 'date_endorsed_to_ulco' in update_data:
            agreement.date_endorsed_to_ulco = update_data['date_endorsed_to_ulco']
        if 'date_ulco_approved' in update_data:
            agreement.date_ulco_approved = update_data['date_ulco_approved']
        if 'date_signed_by_pup' in update_data:
            agreement.date_signed_by_pup = update_data['date_signed_by_pup']
        if 'date_signed' in update_data:
            agreement.date_signed = update_data['date_signed']
        if 'date_expiry' in update_data:
            agreement.date_expiry = update_data['date_expiry']
        if 'document_type' in update_data:
            agreement.document_type = update_data['document_type']
        if 'partnership_type' in update_data:
            agreement.partnership_type = update_data['partnership_type']
        if 'validity_period' in update_data:
            agreement.validity_period = update_data['validity_period']
        if 'event_info' in update_data:
            agreement.event_info = update_data['event_info']
        if 'signatories_list' in update_data:
            agreement.signatories_list = update_data['signatories_list']
        if 'agreement_status' in update_data:
            agreement.agreement_status = update_data['agreement_status']
        if 'hardcopy_location' in update_data:
            agreement.hardcopy_location = update_data['hardcopy_location']
        
        # Update partner fields
        if 'name' in update_data:
            partner.name = update_data['name']
        if 'entity_type' in update_data:
            partner.entity_type = update_data['entity_type']
        if 'country' in update_data:
            partner.country = update_data['country']
        if 'region' in update_data:
            partner.region = update_data['region']
        if 'address' in update_data:
            partner.address = update_data['address']
        if 'website_url' in update_data:
            partner.website_url = update_data['website_url']
        if 'description' in update_data:
            partner.description = update_data['description']
        
        # Update source unit if needed
        if 'unit_name' in update_data:
            source_unit.unit_name = update_data['unit_name']
        
        # Handle contact persons update
        if 'contact_persons' in update_data and update_data['contact_persons']:
            # Delete existing contact persons
            db.query(ContactPersons).filter(
                ContactPersons.partner_id == partner.partner_id
            ).delete()
            
            # Create new contact persons
            for cp_data in update_data['contact_persons']:
                contact_person = ContactPersons(
                    contact_person_position=cp_data.get('contact_person_position', ''),
                    contact_person_name=cp_data.get('contact_person_name', ''),
                    contact_person_email=cp_data.get('contact_person_email', ''),
                    partner_id=partner.partner_id
                )
                db.add(contact_person)
        # Handle point persons update
        if 'point_persons' in update_data:
            new_pp_list = update_data.get('point_persons') or []

           # Remove existing links for this agreement
            db.query(AgreementPointPersons).filter(
                AgreementPointPersons.agreement_id == agreement_id
            ).delete()

            # Recreate point persons and link them
            created_pp_ids = []
            for pp_data in new_pp_list:
                pp = PointPersons(
                    point_person_position=pp_data.get('point_person_position', ''),
                    point_person_name=pp_data.get('point_person_name', ''),
                    point_person_email=pp_data.get('point_person_email', '')
                )
                db.add(pp)
                db.flush()  # to get pp.point_person_id
                created_pp_ids.append(pp.point_person_id)

            # Create bridge rows
            for pp_id in created_pp_ids:
                db.add(AgreementPointPersons(
                    agreement_id=agreement_id,
                    point_person_id=pp_id
                ))

        # Handle remarks update
        if 'remarks' in update_data and update_data['remarks']:
            # Delete existing remarks
            db.query(AgreementRemarks).filter(
                AgreementRemarks.agreement_id == agreement_id
            ).delete()
            
            # Create new remarks
            for remark_data in update_data['remarks']:
                remark = AgreementRemarks(
                    agreement_id=agreement_id,
                    user_id=current_user.user_id,
                    remark_text=remark_data.get('remark_text', ''),
                    remark_timestamp=datetime.utcnow()
                )
                db.add(remark)
        
        db.commit()
        db.refresh(agreement)
        
        # Return updated data in the same format as GET
        contact_persons = db.query(ContactPersons).filter(
            ContactPersons.partner_id == partner.partner_id
        ).all()
        
        point_persons = (
            db.query(PointPersons)
            .join(AgreementPointPersons, AgreementPointPersons.point_person_id == PointPersons.point_person_id)
            .filter(AgreementPointPersons.agreement_id == agreement_id)
            .all()
        )
        
        remarks = db.query(AgreementRemarks).filter(
            AgreementRemarks.agreement_id == agreement_id
        ).all()
        
        return AgreementResponse(
            agreement_id=agreement.agreement_id,
            partner_id=partner.partner_id,
            source_unit_id=source_unit.unit_id,
            name=partner.name,
            country=partner.country,
            region=partner.region,
            address=partner.address,
            entity_type=partner.entity_type,
            website_url=partner.website_url,
            description=partner.description,
            logo_path=partner.logo_path,
            unit_name=source_unit.unit_name,
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
            remarks=remarks,
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
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{agreement_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_agreement(
    agreement_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    try:
        agreement = db.query(Agreements).filter(Agreements.agreement_id == agreement_id).first()
        if not agreement:
            raise HTTPException(status_code=404, detail="Agreement not found")

        db.query(Agreements).filter(
            Agreements.renewed_from_agreement_id == agreement_id
        ).update({Agreements.renewed_from_agreement_id: None})
        db.query(Agreements).filter(
            Agreements.MOU_to_MOA_id == agreement_id
        ).update({Agreements.MOU_to_MOA_id: None})

        # Delete dependents referencing this agreement
        db.query(DocumentVersions).filter(DocumentVersions.agreement_id == agreement_id).delete()
        db.query(AgreementPointPersons).filter(AgreementPointPersons.agreement_id == agreement_id).delete()
        db.query(AgreementRemarks).filter(AgreementRemarks.agreement_id == agreement_id).delete()
        db.query(Notification).filter(Notification.agreement_id == agreement_id).delete()

        # Delete the agreement
        db.delete(agreement)
        db.commit()
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))