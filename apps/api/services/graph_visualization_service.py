from __future__ import annotations

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from models import ContextRecord, Organization, Project, User, UserProjectAccess


def get_graph_visualization(
    db: Session,
    user: dict,
    *,
    project_ref: str | None = None,
    query: str | None = None,
    node_types: set[str] | None = None,
    limit: int = 100,
) -> dict:
    if not user.get("org_id"):
        return {"nodes": [], "edges": [], "timeline": []}

    organization = db.get(Organization, user["org_id"])
    projects_statement = select(Project).where(Project.organization_id == user["org_id"])
    if user["role"] != "admin":
        projects_statement = projects_statement.join(UserProjectAccess).where(
            UserProjectAccess.user_id == user["id"]
        )
    projects = db.execute(projects_statement.order_by(Project.name.asc())).scalars().all()
    allowed_project_ids = {project.id for project in projects}
    if project_ref:
        allowed_project_ids = {
            project.id for project in projects if project.id == project_ref or project.name == project_ref
        }

    members_statement = select(User).where(User.organization_id == user["org_id"])
    if user["role"] != "admin":
        members_statement = members_statement.where(User.id == user["id"])
    members = db.execute(members_statement.order_by(User.name.asc())).scalars().all()
    contexts_statement = (
        select(ContextRecord)
        .where(
            ContextRecord.organization_id == user["org_id"],
            ContextRecord.approval_status.in_(["safe", "approved"]),
        )
        .order_by(ContextRecord.updated_at.desc())
        .limit(limit)
    )
    if allowed_project_ids:
        contexts_statement = contexts_statement.where(
            or_(ContextRecord.project_id.in_(allowed_project_ids), ContextRecord.project_id.is_(None))
        )
    elif project_ref:
        return {"nodes": [], "edges": [], "timeline": []}
    if user["role"] != "admin":
        contexts_statement = contexts_statement.where(
            or_(ContextRecord.visibility != "private", ContextRecord.user_id == user["id"])
        )
    if query:
        contexts_statement = contexts_statement.where(
            or_(
                ContextRecord.title.ilike(f"%{query}%"),
                ContextRecord.summary.ilike(f"%{query}%"),
            )
        )
    contexts = db.execute(contexts_statement).scalars().all()

    nodes: list[dict] = []
    edges: list[dict] = []
    timeline: list[dict] = []

    def include(kind: str) -> bool:
        return not node_types or kind in node_types

    if organization and include("organization"):
        nodes.append(
            {
                "id": organization.id,
                "label": organization.name,
                "type": "organization",
                "meta": {"domain": organization.domain},
            }
        )
    for project in projects:
        if include("project"):
            nodes.append(
                {
                    "id": project.id,
                    "label": project.name,
                    "type": "project",
                    "meta": {"visibility": project.visibility},
                }
            )
        if organization and include("organization") and include("project"):
            edges.append(
                {"id": f"org-project-{project.id}", "source": organization.id, "target": project.id, "label": "HAS_PROJECT"}
            )
    for member in members:
        if include("user"):
            nodes.append(
                {
                    "id": member.id,
                    "label": member.name,
                    "type": "user",
                    "meta": {"email": member.email, "role": member.role},
                }
            )
        if organization and include("organization") and include("user"):
            edges.append(
                {"id": f"org-user-{member.id}", "source": organization.id, "target": member.id, "label": "HAS_MEMBER"}
            )
    for context in contexts:
        if include("context"):
            nodes.append(
                {
                    "id": context.id,
                    "label": context.title,
                    "type": "context",
                    "meta": {
                        "summary": context.summary,
                        "visibility": context.visibility,
                        "sourceType": context.source_type,
                        "approvalStatus": context.approval_status,
                        "brainMode": context.brain_mode,
                        "createdAt": context.created_at.isoformat(),
                    },
                }
            )
        if context.project_id and include("context") and include("project"):
            edges.append(
                {
                    "id": f"context-project-{context.id}",
                    "source": context.id,
                    "target": context.project_id,
                    "label": "BELONGS_TO",
                }
            )
        if include("context") and include("user"):
            edges.append(
                {
                    "id": f"user-context-{context.id}",
                    "source": context.user_id,
                    "target": context.id,
                    "label": "OWNS_CONTEXT",
                }
            )
        if context.graphiti_episode_uuid:
            if include("episode"):
                nodes.append(
                    {
                        "id": context.graphiti_episode_uuid,
                        "label": context.title,
                        "type": "episode",
                        "meta": {
                            "groupId": context.graphiti_group_id,
                            "mode": context.brain_mode,
                            "createdAt": context.created_at.isoformat(),
                        },
                    }
                )
            if include("context") and include("episode"):
                edges.append(
                    {
                        "id": f"context-episode-{context.id}",
                        "source": context.id,
                        "target": context.graphiti_episode_uuid,
                        "label": "INGESTED_AS",
                    }
                )
        timeline.append(
            {
                "id": context.id,
                "title": context.title,
                "summary": context.summary,
                "projectName": next(
                    (project.name for project in projects if project.id == context.project_id),
                    None,
                ),
                "sourceType": context.source_type,
                "createdAt": context.updated_at.isoformat(),
            }
        )
    return {"nodes": nodes, "edges": edges, "timeline": timeline[:12]}
