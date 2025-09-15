# app/seed_email_templates.py
from app.database import SessionLocal, engine, Base
from app.models.email_templates import EmailTemplates

Base.metadata.create_all(bind=engine)

templates = [
    {
        "template_name": "Endorse To ULCO for Review and Approval",
        "subject": "Agreement Update: Endorsed to ULCO for Review - {{PARTNER_NAME}}",
        "body_html": """Dear {{PARTNER_NAME}},<br><br>
        We would like to inform you that the {{DOCUMENT_TYPE}} with {{PARTNER_NAME}} 
        has been endorsed to ULCO for review and approval.<br>
        Current Status: Endorse to ULCO for Review and Approval<br>
        Thank you.<br>
        Best regards,<br>
        Office of International Affairs, PUP"""
    },
    {
        "template_name": "Revert To Initiator with Comments",
        "subject": "Agreement Update: Reverted for Revision - {{PARTNER_NAME}}",
        "body_html": """Dear {{PARTNER_NAME}},<br><br>
        The {{DOCUMENT_TYPE}} with {{PARTNER_NAME}} has been reverted to the initiator 
        with comments for revision.<br>
        Current Status: Revert to Initiator with Comments<br>
        Thank you.<br>
        Best regards,<br>
        Office of International Affairs, PUP"""
    },
    {
        "template_name": "Replication of Copies (8 sets)",
        "subject": "Agreement Update: Ready for Replication - {{PARTNER_NAME}}",
        "body_html": """Dear {{PARTNER_NAME}},<br><br>
        The {{DOCUMENT_TYPE}} with {{PARTNER_NAME}} is now for replication of copies (8 sets).<br>
        Current Status: For Replication of Copies (8 sets)<br>
        Thank you.<br>
        Best regards,<br>
        Office of International Affairs, PUP"""
    },
    {
        "template_name": "For Signatures of PUP Officials",
        "subject": "Agreement Update: Awaiting PUP Signatures - {{PARTNER_NAME}}",
        "body_html": """Dear {{PARTNER_NAME}},<br><br>
        The {{DOCUMENT_TYPE}} with {{PARTNER_NAME}} is now awaiting signatures from PUP officials.<br>
        Current Status: For Signatures of PUP Officials<br>
        Thank you.<br>
        Best regards,<br>
        Office of International Affairs, PUP"""
    },
    {
        "template_name": "Signed by PUP Officials",
        "subject": "Agreement Update: Signed by PUP Officials - {{PARTNER_NAME}}",
        "body_html": """Dear {{PARTNER_NAME}},<br><br>
        The {{DOCUMENT_TYPE}} with {{PARTNER_NAME}} has been signed by PUP officials.<br>
        Current Status: Signed by PUP Officials<br>
        Thank you.<br>
        Best regards,<br>
        Office of International Affairs, PUP"""
    },
    {
        "template_name": "For Signatures of Partner",
        "subject": "Agreement Update: Awaiting Partner Signature - {{PARTNER_NAME}}",
        "body_html": """Dear {{PARTNER_NAME}},<br><br>
        The {{DOCUMENT_TYPE}} with {{PARTNER_NAME}} is now for signature of the partner.<br>
        Current Status: For Signature of Partner<br>
        Thank you.<br>
        Best regards,<br>
        Office of International Affairs, PUP"""
    },
    {
        "template_name": "Signed by Partner Institution",
        "subject": "Agreement Update: Signed by Partner - {{PARTNER_NAME}}",
        "body_html": """Dear {{PARTNER_NAME}},<br><br>
        The {{DOCUMENT_TYPE}} with {{PARTNER_NAME}} has been signed by the partner institution.<br>
        Current Status: Signed by Partner Institution<br>
        Thank you.<br>
        Best regards,<br>
        Office of International Affairs, PUP"""
    },
    {
        "template_name": "Completely Signed",
        "subject": "Agreement Completed: Fully Executed - {{PARTNER_NAME}}",
        "body_html": """Dear {{PARTNER_NAME}},<br><br>
        The {{DOCUMENT_TYPE}} with {{PARTNER_NAME}} has been completely signed and finalized.<br>
        Current Status: Completely Signed<br>
        Thank you.<br>
        Best regards,<br>
        Office of International Affairs, PUP"""
    },
    {
        "template_name": "For Notary",
        "subject": "Agreement Update: Ready for Notarization - {{PARTNER_NAME}}",
        "body_html": """Dear {{PARTNER_NAME}},<br><br>
        We would like to inform you that the {{DOCUMENT_TYPE}} with {{PARTNER_NAME}} 
        has now reached the notarization stage.<br>
        Current Status: For Notary<br>
        Thank you.<br>
        Best regards,<br>
        Office of International Affairs, PUP"""
    },
    {
        "template_name": "FFUP Copy From College/Campus",
        "subject": "Agreement Update: FFUP Copy Required - {{PARTNER_NAME}}",
        "body_html": """Dear {{PARTNER_NAME}},<br><br>
        The {{DOCUMENT_TYPE}} with {{PARTNER_NAME}} is now for forwarding of FFUP copy 
        from the college/campus.<br>
        Current Status: For FFUP Copy from College/Campus<br>
        Thank you.<br>
        Best regards,<br>
        Office of International Affairs, PUP"""
    },
    {
        "template_name": "Renewal",
        "subject": "Agreement Notice: Renewal Required - {{PARTNER_NAME}}",
        "body_html": """Dear {{PARTNER_NAME}},<br><br>
        The {{DOCUMENT_TYPE}} with {{PARTNER_NAME}} is now due for renewal.<br>
        Current Status: Renewal<br>
        Thank you.<br>
        Best regards,<br>
        Office of International Affairs, PUP"""
    },
    {
        "template_name": "Expired",
        "subject": "Agreement Notice: Expired - {{PARTNER_NAME}}",
        "body_html": """Dear {{PARTNER_NAME}},<br><br>
        The {{DOCUMENT_TYPE}} with {{PARTNER_NAME}} has expired and is no longer valid.<br>
        Current Status: Expired<br>
        Please initiate actions for renewal if necessary.<br>
        Thank you.<br>
        Best regards,<br>
        Office of International Affairs, PUP"""
    }
]

def seed_templates():
    db = SessionLocal()
    try:
        for tpl in templates:
            exists = db.query(EmailTemplates).filter_by(template_name=tpl["template_name"]).first()
            if not exists:
                new_tpl = EmailTemplates(
                    template_name=tpl["template_name"], 
                    subject=tpl["subject"],
                    body_html=tpl["body_html"]
                )
                db.add(new_tpl)
        db.commit()
        print("✅ Email templates seeded successfully.")
    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding templates: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_templates()