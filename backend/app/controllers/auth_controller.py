import os
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
import secrets


from app.utils.utils import verify_password, create_access_token, authenticate_user, get_current_user, hash_password, ACCESS_TOKEN_EXPIRE_MINUTES
from app.database import get_db
from app.models.users import Users 
from app.schemas.auth_schemas import Token
from app.services.email_service import send_reset_email

# Create a router for authentication-related endpoints
router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

PH_TZ = ZoneInfo("Asia/Manila")


@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    # Login endpoint
    user = authenticate_user(db, form_data.username, form_data.password)
    
    if not user:
        # If authentication fails, return an error
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Set expiration time (30 minutes)
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    # Create JWT access token for the user
    access_token = create_access_token(
        data={"sub": user.user_name}, 
        expires_delta=access_token_expires
    )
    
    # Return the access token and token type
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "user_id": user.user_id,
            "user_email": user.user_email,
            "user_role": user.user_role,
        }
    }

@router.post("/forgot-password")
async def forgot_password(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    email = data.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    user = db.query(Users).filter(Users.user_email == email).first()
    if not user:
        # Don't reveal if user exists
        return {"msg": "If an account exists with that email, you will receive reset instructions shortly."}
    # Generate token and expiry
    token = secrets.token_urlsafe(32)
    expiry = datetime.now() + timedelta(hours=1)
    user.forgot_pass_token = token
    user.reset_token_expiry = expiry
    db.commit()
    # Send email with reset link
    reset_link = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/resetPass?token={token}"
    send_reset_email(user.user_email, reset_link)
    return {"msg": "If an account exists with that email, you will receive reset instructions shortly."}

@router.post("/reset-password")
async def reset_password(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    token = data.get("token")
    new_password = data.get("new_password")
    if not token or not new_password:
        raise HTTPException(status_code=400, detail="Token and new password are required")
    user = db.query(Users).filter(Users.forgot_pass_token == token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    now = datetime.now()
    expiry = user.reset_token_expiry
    if expiry and expiry.tzinfo is not None:
        expiry = expiry.replace(tzinfo=None)
    if not expiry or expiry < now:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    user.user_pass = hash_password(new_password)
    db.add(user)
    user.forgot_pass_token = None
    user.reset_token_expiry = None
    db.commit()
    return {"msg": "Password reset successful"}