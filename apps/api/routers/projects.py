from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from auth.demo_auth import get_current_user
from database import neo4j_db
from models import Project, UserProjectAccess
from postgres import get_db


router = APIRouter(prefix="/projects", tags=["projects"])


class ProjectRequest(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    visibility: str = Field(default="org", pattern="^(org|private)$")


@router.get("/")
def list_projects(user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if not user.get("org_id"):
        return []
    query = select(Project).where(Project.organization_id == user["org_id"]).order_by(Project.name.asc())
    if user["role"] != "admin":
        query = query.join(UserProjectAccess).where(UserProjectAccess.user_id == user["id"])
    projects = db.execute(query).scalars().all()
    return [
        {"id": project.id, "name": project.name, "visibility": project.visibility}
        for project in projects
    ]


@router.post("/")
def create_project(
    request: ProjectRequest,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user["role"] != "admin" or not user.get("org_id"):
        raise HTTPException(status_code=403, detail="Admin access required.")
    existing = db.execute(
        select(Project).where(
            Project.organization_id == user["org_id"],
            Project.name == request.name.strip(),
        )
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="A project with that name already exists.")
    project = Project(
        id=f"proj_{uuid.uuid4().hex[:12]}",
        organization_id=user["org_id"],
        name=request.name.strip(),
        visibility=request.visibility,
    )
    db.add(project)
    db.add(UserProjectAccess(user_id=user["id"], project_id=project.id))
    db.commit()
    try:
        neo4j_db.execute_query(
            """
            MATCH (o:Organization {id: $org_id})
            MERGE (p:Project {id: $project_id})
            SET p.name = $name, p.visibility = $visibility, p.organizationId = $org_id
            MERGE (o)-[:HAS_PROJECT]->(p)
            """,
            {
                "org_id": user["org_id"],
                "project_id": project.id,
                "name": project.name,
                "visibility": project.visibility,
            },
        )
    except Exception:
        pass
    return {"id": project.id, "name": project.name, "visibility": project.visibility}
