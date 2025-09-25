from jinja2 import Template
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import smtplib

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USER = "pup.international.affairs@gmail.com"
SMTP_PASS = "epcs mqnp cpun pxin"

def render_template(body_html: str, context: dict) -> str:
    template = Template(body_html)
    return template.render(context)

def send_email(to: str, subject: str, body: str):
    """Send email via SMTP"""
    msg = MIMEMultipart("alternative")
    msg["From"] = SMTP_USER
    msg["To"] = to
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "html"))

    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=10) as server:  # Add timeout
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(SMTP_USER, to, msg.as_string())

def send_reset_email(recipient_email, reset_link):
    subject = "Password Reset Request 🔐 - Globalinked"
    body = (
        f'Click the link below to reset your password:<br>'
        f'<a href="{reset_link}">Reset your password here</a><br><br>'
        f"If you did not request this, please ignore this email."
    )
    send_email(recipient_email, subject, body)
