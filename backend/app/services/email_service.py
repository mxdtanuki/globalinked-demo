import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException
from jinja2 import Template
import os

# Your Brevo API key (store in .env instead of hardcoding!)
BREVO_API_KEY = os.getenv("BREVO_API_KEY")

# Configure API client
configuration = sib_api_v3_sdk.Configuration()
configuration.api_key['api-key'] = BREVO_API_KEY

api_instance = sib_api_v3_sdk.TransactionalEmailsApi(
    sib_api_v3_sdk.ApiClient(configuration)
)

def render_template(body_html: str, context: dict) -> str:
    template = Template(body_html)
    return template.render(context)

def send_email(to: str, subject: str, body: str):
    """Send email via Brevo API"""
    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
        to=[{"email": to}],
        sender={"name": "PUP International Affairs", "email": "no-reply@globalinked.systems"},
        subject=subject,
        html_content=body
    )
    try:
        api_response = api_instance.send_transac_email(send_smtp_email)
        # Handle response: check if it's a dict or object
        if isinstance(api_response, dict) and 'messageId' in api_response:
            print("✅ Email sent. Message ID:", api_response['messageId'])
        elif hasattr(api_response, 'message_id'):  # If it's an object with message_id
            print("✅ Email sent. Message ID:", api_response.message_id)
        else:
            print("✅ Email sent successfully (response type:", type(api_response).__name__, ")")
    except ApiException as e:
        print("❌ Exception when sending email: %s\n" % e)
        raise

def send_reset_email(recipient_email, reset_link):
    subject = "Password Reset Request 🔐 - Globalinked"
    
    template_str = """
    <html>
    <body>
        <h2>Password Reset</h2>
        <p>Click the link below to reset your password:</p>
        <a href="{{ reset_link }}">Reset your password here</a>
        <p>If you did not request this, please ignore this email.</p>
        <p>Best,<br>Globalinked Team</p>
    </body>
    </html>
    """
    context = {"reset_link": reset_link}
    body = render_template(template_str, context)
    
    send_email(recipient_email, subject, body)
