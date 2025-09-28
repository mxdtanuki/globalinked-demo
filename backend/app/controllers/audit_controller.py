from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.audit_logging import AuditLogging
from app.models.users import Users
from app.utils.utils import get_current_user
from app.utils.audit_utils import log_add_entry, log_update_entry, log_delete_entry, log_approve_request, log_reject_request

router = APIRouter(
    prefix="/audit",
    tags=["Audit Logging"]
)

@router.get("/logs")
async def get_audit_logs(
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
    skip: int = 0,
    limit: int = 50
):
    if current_user.user_role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    logs = (
        db.query(AuditLogging, Users.user_name)
        .join(Users, AuditLogging.user_id == Users.user_id)
        .order_by(AuditLogging.audit_timestamp.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return [
        {
            "audit_id": log.audit_id,
            "user_name": username, 
            "audit_timestamp": log.audit_timestamp,
            "audit_description": log.audit_description,
        }
        for log, username in logs
    ]