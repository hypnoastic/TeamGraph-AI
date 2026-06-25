from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from auth.demo_auth import build_user_payload, create_session, get_current_user
from models import SessionToken, User
from postgres import get_db
from services.activity_service import record_activity
from services.postgres_seed import hash_password, verify_password
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from config import settings

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: str
    password: str = Field(min_length=4)


class GoogleLoginRequest(BaseModel):
    credential: str


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

    user = User(
        id=f"usr_{uuid.uuid4().hex[:12]}",
        organization_id=None,
        email=request.email,
        name=request.name,
        role="member",
        password_hash=hash_password(request.password),
        is_demo=False,
    )
    db.add(user)
    db.flush()

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


@router.post("/google", response_model=LoginResponse)
def google_login(request: GoogleLoginRequest, db: Session = Depends(get_db)):
    if not settings.google_client_id:
        raise HTTPException(status_code=500, detail="Google Login is not configured.")

    try:
        idinfo = id_token.verify_oauth2_token(
            request.credential, google_requests.Request(), settings.google_client_id
        )
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    email = idinfo.get("email")
    name = idinfo.get("name", "Google User")

    if not email:
        raise HTTPException(status_code=400, detail="Google account has no email")

    user = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
    
    if user is None:
        user = User(
            id=f"usr_{uuid.uuid4().hex[:12]}",
            organization_id=None,
            email=email,
            name=name,
            role="member",
            password_hash=hash_password(uuid.uuid4().hex),
            is_demo=False,
        )
        db.add(user)
        db.flush()
        db.commit()
        db.refresh(user)

        record_activity(
            event_type="auth.signup_google",
            title="User signed up with Google",
            description=f"{user.email} created an account via Google.",
            actor=build_user_payload(user, db),
            metadata={"user_id": user.id},
            db=db,
        )

    token = create_session(db, user)
    user_payload = build_user_payload(user, db)
    
    record_activity(
        event_type="auth.login_google",
        title="User logged in with Google",
        description=f"{user.email} authenticated successfully via Google.",
        actor=user_payload,
        metadata={"user_id": user.id},
        db=db,
    )
    
    return {"token": token, "user": user_payload}


@router.get("/me")
def me(user: dict = Depends(get_current_user)):
    return user


@router.post("/logout")
def logout(
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sessions = db.execute(select(SessionToken).where(SessionToken.user_id == user["id"])).scalars().all()
    for session in sessions:
        db.delete(session)
    db.commit()
    return {"status": "logged_out"}
