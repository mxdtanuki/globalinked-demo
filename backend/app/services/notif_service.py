# Business logic for notifications (create, query, mark read)
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.notification import Notification

def notification_exists(db: Session, agreement_id: int, category: str) -> bool:
    """
    Return True if a notification for agreement/category already exists.
    Prevents duplicates.
    """
    return (
        db.query(Notification)
        .filter(Notification.agreement_id == agreement_id, Notification.category == category)
        .first()
        is not None
    )

def create_notification_if_new(db: Session, agreement_id: int, category: str, message: str, recommended_action: str = None, user_id: int = None):
    """
    Create notification only if a same-category notification for the same agreement does not exist.
    """
    if notification_exists(db, agreement_id, category):
        return None
    notif = Notification(
        agreement_id=agreement_id,
        user_id=user_id,
        category=category,
        message=message,
        recommended_action=recommended_action,
        created_at=datetime.utcnow(),
        is_read=False
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif

def get_notifications_for_user(db: Session, user_id: int = None, unread_only: bool = False, limit: int = 100):
    """
    If user_id is None, return system notifications (or return all in admin use).
    For now, return notifications where user_id is None OR equals user_id.
    """
    q = db.query(Notification).order_by(Notification.created_at.desc())
    if user_id:
        q = q.filter((Notification.user_id == None) | (Notification.user_id == user_id))
    if unread_only:
        q = q.filter(Notification.is_read == False)
    return q.limit(limit).all()

def mark_notification_read(db: Session, notification_id: int, user_id: int = None):
    """
    Mark notification as read (optionally ensure user owns it).
    """
    notif = db.query(Notification).filter(Notification.notification_id == notification_id).first()
    if not notif:
        return None
    # Optional: enforce user_id matches if provided
    if user_id and notif.user_id and notif.user_id != user_id:
        return None
    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif