from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.users import Users
from app.schemas.registration_schemas import UserCreate, UserResponse, UserUpdate
from datetime import datetime
from app.utils.utils import get_current_user, hash_password
from app.services.email_service import send_email

router = APIRouter(
    prefix="/registration",
    tags=["Registration"]
)

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
    
    if hasattr(user, 'user_email') and user.user_email:
        existing_email = db.query(Users).filter(Users.user_email == user.user_email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

    new_user = Users(
        user_name=user.user_name,
        user_pass=hash_password(user.user_pass), # Hash the password before storing
        user_profile_img=user.user_profile_img,
        user_position=user.user_position,
        user_status="pending"  # default until admin approval
    )

    if hasattr(user, 'user_email') and user.user_email:
         new_user.user_email = user.user_email

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Send notification to admins (if email functionality is available)
    try:
        admin_users = db.query(Users).filter(Users.user_position.ilike("admin")).all()
        for admin in admin_users:
            # Only send email if admin has email and new user has email
            if hasattr(admin, 'user_email') and admin.user_email and hasattr(new_user, 'user_email'):
                await send_email(
                    recipient_email=admin.user_email,
                    subject="New User Registration Request",
                    custom_body=f"""
                    <h2>👤 New User Registration Request</h2>
                    <p>A new user has requested access to the Globalinked Partnerships System:</p>
                    <ul>
                        <li><strong>Name:</strong> {new_user.user_name}</li>
                        <li><strong>Email:</strong> {getattr(new_user, 'user_email', 'N/A')}</li>
                        <li><strong>Position:</strong> {new_user.user_position}</li>
                        <li><strong>Registration Date:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</li>
                    </ul>
                    <p>Please review and approve this request in the User Management dashboard.</p>
                    """
                )
                print(f"✅ Admin notification sent to {admin.user_email}")
    except Exception as e:
        print(f"❌ Failed to send admin notification: {e}")
        # Don't fail registration if email fails # checking only

    return new_user


# R
@router.get("/", response_model=List[UserResponse])
async def list_users(db: Session = Depends(get_db), current_user: Users = Depends(get_current_user)):
    # only admins can see the registration list
    if current_user.user_position.lower() != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    users = db.query(Users).all()
    return users


# U
@router.put("/{user_id}", response_model=UserResponse)
async def update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db), current_user: Users = Depends(get_current_user)):
    user = db.query(Users).filter(Users.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Allow self-update OR admin update
    if current_user.user_id != user_id and current_user.user_position.lower() != "admin":
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
    if current_user.user_id != user_id and current_user.user_position.lower() != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    db.delete(user)
    db.commit()
    return {"status": "deleted"}

# Get pending users (only) 
@router.get("/pending", response_model=List[UserResponse])
async def get_pending_users(
    db: Session = Depends(get_db), 
    current_user: Users = Depends(get_current_user)
):
    if current_user.user_position.lower() != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    return db.query(Users).filter(Users.user_status == "pending").all()


# Approval endpoint: Use this instead the generic update method, easier for the front end coz no logic needed there na
@router.put("/{user_id}/approve", response_model=UserResponse)
async def approve_user(user_id: int, db: Session = Depends(get_db), current_user: Users = Depends(get_current_user)):
    # only admins can approve
    if current_user.user_position.lower() != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    user = db.query(Users).filter(Users.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.user_status = "approved"
    db.commit()
    db.refresh(user)

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
                    <li>Approved on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</li>
                </ul>
                
                <p>Welcome to the Globalinked Partnerships System!</p>
                <p><em>- The Globalinked Partnerships Team</em></p>
                """
            )
            print(f"✅ Approval email sent to {user.user_email}")
    except Exception as e:
        print(f"❌ Failed to send approval email: {e}")
        # Don't fail the approval process if email fails # checking only

    return user

#Reject
@router.put("/{user_id}/reject", response_model=UserResponse)
async def reject_user(user_id: int, db: Session = Depends(get_db), current_user: Users = Depends(get_current_user)):
    if current_user.user_position.lower() != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    user = db.query(Users).filter(Users.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.user_status = "rejected"
    db.commit()
    db.refresh(user)
    
    # Send rejection email (if user has email)
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
                    <li>Approved on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</li>
                </ul>
                
                <p>Welcome to the Globalinked Partnerships System!</p>
                <p><em>- The Globalinked Partnerships Team</em></p>
                """
            )
            print(f"✅ Approval email sent to {user.user_email}")
    except Exception as e:
        print(f"❌ Failed to send approval email: {e}")
        # Don't fail the approval process if email fails # checking only
    
    return user

    # Sample fe implementation:
    '''
    import React, { useState, useEffect } from "react";
    import { approveUser, getPendingUsers } from "../services/registrationService";

    export default function UserApprovalList() {
    const [pendingUsers, setPendingUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchPendingUsers = async () => {
        try {
            setLoading(true);
            const users = await getPendingUsers();
            setPendingUsers(users);
        } catch (err) {
            console.error("Error fetching pending users:", err);
            setError("Failed to load pending users.");
        } finally {
            setLoading(false);
        }
        };

        fetchPendingUsers();
    }, []);

    const handleApprove = async (userId) => {
        try {
        await approveUser(userId);
        setPendingUsers(pendingUsers.filter((user) => user.user_id !== userId));
        } catch (err) {
        console.error("Error approving user:", err);
        setError("Failed to approve user.");
        }
    };

    if (loading) return <p>Loading pending users...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div>
        <h2>Pending User Approvals</h2>
        {pendingUsers.length === 0 ? (
            <p>No pending users</p>
        ) : (
            <ul>
            {pendingUsers.map((user) => (
                <li key={user.user_id}>
                {user.user_name} ({user.user_position})
                <button onClick={() => handleApprove(user.user_id)}>
                    Approve
                </button>
                </li>
            ))}
            </ul>
        )}
        </div>
    );
    }
    '''
    
