from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import and_, or_
from datetime import datetime, timedelta
import json
from zoneinfo import ZoneInfo
from app.database import SessionLocal
from app.models.agreements import Agreements
from app.models.partners import Partners
from app.models.contact_persons import ContactPersons
from app.models.point_persons import PointPersons
from app.models.timer import Timer
from contextlib import contextmanager
import logging

logger = logging.getLogger("uvicorn.error")

# Timeframe constants (configurable via environment variables)
EXPIRY_WINDOW_DAYS = int(__import__("os").environ.get("EXPIRY_WINDOW_DAYS", "30"))
PENDING_DAYS_DEFAULT = int(__import__("os").environ.get("PENDING_DAYS_DEFAULT", "7"))
RENEWAL_DAYS = int(__import__("os").environ.get("RENEWAL_DAYS", "30"))

PH_TZ = ZoneInfo("Asia/Manila")
scheduler = BackgroundScheduler(timezone=PH_TZ)

# Threshold days for pending status alerts
STATUS_THRESHOLD_DAYS = {
    "InitialReview": 3,
    "Endorse": 3,
    "Revert": 3,
    "Consultation": 3,
    "Replication": 3,
    "SignituresPUP": 3,
    "SignedPUP": 3,
    "SignituresPartner": 3,
    "SignedPartner": 3,
    "Complete": 3,
    "Notary": 3,
    "FFUPCopy": 3,
}

@contextmanager
def _open_session():
    """
    Context manager for database sessions.
    Ensures the session is always closed and returned to the pool, even on exceptions.
    """
    session = SessionLocal()
    try:
        yield session
    except Exception as e:
        logger.error(f"Session error: {e}")
        session.rollback()
        raise
    finally:
        try:
            session.close()
            logger.debug("Scheduler session closed")
        except Exception as e:
            logger.warning(f"Error closing scheduler session: {e}")

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
    """
    Formats the email/notification subject based on category.
    """
    prefix = {
        "expiring_soon": "Expiring Soon",
        "pending_long": "Pending Action",
        "renewal_needed": "Renewal Needed"
    }.get(category, "Notification")
    return f"[Globalinked] {prefix}: {partner_name} — {a.document_type} {a.dts_number}"

def _format_body(category: str, a: Agreements, partner_name: str, recommended_actions, last_status_change=None):
    """
    Formats the email/notification body with agreement details and actions.
    """
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
    """
    Formats days into a human-readable string (e.g., "3 days", "2 months").
    """
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
    """
    Formats days until expiry into a human-readable string.
    """
    if days_until is None:
        return "unknown time"
    if days_until <= 0:
        return "today"
    return _format_days_ago(days_until)

