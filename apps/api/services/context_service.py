import datetime
import json
import uuid
from typing import Any

from fastapi import HTTPException
from pydantic import BaseModel, Field

from config import settings
from database import neo4j_db
from services.activity_service import record_activity
from services.curator.graph_harness import curate_context
from services.graphiti.service import graphiti_service
from services.graphiti.schemas import EpisodeMetadata
from services.team_service import get_user_project_names, user_can_access_project


class UploadContextRequest(BaseModel):
    title: str
    content: str
    project: str | None = None
    type: str = "note"
    visibility: str = "project"
    source: str = "api"
    sourceType: str = "mcp_upload"
    tags: list[str] = Field(default_factory=list)
    upload_channel: str = "ui"


def _utcnow() -> str:
    return datetime.datetime.utcnow().isoformat()


def _lookup_project(project_name: str | None) -> dict[str, Any] | None:
    if not project_name:
        return None
    query = """
    MATCH (p:Project {name: $project_name})
    RETURN p
    LIMIT 1
    """
    results = neo4j_db.execute_query(query, {"project_name": project_name})
    if not results:
        return None
    return results[0]["p"]


def _resolve_project_name(requested_project: str | None, user: dict) -> str | None:
    project_name = requested_project or settings.teamgraph_default_project
    if project_name and not user_can_access_project(user, project_name):
        raise HTTPException(status_code=403, detail="You do not have access to that project.")
    return project_name


def _build_scope_keys(org_id: str, project_id: str | None, user_id: str | None) -> list[str]:
    scope_keys = [f"org:{org_id}"]
    if project_id:
        scope_keys.append(f"org:{org_id}:project:{project_id}")
    if user_id:
        scope_keys.append(f"org:{org_id}:user:{user_id}")
    return scope_keys


def _create_raw_context(request: UploadContextRequest, user: dict, project_name: str | None) -> tuple[str, str]:
    raw_id = f"raw_{uuid.uuid4().hex[:12]}"
    now = _utcnow()
    query = """
    MATCH (u:User {id: $user_id})
    CREATE (r:RawContext {
        id: $raw_id,
        title: $title,
        content: $content,
        source: $source,
        sourceType: $source_type,
        contextType: $context_type,
        visibilityRequested: $visibility,
        projectRequested: $project_name,
        uploadChannel: $upload_channel,
        tags: $tags,
        uploaderEmail: $uploader_email,
        userId: $user_id,
        organizationId: $organization_id,
        approvalStatus: 'pending',
        createdAt: $now,
        updatedAt: $now
    })
    MERGE (u)-[:UPLOADED]->(r)
    RETURN r
    """
    neo4j_db.execute_query(
        query,
        {
            "raw_id": raw_id,
            "title": request.title,
            "content": request.content,
            "source": request.source,
            "source_type": request.sourceType,
            "context_type": request.type,
            "visibility": request.visibility,
            "project_name": project_name,
            "upload_channel": request.upload_channel,
            "tags": request.tags,
            "uploader_email": user["email"],
            "user_id": user["id"],
            "organization_id": user["org_id"],
            "now": now,
        },
    )
    return raw_id, now


def _create_curator_run(raw_id: str, curator_output, decision: str) -> str:
    run_id = f"run_{uuid.uuid4().hex[:12]}"
    now = _utcnow()
    query = """
    MATCH (r:RawContext {id: $raw_id})
    CREATE (c:CuratorRun {
        id: $run_id,
        mode: 'auto',
        laneDecision: $lane,
        confidence: $confidence,
        createdAt: $now
    })
    MERGE (r)-[:ANALYZED_BY]->(c)
    """
    neo4j_db.execute_query(
        query,
        {
            "raw_id": raw_id,
            "run_id": run_id,
            "lane": decision,
            "confidence": curator_output.quality.score,
            "now": now,
        },
    )
    return run_id


