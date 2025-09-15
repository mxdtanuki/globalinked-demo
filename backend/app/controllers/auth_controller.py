from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from app.utils.utils import verify_password, create_access_token, authenticate_user, get_current_user, hash_password, ACCESS_TOKEN_EXPIRE_MINUTES
from app.database import get_db
from app.models.users import Users 
from app.schemas.auth_schemas import Token

# Create a router for authentication-related endpoints
router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):

    # Login endpoint.
    # Accepts username and password, verifies them, and returns an access token if valid.
    # Check if the user exists and the password is correct
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
        "token_type": "bearer"
    }
