import os
import smtplib
from email.mime.text import MIMEText

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT") or 587)
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASS = os.getenv("SMTP_PASS")
SMTP_FROM = os.getenv("SMTP_FROM", "no-reply@globalinked.local")

def send_email(recipients, subject, body):
    """
    Send a plain-text email to recipients (list of addresses).
    If SMTP not configured, print to stdout (safe for dev).
    """
    if not recipients:
        return

    if not (SMTP_HOST and SMTP_USER and SMTP_PASS):
        # dev fallback
        print("[EmailService] SMTP not configured, would send:")
        print("To:", recipients)
        print("Subject:", subject)
        print(body)
        return

    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = subject
    msg["From"] = SMTP_FROM
    msg["To"] = ", ".join(recipients)

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as smtp:
            smtp.starttls()
            smtp.login(SMTP_USER, SMTP_PASS)
            smtp.sendmail(SMTP_FROM, recipients, msg.as_string())
    except Exception as exc:
        # Do not raise in scheduler; just log
        print("[EmailService] send_email error:", exc)