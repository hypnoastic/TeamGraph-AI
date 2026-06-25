from __future__ import annotations

import datetime
import hashlib
import json
import secrets
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from auth.demo_auth import get_current_user, require_admin
from config import settings
from models import Invitation, Project, User, UserProjectAccess
from postgres import get_db
from services.team_service import list_team_members


router = APIRouter(prefix="/team", tags=["team"])


class InvitationRequest(BaseModel):
    email: str
    role: str = Field(default="member", pattern="^(admin|member)$")
    project_ids: list[str] = Field(default_factory=list)


class InvitationAcceptRequest(BaseModel):
    token: str


class MemberUpdateRequest(BaseModel):
    role: str = Field(pattern="^(admin|member)$")
    project_ids: list[str] = Field(default_factory=list)


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


@router.get("/")
def get_team(user: dict = Depends(require_admin)):
    return list_team_members(user["org_id"])


@router.post("/invitations")
def create_invitation(
    request: InvitationRequest,
    user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    projects = db.execute(
        select(Project).where(
            Project.organization_id == user["org_id"],
            Project.id.in_(request.project_ids),
        )
    ).scalars().all()
    if len(projects) != len(set(request.project_ids)):
        raise HTTPException(status_code=400, detail="One or more projects are invalid.")

    raw_token = secrets.token_urlsafe(32)
    invitation = Invitation(
        id=f"inv_{uuid.uuid4().hex[:12]}",
        organization_id=user["org_id"],
        email=request.email.lower().strip(),
        role=request.role,
        project_ids_json=json.dumps(request.project_ids),
        token_hash=_hash_token(raw_token),
        expires_at=datetime.datetime.utcnow() + datetime.timedelta(hours=settings.invitation_ttl_hours),
        created_by_user_id=user["id"],
    )
    db.add(invitation)
    db.commit()
    
    invite_url = f"{settings.public_base_url}/login?invite={raw_token}"
    
    from services.email import email_service
    email_service.send_invitation_email(
        to_email=invitation.email,
        invite_url=invite_url,
        role=invitation.role
    )

    return {
        "id": invitation.id,
        "email": invitation.email,
        "status": invitation.status,
        "invite_url": invite_url,
        "expires_at": invitation.expires_at.isoformat(),
    }


@router.get("/invitations")
def list_invitations(
    user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    invitations = db.execute(
        select(Invitation)
        .where(Invitation.organization_id == user["org_id"])
        .order_by(Invitation.created_at.desc())
    ).scalars().all()
    return [
        {
            "id": invitation.id,
            "email": invitation.email,
            "role": invitation.role,
            "status": invitation.status,
            "project_ids": json.loads(invitation.project_ids_json),
            "expires_at": invitation.expires_at.isoformat(),
        }
        for invitation in invitations
    ]


@router.post("/invitations/accept")
def accept_invitation(
    request: InvitationAcceptRequest,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    invitation = db.execute(
        select(Invitation).where(
            Invitation.token_hash == _hash_token(request.token),
            Invitation.status == "pending",
            Invitation.expires_at > datetime.datetime.utcnow(),
        )
    ).scalar_one_or_none()
    if invitation is None:
        raise HTTPException(status_code=400, detail="Invitation is invalid or expired.")
    if invitation.email != user["email"].lower():
        raise HTTPException(status_code=403, detail="This invitation belongs to another email address.")

    account = db.get(User, user["id"])
    if account is None:
        raise HTTPException(status_code=404, detail="User not found.")
    if account.organization_id and account.organization_id != invitation.organization_id:
        raise HTTPException(status_code=409, detail="Your account already belongs to another organization.")

    account.organization_id = invitation.organization_id
    account.role = invitation.role
    db.execute(delete(UserProjectAccess).where(UserProjectAccess.user_id == account.id))
    for project_id in json.loads(invitation.project_ids_json):
        db.add(UserProjectAccess(user_id=account.id, project_id=project_id))
    invitation.status = "accepted"
    invitation.accepted_by_user_id = account.id
    invitation.accepted_at = datetime.datetime.utcnow()
    db.commit()
    return {"status": "accepted"}


@router.patch("/{user_id}")
def update_member(
    user_id: str,
    request: MemberUpdateRequest,
    user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    member = db.get(User, user_id)
    if member is None or member.organization_id != user["org_id"]:
        raise HTTPException(status_code=404, detail="Member not found.")
    projects = db.execute(
        select(Project).where(
            Project.organization_id == user["org_id"],
            Project.id.in_(request.project_ids),
        )
    ).scalars().all()
    if len(projects) != len(set(request.project_ids)):
        raise HTTPException(status_code=400, detail="One or more projects are invalid.")
    member.role = request.role
    db.execute(delete(UserProjectAccess).where(UserProjectAccess.user_id == member.id))
    for project in projects:
        db.add(UserProjectAccess(user_id=member.id, project_id=project.id))
    db.commit()
    return {"status": "updated"}


@router.delete("/{user_id}")
def remove_member(
    user_id: str,
    user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if user_id == user["id"]:
        raise HTTPException(status_code=400, detail="You cannot remove your own account.")
    member = db.get(User, user_id)
    if member is None or member.organization_id != user["org_id"]:
        raise HTTPException(status_code=404, detail="Member not found.")
    member.organization_id = None
    member.role = "member"
    db.execute(delete(UserProjectAccess).where(UserProjectAccess.user_id == member.id))
    db.commit()
    return {"status": "removed"}
