from __future__ import annotations

import datetime
import json
import uuid
from typing import Any

from fastapi import HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from database import neo4j_db
from models import ApprovalRecord, ContextRecord, Project, RawContextRecord, User
from services.activity_service import record_activity
from services.curator.graph_harness import curate_context
from services.graphiti.schemas import EpisodeMetadata
from services.graphiti.service import graphiti_service
from services.team_service import user_can_access_project


class UploadContextRequest(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    content: str = Field(min_length=1, max_length=200_000)
    project: str | None = None
    type: str = Field(default="note", max_length=64)
    visibility: str = Field(default="project", pattern="^(org|project|private)$")
    source: str = "api"
    sourceType: str = "ui_upload"
    tags: list[str] = Field(default_factory=list, max_length=20)
    upload_channel: str = Field(default="ui", pattern="^(ui|mcp|connector_dummy|seed)$")


def _project_for_request(db: Session, project_ref: str | None, user: dict) -> Project | None:
    if not project_ref:
        return None
    project = db.execute(
        select(Project).where(
            Project.organization_id == user["org_id"],
            or_(Project.id == project_ref, Project.name == project_ref),
        )
    ).scalar_one_or_none()
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found.")
    if not user_can_access_project(user, project.name):
        raise HTTPException(status_code=403, detail="You do not have access to that project.")
    return project


def _group_id(organization_id: str, project_id: str | None, user_id: str, visibility: str) -> str:
    if visibility == "private":
        return f"org:{organization_id}:user:{user_id}"
    if project_id:
        return f"org:{organization_id}:project:{project_id}"
    return f"org:{organization_id}"


def _serialize_raw(raw: RawContextRecord, project: Project | None) -> dict[str, Any]:
    return {
        "id": raw.id,
        "title": raw.title,
        "content": raw.content,
        "sourceType": raw.source_type,
        "contextType": raw.context_type,
        "visibilityRequested": raw.visibility,
        "projectRequested": project.name if project else None,
        "projectId": raw.project_id,
        "uploadChannel": raw.upload_channel,
        "tags": json.loads(raw.tags_json),
        "userId": raw.user_id,
        "organizationId": raw.organization_id,
        "approvalStatus": raw.approval_status,
        "createdAt": raw.created_at.isoformat(),
        "updatedAt": raw.updated_at.isoformat(),
    }


def _serialize_context(context: ContextRecord, project: Project | None) -> dict[str, Any]:
    return {
        "id": context.id,
        "title": context.title,
        "summary": context.summary,
        "content": context.content,
        "type": context.context_type,
        "visibility": context.visibility,
        "approvalStatus": context.approval_status,
        "qualityScore": context.quality_score,
        "graphitiEpisodeUuid": context.graphiti_episode_uuid,
        "graphitiGroupId": context.graphiti_group_id,
        "brainMode": context.brain_mode,
        "sourceType": context.source_type,
        "uploadChannel": context.upload_channel,
        "tags": json.loads(context.tags_json),
        "riskTags": json.loads(context.risk_tags_json),
        "projectId": context.project_id,
        "projectName": project.name if project else None,
        "userId": context.user_id,
        "createdAt": context.created_at.isoformat(),
        "updatedAt": context.updated_at.isoformat(),
    }


def _serialize_approval(approval: ApprovalRecord) -> dict[str, Any]:
    return {
        "id": approval.id,
        "status": approval.status,
        "reason": approval.reason,
        "riskTags": json.loads(approval.risk_tags_json),
        "qualityScore": approval.quality_score,
        "proposedTitle": approval.proposed_title,
        "proposedSummary": approval.proposed_summary,
        "proposedContextType": approval.proposed_context_type,
        "proposedVisibility": approval.proposed_visibility,
        "createdAt": approval.created_at.isoformat(),
        "updatedAt": approval.updated_at.isoformat(),
    }


def _mirror_context_to_neo4j(
    raw: RawContextRecord,
    context: ContextRecord,
    project: Project | None,
    user: dict,
) -> None:
    try:
        neo4j_db.execute_query(
        """
        MERGE (o:Organization {id: $org_id})
        SET o.name = $org_name
        MERGE (u:User {id: $user_id})
        SET u.email = $email, u.name = $user_name, u.role = $role
        MERGE (r:RawContext {id: $raw_id})
        SET r.title = $raw_title, r.content = $content, r.organizationId = $org_id,
            r.userId = $user_id, r.projectRequested = $project_name,
            r.visibilityRequested = $visibility, r.approvalStatus = $approval_status,
            r.sourceType = $source_type, r.uploadChannel = $upload_channel,
            r.createdAt = $created_at, r.updatedAt = $updated_at
        MERGE (c:Context {id: $context_id})
        SET c.title = $title, c.summary = $summary, c.content = $content,
            c.type = $context_type, c.visibility = $visibility,
            c.status = 'trusted', c.approvalStatus = $approval_status,
            c.qualityScore = $quality_score, c.graphitiEpisodeUuid = $episode_uuid,
            c.graphitiGroupId = $group_id, c.brainMode = $brain_mode,
            c.sourceType = $source_type, c.uploadChannel = $upload_channel,
            c.organizationId = $org_id, c.projectId = $project_id,
            c.projectName = $project_name, c.userId = $user_id,
            c.createdAt = $created_at, c.updatedAt = $updated_at
        MERGE (o)-[:HAS_MEMBER]->(u)
        MERGE (u)-[:UPLOADED]->(r)
        MERGE (r)-[:CURATED_INTO]->(c)
        MERGE (u)-[:OWNS_CONTEXT]->(c)
        WITH o, c
        OPTIONAL MATCH (p:Project {id: $project_id})
        FOREACH (_ IN CASE WHEN p IS NULL THEN [] ELSE [1] END |
            MERGE (o)-[:HAS_PROJECT]->(p)
            MERGE (c)-[:BELONGS_TO]->(p)
        )
        """,
        {
            "org_id": raw.organization_id,
            "org_name": user.get("org_name") or "Organization",
            "user_id": raw.user_id,
            "email": user.get("email"),
            "user_name": user.get("name") or user.get("email"),
            "role": user.get("role", "member"),
            "raw_id": raw.id,
            "raw_title": raw.title,
            "context_id": context.id,
            "title": context.title,
            "summary": context.summary,
            "content": context.content,
            "context_type": context.context_type,
            "visibility": context.visibility,
            "approval_status": context.approval_status,
            "quality_score": context.quality_score,
            "episode_uuid": context.graphiti_episode_uuid,
            "group_id": context.graphiti_group_id,
            "brain_mode": context.brain_mode,
            "source_type": context.source_type,
            "upload_channel": context.upload_channel,
            "project_id": context.project_id,
            "project_name": project.name if project else None,
            "created_at": context.created_at.isoformat(),
            "updated_at": context.updated_at.isoformat(),
            },
        )
    except Exception:
        # Upload and approval flows remain available when Neo4j is temporarily down.
        pass


async def _materialize_context(
    *,
    db: Session,
    raw: RawContextRecord,
    project: Project | None,
    curator_output: Any,
    user: dict,
    approval_status: str,
) -> ContextRecord:
    context_id = f"ctx_{uuid.uuid4().hex[:12]}"
    group_id = _group_id(raw.organization_id, raw.project_id, raw.user_id, curator_output.classification.suggested_visibility)
    metadata = EpisodeMetadata(
        raw_context_id=raw.id,
        context_id=context_id,
        organization_id=raw.organization_id,
        organization_name=user.get("org_name"),
        project_id=raw.project_id,
        project_name=project.name if project else None,
        user_id=raw.user_id,
        uploader_email=user.get("email"),
        source_type=raw.source_type,
        context_type=curator_output.classification.context_type,
        visibility=curator_output.classification.suggested_visibility,
        tags=json.loads(raw.tags_json) or curator_output.classification.suggested_tags,
        upload_channel=raw.upload_channel,
        approval_status=approval_status,
        created_at=raw.created_at,
        scope_keys=[group_id],
    )
    graphiti_result = await graphiti_service.add_episode_for_context(
        title=curator_output.classification.canonical_title,
        content=raw.content,
        metadata=metadata,
        summary=curator_output.classification.summary,
        group_id=group_id,
    )
    context = ContextRecord(
        id=context_id,
        raw_context_id=raw.id,
        organization_id=raw.organization_id,
        project_id=raw.project_id,
        user_id=raw.user_id,
        title=curator_output.classification.canonical_title,
        summary=curator_output.classification.summary,
        content=raw.content,
        context_type=curator_output.classification.context_type,
        source_type=raw.source_type,
        upload_channel=raw.upload_channel,
        visibility=curator_output.classification.suggested_visibility,
        approval_status=approval_status,
        quality_score=curator_output.quality.score,
        tags_json=json.dumps(metadata.tags),
        risk_tags_json=json.dumps(curator_output.safety.risk_tags),
        graphiti_episode_uuid=graphiti_result.episode_uuid,
        graphiti_group_id=group_id,
        brain_mode=graphiti_result.mode,
    )
    raw.approval_status = approval_status
    db.add(context)
    db.commit()
    db.refresh(context)
    _mirror_context_to_neo4j(raw, context, project, user)
    return context


async def process_upload(request: UploadContextRequest, user: dict, db: Session):
    if not user.get("org_id"):
        raise HTTPException(status_code=409, detail="Complete organization setup first.")
    project = _project_for_request(db, request.project, user)
    if request.visibility == "project" and project is None:
        raise HTTPException(status_code=400, detail="Project visibility requires a project.")

    account = db.get(User, user["id"])
    if account is None:
        raise HTTPException(status_code=404, detail="User not found.")
    raw = RawContextRecord(
        id=f"raw_{uuid.uuid4().hex[:12]}",
        organization_id=user["org_id"],
        project_id=project.id if project else None,
        user_id=user["id"],
        title=request.title.strip(),
        content=request.content.strip(),
        context_type=request.type,
        source_type=request.sourceType,
        upload_channel=request.upload_channel,
        visibility=request.visibility,
        tags_json=json.dumps(request.tags),
    )
    db.add(raw)
    db.commit()
    db.refresh(raw)

    curator_output = curate_context(
        {
            "raw_context_id": raw.id,
            "uploaded_by": user["email"],
            "project": project.name if project else None,
            "visibility_requested": request.visibility,
            "content": raw.content,
            "title": raw.title,
            "type": raw.context_type,
            "tags": request.tags,
        }
    )
    decision = curator_output.lane.decision
    if decision == "auto_curate":
        context = await _materialize_context(
            db=db,
            raw=raw,
            project=project,
            curator_output=curator_output,
            user=user,
            approval_status="safe",
        )
        record_activity(
            event_type="context.ingested",
            title="Context ingested",
            description=raw.title,
            actor=user,
            metadata={"raw_id": raw.id, "context_id": context.id},
            db=db,
        )
        return {"status": "success", "decision": "auto_curate", "raw_id": raw.id, "context_id": context.id}

    approval = ApprovalRecord(
        id=f"rev_{uuid.uuid4().hex[:12]}",
        raw_context_id=raw.id,
        organization_id=raw.organization_id,
        status="pending" if decision == "review" else "quarantined",
        reason=curator_output.lane.reason,
        risk_tags_json=json.dumps(curator_output.safety.risk_tags),
        quality_score=curator_output.quality.score,
        proposed_title=curator_output.classification.canonical_title,
        proposed_summary=curator_output.classification.summary,
        proposed_context_type=curator_output.classification.context_type,
        proposed_visibility=curator_output.classification.suggested_visibility,
    )
    raw.approval_status = approval.status
    db.add(approval)
    db.commit()
    record_activity(
        event_type=f"context.{approval.status}",
        title="Context queued" if approval.status == "pending" else "Context quarantined",
        description=raw.title,
        actor=user,
        metadata={"raw_id": raw.id, "review_id": approval.id},
        db=db,
    )
    return {
        "status": "success",
        "decision": "review" if approval.status == "pending" else "quarantine",
        "raw_id": raw.id,
        "review_id": approval.id,
        "reason": approval.reason,
    }


def list_inbox(user: dict, db: Session) -> list[dict[str, Any]]:
    if not user.get("org_id"):
        return []
    statement = (
        select(RawContextRecord, ContextRecord, ApprovalRecord, Project)
        .outerjoin(ContextRecord, ContextRecord.raw_context_id == RawContextRecord.id)
        .outerjoin(ApprovalRecord, ApprovalRecord.raw_context_id == RawContextRecord.id)
        .outerjoin(Project, RawContextRecord.project_id == Project.id)
        .where(RawContextRecord.organization_id == user["org_id"])
        .order_by(RawContextRecord.created_at.desc())
        .limit(100)
    )
    rows = db.execute(statement).all()
    response = []
    for raw, context, approval, project in rows:
        if user["role"] != "admin":
            if raw.visibility == "private" and raw.user_id != user["id"]:
                continue
            if project and project.name not in user.get("project_names", []):
                continue
        lane = "auto_curated" if context else "quarantined" if approval and approval.status == "quarantined" else "pending_review"
        response.append(
            {
                "raw": _serialize_raw(raw, project),
                "context": _serialize_context(context, project) if context else None,
                "review_item": _serialize_approval(approval) if approval else None,
                "lane": lane,
            }
        )
    return response


def list_approvals(user: dict, db: Session) -> list[dict[str, Any]]:
    rows = db.execute(
        select(ApprovalRecord, RawContextRecord, Project)
        .join(RawContextRecord, ApprovalRecord.raw_context_id == RawContextRecord.id)
        .outerjoin(Project, RawContextRecord.project_id == Project.id)
        .where(
            ApprovalRecord.organization_id == user["org_id"],
            ApprovalRecord.status == "pending",
        )
        .order_by(ApprovalRecord.created_at.desc())
    ).all()
    return [
        {"raw": _serialize_raw(raw, project), "review_item": _serialize_approval(approval)}
        for approval, raw, project in rows
    ]


async def approve_review_item(review_id: str, approver: dict, db: Session) -> dict[str, Any]:
    approval = db.get(ApprovalRecord, review_id)
    if approval is None or approval.organization_id != approver["org_id"]:
        raise HTTPException(status_code=404, detail="Review item not found.")
    if approval.status != "pending":
        raise HTTPException(status_code=409, detail="Review item is no longer pending.")
    raw = db.get(RawContextRecord, approval.raw_context_id)
    if raw is None:
        raise HTTPException(status_code=404, detail="Raw context not found.")
    project = db.get(Project, raw.project_id) if raw.project_id else None
    uploader = db.get(User, raw.user_id)
    curator_output = curate_context(
        {
            "raw_context_id": raw.id,
            "uploaded_by": uploader.email if uploader else None,
            "project": project.name if project else None,
            "visibility_requested": approval.proposed_visibility,
            "content": raw.content,
            "title": approval.proposed_title,
            "type": approval.proposed_context_type,
            "tags": json.loads(raw.tags_json),
        }
    )
    curator_output.classification.canonical_title = approval.proposed_title
    curator_output.classification.summary = approval.proposed_summary
    curator_output.classification.context_type = approval.proposed_context_type
    curator_output.classification.suggested_visibility = approval.proposed_visibility
    context = await _materialize_context(
        db=db,
        raw=raw,
        project=project,
        curator_output=curator_output,
        user={
            "id": raw.user_id,
            "email": uploader.email if uploader else None,
            "name": uploader.name if uploader else None,
            "role": uploader.role if uploader else "member",
            "org_id": raw.organization_id,
            "org_name": approver.get("org_name"),
        },
        approval_status="approved",
    )
    approval.status = "approved"
    approval.reviewed_by_user_id = approver["id"]
    approval.reviewed_at = datetime.datetime.utcnow()
    db.commit()
    record_activity(
        event_type="context.approved",
        title="Context approved",
        description=raw.title,
        actor=approver,
        metadata={"review_id": approval.id, "context_id": context.id},
        db=db,
    )
    return {"status": "approved", "context_id": context.id}


def reject_review_item(review_id: str, approver: dict, db: Session) -> dict[str, Any]:
    approval = db.get(ApprovalRecord, review_id)
    if approval is None or approval.organization_id != approver["org_id"]:
        raise HTTPException(status_code=404, detail="Review item not found.")
    if approval.status != "pending":
        raise HTTPException(status_code=409, detail="Review item is no longer pending.")
    raw = db.get(RawContextRecord, approval.raw_context_id)
    approval.status = "rejected"
    approval.reviewed_by_user_id = approver["id"]
    approval.reviewed_at = datetime.datetime.utcnow()
    if raw:
        raw.approval_status = "rejected"
    db.commit()
    record_activity(
        event_type="context.rejected",
        title="Context rejected",
        description=raw.title if raw else review_id,
        actor=approver,
        metadata={"review_id": approval.id},
        db=db,
    )
    return {"status": "rejected"}
