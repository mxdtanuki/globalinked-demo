from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.email_templates import EmailTemplates
from app.models.agreements import Agreements
from app.models.partners import Partners
from app.models.point_persons import PointPersons
from app.models.contact_persons import ContactPersons
import smtplib
from app.services.email_service import send_email, render_template
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import re


router = APIRouter(prefix="/emails", tags=["Email"])

# Get all templates
@router.get("/templates")
def get_templates(db: Session = Depends(get_db)):
    return db.query(EmailTemplates).all()

# Get one template
@router.get("/templates/{template_id}")
def get_template(template_id: int, db: Session = Depends(get_db)):
    template = db.query(EmailTemplates).filter(EmailTemplates.template_id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template

# Create template
@router.post("/templates")
def create_template(template: dict, db: Session = Depends(get_db)):
    new_template = EmailTemplates(
        template_name=template["template_name"],
        subject=template.get("subject", ""),
        body_html=template["body_html"]
    )
    db.add(new_template)
    db.commit()
    db.refresh(new_template)
    return new_template

# Update template
@router.put("/templates/{template_id}")
def update_template(template_id: int, template: dict, db: Session = Depends(get_db)):
    db_template = db.query(EmailTemplates).filter(EmailTemplates.template_id == template_id).first()
    if not db_template:
        raise HTTPException(status_code=404, detail="Template not found")

    db_template.template_name = template["template_name"]
    db_template.subject = template.get("subject", "")
    db_template.body_html = template["body_html"]

    db.commit()
    db.refresh(db_template)
    return db_template

# Delete template
@router.delete("/templates/{template_id}")
def delete_template(template_id: int, db: Session = Depends(get_db)):
    db_template = db.query(EmailTemplates).filter(EmailTemplates.template_id == template_id).first()
    if not db_template:
        raise HTTPException(status_code=404, detail="Template not found")

    db.delete(db_template)
    db.commit()
    return {"message": "Template deleted successfully"}

# Send email using template
@router.post("/send")
def send_email_endpoint(email_data: dict, db: Session = Depends(get_db)):
    try:
        
        # Validate required fields
        if not email_data.get("recipient_email"):
            raise HTTPException(status_code=400, detail="recipient_email is required")

        # Check if custom content is provided
        if email_data.get("custom_subject") and email_data.get("custom_body"):
            # Use custom content (user-modified template)
            subject = email_data["custom_subject"]
            body = email_data["custom_body"]
            print("DEBUG: Using custom email content")
        elif email_data.get("template_id"):
            # Use original template
            template = db.query(EmailTemplates).filter(
                EmailTemplates.template_id == email_data["template_id"]
            ).first()
            if not template:
                raise HTTPException(status_code=404, detail="Template not found")
            
            subject = template.subject
            body = template.body_html
            
            # Get agreement data for template rendering
            context = {}
            if email_data.get("agreement_id"):
                agreement = db.query(Agreements, Partners).join(
                    Partners, Agreements.partner_id == Partners.partner_id
                ).filter(Agreements.agreement_id == email_data["agreement_id"]).first()
                
                if agreement:
                    agreement_obj, partner_obj = agreement
                    context = {
                        "PARTNER_NAME": partner_obj.name or "N/A",  # Use partner.name
                        "DOCUMENT_TYPE": agreement_obj.document_type or "Agreement",
                        "DTS_NUMBER": agreement_obj.dts_number or "N/A",
                        "AGREEMENT_STATUS": agreement_obj.agreement_status or "N/A",
                        "EXPIRY_DATE": str(agreement_obj.date_expiry) if agreement_obj.date_expiry else "N/A"
                    }
                    
            # Render template with context using email service
            subject = render_template(subject, context)
            body = render_template(body, context)
            
        else:
            raise HTTPException(status_code=400, detail="Either custom content (custom_subject + custom_body) or template_id is required")

        # Send email using email service
        send_email(
            to=email_data["recipient_email"],
            subject=subject,
            body=body
        )
        
        return {
            "message": "Email sent successfully",
            "recipient": email_data["recipient_email"],
            "subject": subject,
            "status": "delivered"
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"DEBUG: Email sending failed: {str(e)}")
        print(f"DEBUG: Error type: {type(e).__name__}")
        import traceback
        print(f"DEBUG: Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}") 