async def _materialize_context(
    *,
    raw_id: str,
    raw_title: str,
    raw_content: str,
    curator_output,
    user: dict,
    now: str,
    project_name: str | None,
    relation_type: str,
    approval_status: str,
    upload_channel: str,
    source_type: str,
    tags: list[str],
) -> dict[str, Any]:
    project = _lookup_project(project_name)
    project_id = project.get("id") if project else None
    project_name_resolved = project.get("name") if project else project_name
    context_id = f"ctx_{uuid.uuid4().hex[:12]}"

    metadata = EpisodeMetadata(
        raw_context_id=raw_id,
        context_id=context_id,
        organization_id=user["org_id"],
        organization_name=user.get("org_name"),
        project_id=project_id,
        project_name=project_name_resolved,
        user_id=user["id"],
        uploader_email=user["email"],
        source_type=source_type,
        context_type=curator_output.classification.context_type,
        visibility=curator_output.classification.suggested_visibility,
        tags=tags or curator_output.classification.suggested_tags,
        upload_channel=upload_channel,
        approval_status=approval_status,
        created_at=datetime.datetime.fromisoformat(now),
        scope_keys=_build_scope_keys(user["org_id"], project_id, user["id"]),
    )

    graphiti_result = await graphiti_service.add_episode_for_context(
        title=curator_output.classification.canonical_title,
        content=raw_content,
        metadata=metadata,
        summary=curator_output.classification.summary,
    )

    query = f"""
    MATCH (r:RawContext {{id: $raw_id}})
    MATCH (u:User {{id: $user_id}})
    OPTIONAL MATCH (p:Project {{name: $project_name}})
    CREATE (c:Context {{
        id: $context_id,
        title: $title,
        type: $context_type,
        summary: $summary,
        content: $content,
        visibility: $visibility,
        qualityScore: $quality_score,
        status: 'trusted',
        approvalStatus: $approval_status,
        graphitiEpisodeUuid: $graphiti_episode_uuid,
        brainMode: $brain_mode,
        sourceType: $source_type,
        uploadChannel: $upload_channel,
        tags: $tags,
        riskTags: $risk_tags,
        organizationId: $organization_id,
        projectId: $project_id,
        projectName: $project_name,
        userId: $user_id,
        uploaderEmail: $uploader_email,
        scopeKeys: $scope_keys,
        createdAt: $now,
        updatedAt: $now
    }})
    MERGE (r)-[:{relation_type}]->(c)
    MERGE (u)-[:OWNS_CONTEXT]->(c)
    FOREACH (_ IN CASE WHEN p IS NULL THEN [] ELSE [1] END |
        MERGE (c)-[:BELONGS_TO]->(p)
        MERGE (p)-[:HAS_CONTEXT]->(c)
    )
    SET r.approvalStatus = $approval_status, r.updatedAt = $now
    RETURN c
    """
    result = neo4j_db.execute_query(
        query,
        {
            "raw_id": raw_id,
            "user_id": user["id"],
            "project_name": project_name_resolved,
            "context_id": context_id,
            "title": curator_output.classification.canonical_title,
            "context_type": curator_output.classification.context_type,
            "summary": curator_output.classification.summary,
            "content": raw_content,
            "visibility": curator_output.classification.suggested_visibility,
            "quality_score": curator_output.quality.score,
            "approval_status": approval_status,
            "graphiti_episode_uuid": graphiti_result.episode_uuid,
            "brain_mode": graphiti_result.mode,
            "source_type": source_type,
            "upload_channel": upload_channel,
            "tags": metadata.tags,
            "risk_tags": curator_output.safety.risk_tags,
            "organization_id": user["org_id"],
            "project_id": project_id,
            "uploader_email": user["email"],
            "scope_keys": metadata.scope_keys,
            "now": now,
        },
    )
    context_node = result[0]["c"] if result else {}
    return {
        "context": context_node,
        "context_id": context_id,
        "graphiti": graphiti_result.model_dump(),
        "project_name": project_name_resolved,
        "project_id": project_id,
    }


