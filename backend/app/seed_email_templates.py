from app.database import SessionLocal, engine, Base
from app.models.email_templates import EmailTemplates
from app.models.agreements import Agreements
from app.models.timer import Timer
from app.models.partners import Partners
from app.models.contact_persons import ContactPersons
from app.models.point_persons import PointPersons
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

Base.metadata.create_all(bind=engine)

# Professional, polished templates
templates = [
    {
        "template_name": "Endorse To ULCO for Review and Approval",
        "subject": "Agreement Endorsed to ULCO for Review",
        "body_html": """Dear {{PARTNER_NAME}},<br><br>
        This is to notify you that the {{DOCUMENT_TYPE}} with <strong>{{PARTNER_NAME}}</strong> 
        has been formally endorsed to ULCO for review and approval.<br><br>
        <b>DTS Number:</b> {{DTS_NUMBER}}<br>
        <b>Status:</b> Endorse to ULCO for Review and Approval<br><br>
        Thank you.<br>
        <i>Office of International Affairs, PUP</i>"""
    },
    {
        "template_name": "Revert To Initiator with Comments",
        "subject": "Agreement Reverted for Revision",
        "body_html": """Dear {{PARTNER_NAME}},<br><br>
        The {{DOCUMENT_TYPE}} with <strong>{{PARTNER_NAME}}</strong> has been reverted to the initiator 
        with comments for revision.<br><br>
        <b>Status:</b> Revert to Initiator with Comments<br><br>
        Thank you.<br>
        <i>Office of International Affairs, PUP</i>"""
    },
    {
        "template_name": "Replication of Copies (8 sets)",
        "subject": "Agreement Ready for Replication",
        "body_html": """Dear {{PARTNER_NAME}},<br><br>
        The {{DOCUMENT_TYPE}} with <strong>{{PARTNER_NAME}}</strong> is now scheduled for replication of copies (8 sets).<br><br>
        <b>Status:</b> For Replication of Copies (8 sets)<br><br>
        Thank you.<br>
        <i>Office of International Affairs, PUP</i>"""
    },
    {
        "template_name": "For Signatures of PUP Officials",
        "subject": "Agreement Awaiting PUP Signatures",
        "body_html": """Dear {{PARTNER_NAME}},<br><br>
        The {{DOCUMENT_TYPE}} with <strong>{{PARTNER_NAME}}</strong> is now awaiting signatures from PUP officials.<br><br>
        <b>Status:</b> For Signatures of PUP Officials<br><br>
        Thank you.<br>
        <i>Office of International Affairs, PUP</i>"""
    },
    {
        "template_name": "Signed by PUP Officials",
        "subject": "Agreement Signed by PUP Officials",
        "body_html": """Dear {{PARTNER_NAME}},<br><br>
        The {{DOCUMENT_TYPE}} with <strong>{{PARTNER_NAME}}</strong> has been signed by PUP officials.<br><br>
        <b>Status:</b> Signed by PUP Officials<br><br>
        Thank you.<br>
        <i>Office of International Affairs, PUP</i>"""
    },
    {
        "template_name": "For Signatures of Partner",
        "subject": "Agreement Awaiting Partner Signature",
        "body_html": """Dear {{PARTNER_NAME}},<br><br>
        The {{DOCUMENT_TYPE}} with <strong>{{PARTNER_NAME}}</strong> is now awaiting your signature.<br><br>
        <b>Status:</b> For Signature of Partner<br><br>
        Thank you.<br>
        <i>Office of International Affairs, PUP</i>"""
    },
    {
        "template_name": "Signed by Partner Institution",
        "subject": "Agreement Signed by Partner Institution",
        "body_html": """Dear {{PARTNER_NAME}},<br><br>
        The {{DOCUMENT_TYPE}} has been signed by <strong>{{PARTNER_NAME}}</strong>.<br><br>
        <b>Status:</b> Signed by Partner Institution<br><br>
        Thank you.<br>
        <i>Office of International Affairs, PUP</i>"""
    },
    {
        "template_name": "Completely Signed",
        "subject": "Agreement Fully Executed",
        "body_html": """Dear {{PARTNER_NAME}},<br><br>
        The {{DOCUMENT_TYPE}} with <strong>{{PARTNER_NAME}}</strong> has been completely signed and finalized.<br><br>
        <b>Status:</b> Completely Signed<br><br>
        Thank you.<br>
        <i>Office of International Affairs, PUP</i>"""
    },
    {
        "template_name": "For Notary",
        "subject": "Agreement Ready for Notarization",
        "body_html": """Dear {{PARTNER_NAME}},<br><br>
        The {{DOCUMENT_TYPE}} with <strong>{{PARTNER_NAME}}</strong> is now ready for notarization.<br><br>
        <b>Status:</b> For Notary<br><br>
        Thank you.<br>
        <i>Office of International Affairs, PUP</i>"""
    },
    {
        "template_name": "FFUP Copy From College/Campus",
        "subject": "Agreement Requires FFUP Copy",
        "body_html": """Dear {{PARTNER_NAME}},<br><br>
        The {{DOCUMENT_TYPE}} with <strong>{{PARTNER_NAME}}</strong> is now awaiting the FFUP copy 
        from the concerned college/campus.<br><br>
        <b>Status:</b> For FFUP Copy from College/Campus<br><br>
        Thank you.<br>
        <i>Office of International Affairs, PUP</i>"""
    },
    {
        "template_name": "Renewal",
        "subject": "Agreement Renewal Notice",
        "body_html": """Dear {{PARTNER_NAME}},<br><br>
        Please be advised that the {{DOCUMENT_TYPE}} with <strong>{{PARTNER_NAME}}</strong> 
        is due for renewal.<br><br>
        <b>Status:</b> Renewal<br>
        <b>Expiry Date:</b> {{EXPIRY_DATE}}<br><br>
        Thank you.<br>
        <i>Office of International Affairs, PUP</i>"""
    },
    {
        "template_name": "Expired",
        "subject": "Agreement Expiration Notice",
        "body_html": """Dear {{PARTNER_NAME}},<br><br>
        The {{DOCUMENT_TYPE}} with <strong>{{PARTNER_NAME}}</strong> has expired.<br><br>
        <b>Status:</b> Expired<br>
        Please coordinate with our office for possible renewal.<br><br>
        Thank you.<br>
        <i>Office of International Affairs, PUP</i>"""
    }
]

def seed_templates():
    with SessionLocal() as db:
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
                    logging.info(f"Added template: {tpl['template_name']}")
                else:
                    logging.info(f"Skipped existing template: {tpl['template_name']}")
            db.commit()
            logging.info("Email templates seeded successfully.")
        except Exception as e:
            db.rollback()
            logging.error(f"Error seeding templates: {e}")

if __name__ == "__main__":
    seed_templates()
