from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.services.notif_service import get_notifications_for_user, mark_notification_read
from app.utils.utils import get_current_user
from app.models.users import Users
from app.models.notification import Notification

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("/", response_model=List[dict])
def list_notifications(db: Session = Depends(get_db), current_user: Users = Depends(get_current_user)):

    user_notifs = get_notifications_for_user(db, user_id=current_user.user_id)
    system_notifs = get_notifications_for_user(db, user_id=None)

    if current_user.user_role.lower() == "admin":
        all_notifs = list(user_notifs) + list(system_notifs)
    else:
        # Staff: show all system notifications except registration notifications
        all_notifs = [n for n in (list(user_notifs) + list(system_notifs)) if n.category != "user_registration"]

    seen_ids = set()
    unique_notifs = []
    for n in sorted(all_notifs, key=lambda x: x.created_at, reverse=True):
        if n.notification_id not in seen_ids:
            unique_notifs.append(n)
            seen_ids.add(n.notification_id)

    return [
        {
            "notification_id": n.notification_id,
            "agreement_id": n.agreement_id,
            "user_id": n.user_id,
            "category": n.category,
            "message": n.message,
            "recommended_action": n.recommended_action,
            "created_at": n.created_at.strftime("%Y-%m-%d %H:%M:%S"),  
            "is_read": n.is_read,
        }
        for n in unique_notifs
    ]

@router.post("/{notification_id}/read", status_code=status.HTTP_200_OK)
def mark_read(notification_id: int, db: Session = Depends(get_db), current_user: Users = Depends(get_current_user)):
    notif = mark_notification_read(db, notification_id, current_user=current_user)

    if notif is None:
        raise HTTPException(status_code=403, detail="Only admins can mark notifications as read")

    return {"status": "ok", "notification_id": notif.notification_id}

@router.delete("/{notification_id}")
def delete_notification(notification_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if not current_user or current_user.user_role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete notifications")
    notif = db.query(Notification).filter(Notification.notification_id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    db.delete(notif)
    db.commit()
    return {"detail": "Notification deleted"}
