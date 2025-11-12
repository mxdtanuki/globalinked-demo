from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from sqlalchemy.orm import Session
from app.models.notification import Notification

PH_TZ = ZoneInfo("Asia/Manila")

def get_ph_time():
    return datetime.now(PH_TZ)

def notification_exists(db: Session, agreement_id: int, category: str, user_id: int = None, message: str = None) -> bool:
    query = db.query(Notification).filter(
        Notification.agreement_id == agreement_id,
        Notification.category == category
    )
    if user_id is not None:
        query = query.filter(Notification.user_id == user_id)

    if category == "user_registration" and message:
        # Try to extract the username 
        try:
            username = message.split()[3]  # Should be the username
            query = query.filter(Notification.message.contains(username))
        except Exception:
            pass  

    return query.first() is not None

def create_notification_if_new(
    db: Session,
    agreement_id: int,
    category: str,
    message: str,
    recommended_action: str = None,
    user_id: int = None,
    last_status_change: datetime = None
):
    """
    Create a notification if:
    - none exists,
    - the last one is >24h old and status did not change,
    - the last one was before the latest status change.
    """
    query = db.query(Notification).filter(
        Notification.agreement_id == agreement_id,
        Notification.category == category
    )
    if user_id is not None:
        query = query.filter(Notification.user_id == user_id)

    existing = query.order_by(Notification.created_at.desc()).first()
    now = datetime.now(PH_TZ)

    if existing:
        # If status changed , allow new notification
        if last_status_change and existing.created_at < last_status_change:
            pass  
        # If status did not change, only allow if >24h old
        elif (now - existing.created_at) > timedelta(hours=24):
            pass  
        else:
            return None

    notif = Notification(
        agreement_id=agreement_id,
        user_id=user_id,
        category=category,
        message=message,
        recommended_action=recommended_action,
        created_at=now,
        is_read=False
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif

def get_notifications_for_user(db: Session, user_id: int = None):
    query = db.query(Notification)
    if user_id:
        query = query.filter(Notification.user_id == user_id)

    return query.order_by(Notification.created_at.desc()).all()

def mark_notification_read(db: Session, notification_id: int, current_user):
    notif = db.query(Notification).filter(Notification.notification_id == notification_id).first()
    if not notif:
        print(f"Mark read failed: Notification {notification_id} not found")
        return None

    if not current_user or current_user.user_role.lower() != "admin":
        print(f"Mark read denied: User {current_user.user_name if current_user else 'Unknown'} is not admin")
        return None

    notif.is_read = True
    db.commit()
    db.refresh(notif)

    print(f"Notification {notification_id} marked as read by admin {current_user.user_name}")
    return notif
