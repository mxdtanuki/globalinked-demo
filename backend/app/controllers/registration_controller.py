from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.users import Users
from app.schemas.registration_schemas import UserCreate, UserResponse, UserUpdate
from datetime import datetime
from app.utils.utils import get_current_user

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

    new_user = Users(
        user_name=user.user_name,
        user_pass=user.user_pass,  # TODO: hash password!
        user_profile_img=user.user_profile_img,
        user_position=user.user_position,
        user_status="pending"  # default until admin approval
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
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
    
