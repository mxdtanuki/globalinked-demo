from datetime import datetime
from zoneinfo import ZoneInfo
from app.models.audit_logging import AuditLogging
from app.models.users import Users


PH_TZ = ZoneInfo("Asia/Manila")

def _log_action(db, user: Users, description: str):
    audit = AuditLogging(
        user_id=user.user_id,
        audit_timestamp=datetime.now(PH_TZ),
        audit_description=description
    )
    db.add(audit)
    db.commit()
    print(f"[AUDIT] {description}")

    # Document Management Logs

def log_add_entry(db, user: Users, document_type: str, dts_number: str):
    _log_action(
        db,
        user,
        f" {user.user_name} added a new {document_type} entry {dts_number}"
    )

def log_update_entry(db, user: Users, document_type: str, dts_number: str):
    _log_action(
        db,
        user,
        f" {user.user_name} updated {document_type} entry {dts_number}"
    )

def log_delete_entry(db, user: Users, document_type: str, dts_number: str):
    _log_action(
        db,
        user,
        f" {user.user_name} deleted {document_type} entry {dts_number}"
    )

   # User Management Logs 

def log_approve_request(db, user: Users, new_user: Users):
    _log_action(
        db,
        user,
        f" {user.user_name} approved request for {new_user.user_name} "
    )

def log_reject_request(db, user: Users, new_user: Users):
    _log_action(
        db,
        user,
        f" {user.user_name} rejected request for {new_user.user_name} ({new_user.user_position})"
    )
    
def log_delete_request(db, user: Users, new_user: Users):
    _log_action(
        db,
        user,
        f" {user.user_name} deleted a user {new_user.user_name} ({new_user.user_position})"
    )

    # File Upload Log

def log_file_upload(db, user: Users, dts_number: str, version_number: int):
    _log_action(
        db,
        user,
        f"{user.user_name} uploaded file version {version_number} for agreement {dts_number}"
    )



