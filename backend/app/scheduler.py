from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import json
from zoneinfo import ZoneInfo
from app.database import SessionLocal
from app.models.agreements import Agreements
from app.models.partners import Partners
from app.models.contact_persons import ContactPersons
from app.models.point_persons import PointPersons
from app.models.timer import Timer

# Timeframe constants
EXPIRY_WINDOW_DAYS = int(__import__("os").environ.get("EXPIRY_WINDOW_DAYS", "30"))
PENDING_DAYS_DEFAULT = int(__import__("os").environ.get("PENDING_DAYS_DEFAULT", "7"))
RENEWAL_DAYS = int(__import__("os").environ.get("RENEWAL_DAYS", "30"))

from zoneinfo import ZoneInfo
PH_TZ = ZoneInfo("Asia/Manila")
scheduler = BackgroundScheduler(timezone=PH_TZ)

# Mapping for per-status thresholds
STATUS_THRESHOLD_DAYS = {
    # status -> days before the alert
    "Initial Review": 3,
    "Endorse": 3,
    "Revert": 3,
    "For Consultation": 3,
    "Replication": 3,
    "SignituresPUP": 3,
    "SignedPUP": 3,
    "SignituresPartner": 3,
    "Notary": 3,
    "FFUPCopy": 3,
}

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

def _format_subject(category: str, a: Agreements, partner_name: str):
    prefix = {
        "expiring_soon": "Expiring Soon",
        "pending_long": "Pending Action",
        "renewal_needed": "Renewal Needed"
    }.get(category, "Notification")
    return f"[Globalinked] {prefix}: {partner_name} — {a.document_type} {a.dts_number}"

def _format_body(category: str, a: Agreements, partner_name: str, recommended_actions, last_status_change=None):
    expiry = a.date_expiry.isoformat() if a.date_expiry else "-"
    actions_str = "\n- ".join(recommended_actions)
    return f"""Partner: {partner_name}
    DTS: {a.dts_number}
    Type: {a.document_type}
    Name: {partner_name}
    Status: {a.agreement_status or '-'}
    Last status change: {last_status_change or '-'}
    Expiry: {expiry}

    Recommended actions:
    - {actions_str}
    """

def _format_days_ago(days):
    if days is None:
        return "unknown time"
    if days < 30:
        return f"{days} days"
    elif days < 365:
        months = days // 30
        remaining_days = days % 30
        if remaining_days == 0:
            return f"{months} months"
        return f"{months} months {remaining_days} days"
    else:
        years = days // 365
        remaining_days = days % 365
        months = remaining_days // 30
        if months == 0:
            return f"{years} years"
        return f"{years} years {months} months"


def _format_days_until(days_until):
    if days_until is None:
        return "unknown time"
    if days_until <= 0:
        return "today"
    return _format_days_ago(days_until)


def _recommended_actions_for_category(category, status=None):
    if category == "expiring_soon":
        return [
            "Prepare renewal documents and notify partner contacts.",
            "Confirm responsibilities and timelines with source unit."
        ]
    if category == "pending_long":
        status_actions = {
            "Initial Review": [
                "conduct initial document review.",
                "Verify all required documents and information are complete.",
                "Schedule review meeting if necessary and proceed to next status."
            ],
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
            "For Consultation": [
                "Reach out to relevant stakeholders for consultation.",
                "Prepare consultation materials and agenda items.",
                "Follow up with consulted parties for feedback and recommendations."
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
    #  service imports
    from app.services.notif_service import create_notification_if_new

    """
    scanning 
      - create 'expiring_soon' notifications for agreements expiring within EXPIRY_WINDOW_DAYS
      - create 'pending_long' notifications for agreements in pending statuses longer than threshold
      - create 'renewal_needed' notifications for agreements expired > RENEWAL_DAYS
    The function avoids creating duplicate notifications .
    """
    db = _open_session()
    try:
        today = datetime.now(PH_TZ).date()

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
            days_until = (a.date_expiry - today).days if a.date_expiry else None
            time_until = _format_days_until(days_until)
            msg = f"{a.document_type} '{a.dts_number}' with partner '{p.name}' expires in {time_until}."
            actions = _recommended_actions_for_category(category, None)
            notif = create_notification_if_new(db, a.agreement_id, category, msg, "\n".join(actions))

        # 2) Pending statuses with timeframe
        pending_statuses = list(STATUS_THRESHOLD_DAYS.keys())
        threshold_map = STATUS_THRESHOLD_DAYS

        for status in pending_statuses:
            days_threshold = threshold_map.get(status, PENDING_DAYS_DEFAULT)
            cutoff = today - timedelta(days=days_threshold)
            pending_rows = (
                db.query(Agreements, Partners, Timer)
                  .join(Partners, Agreements.partner_id == Partners.partner_id)
                  .join(Timer, Timer.agreement_id == Agreements.agreement_id)
                  .filter(Agreements.agreement_status == status)
                  .filter(Timer.last_status_change != None)
                  .filter(Timer.last_status_change <= datetime.combine(cutoff, datetime.min.time()))
                  .all()
            )

            for a, p, t in pending_rows:
                category = "pending_long"
                days_pending = (today - t.last_status_change.date()).days if t.last_status_change else None
                time_pending = _format_days_ago(days_pending)

                print(f"[DormantCheck] Agreement {a.agreement_id} ({a.agreement_status}) last change: {t.last_status_change}, days: {days_pending}")
                # LOG: For debugging dormant check

                msg = (
                    f"{a.document_type} for {p.name} - '{a.dts_number}' has been in "
                    f"status '{a.agreement_status}' for {time_pending}."
                )
                actions = _recommended_actions_for_category(category, a.agreement_status)
                notif = create_notification_if_new(db, a.agreement_id, category, msg, "\n".join(actions))

        # 3) renewal needed: expired more than RENEWAL_DAYS ago
        cutoff_expired = today - timedelta(days=RENEWAL_DAYS)
        renewal = (
            db.query(Agreements, Partners)
              .join(Partners, Agreements.partner_id == Partners.partner_id)
              .filter(Agreements.date_expiry != None)
              .filter(Agreements.date_expiry <= cutoff_expired)
              .all()
        )
        for a, p in renewal:
            category = "renewal_needed"
            days_expired = (today - a.date_expiry).days if a.date_expiry else None
            time_ago = _format_days_ago(days_expired)
            msg = f"{a.document_type} of {p.name} -'{a.dts_number}' expired on {a.date_expiry} ({time_ago})."
            actions = _recommended_actions_for_category(category, None)
            notif = create_notification_if_new(db, a.agreement_id, category, msg, "\n".join(actions))

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