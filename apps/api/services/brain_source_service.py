from __future__ import annotations

import json
from typing import Any

from fastapi import HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from database import neo4j_db
from models import ContextRecord, Project, RawContextRecord, User
from services.team_service import user_can_access_project


class BrainSourceDetail(BaseModel):
    id: str
    context_id: str | None = None
    graphiti_episode_uuid: str | None = None
    title: str
    summary: str | None = None
    content: str | None = None
    source_type: str | None = None
    context_type: str | None = None
    project_name: str | None = None
    uploader_email: str | None = None
    uploader_name: str | None = None
    created_at: str | None = None
    approval_status: str | None = None
    tags: list[str] = Field(default_factory=list)


def _can_access_raw(raw: RawContextRecord, project: Project | None, user: dict) -> bool:
    if raw.organization_id != user.get("org_id"):
        return False
    if user["role"] == "admin":
        return True
    if raw.visibility == "private" and raw.user_id != user["id"]:
        return False
    if project and not user_can_access_project(user, project.name):
        return False
    return True


def _episode_props(node: Any) -> dict[str, Any]:
    if node is None:
        return {}
    if isinstance(node, dict):
        return node
    items = getattr(node, "items", None)
    if callable(items):
        return dict(items())
    properties = getattr(node, "_properties", None)
    if isinstance(properties, dict):
        return properties
    return {}


def _lookup_graphiti_episode(source_ref: str, user: dict) -> BrainSourceDetail | None:
    if neo4j_db.driver is None:
        neo4j_db.connect()
    if neo4j_db.health_check().get("status") != "ok":
        return None

    org_id = user.get("org_id")
    group_id = f"org_{org_id}" if org_id else None
    rows = neo4j_db.execute_query(
        """
        MATCH (e:Episodic)
        WHERE e.uuid = $source_ref OR e.id = $source_ref
        RETURN e
        LIMIT 1
        """,
        {"source_ref": source_ref},
    )
    if not rows and group_id:
        rows = neo4j_db.execute_query(
            """
            MATCH (e:Episodic {group_id: $group_id})
            WHERE e.uuid = $source_ref OR e.name = $source_ref
            RETURN e
            LIMIT 1
            """,
            {"source_ref": source_ref, "group_id": group_id},
        )

    if not rows:
        return None

    episode = rows[0].get("e")
    props = _episode_props(episode)
    created = props.get("created_at")
    created_str = created.isoformat() if hasattr(created, "isoformat") else (str(created) if created else None)

    return BrainSourceDetail(
        id=source_ref,
        graphiti_episode_uuid=props.get("uuid") or source_ref,
        title=str(props.get("name") or props.get("title") or "Graphiti episode"),
        summary=str(props.get("summary") or props.get("source_description") or "") or None,
        content=str(props.get("content") or props.get("source_description") or props.get("summary") or "") or None,
        source_type="graphiti",
        context_type="episode",
        project_name=props.get("project_name"),
        created_at=created_str,
        tags=[],
    )


def _serialize_detail(
    *,
    context: ContextRecord | None,
    raw: RawContextRecord | None,
    project: Project | None,
    uploader: User | None,
    source_ref: str,
) -> BrainSourceDetail:
    record = context or raw
    if record is None:
        raise HTTPException(status_code=404, detail="Source not found.")

    tags: list[str] = []
    if context is not None:
        tags = json.loads(context.tags_json or "[]")
    elif raw is not None:
        tags = json.loads(raw.tags_json or "[]")

    return BrainSourceDetail(
        id=source_ref,
        context_id=context.id if context else None,
        graphiti_episode_uuid=context.graphiti_episode_uuid if context else None,
        title=(context.title if context else raw.title if raw else source_ref),
        summary=context.summary if context else None,
        content=(context.content if context else raw.content if raw else None),
        source_type=(context.source_type if context else raw.source_type if raw else None),
        context_type=(context.context_type if context else raw.context_type if raw else None),
        project_name=project.name if project else None,
        uploader_email=uploader.email if uploader else None,
        uploader_name=uploader.name if uploader else None,
        created_at=(context.created_at.isoformat() if context else raw.created_at.isoformat() if raw else None),
        approval_status=(context.approval_status if context else raw.approval_status if raw else None),
        tags=tags,
    )


def get_brain_source_detail(source_ref: str, user: dict, db: Session) -> BrainSourceDetail:
    if not user.get("org_id"):
        raise HTTPException(status_code=404, detail="Source not found.")

    statement = (
        select(ContextRecord, RawContextRecord, Project, User)
        .outerjoin(RawContextRecord, ContextRecord.raw_context_id == RawContextRecord.id)
        .outerjoin(Project, ContextRecord.project_id == Project.id)
        .outerjoin(User, ContextRecord.user_id == User.id)
        .where(
            ContextRecord.organization_id == user["org_id"],
            or_(
                ContextRecord.id == source_ref,
                ContextRecord.graphiti_episode_uuid == source_ref,
            ),
        )
        .limit(1)
    )
    row = db.execute(statement).first()
    if row:
        context, raw, project, uploader = row
        if raw and not _can_access_raw(raw, project, user):
            raise HTTPException(status_code=403, detail="You do not have access to this source.")
        return _serialize_detail(
            context=context,
            raw=raw,
            project=project,
            uploader=uploader,
            source_ref=source_ref,
        )

    raw_statement = (
        select(RawContextRecord, Project, User)
        .outerjoin(Project, RawContextRecord.project_id == Project.id)
        .outerjoin(User, RawContextRecord.user_id == User.id)
        .where(
            RawContextRecord.organization_id == user["org_id"],
            RawContextRecord.id == source_ref,
        )
        .limit(1)
    )
    raw_row = db.execute(raw_statement).first()
    if raw_row:
        raw, project, uploader = raw_row
        if not _can_access_raw(raw, project, user):
            raise HTTPException(status_code=403, detail="You do not have access to this source.")
        return _serialize_detail(
            context=None,
            raw=raw,
            project=project,
            uploader=uploader,
            source_ref=source_ref,
        )

    graphiti_detail = _lookup_graphiti_episode(source_ref, user)
    if graphiti_detail:
        return graphiti_detail

    raise HTTPException(status_code=404, detail="Source not found.")
