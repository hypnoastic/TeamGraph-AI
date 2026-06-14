from __future__ import annotations

import uuid

from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.orm import Session

from config import settings
from models import ConnectorAccount, Organization, Project, User, UserProjectAccess


password_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def hash_password(password: str) -> str:
    return password_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return password_context.verify(password, password_hash)


def seed_postgres(db: Session) -> None:
    org = db.get(Organization, settings.teamgraph_org_id)
    if org is None:
        org = Organization(
            id=settings.teamgraph_org_id,
            name=settings.teamgraph_org_name,
            domain=settings.teamgraph_default_domain,
        )
        db.add(org)
        db.flush()

    default_projects = [
        ("proj_1", "Core Platform"),
        ("proj_2", "Agent Workflows"),
    ]
    for project_id, project_name in default_projects:
        project = db.get(Project, project_id)
        if project is None:
            db.add(
                Project(
                    id=project_id,
                    organization_id=org.id,
                    name=project_name,
                    visibility="org",
                )
            )
    db.flush()

    default_users = [
        ("usr_admin", "admin@teamgraph.local", "Admin User", "admin", ["proj_1", "proj_2"], True),
        ("usr_member", "member@teamgraph.local", "Member User", "member", ["proj_1"], True),
        ("usr_demo", "demo@teamgraph.local", "Demo Operator", "admin", ["proj_1", "proj_2"], True),
    ]
    for user_id, email, name, role, projects, is_demo in default_users:
        user = db.get(User, user_id)
        if user is None:
            user = User(
                id=user_id,
                organization_id=org.id,
                email=email,
                name=name,
                role=role,
                password_hash=hash_password("password"),
                is_demo=is_demo,
            )
            db.add(user)
            db.flush()
        elif is_demo and not verify_password("password", user.password_hash):
            user.password_hash = hash_password("password")

        existing_project_ids = set(
            db.execute(select(UserProjectAccess.project_id).where(UserProjectAccess.user_id == user_id)).scalars().all()
        )
        for project_id in projects:
            if project_id not in existing_project_ids:
                db.add(UserProjectAccess(user_id=user_id, project_id=project_id))

    for provider, name in [("github", "GitHub"), ("slack", "Slack"), ("google-drive", "Google Drive")]:
        connector = db.execute(
            select(ConnectorAccount).where(
                ConnectorAccount.organization_id == org.id,
                ConnectorAccount.provider == provider,
            )
        ).scalar_one_or_none()
        if connector is None:
            db.add(
                ConnectorAccount(
                    id=f"conn_{uuid.uuid4().hex[:12]}",
                    organization_id=org.id,
                    provider=provider,
                    status="disconnected",
                    mode="oauth_ready",
                    display_name=name,
                    metadata_json="{}",
                )
            )

    db.commit()