def _queue_review_item(
    *,
    raw_id: str,
    curator_output,
    project_name: str | None,
    request: UploadContextRequest,
    status: str,
    now: str,
) -> str:
    review_id = f"rev_{uuid.uuid4().hex[:12]}"
    query = """
    MATCH (r:RawContext {id: $raw_id})
    CREATE (ri:ReviewItem {
        id: $review_id,
        status: $status,
        reason: $reason,
        riskTags: $risk_tags,
        qualityScore: $quality_score,
        proposedProject: $project_name,
        proposedVisibility: $visibility,
        proposedSummary: $summary,
        proposedTitle: $title,
        proposedContextType: $context_type,
        sourceType: $source_type,
        uploadChannel: $upload_channel,
        tags: $tags,
        createdAt: $now,
        updatedAt: $now
    })
    MERGE (r)-[:QUEUED_AS]->(ri)
    SET r.approvalStatus = $status, r.updatedAt = $now
    RETURN ri
    """
    neo4j_db.execute_query(
        query,
        {
            "raw_id": raw_id,
            "review_id": review_id,
            "status": status,
            "reason": curator_output.lane.reason,
            "risk_tags": curator_output.safety.risk_tags,
            "quality_score": curator_output.quality.score,
            "project_name": project_name,
            "visibility": curator_output.classification.suggested_visibility,
            "summary": curator_output.classification.summary,
            "title": curator_output.classification.canonical_title,
            "context_type": curator_output.classification.context_type,
            "source_type": request.sourceType,
            "upload_channel": request.upload_channel,
            "tags": request.tags or curator_output.classification.suggested_tags,
            "now": now,
        },
    )
    return review_id


async def process_upload(request: UploadContextRequest, user: dict):
    project_name = _resolve_project_name(request.project, user)
    raw_id, now = _create_raw_context(request, user, project_name)

    curator_input = {
        "raw_context_id": raw_id,
        "uploaded_by": user["email"],
        "project": project_name,
        "visibility_requested": request.visibility,
        "content": request.content,
        "title": request.title,
        "type": request.type,
        "tags": request.tags,
    }
    curator_output = curate_context(curator_input)
    decision = curator_output.lane.decision
    _create_curator_run(raw_id, curator_output, decision)

    if decision == "auto_curate":
        context_result = await _materialize_context(
            raw_id=raw_id,
            raw_title=request.title,
            raw_content=request.content,
            curator_output=curator_output,
            user=user,
            now=now,
            project_name=project_name,
            relation_type="CURATED_INTO",
            approval_status="safe",
            upload_channel=request.upload_channel,
            source_type=request.sourceType,
            tags=request.tags,
        )
        record_activity(
            event_type="context_ingested",
            title="Context auto-curated",
            description=f"{request.title} was ingested into the TeamGraph live brain.",
            actor=user,
            metadata={"raw_id": raw_id, "context_id": context_result["context_id"]},
        )
        return {
            "status": "success",
            "raw_id": raw_id,
            "context_id": context_result["context_id"],
            "decision": "auto_curate",
            "reason": curator_output.lane.reason,
            "graphiti": context_result["graphiti"],
        }

    if decision == "review":
        review_id = _queue_review_item(
            raw_id=raw_id,
            curator_output=curator_output,
            project_name=project_name,
            request=request,
            status="pending",
            now=now,
        )
        record_activity(
            event_type="context_review",
            title="Context queued for approval",
            description=f"{request.title} requires admin review before entering the brain.",
            actor=user,
            metadata={"raw_id": raw_id, "review_id": review_id},
        )
        return {
            "status": "success",
            "raw_id": raw_id,
            "review_id": review_id,
            "decision": "review",
            "reason": curator_output.lane.reason,
        }

    review_id = _queue_review_item(
        raw_id=raw_id,
        curator_output=curator_output,
        project_name=project_name,
        request=request,
        status="quarantined",
        now=now,
    )
    record_activity(
        event_type="context_quarantined",
        title="Context quarantined",
        description=f"{request.title} was quarantined and blocked from Graphiti ingestion.",
        actor=user,
        metadata={"raw_id": raw_id, "review_id": review_id},
    )
    return {
        "status": "success",
        "raw_id": raw_id,
        "review_id": review_id,
        "decision": "quarantine",
        "reason": curator_output.lane.reason,
    }


def list_inbox(user: dict) -> list[dict[str, Any]]:
    allowed_projects = get_user_project_names(user)
    query = """
    MATCH (r:RawContext)
    OPTIONAL MATCH (r)-[:CURATED_INTO|APPROVED_AS]->(c:Context)
    OPTIONAL MATCH (r)-[:QUEUED_AS]->(ri:ReviewItem)
    RETURN r, c, ri
    ORDER BY r.createdAt DESC
    LIMIT 100
    """
    results = neo4j_db.execute_query(query)
    inbox: list[dict[str, Any]] = []

    for record in results:
        raw = record["r"]
        context = record.get("c")
        review_item = record.get("ri")

        if user.get("role") != "admin":
            if raw.get("visibilityRequested") == "private" and raw.get("userId") != user.get("id"):
                continue
            project_requested = raw.get("projectRequested")
            if project_requested and project_requested not in allowed_projects:
                continue

        lane = "pending_review"
        if context:
            lane = "auto_curated"
        elif review_item and review_item.get("status") == "quarantined":
            lane = "quarantined"

        inbox.append(
            {
                "raw": raw,
                "context": context,
                "review_item": review_item,
                "lane": lane,
            }
        )

    return inbox


