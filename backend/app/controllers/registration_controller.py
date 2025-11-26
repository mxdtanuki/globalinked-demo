from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.users import Users
from app.schemas.registration_schemas import UserCreate, UserResponse, UserUpdate
from datetime import datetime
from app.models.audit_logging import AuditLogging
from app.utils.utils import get_current_user, hash_password
from app.services.email_service import send_email
from app.services.notif_service import create_notification_if_new
from app.utils.audit_utils import log_approve_request, log_reject_request, log_delete_request

router = APIRouter(
    prefix="/registration",
    tags=["Registration"]
)

def get_role_from_position(position: str) -> str:
    """Determine access role based on job position"""
    admin_positions = [
        "Director",
        "Partnership and Linkages Section"
    ]
    return "admin" if position in admin_positions else "staff"

# Cr
@router.post("/", response_model=UserResponse)
async def register_user(user: UserCreate, db: Session = Depends(get_db)):

    # Check if username already exists
    existing = db.query(Users).filter(Users.user_name == user.user_name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )
    
    user_role = get_role_from_position(user.user_position)

    if hasattr(user, 'user_email') and user.user_email:
        existing_email = db.query(Users).filter(Users.user_email == user.user_email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
    # Create the user
    new_user = Users(
        user_name=user.user_name,
        user_pass=hash_password(user.user_pass),
        user_position=user.user_position,
        user_role=user_role,
        user_status="pending"
    )
    if hasattr(user, 'user_email') and user.user_email:
        new_user.user_email = user.user_email

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Send notification to system (one for all admins, not per-admin)
    try:
        result = create_notification_if_new(
            db=db,
            agreement_id=None,
            category="user_registration",
            message=f"New user registration: {new_user.user_name} ({new_user.user_position}) is requesting access to the system.",
            recommended_action=f"Review and approve/reject {new_user.user_name}'s registration request in User Management.",
            user_id=None  # System-wide notification
        )
        if result:
            print(f"System notification created for user registration (ID: {result.notification_id})")
        else:
            print("System notification already exists or failed")
    except Exception as e:
        print(f"Failed to create system notification: {e}")
        import traceback
        print(f"Full error: {traceback.format_exc()}")
        # Don't fail registration if notification creation fails

    return new_user


# R
@router.get("/", response_model=List[UserResponse])
async def list_users(db: Session = Depends(get_db), current_user: Users = Depends(get_current_user)):
    # only admins can see the registration list
    if current_user.user_role.lower() != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    users = db.query(Users).all()
    return users

# R - Get currently logged-in user
@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    """
    Return the currently authenticated user's profile info.
    """
    user = db.query(Users).filter(Users.user_id == current_user.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# U
@router.put("/{user_id}", response_model=UserResponse)
async def update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db), current_user: Users = Depends(get_current_user)):
    user = db.query(Users).filter(Users.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Allow self-update OR admin update
    if current_user.user_id != user_id and current_user.user_role.lower() != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    for field, value in user_update.dict(exclude_unset=True).items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user

# D
@router.delete("/{user_id}", response_model=dict)
async def delete_user(user_id: int, db: Session = Depends(get_db), current_user: Users = Depends(get_current_user)):
    user = db.query(Users).filter(Users.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Allow self-delete OR admin delete
    if current_user.user_id != user_id and current_user.user_role.lower() != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    audit_logs = db.query(AuditLogging).filter(AuditLogging.user_id == user_id).all()
    for log in audit_logs:
        log.user_id = None 

    # Now delete the user
    db.delete(user)
    db.commit()
    log_delete_request(db, current_user, user) 
    return {"status": "deleted"}
    

# Get pending users (only) 
@router.get("/pending", response_model=List[UserResponse])
async def get_pending_users(
    db: Session = Depends(get_db), 
    current_user: Users = Depends(get_current_user)
):
    if current_user.user_role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    return db.query(Users).filter(Users.user_status == "pending").all()


# Approval endpoint: Use this instead the generic update method, easier for the front end coz no logic needed there na
@router.put("/{user_id}/approve", response_model=UserResponse)
async def approve_user(user_id: int, db: Session = Depends(get_db), current_user: Users = Depends(get_current_user)):
    # only admins can approve
    if current_user.user_role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    user = db.query(Users).filter(Users.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.user_status = "approved"
    db.commit()
    db.refresh(user)
    log_approve_request(db, current_user, user)

    try:
        if hasattr(user, 'user_email') and user.user_email:
            send_email(
                to=user.user_email,
                subject="🎉 Account Approved - You Can Now Login",
                body=f"""
                <h2>🎉 Your Account Has Been Approved!</h2>
                <p>Dear {user.user_name},</p>
                <p>Great news! Your registration for the Global Partnerships System has been approved by our administrator.</p>
                
                <h3>🔑 You can now login to the system:</h3>
                <ul>
                    <li><strong>Username:</strong> {user.user_name}</li>
                    <li><strong>Use the password you created during registration</strong></li>
                </ul>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="http://localhost:3000/login" 
                       style="background-color: #2E86C1; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 5px; font-weight: bold;">
                        🔑 Login Now
                    </a>
                </div>
                
                <p><strong>Account Details:</strong></p>
                <ul>
                    <li>Position: {user.user_position}</li>
                    <li>Role: {user.user_role}</li>
                    <li>Approved on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</li>
                </ul>
                
                <p>Welcome to the Globalinked Partnerships System!</p>
                <p><em>- The Globalinked Partnerships Team</em></p>
                """
            )
            print(f"✅ Approval email sent to {user.user_email}")
    except Exception as e:
        print(f"Failed to send approval email: {e}")

    return user

#Reject
@router.put("/{user_id}/reject", response_model=UserResponse)
async def reject_user(user_id: int, db: Session = Depends(get_db), current_user: Users = Depends(get_current_user)):
    if current_user.user_role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    user = db.query(Users).filter(Users.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.user_status = "rejected"
    db.commit()
    db.refresh(user)
    log_reject_request(db, current_user, user)
    
    # Send rejection email
    try:
        if hasattr(user, 'user_email') and user.user_email:
            send_email(
                to=user.user_email,
                subject="Registration Request Rejected",
                body=f"""
                <h2>Registration Request Rejected</h2>
                <p>Dear {user.user_name},</p>
                <p>We regret to inform you that your registration request for the Global Partnerships System has been rejected by our administrator.</p>
                
                <p><strong>Account Details:</strong></p>
                <ul>
                    <li>Username: {user.user_name}</li>
                    <li>Position: {user.user_position}</li>
                    <li>Role: {user.user_role}</li>
                    <li>Rejected on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</li>
                </ul>
                
                <p>If you believe this was done in error or have questions about the rejection, please contact the administrator.</p>
                <p><em>- The Globalinked Partnerships Team</em></p>
                """
            )
            print(f"✅ Rejection email sent to {user.user_email}")
    except Exception as e:
        print(f"Failed to send rejection email: {e}")
        
    
    return user

    
