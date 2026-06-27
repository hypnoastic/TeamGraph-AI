from datetime import datetime
from typing import Any

from .schemas import EpisodeMetadata


def build_episode_body(title: str, content: str, metadata: EpisodeMetadata, summary: str | None = None) -> str:
    lines = [
        f"title: {title}",
        f"context_id: {metadata.context_id or ''}",
        f"raw_context_id: {metadata.raw_context_id}",
        f"summary: {summary or ''}",
        f"context_type: {metadata.context_type}",
        f"visibility: {metadata.visibility}",
        f"source_type: {metadata.source_type}",
        f"upload_channel: {metadata.upload_channel}",
        f"approval_status: {metadata.approval_status}",
        f"organization_id: {metadata.organization_id}",
        f"project_id: {metadata.project_id or ''}",
        f"user_id: {metadata.user_id or ''}",
        f"uploader_email: {metadata.uploader_email or ''}",
        f"tags: {', '.join(metadata.tags)}",
        "",
        content,
    ]
    return "\n".join(lines).strip()


def build_episode_name(title: str, metadata: EpisodeMetadata) -> str:
    prefix = metadata.project_name or metadata.organization_name or metadata.organization_id
    return f"{prefix} :: {title}"


def build_episode_payload(
    *,
    title: str,
    content: str,
    metadata: EpisodeMetadata,
    summary: str | None = None,
    group_id: str,
) -> dict[str, Any]:
    return {
        "name": build_episode_name(title, metadata),
        "episode_body": build_episode_body(title, content, metadata, summary=summary),
        "source_description": metadata.source_type,
        "reference_time": metadata.created_at if isinstance(metadata.created_at, datetime) else datetime.utcnow(),
        "group_id": group_id,
    }
