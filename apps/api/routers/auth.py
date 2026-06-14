from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from auth.demo_auth import build_user_payload, create_session, get_current_user
from config import settings
from models import Organization, User, UserProjectAccess
from postgres import get_db
from services.activity_service import record_activity
from services.postgres_seed import hash_password, verify_password


router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: str
    password: str = Field(min_length=4)


class SignupRequest(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    email: str
    password: str = Field(min_length=8, max_length=255)


class LoginResponse(BaseModel):
    token: str
    user: dict


@router.post("/signup", response_model=LoginResponse)
def signup(request: SignupRequest, db: Session = Depends(get_db)):
    existing_user = db.execute(select(User).where(User.email == request.email)).scalar_one_or_none()
    if existing_user is not None:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    organization = db.get(Organization, settings.teamgraph_org_id)
    if organization is None:
        raise HTTPException(status_code=500, detail="Default organization is not initialized.")

    user = User(
        id=f"usr_{uuid.uuid4().hex[:12]}",
        organization_id=organization.id,
        email=request.email,
        name=request.name,
        role="member",
        password_hash=hash_password(request.password),
        is_demo=False,
    )
    db.add(user)
    db.flush()

    default_project_access = db.execute(
        select(UserProjectAccess).where(UserProjectAccess.user_id == "usr_member")
    ).scalars().all()
    for access in default_project_access:
        db.add(UserProjectAccess(user_id=user.id, project_id=access.project_id))

    db.commit()
    db.refresh(user)

    token = create_session(db, user)
    user_payload = build_user_payload(user, db)
    record_activity(
        event_type="auth.signup",
        title="User signed up",
        description=f"{user.email} created an account.",
        actor=user_payload,
        metadata={"user_id": user.id},
        db=db,
    )
    return {"token": token, "user": user_payload}


@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.execute(select(User).where(User.email == request.email)).scalar_one_or_none()
    if user is None or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_session(db, user)
    user_payload = build_user_payload(user, db)
    record_activity(
        event_type="auth.login",
        title="User logged in",
        description=f"{user.email} authenticated successfully.",
        actor=user_payload,
        metadata={"user_id": user.id},
        db=db,
    )
    return {"token": token, "user": user_payload}


@router.get("/me")
def me(user: dict = Depends(get_current_user)):
    return user