async def approve_review_item(review_id: str, approver: dict) -> dict[str, Any]:
    now = _utcnow()
    query = """
    MATCH (r:RawContext)-[:QUEUED_AS]->(ri:ReviewItem {id: $review_id})
    RETURN r, ri
    LIMIT 1
    """
    results = neo4j_db.execute_query(query, {"review_id": review_id})
    if not results:
        raise HTTPException(status_code=404, detail="Review item not found")

    raw = results[0]["r"]
    review_item = results[0]["ri"]
    project_name = review_item.get("proposedProject") or raw.get("projectRequested")

    curator_input = {
        "raw_context_id": raw["id"],
        "uploaded_by": raw.get("uploaderEmail"),
        "project": project_name,
        "visibility_requested": review_item.get("proposedVisibility") or raw.get("visibilityRequested"),
        "content": raw.get("content"),
        "title": review_item.get("proposedTitle") or raw.get("title"),
        "type": review_item.get("proposedContextType") or raw.get("contextType"),
        "tags": review_item.get("tags") or raw.get("tags") or [],
    }
    curator_output = curate_context(curator_input)
    curator_output.classification.canonical_title = review_item.get("proposedTitle") or curator_output.classification.canonical_title
    curator_output.classification.summary = review_item.get("proposedSummary") or curator_output.classification.summary
    curator_output.classification.suggested_visibility = review_item.get("proposedVisibility") or curator_output.classification.suggested_visibility
    curator_output.classification.context_type = review_item.get("proposedContextType") or curator_output.classification.context_type

    context_result = await _materialize_context(
        raw_id=raw["id"],
        raw_title=raw.get("title", "Approved Context"),
        raw_content=raw.get("content", ""),
        curator_output=curator_output,
        user={
            "id": raw.get("userId"),
            "email": raw.get("uploaderEmail"),
            "org_id": raw.get("organizationId", settings.teamgraph_org_id),
            "org_name": settings.teamgraph_org_name,
        },
        now=now,
        project_name=project_name,
        relation_type="APPROVED_AS",
        approval_status="approved",
        upload_channel=review_item.get("uploadChannel", raw.get("uploadChannel", "ui")),
        source_type=review_item.get("sourceType", raw.get("sourceType", "ui_upload")),
        tags=review_item.get("tags") or raw.get("tags") or [],
    )

    update_query = """
    MATCH (ri:ReviewItem {id: $review_id})
    SET ri.status = 'approved', ri.reviewedAt = $now, ri.updatedAt = $now
    RETURN ri
    """
    neo4j_db.execute_query(update_query, {"review_id": review_id, "now": now})

    record_activity(
        event_type="context_approved",
        title="Context approved",
        description=f"{raw.get('title', 'Context')} was approved and sent to the live brain.",
        actor=approver,
        metadata={"raw_id": raw["id"], "context_id": context_result["context_id"], "review_id": review_id},
    )
    return {"status": "approved", "context_id": context_result["context_id"], "graphiti": context_result["graphiti"]}


def reject_review_item(review_id: str, approver: dict) -> dict[str, Any]:
    now = _utcnow()
    query = """
    MATCH (r:RawContext)-[:QUEUED_AS]->(ri:ReviewItem {id: $review_id})
    SET ri.status = 'rejected', ri.reviewedAt = $now, ri.updatedAt = $now,
        r.approvalStatus = 'rejected', r.updatedAt = $now
    RETURN r, ri
    """
    results = neo4j_db.execute_query(query, {"review_id": review_id, "now": now})
    if not results:
        raise HTTPException(status_code=404, detail="Review item not found")

    raw = results[0]["r"]
    record_activity(
        event_type="context_rejected",
        title="Context rejected",
        description=f"{raw.get('title', 'Context')} was rejected and kept out of the live brain.",
        actor=approver,
        metadata={"raw_id": raw["id"], "review_id": review_id},
    )
    return {"status": "rejected"}
