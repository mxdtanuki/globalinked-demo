from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import json

from app.database import SessionLocal
from app.models.agreements import Agreements
from app.models.partners import Partners
from app.models.contact_persons import ContactPersons

# Timeframe constants (tweak as needed or move to .env)
EXPIRY_WINDOW_DAYS = int(__import__("os").environ.get("EXPIRY_WINDOW_DAYS", "30"))
PENDING_DAYS_DEFAULT = int(__import__("os").environ.get("PENDING_DAYS_DEFAULT", "7"))
DORMANT_DAYS = int(__import__("os").environ.get("DORMANT_DAYS", "30"))

# Mapping for per-status thresholds (optional override)
STATUS_THRESHOLD_DAYS = {
    # status -> days before the alert
    "Endorse": 7,
    "Revert": 7,
    "Replication": 14,
    "SignituresPUP": 7,
    "SignedPUP": 7,
    "SignituresPartner": 7,
    "Notary": 7,
    "FFUPCopy": 7,
}

scheduler = BackgroundScheduler(timezone="UTC")


def _open_session():
    return SessionLocal()


def _parse_point_persons(raw):
    """
    Parse agreements.point_persons_list if you have legacy JSON stored there.
    Returns list of dicts or empty list.
    """
    try:
        if not raw:
            return []
        if isinstance(raw, list):
            return raw
        return json.loads(raw)
    except Exception:
        return []


def _collect_recipient_emails(db: Session, agreement: Agreements, partner: Partners):
    """
    Collect emails from:
      - partner contact_persons table
      - agreement -> agreement_point_persons -> point_persons join
      - fallback: agreements.point_persons_list JSON (if present)
    Returns deduplicated list of lowercased emails.
    """
    emails = []

    # partner contact persons
    try:
        cps = db.query(ContactPersons).filter(ContactPersons.partner_id == partner.partner_id).all()
        for cp in cps:
            if getattr(cp, "contact_person_email", None):
                emails.append(cp.contact_person_email.strip().lower())
    except Exception:
        pass

    # agreement point persons via agreement_point_persons to point_persons
    try:
        # import here to avoid circular imports at module import time
        from app.models.agreement_point_persons import AgreementPointPersons
        from app.models.point_persons import PointPersons

        rows = (
            db.query(AgreementPointPersons, PointPersons)
              .join(PointPersons, AgreementPointPersons.point_person_id == PointPersons.point_person_id)
              .filter(AgreementPointPersons.agreement_id == agreement.agreement_id)
              .all()
        )
        for ap, pp in rows:
            if getattr(pp, "point_person_email", None):
                emails.append(pp.point_person_email.strip().lower())
    except Exception:
        pass

    #  fallback: legacy JSON column on Agreements (if any)
    try:
        for pp in _parse_point_persons(getattr(agreement, "point_persons_list", None) or []):
            # support multiple possible key names
            email = pp.get("email") or pp.get("contact_person_email") or pp.get("point_person_email")
            if email:
                emails.append(email.strip().lower())
    except Exception:
        pass

    # deduplicate while preserving order
    return list(dict.fromkeys(emails))


def _format_subject(category: str, a: Agreements, partner_name: str):
    prefix = {
        "expiring_soon": "Expiring Soon",
        "pending_long": "Pending Action",
        "renewal_needed": "Renewal Needed"
    }.get(category, "Notification")
    return f"[Globalinked] {prefix}: {partner_name} — {a.document_type} {a.dts_number}"


def _format_body(category: str, a: Agreements, partner_name: str, recommended_actions):
    expiry = a.date_expiry.isoformat() if a.date_expiry else "-"
    return f"""Partner: {partner_name}
DTS: {a.dts_number}
Type: {a.document_type}
Name: {partner_name}
Status: {a.agreement_status or '-'}
Entry: {a.entry_date}
Expiry: {expiry}

Recommended actions:
- {"\n- ".join(recommended_actions)}
"""


def _recommended_actions_for_category(category):
    if category == "expiring_soon":
        return [
            "Prepare renewal documents and notify partner contacts.",
            "Confirm responsibilities and timelines with source unit."
        ]
    if category == "pending_long":
        status_actions = {
            "Endorse": [
                "Follow up with the endorsing authority for approval.",
                "Verify all required documents are complete and submitted.",
                "Escalate to supervisor if approval is overdue."
            ],
            "Revert": [
                "Contact the initiator to address feedback and resubmit.",
                "Review comments and prepare revised documentation.",
                "Set deadline for resubmission to avoid further delays."
            ],
            "Replication": [
                "Check with document processing team for replication status.",
                "Ensure all copies are properly prepared and distributed.",
                "Follow up on any missing signatures or approvals."
            ],
            "SignituresPUP": [
                "Coordinate with PUP signatories for document signing.",
                "Schedule signing appointment if needed.",
                "Verify all PUP requirements are met before signing."
            ],
            "SignedPUP": [
                "Proceed to partner signature collection.",
                "Send signed document to partner contact persons.",
                "Set follow-up timeline for partner signature completion."
            ],
            "SignituresPartner": [
                "Follow up with partner for document signing.",
                "Send reminder to partner contact persons.",
                "Escalate to partner management if response is delayed."
            ],
            "Notary": [
                "Schedule notarization appointment.",
                "Ensure all parties are available for notary witness.",
                "Verify notary requirements and prepare necessary IDs."
            ],
            "FFUPCopy": [
                "Finalize document distribution to all parties.",
                "Ensure copies are properly filed and archived.",
                "Update agreement status to active/completed."
            ]
        }
        
        if status and status in status_actions:
            return status_actions[status]
        
        # Default pending if status not found
        return [
            "Review current status and identify blockers.",
            "Follow up with responsible parties for next steps.",
            "Escalate if no response within agreed timeframe."
        ]
    if category == "renewal_needed":
        return [
            "Initiate renewal workflow or archive agreement.",
            "Notify partner and responsible unit to decide on next steps."
            "Assess impact on current projects before closure."
        ]
    return ["Review and act accordingly."]