def _recommended_actions_for_category(category, status=None):
    """
    Returns recommended actions based on notification category and status.
    """
    if category == "expiring_soon":
        return [
            "Prepare renewal documents and notify partner contacts.",
            "Confirm responsibilities and timelines with source unit."
        ]
    if category == "pending_long":
        status_actions = {
            "InitialReview": [
                "Conduct initial document review.",
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
            "Consultation": [
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
        
        return [
            "Review current status and identify blockers.",
            "Follow up with responsible parties for next steps.",
            "Escalate if no response within agreed timeframe."
        ]
    if category == "renewal_needed":
        return [
            "Initiate renewal workflow or archive agreement.",
            "Notify partner and responsible unit to decide on next steps.",
            "Assess impact on current projects before closure."
        ]
    return ["Review and act accordingly."]

def agreement_notification_job():
    """
    Main scheduler job: Scans for expiring, pending, and renewal-needed agreements,
    then creates notifications if new ones are found.
    
    OPTIMIZED:
    - Uses batch loading with selectinload() to prevent N+1 queries
    - Single session lifecycle per job
    - Efficient filtering at database level
    - Proper error handling and logging
    """
    from app.services.notif_service import create_notification_if_new

    today = datetime.now(PH_TZ).date()
    logger.info(f"[Scheduler] Starting notification job for {today}")

    with _open_session() as db:
        try:
            # ===== 1) EXPIRING SOON =====
            # Single optimized query with eager loading
            horizon = today + timedelta(days=EXPIRY_WINDOW_DAYS)
            expiring_query = (
                db.query(Agreements)
                  .options(
                      selectinload(Agreements.partner),
                      selectinload(Agreements.timer)
                  )
                  .join(Partners)
                  .filter(
                      and_(
                          Agreements.date_expiry != None,
                          Agreements.date_expiry >= today,
                          Agreements.date_expiry <= horizon,
                          Agreements.agreement_status != "Withdrawn"
                      )
                  )
                  .all()
            )
            
            logger.info(f"[Scheduler] Found {len(expiring_query)} expiring agreements")
            
            for a in expiring_query:
                try:
                    partner = a.partner
                    category = "expiring_soon"
                    days_until = (a.date_expiry - today).days if a.date_expiry else None
                    if days_until is not None and (
                        days_until % 5 == 0 or days_until in [3, 2, 1]
                    ):
                        time_until = _format_days_until(days_until)
                        msg = f"{a.document_type} '{a.dts_number}' with partner '{partner.name}' expires in {time_until}."
                        actions = _recommended_actions_for_category(category, None)
                        
                        notif = create_notification_if_new(
                            db, 
                            a.agreement_id, 
                            category, 
                            msg, 
                            "\n".join(actions)
                        )
                        
                        if notif:
                            logger.info(f"[Scheduler] ✅ Created expiring notification: {a.dts_number}")
                        else:
                            logger.debug(f"[Scheduler] ⚠️ Notification already exists: {a.dts_number}")
                            
                except Exception as e:
                    logger.error(f"[Scheduler] Error processing expiring agreement {a.agreement_id}: {e}")
                    continue

            # ===== 2) PENDING LONG =====
            # Get all agreements not in final states (more efficient)
            pending_statuses = list(STATUS_THRESHOLD_DAYS.keys())
            pending_query = (
                db.query(Agreements)
                .options(
                    selectinload(Agreements.partner),
                    selectinload(Agreements.timer)
                )
                .filter(
                    and_(
                        Agreements.agreement_status.in_(pending_statuses),
                        Agreements.agreement_status != "Withdrawn",
                        Agreements.agreement_status != "Active"
                    )
                )
                .all()
            )

            logger.info(f"[Scheduler] Found {len(pending_query)} agreements in pending status")
            pending_count = 0

            for a in pending_query:
                try:
                    partner = a.partner
                    status = a.agreement_status
                    days_threshold = STATUS_THRESHOLD_DAYS.get(status, PENDING_DAYS_DEFAULT)
                    
                    # Determine days pending
                    if a.timer and a.timer.last_status_change:
                        last_status_change = a.timer.last_status_change
                        # Ensure last_change_date is always a date object
                        if isinstance(last_status_change, datetime):
                            last_change_date = last_status_change.date()
                        else:
                            last_change_date = last_status_change
                        # Ensure today is also a date
                        today_date = today.date() if isinstance(today, datetime) else today
                        days_pending = (today_date - last_change_date).days
                        last_change_info = f"since {last_change_date}"
                    elif a.entry_date:
                        entry_date = (
                            datetime.strptime(a.entry_date, '%Y-%m-%d').date() 
                            if isinstance(a.entry_date, str) 
                            else a.entry_date.date() if isinstance(a.entry_date, datetime) else a.entry_date
                        )
                        # Ensure both are date objects
                        if isinstance(entry_date, datetime):
                            entry_date = entry_date.date()
                        today_date = today.date() if isinstance(today, datetime) else today
                        
                        days_pending = (today_date - entry_date).days
                        last_change_info = f"since entry {entry_date}"
                        last_status_change = None
                    else:
                        days_pending = days_threshold + 1
                        last_change_info = "no timestamp available"
                        last_status_change = None

                    logger.debug(f"[Scheduler] {a.dts_number} in '{status}': {days_pending}/{days_threshold} days")

                    # Check if threshold exceeded
                    if days_pending >= days_threshold:
                        category = "pending_long"
                        time_pending = _format_days_ago(days_pending)
                        msg = (
                            f"{a.document_type} for {partner.name} - '{a.dts_number}' has been in "
                            f"status '{status}' for {time_pending} ({last_change_info})."
                        )
                        actions = _recommended_actions_for_category(category, status)
                        
                        notif = create_notification_if_new(
                            db, 
                            a.agreement_id, 
                            category, 
                            msg, 
                            "\n".join(actions),
                            last_status_change=last_status_change
                        )
                        
                        if notif:
                            logger.info(f"[Scheduler] ✅ Created pending notification: {a.dts_number}")
                            pending_count += 1
                        else:
                            logger.debug(f"[Scheduler] ⚠️ Notification exists: {a.dts_number}")
                    else:
                        logger.debug(f"[Scheduler] ⏳ Not at threshold: {a.dts_number}")
                        
                except Exception as e:
                    logger.error(f"[Scheduler] Error processing pending agreement {a.agreement_id}: {e}")
                    continue

            logger.info(f"[Scheduler] Created {pending_count} pending notifications")

            # ===== 3) RENEWAL NEEDED =====
            # Agreements expired more than RENEWAL_DAYS ago
            cutoff_expired = today - timedelta(days=RENEWAL_DAYS)
            renewal_query = (
                db.query(Agreements)
                  .options(
                      selectinload(Agreements.partner)
                  )
                  .filter(
                      and_(
                          Agreements.date_expiry != None,
                          Agreements.date_expiry <= cutoff_expired,
                          Agreements.agreement_status != "Withdrawn"
                      )
                  )
                  .all()
            )
            
            logger.info(f"[Scheduler] Found {len(renewal_query)} agreements needing renewal")
            
            for a in renewal_query:
                try:
                    partner = a.partner
                    category = "renewal_needed"
                    days_expired = (today - a.date_expiry).days if a.date_expiry else None
                    if days_expired == 0 or days_expired == (today - a.entry_date).days:
                        time_ago = _format_days_ago(days_expired)
                        msg = f"{a.document_type} of {partner.name} - '{a.dts_number}' expired on {a.date_expiry} ({time_ago})."
                        actions = _recommended_actions_for_category(category, None)
                        
                        notif = create_notification_if_new(
                            db, 
                            a.agreement_id, 
                            category, 
                            msg, 
                            "\n".join(actions)
                        )
                        
                        if notif:
                            logger.info(f"[Scheduler] ✅ Created renewal notification: {a.dts_number}")
                        else:
                            logger.debug(f"[Scheduler] ⚠️ Notification exists: {a.dts_number}")
                            
                except Exception as e:
                    logger.error(f"[Scheduler] Error processing renewal agreement {a.agreement_id}: {e}")
                    continue

            logger.info("[Scheduler] ✅ Notification job completed successfully")

        except Exception as exc:
            logger.error(f"[Scheduler] ❌ ERROR in agreement_notification_job: {exc}", exc_info=True)
            # Don't re-raise - let scheduler continue

def start_scheduler():
    """
    Starts the scheduler: Runs an initial scan, then schedules daily jobs.
    """
    logger.info("[Scheduler] Starting scheduler...")
    try:
        logger.info("[Scheduler] Running initial scan...")
        agreement_notification_job()
        logger.info("[Scheduler] ✅ Initial scan completed")
    except Exception as e:
        logger.error(f"[Scheduler] ⚠️ Initial scan failed: {e}", exc_info=True)
    
    scheduler.add_job(
        agreement_notification_job, 
        "cron", 
        hour=1, 
        minute=0, 
        id="daily_agreement_scan",
        name="Daily Agreement Notification Scan"
    )
    scheduler.start()
    logger.info("[Scheduler] Started successfully - Next run scheduled for 1:00 AM PH time")
    logger.info(f"[Scheduler] Current jobs: {len(scheduler.get_jobs())}")

def shutdown_scheduler():
    """
    Shuts down the scheduler gracefully.
    """
    try:
        logger.info("[Scheduler] Shutting down...")
        scheduler.shutdown(wait=False)
        logger.info("[Scheduler] ✅ Stopped successfully")
    except Exception as e:
        logger.warning(f"[Scheduler] Warning during shutdown: {e}")