from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class GraphitiHealth(BaseModel):
    mode: str = "fallback"
    provider: str = "mock"
    status: str = "degraded"
    reason: str | None = None
    initialized_at: datetime | None = None
    group_id: str = "org_1"


class EpisodeMetadata(BaseModel):
    raw_context_id: str
    context_id: str | None = None
    organization_id: str
    organization_name: str | None = None
    project_id: str | None = None
    project_name: str | None = None
    user_id: str | None = None
    uploader_email: str | None = None
    source_type: str
    context_type: str = "note"
    visibility: str = "project"
    tags: list[str] = Field(default_factory=list)
    upload_channel: str = "ui"
    approval_status: str = "safe"
    created_at: datetime
    scope_keys: list[str] = Field(default_factory=list)


class EpisodeIngestionResult(BaseModel):
    mode: str
    provider: str
    status: str
    episode_uuid: str | None = None
    group_id: str | None = None
    reason: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class SearchCitation(BaseModel):
    context_id: str | None = None
    graphiti_episode_uuid: str | None = None
    title: str
    summary: str | None = None
    source_type: str | None = None
    project_name: str | None = None
    uploader_email: str | None = None
    created_at: str | None = None
    score: float | None = None


class SearchFact(BaseModel):
    id: str
    label: str
    kind: str
    summary: str | None = None


class BrainSearchResult(BaseModel):
    mode: str
    provider: str
    answer_context: str
    citations: list[SearchCitation] = Field(default_factory=list)
    related_facts: list[SearchFact] = Field(default_factory=list)
    timeline: list[dict[str, Any]] = Field(default_factory=list)
    confidence: float = 0.0
    reason: str | None = None
