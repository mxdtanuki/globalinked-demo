import hashlib
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import JWTError, jwt

from app.database import get_db
from app.models.users import Users  

SECRET_KEY = "globalinked"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 30  # 30 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str):
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except Exception:
            # Fallback for legacy SHA-256
            import hashlib
            sha256_hash = hashlib.sha256(plain_password.encode()).hexdigest()
            is_match = sha256_hash == hashed_password
            if is_match:
                print("⚠️ User authenticated with legacy SHA-256 hash. Consider updating password.")
            return is_match
        except Exception:
            return False

def get_user(db: Session, username: str):
    """Get user by username using your existing Users model"""
    user = db.query(Users).filter(Users.user_name == username).first()
    
    # Check if user is approved
    if user and hasattr(user, 'user_status'):
        if user.user_status != "approved":
            print(f"⚠️ User {username} login attempt but status is: {user.user_status}")
            return None  # Don't allow login if not approved
    
    return user

def authenticate_user(db: Session, username: str, password: str):
    """Authenticate user using your existing Users model"""
    user = get_user(db, username)
    if not user:
        print(f" User {username} not found or not approved")
        return False
        
    if not verify_password(password, user.user_pass):
        print(f" Invalid password for user {username}")
        return False
        
    print(f" User {username} authenticated successfully")
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        print("🔑 Token subject:", username) 
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = get_user(db, username=username)
    print("👤 Resolved user:", user)
    if user is None:
        raise credentials_exception
    return user