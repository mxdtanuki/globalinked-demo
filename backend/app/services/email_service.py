from jinja2 import Template
import os
import requests 

BREVO_API_KEY = os.getenv("BREVO_API_KEY")

def render_template(body_html: str, context: dict) -> str:
    template = Template(body_html)
    return template.render(context)

def send_email(to: str, subject: str, body: str):
    """Send email using Brevo API"""
    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json"
    }
    data = {
        "sender": {"name": "Globalinked", "email": "noreply@globalinked.com"},
        "to": [{"email": to}],
        "subject": subject,
        "htmlContent": body
    }

    r = requests.post(url, headers=headers, json=data)
    r.raise_for_status()
    return r.json()


def send_reset_email(recipient_email, reset_link):
    """Send password reset email via Brevo"""
    subject = "Password Reset Request 🔐 - Globalinked"
    body = (
        f'Click the link below to reset your password:<br>'
        f'<a href="{reset_link}">Reset your password here</a><br><br>'
        f"If you did not request this, please ignore this email."
    )
    return send_email(recipient_email, subject, body)