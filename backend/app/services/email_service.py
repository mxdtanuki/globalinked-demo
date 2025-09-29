import sib_api_v3_sdk
from sib_api_v3_sdk import Configuration
from sib_api_v3_sdk.rest import ApiException
from jinja2 import Template
import os

# Configure Brevo API
configuration = Configuration()  # Create a Configuration instance
configuration.api_key['api-key'] = os.getenv("BREVO_API_KEY")  # Set the API key

def render_template(body_html: str, context: dict) -> str:
    template = Template(body_html)
    return template.render(context)

def send_email(to: str, subject: str, body: str):
    """Send email via Brevo API"""
    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(configuration)  # Pass configuration
    
    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
        to=[{"email": to}],
        sender={"name": "Globalinked", "email": "noreply@pup.international.affairs"},
        subject=subject,
        html_content=body
    )
    
    try:
        api_response = api_instance.send_transac_email(send_smtp_email)
        print(f"Email sent successfully: {api_response}")
    except ApiException as e:
        print(f"Exception when sending email: {e}")

def send_reset_email(recipient_email, reset_link):
    subject = "Password Reset Request 🔐 - Globalinked"
    body = (
        f'Click the link below to reset your password:<br>'
        f'<a href="{reset_link}">Reset your password here</a><br><br>'
        f"If you did not request this, please ignore this email."
    )
    send_email(recipient_email, subject, body)