def agreement_notification_job():
    #  service imports to avoid circular import at module import time
    from app.services.notif_service import create_notification_if_new
    from app.services.email_service import send_email

    """
    scanning 
      - create 'expiring_soon' notifications for agreements expiring within EXPIRY_WINDOW_DAYS
      - create 'pending_long' notifications for agreements in pending statuses longer than threshold
      - create 'renewal_needed' notifications for agreements expired > DORMANT_DAYS
    The function avoids creating duplicate notifications .
    """
    db = _open_session()
    try:
        today = datetime.utcnow().date()

        # 1) Expiring soon
        horizon = today + timedelta(days=EXPIRY_WINDOW_DAYS)
        expiring = (
            db.query(Agreements, Partners)
              .join(Partners, Agreements.partner_id == Partners.partner_id)
              .filter(Agreements.date_expiry != None)
              .filter(Agreements.date_expiry >= today)
              .filter(Agreements.date_expiry <= horizon)
              .all()
        )
        for a, p in expiring:
            category = "expiring_soon"
            f"{a.document_type} '{a.dts_number}' with partner '{p.name}' expires on {a.date_expiry}."
            actions = _recommended_actions_for_category(category)
            notif = create_notification_if_new(db, a.agreement_id, category, msg, "\n".join(actions))
            # send email to recipients (optional)
            recipients = _collect_recipient_emails(db, a, p)
            if notif and recipients:
                try:
                    subj = _format_subject(category, a, p.name)
                    body = _format_body(category, a, p.name, actions)
                    send_email(recipients, subj, body)
                except Exception as e:
                    print("[Scheduler] email send failed:", e)

        # 2) Pending statuses with timeframe
        pending_statuses = list(STATUS_THRESHOLD_DAYS.keys())
        threshold_map = STATUS_THRESHOLD_DAYS

        for status in pending_statuses:
            days_threshold = threshold_map.get(status, PENDING_DAYS_DEFAULT)
            cutoff = today - timedelta(days=days_threshold)
            pending_rows = (
                db.query(Agreements, Partners)
                  .join(Partners, Agreements.partner_id == Partners.partner_id)
                  .filter(Agreements.agreement_status == status)
                  .filter(Agreements.entry_date != None)
                  .filter(Agreements.entry_date <= cutoff)
                  .all()
            )
            for a, p in pending_rows:
                category = "pending_long"
                days_pending = (today - a.entry_date).days if a.entry_date else None
                msg = f"{a.document_type} for {p.name} - '{a.dts_number}' has been in status '{a.agreement_status}' for {days_pending} days."
                actions = _recommended_actions_for_category(category)
                notif = create_notification_if_new(db, a.agreement_id, category, msg, "\n".join(actions))
                recipients = _collect_recipient_emails(db, a, p)
                if notif and recipients:
                    try:
                        subj = _format_subject(category, a, p.name)
                        body = _format_body(category, a, p.name, actions)
                        send_email(recipients, subj, body)
                    except Exception as e:
                        print("[Scheduler] email send failed:", e)

        # 3) Dormant / renewal needed: expired more than DORMANT_DAYS ago
        cutoff_expired = today - timedelta(days=DORMANT_DAYS)
        dormant = (
            db.query(Agreements, Partners)
              .join(Partners, Agreements.partner_id == Partners.partner_id)
              .filter(Agreements.date_expiry != None)
              .filter(Agreements.date_expiry <= cutoff_expired)
              .all()
        )
        for a, p in dormant:
            category = "renewal_needed"
            days_expired = (today - a.date_expiry).days if a.date_expiry else None
            msg = f"{a.document_type} of {p.name} -'{a.dts_number}' expired on {a.date_expiry} ({days_expired} days ago)."
            actions = _recommended_actions_for_category(category)
            notif = create_notification_if_new(db, a.agreement_id, category, msg, "\n".join(actions))
            recipients = _collect_recipient_emails(db, a, p)
            if notif and recipients:
                try:
                    subj = _format_subject(category, a, p.name)
                    body = _format_body(category, a, p.name, actions)
                    send_email(recipients, subj, body)
                except Exception as e:
                    print("[Scheduler] email send failed:", e)

    except Exception as exc:
        print("[Scheduler] agreement_notification_job error:", exc)
    finally:
        db.close()


def start_scheduler():
    # schedule the scan once at startup and daily
    try:
        agreement_notification_job()
    except Exception:
        pass
    scheduler.add_job(agreement_notification_job, "cron", hour=1, minute=0, id="daily_agreement_scan")
    scheduler.start()
    print("[Scheduler] started")


def shutdown_scheduler():
    try:
        scheduler.shutdown(wait=False)
    except Exception:
        pass
    print("[Scheduler] stopped")