from __future__ import annotations

import re
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from auth.demo_auth import get_current_user
from database import neo4j_db
from models import Organization, Project, User, UserProjectAccess
from postgres import get_db
from services.activity_service import record_activity


router = APIRouter(tags=["organizations"])


class OrganizationSetupRequest(BaseModel):
    organization_name: str = Field(min_length=2, max_length=255)
    project_name: str = Field(min_length=2, max_length=255)


class OrganizationUpdateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=255)


def _domain_for_name(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") or "team"
    return f"{slug}-{uuid.uuid4().hex[:6]}.teamgraph"


@router.post("/onboarding/organization")
def create_organization(
    request: OrganizationSetupRequest,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.get("org_id"):
        raise HTTPException(status_code=409, detail="Your account already belongs to an organization.")

    account = db.get(User, user["id"])
    if account is None:
        raise HTTPException(status_code=404, detail="User not found.")

    organization = Organization(
        id=f"org_{uuid.uuid4().hex[:12]}",
        name=request.organization_name.strip(),
        domain=_domain_for_name(request.organization_name),
    )
    project = Project(
        id=f"proj_{uuid.uuid4().hex[:12]}",
        organization_id=organization.id,
        name=request.project_name.strip(),
        visibility="org",
    )
    db.add(organization)
    db.add(project)
    db.flush()

    account.organization_id = organization.id
    account.role = "admin"
    db.add(UserProjectAccess(user_id=account.id, project_id=project.id))
    db.commit()

    try:
        neo4j_db.execute_query(
            """
            MERGE (o:Organization {id: $org_id})
            SET o.name = $org_name, o.domain = $domain
            MERGE (u:User {id: $user_id})
            SET u.email = $email, u.name = $user_name, u.role = 'admin'
            MERGE (p:Project {id: $project_id})
            SET p.name = $project_name, p.visibility = 'org', p.organizationId = $org_id
            MERGE (o)-[:HAS_MEMBER]->(u)
            MERGE (o)-[:HAS_PROJECT]->(p)
            MERGE (u)-[:CAN_ACCESS]->(p)
            """,
            {
                "org_id": organization.id,
                "org_name": organization.name,
                "domain": organization.domain,
                "user_id": account.id,
                "email": account.email,
                "user_name": account.name,
                "project_id": project.id,
                "project_name": project.name,
            },
        )
    except Exception:
        # Postgres is authoritative for the control plane; graph mirroring is best effort.
        pass
    record_activity(
        event_type="organization.created",
        title="Organization created",
        description=organization.name,
        actor={"id": account.id, "email": account.email, "org_id": organization.id},
        metadata={"project_id": project.id},
        db=db,
    )
    return {
        "organization": {"id": organization.id, "name": organization.name, "domain": organization.domain},
        "project": {"id": project.id, "name": project.name},
    }


@router.get("/organizations/current")
def get_current_organization(
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not user.get("org_id"):
        raise HTTPException(status_code=404, detail="Organization not configured.")
    organization = db.get(Organization, user["org_id"])
    if organization is None:
        raise HTTPException(status_code=404, detail="Organization not found.")
    return {"id": organization.id, "name": organization.name, "domain": organization.domain}


@router.patch("/organizations/current")
def update_current_organization(
    request: OrganizationUpdateRequest,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user["role"] != "admin" or not user.get("org_id"):
        raise HTTPException(status_code=403, detail="Admin access required.")
    organization = db.get(Organization, user["org_id"])
    if organization is None:
        raise HTTPException(status_code=404, detail="Organization not found.")
    organization.name = request.name.strip()
    db.commit()
    return {"id": organization.id, "name": organization.name, "domain": organization.domain}
