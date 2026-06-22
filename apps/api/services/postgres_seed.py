from __future__ import annotations

import uuid
import json

from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.orm import Session

from config import settings
from models import (
    ApprovalRecord,
    ConnectorAccount,
    ContextRecord,
    Organization,
    Project,
    RawContextRecord,
    User,
    UserProjectAccess,
)


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

    demo_contexts = [
        (
            "raw_demo_architecture",
            "ctx_demo_architecture",
            "Architecture decision",
            "TeamGraph uses FastAPI as the permission boundary, Postgres for the control plane, and Graphiti with Neo4j for temporal organization memory.",
            "Architecture: TeamGraph control plane and Graphiti knowledge plane.",
            "decision",
        ),
        (
            "raw_demo_launch",
            "ctx_demo_launch",
            "Hackathon launch checklist",
            "Before submission, verify Brain Chat citations, upload a safe note, approve a risky note as admin, inspect the graph, and connect the MCP CLI with a scoped API key.",
            "Hackathon submission verification checklist.",
            "handoff",
        ),
        (
            "raw_demo_security",
            "ctx_demo_security",
            "Security policy",
            "Members cannot approve risky context, private memory is visible only to its owner, API keys are stored as hashes, and external agents never access Graphiti directly.",
            "Core TeamGraph access and ingestion safety rules.",
            "policy",
        ),
    ]
    for raw_id, context_id, title, content, summary, context_type in demo_contexts:
        if db.get(RawContextRecord, raw_id) is None:
            db.add(
                RawContextRecord(
                    id=raw_id,
                    organization_id=org.id,
                    project_id="proj_1",
                    user_id="usr_demo",
                    title=title,
                    content=content,
                    context_type=context_type,
                    source_type="seed",
                    upload_channel="seed",
                    visibility="project",
                    tags_json=json.dumps(["demo", "hackathon"]),
                    approval_status="safe",
                )
            )
            db.flush()
        if db.get(ContextRecord, context_id) is None:
            db.add(
                ContextRecord(
                    id=context_id,
                    raw_context_id=raw_id,
                    organization_id=org.id,
                    project_id="proj_1",
                    user_id="usr_demo",
                    title=title,
                    summary=summary,
                    content=content,
                    context_type=context_type,
                    source_type="seed",
                    upload_channel="seed",
                    visibility="project",
                    approval_status="safe",
                    quality_score=0.95,
                    tags_json=json.dumps(["demo", "hackathon"]),
                    risk_tags_json="[]",
                    graphiti_group_id=f"org:{org.id}:project:proj_1",
                    brain_mode="fallback",
                )
            )

    if db.get(RawContextRecord, "raw_demo_review") is None:
        db.add(
            RawContextRecord(
                id="raw_demo_review",
                organization_id=org.id,
                project_id="proj_1",
                user_id="usr_member",
                title="Deployment access note",
                content="A deployment note references a credential-shaped token and requires administrator review before ingestion.",
                context_type="note",
                source_type="seed",
                upload_channel="seed",
                visibility="project",
                tags_json='["demo"]',
                approval_status="pending",
            )
        )
        db.flush()
    if db.get(ApprovalRecord, "rev_demo_review") is None:
        db.add(
            ApprovalRecord(
                id="rev_demo_review",
                raw_context_id="raw_demo_review",
                organization_id=org.id,
                status="pending",
                reason="Credential-shaped content requires administrator review.",
                risk_tags_json='["possible_secret"]',
                quality_score=0.72,
                proposed_title="Deployment access note",
                proposed_summary="Deployment access note pending safety review.",
                proposed_context_type="note",
                proposed_visibility="project",
            )
        )

    db.commit()
