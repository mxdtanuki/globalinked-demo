from fastapi import APIRouter
from pydantic import BaseModel
from app.database import SessionLocal
from app.models.notification import Notification
from app.models.email_templates import EmailTemplates
from app.services.email_service import send_email

router = APIRouter()

class SendEmailRequest(BaseModel):
    notification_id: int
    template_id: int
    to_email: str
    subject_override: str = None  # optional, if admin wants to change subject
    body_override: str = None     # optional, if admin wants to edit template

@router.post("/send-email")
def send_email_to_partner(req: SendEmailRequest):
    session = SessionLocal()
    try:
        notif = session.query(Notification).filter(Notification.notification_id == req.notification_id).first()
        template = session.query(EmailTemplates).filter(EmailTemplates.template_id == req.template_id).first()

        if not notif or not template:
            return {"success": False, "message": "Notification or template not found"}

        # Prepare email content
        body_html = req.body_override or template.body_html
        subject = req.subject_override or f"Notification: {notif.category.capitalize()}"

        # Optional placeholder replacement
        body_html = body_html.replace("{{agreement_number}}", notif.agreement.dts_number)
        # Add more replacements if needed: {{partner_name}}, {{expiry_date}}, etc.

        # Send email
        send_email(req.to_email, subject, body_html)

        return {"success": True}
    finally:
        session.close()