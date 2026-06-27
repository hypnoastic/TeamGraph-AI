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


def _parse_episode_body(episode_body: str | None) -> tuple[str | None, str | None, dict[str, str]]:
    if not episode_body:
        return None, None, {}
    metadata: dict[str, str] = {}
    content_lines: list[str] = []
    in_content = False
    for line in str(episode_body).split("\n"):
        if not in_content:
            if not line.strip():
                in_content = True
                continue
            if ":" in line:
                key, _, value = line.partition(":")
                metadata[key.strip()] = value.strip()
            continue
        content_lines.append(line)
    content = "\n".join(content_lines).strip() or None
    summary = metadata.get("summary") or None
    return summary, content, metadata


def _lookup_neo4j_context(source_ref: str, user: dict) -> BrainSourceDetail | None:
    if neo4j_db.driver is None:
        neo4j_db.connect()
    if neo4j_db.health_check().get("status") != "ok":
        return None

    org_id = user.get("org_id")
    rows = neo4j_db.execute_query(
        """
        MATCH (c:Context)
        WHERE c.id = $source_ref OR c.graphitiEpisodeUuid = $source_ref
        RETURN c
        LIMIT 1
        """,
        {"source_ref": source_ref},
    )
    if not rows and org_id:
        rows = neo4j_db.execute_query(
            """
            MATCH (c:Context)
            WHERE c.organizationId = $org_id AND c.title = $source_ref
            RETURN c
            LIMIT 1
            """,
            {"source_ref": source_ref, "org_id": org_id},
        )

    if not rows:
        return None

    props = _episode_props(rows[0].get("c"))
    if org_id and props.get("organizationId") and props.get("organizationId") != org_id:
        return None

    created = props.get("createdAt") or props.get("created_at")
    created_str = created.isoformat() if hasattr(created, "isoformat") else (str(created) if created else None)
    tags = props.get("tags") or []
    if isinstance(tags, str):
        tags = [tags]

    return BrainSourceDetail(
        id=source_ref,
        context_id=props.get("id"),
        graphiti_episode_uuid=props.get("graphitiEpisodeUuid"),
        title=str(props.get("title") or "Context"),
        summary=str(props.get("summary") or "") or None,
        content=str(props.get("content") or "") or None,
        source_type=str(props.get("sourceType") or props.get("source_type") or "graph"),
        context_type=str(props.get("type") or props.get("context_type") or "note"),
        project_name=props.get("projectName") or props.get("project_name"),
        uploader_email=props.get("uploaderEmail") or props.get("uploader_email"),
        created_at=created_str,
        approval_status=props.get("approvalStatus") or props.get("approval_status"),
        tags=list(tags) if isinstance(tags, list) else [],
    )


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

    parsed_summary, parsed_content, parsed_meta = _parse_episode_body(props.get("episode_body"))
    context_id = parsed_meta.get("context_id") or None

    return BrainSourceDetail(
        id=source_ref,
        context_id=context_id,
        graphiti_episode_uuid=props.get("uuid") or source_ref,
        title=str(props.get("name") or props.get("title") or parsed_meta.get("title") or "Graphiti episode"),
        summary=str(parsed_summary or props.get("summary") or props.get("source_description") or "") or None,
        content=str(parsed_content or props.get("content") or "") or None,
        source_type=str(parsed_meta.get("source_type") or "graphiti"),
        context_type="episode",
        project_name=parsed_meta.get("project_name") or props.get("project_name"),
        uploader_email=parsed_meta.get("uploader_email"),
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
        if graphiti_detail.context_id and not graphiti_detail.content:
            context_row = db.execute(
                select(ContextRecord, RawContextRecord, Project, User)
                .outerjoin(RawContextRecord, ContextRecord.raw_context_id == RawContextRecord.id)
                .outerjoin(Project, ContextRecord.project_id == Project.id)
                .outerjoin(User, ContextRecord.user_id == User.id)
                .where(
                    ContextRecord.organization_id == user["org_id"],
                    ContextRecord.id == graphiti_detail.context_id,
                )
                .limit(1)
            ).first()
            if context_row:
                context, raw, project, uploader = context_row
                return _serialize_detail(
                    context=context,
                    raw=raw,
                    project=project,
                    uploader=uploader,
                    source_ref=source_ref,
                )
        return graphiti_detail

    neo4j_context = _lookup_neo4j_context(source_ref, user)
    if neo4j_context:
        if neo4j_context.context_id:
            context_row = db.execute(
                select(ContextRecord, RawContextRecord, Project, User)
                .outerjoin(RawContextRecord, ContextRecord.raw_context_id == RawContextRecord.id)
                .outerjoin(Project, ContextRecord.project_id == Project.id)
                .outerjoin(User, ContextRecord.user_id == User.id)
                .where(
                    ContextRecord.organization_id == user["org_id"],
                    ContextRecord.id == neo4j_context.context_id,
                )
                .limit(1)
            ).first()
            if context_row:
                context, raw, project, uploader = context_row
                if raw and not _can_access_raw(raw, project, user):
                    raise HTTPException(status_code=403, detail="You do not have access to this source.")
                return _serialize_detail(
                    context=context,
                    raw=raw,
                    project=project,
                    uploader=uploader,
                    source_ref=source_ref,
                )
        return neo4j_context

    raise HTTPException(status_code=404, detail="Source not found.")


def enrich_citations_from_postgres(citations: list[Any], user: dict, db: Session) -> list[Any]:
    if not user.get("org_id") or not citations:
        return citations

    enriched: list[Any] = []
    for citation in citations:
        if getattr(citation, "context_id", None):
            enriched.append(citation)
            continue

        row = None
        episode_uuid = getattr(citation, "graphiti_episode_uuid", None)
        if episode_uuid:
            row = db.execute(
                select(ContextRecord, Project)
                .outerjoin(Project, ContextRecord.project_id == Project.id)
                .where(
                    ContextRecord.organization_id == user["org_id"],
                    ContextRecord.graphiti_episode_uuid == episode_uuid,
                )
                .limit(1)
            ).first()

        title = getattr(citation, "title", None)
        if row is None and title:
            row = db.execute(
                select(ContextRecord, Project)
                .outerjoin(Project, ContextRecord.project_id == Project.id)
                .where(
                    ContextRecord.organization_id == user["org_id"],
                    ContextRecord.title == title,
                )
                .limit(1)
            ).first()

        if row is None:
            enriched.append(citation)
            continue

        context, project = row
        update = {
            "context_id": context.id,
            "graphiti_episode_uuid": context.graphiti_episode_uuid or episode_uuid,
            "summary": getattr(citation, "summary", None) or context.summary,
            "source_type": getattr(citation, "source_type", None) or context.source_type,
            "project_name": getattr(citation, "project_name", None) or (project.name if project else None),
            "created_at": getattr(citation, "created_at", None) or context.created_at.isoformat(),
        }
        if hasattr(citation, "model_copy"):
            enriched.append(citation.model_copy(update=update))
        else:
            enriched.append(citation)
    return enriched
