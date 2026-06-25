from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from postgres import Base


class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    domain: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    organization_id: Mapped[str] = mapped_column(ForeignKey("organizations.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    visibility: Mapped[str] = mapped_column(String(32), default="org", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (UniqueConstraint("organization_id", "name", name="uq_projects_org_name"),)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    organization_id: Mapped[str | None] = mapped_column(ForeignKey("organizations.id"), nullable=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(32), default="member", nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class UserProjectAccess(Base):
    __tablename__ = "user_project_access"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id"), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (UniqueConstraint("user_id", "project_id", name="uq_user_project_access"),)


class SessionToken(Base):
    __tablename__ = "session_tokens"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    token_hash: Mapped[str] = mapped_column(String(128), unique=True, nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class ApiKeyRecord(Base):
    __tablename__ = "api_keys"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    key_hash: Mapped[str] = mapped_column(String(128), unique=True, nullable=False, index=True)
    key_prefix: Mapped[str] = mapped_column(String(16), nullable=False)
    purpose: Mapped[str] = mapped_column(String(255), nullable=False)
    scopes: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="active", nullable=False)
    project_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class ActivityRecord(Base):
    __tablename__ = "activity_events"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    organization_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    type: Mapped[str] = mapped_column(String(64), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    actor_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    actor_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    metadata_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class ConnectorAccount(Base):
    __tablename__ = "connector_accounts"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    organization_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    provider: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(32), default="disconnected", nullable=False)
    mode: Mapped[str] = mapped_column(String(32), default="demo", nullable=False)
    external_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    display_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    access_token: Mapped[str | None] = mapped_column(Text, nullable=True)
    refresh_token: Mapped[str | None] = mapped_column(Text, nullable=True)
    metadata_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    last_synced_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (UniqueConstraint("organization_id", "provider", name="uq_connector_org_provider"),)


class Invitation(Base):
    __tablename__ = "invitations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    organization_id: Mapped[str] = mapped_column(ForeignKey("organizations.id"), nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(32), default="member", nullable=False)
    project_ids_json: Mapped[str] = mapped_column(Text, default="[]", nullable=False)
    token_hash: Mapped[str] = mapped_column(String(128), unique=True, nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(32), default="pending", nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    created_by_user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    accepted_by_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class RawContextRecord(Base):
    __tablename__ = "raw_context_uploads"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    organization_id: Mapped[str] = mapped_column(ForeignKey("organizations.id"), nullable=False, index=True)
    project_id: Mapped[str | None] = mapped_column(ForeignKey("projects.id"), nullable=True, index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    context_type: Mapped[str] = mapped_column(String(64), default="note", nullable=False)
    source_type: Mapped[str] = mapped_column(String(64), nullable=False)
    upload_channel: Mapped[str] = mapped_column(String(32), nullable=False)
    visibility: Mapped[str] = mapped_column(String(32), nullable=False)
    tags_json: Mapped[str] = mapped_column(Text, default="[]", nullable=False)
    approval_status: Mapped[str] = mapped_column(String(32), default="pending", nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class ContextRecord(Base):
    __tablename__ = "context_records"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    raw_context_id: Mapped[str] = mapped_column(ForeignKey("raw_context_uploads.id"), nullable=False, index=True)
    organization_id: Mapped[str] = mapped_column(ForeignKey("organizations.id"), nullable=False, index=True)
    project_id: Mapped[str | None] = mapped_column(ForeignKey("projects.id"), nullable=True, index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    context_type: Mapped[str] = mapped_column(String(64), nullable=False)
    source_type: Mapped[str] = mapped_column(String(64), nullable=False)
    upload_channel: Mapped[str] = mapped_column(String(32), nullable=False)
    visibility: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    approval_status: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    quality_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    tags_json: Mapped[str] = mapped_column(Text, default="[]", nullable=False)
    risk_tags_json: Mapped[str] = mapped_column(Text, default="[]", nullable=False)
    graphiti_episode_uuid: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    graphiti_group_id: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    brain_mode: Mapped[str] = mapped_column(String(32), default="fallback", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class ApprovalRecord(Base):
    __tablename__ = "approval_items"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    raw_context_id: Mapped[str] = mapped_column(ForeignKey("raw_context_uploads.id"), nullable=False, index=True)
    organization_id: Mapped[str] = mapped_column(ForeignKey("organizations.id"), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(32), default="pending", nullable=False, index=True)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    risk_tags_json: Mapped[str] = mapped_column(Text, default="[]", nullable=False)
    quality_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    proposed_title: Mapped[str] = mapped_column(String(255), nullable=False)
    proposed_summary: Mapped[str] = mapped_column(Text, nullable=False)
    proposed_context_type: Mapped[str] = mapped_column(String(64), nullable=False)
    proposed_visibility: Mapped[str] = mapped_column(String(32), nullable=False)
    reviewed_by_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class IntegrationOAuthState(Base):
    __tablename__ = "integration_oauth_states"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    state_hash: Mapped[str] = mapped_column(String(128), unique=True, nullable=False, index=True)
    provider: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    organization_id: Mapped[str] = mapped_column(ForeignKey("organizations.id"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    redirect_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class IntegrationConnection(Base):
    __tablename__ = "integration_connections"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    organization_id: Mapped[str] = mapped_column(ForeignKey("organizations.id"), nullable=False, index=True)
    provider: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(32), default="connected", nullable=False)
    
    # Encrypted tokens
    access_token_enc: Mapped[str | None] = mapped_column(Text, nullable=True)
    refresh_token_enc: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Identity and display information
    external_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    display_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    metadata_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    config_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    connected_by_user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    last_synced_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    __table_args__ = (UniqueConstraint("organization_id", "provider", name="uq_integration_org_provider"),)
