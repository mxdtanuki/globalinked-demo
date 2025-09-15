from jinja2 import Template
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import smtplib

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USER = "pup.international.affairs@gmail.com"
SMTP_PASS = "epcs mqnp cpun pxin"

def render_template(body_html: str, context: dict) -> str:
    """Render DB template with Jinja2 placeholders like {{ name }}"""
    template = Template(body_html)
    return template.render(context)

def send_email(to: str, subject: str, body: str):
    """Send email via SMTP"""
    msg = MIMEMultipart("alternative")
    msg["From"] = SMTP_USER
    msg["To"] = to
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "html"))

    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(SMTP_USER, to, msg.as_string())
