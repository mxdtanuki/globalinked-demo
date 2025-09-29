import os
from jinja2 import Template
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import smtplib

# Get SMTP credentials from environment variables
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USER = "pup.international.affairs@gmail.com"
SMTP_PASS = "epcs mqnp cpun pxin"

if not SMTP_USER or not SMTP_PASS:
    raise ValueError("SMTP_USER and SMTP_PASS environment variables must be set")

def render_template(body_html: str, context: dict) -> str:
    """Render HTML email templates using Jinja2."""
    template = Template(body_html)
    return template.render(context)

def send_email(to, subject: str, body: str):
    """Send email via SMTP with proper error handling."""
    try:
        # Handle both single email string and list of emails
        if isinstance(to, list):
            recipients = to
            to_header = ", ".join(to)  # For the To header
        else:
            recipients = [to]
            to_header = to

        msg = MIMEMultipart("alternative")
        msg["From"] = SMTP_USER
        msg["To"] = to_header
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "html"))

        print(f"Attempting to send email to: {recipients}")
        print(f"Using SMTP server: {SMTP_SERVER}:{SMTP_PORT}")
        print(f"From: {SMTP_USER}")

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=30) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, recipients, msg.as_string())

        print(f"Email sent successfully to: {recipients}")
        return True

    except smtplib.SMTPAuthenticationError as e:
        print(f"SMTP Authentication Error: {e}")
        raise Exception(f"SMTP authentication failed. Check credentials. Error: {e}")
    except smtplib.SMTPConnectError as e:
        print(f"SMTP Connection Error: {e}")
        raise Exception(f"Failed to connect to SMTP server. Error: {e}")
    except smtplib.SMTPException as e:
        print(f"SMTP Error: {e}")
        raise Exception(f"SMTP error occurred. Error: {e}")
    except Exception as e:
        print(f"Unexpected error sending email: {e}")
        raise Exception(f"Failed to send email: {e}")

def send_reset_email(recipient_email: str, reset_link: str):
    """Send password reset email."""
    subject = "Password Reset Request 🔐 - Globalinked"
    body = (
        f'<p>Click the link below to reset your password:</p>'
        f'<p><a href="{reset_link}">Reset your password here</a></p>'
        f'<p>If you did not request this, please ignore this email.</p>'
        f'<p>This link will expire in 1 hour.</p>'
    )
    send_email(recipient_email, subject, body)
