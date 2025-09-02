from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.services.notif_service import get_notifications_for_user, mark_notification_read
from app.utils.utils import get_current_user
from app.models.users import Users

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("/", response_model=List[dict])
def list_notifications(db: Session = Depends(get_db), current_user: Users = Depends(get_current_user)):
    """
    Return notifications for the current user.
    Response is raw dicts; you can add pydantic schema later.
    """
    notifs = get_notifications_for_user(db, user_id=current_user.user_id)
    return [
        {
            "notification_id": n.notification_id,
            "agreement_id": n.agreement_id,
            "user_id": n.user_id,
            "category": n.category,
            "message": n.message,
            "recommended_action": n.recommended_action,
            "created_at": n.created_at,
            "is_read": n.is_read,
        }
        for n in notifs
    ]

@router.post("/{notification_id}/read", status_code=status.HTTP_200_OK)
def mark_read(notification_id: int, db: Session = Depends(get_db), current_user: Users = Depends(get_current_user)):
    """
    Mark a notification as read for current user.
    """
    notif = mark_notification_read(db, notification_id, user_id=current_user.user_id)
    if notif is None:
        raise HTTPException(status_code=404, detail="Notification not found or not accessible")
    return {"status": "ok"}