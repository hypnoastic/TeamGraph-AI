from __future__ import annotations

import datetime
import hashlib
import secrets
import uuid
from typing import Optional

from fastapi import Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from config import settings
from models import Organization, Project, SessionToken, User, UserProjectAccess
from postgres import get_db


def hash_session_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode()).hexdigest()


def create_session(db: Session, user: User) -> str:
    raw_token = f"tg_session_{secrets.token_urlsafe(32)}"
    session = SessionToken(
        id=f"sess_{uuid.uuid4().hex[:12]}",
        user_id=user.id,
        token_hash=hash_session_token(raw_token),
        expires_at=datetime.datetime.utcnow() + datetime.timedelta(hours=settings.session_ttl_hours),
        last_used_at=datetime.datetime.utcnow(),
    )
    db.add(session)
    db.commit()
    return raw_token


def build_user_payload(user: User, db: Session) -> dict:
    project_rows = db.execute(
        select(Project.id, Project.name)
        .join(UserProjectAccess, UserProjectAccess.project_id == Project.id)
        .where(UserProjectAccess.user_id == user.id)
        .order_by(Project.name.asc())
    ).all()
    organization = db.get(Organization, user.organization_id) if user.organization_id else None
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "org_id": user.organization_id,
        "org_name": organization.name if organization else None,
        "project_ids": [row.id for row in project_rows],
        "project_names": [row.name for row in project_rows],
        "is_demo": user.is_demo,
        "onboarding_required": user.organization_id is None,
    }


def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")

    token = authorization.split(" ")[1]
    token_hash = hash_session_token(token)
    session = db.execute(
        select(SessionToken).where(
            SessionToken.token_hash == token_hash,
            SessionToken.expires_at > datetime.datetime.utcnow(),
        )
    ).scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.get(User, session.user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid token")

    session.last_used_at = datetime.datetime.utcnow()
    db.commit()
    return build_user_payload(user, db)


def require_admin(user: dict = Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user
