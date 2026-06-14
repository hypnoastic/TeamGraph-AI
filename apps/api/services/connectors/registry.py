from __future__ import annotations

import datetime
import json
import uuid
from urllib.parse import urlencode

from sqlalchemy import select

from config import settings
from models import ConnectorAccount
from postgres import SessionLocal

from .base import ConnectorRecord


CONNECTOR_DESCRIPTIONS = {
    "github": "Ingest repositories, pull requests, issues, and docs into the TeamGraph live brain.",
    "slack": "Ingest channels, threads, and messages into the TeamGraph live brain.",
    "google-drive": "Ingest Drive documents, folders, and knowledge artifacts into the TeamGraph live brain.",
    "notion": "Workspace and doc ingestion is planned after the launch integrations.",
    "jira": "Ticket, epic, and decision ingestion is planned after the launch integrations.",
    "teams": "Team chat and meeting ingestion is planned after the launch integrations.",
    "outlook": "Email-driven context ingestion is planned after the launch integrations.",
}


def _connector_ready(provider: str) -> bool:
    if provider == "github":
        return all([settings.github_app_slug, settings.github_client_id, settings.github_client_secret, settings.github_private_key])
    if provider == "slack":
        return all([settings.slack_client_id, settings.slack_client_secret, settings.slack_signing_secret])
    if provider == "google-drive":
        return all([settings.google_client_id, settings.google_client_secret])
    return False


def _auth_url(provider: str) -> str | None:
    if provider == "github" and settings.github_app_slug:
        return f"https://github.com/apps/{settings.github_app_slug}/installations/new"
    if provider == "slack" and settings.slack_client_id:
        params = urlencode(
            {
                "client_id": settings.slack_client_id,
                "scope": settings.slack_bot_scopes,
                "redirect_uri": f"{settings.api_base_url}/connectors/slack/callback",
            }
        )
        return f"https://slack.com/oauth/v2/authorize?{params}"
    if provider == "google-drive" and settings.google_client_id:
        params = urlencode(
            {
                "client_id": settings.google_client_id,
                "redirect_uri": f"{settings.api_base_url}/connectors/google-drive/callback",
                "response_type": "code",
                "access_type": "offline",
                "prompt": "consent",
                "scope": settings.google_drive_scopes,
            }
        )
        return f"https://accounts.google.com/o/oauth2/v2/auth?{params}"
    return None


def _base_record(provider: str, account: ConnectorAccount | None) -> ConnectorRecord:
    ready = _connector_ready(provider)
    state = account.status if account else ("disconnected" if ready else "needs_config")
    mode = "live" if ready else "config_required"
    todo = (
        "Ready for OAuth/install and read-only sync."
        if ready
        else "Add provider credentials in the API environment to enable this connector."
    )
    names = {
        "github": "GitHub",
        "slack": "Slack",
        "google-drive": "Google Drive",
    }
    return ConnectorRecord(
        key=provider,
        name=names[provider],
        description=CONNECTOR_DESCRIPTIONS[provider],
        state=state,
        mode=mode,
        todo=todo,
        auth_url=_auth_url(provider),
        ready=ready,
        connected_account=account.display_name if account else None,
        last_synced_at=account.last_synced_at.isoformat() if account and account.last_synced_at else None,
    )


def list_connectors() -> list[dict]:
    with SessionLocal() as db:
        accounts = db.execute(
            select(ConnectorAccount).where(ConnectorAccount.organization_id == settings.teamgraph_org_id)
        ).scalars().all()
        by_provider = {account.provider: account for account in accounts}

        live_records = [
            _base_record("slack", by_provider.get("slack")),
            _base_record("github", by_provider.get("github")),
            _base_record("google-drive", by_provider.get("google-drive")),
        ]
        demo_records = [
            ConnectorRecord(
                key="notion",
                name="Notion",
                description=CONNECTOR_DESCRIPTIONS["notion"],
                state="coming_soon",
                mode="demo",
                todo="Planned after GitHub, Slack, and Google Drive.",
            ),
            ConnectorRecord(
                key="jira",
                name="Jira",
                description=CONNECTOR_DESCRIPTIONS["jira"],
                state="coming_soon",
                mode="demo",
                todo="Planned after GitHub, Slack, and Google Drive.",
            ),
            ConnectorRecord(
                key="teams",
                name="Teams",
                description=CONNECTOR_DESCRIPTIONS["teams"],
                state="coming_soon",
                mode="demo",
                todo="Planned after GitHub, Slack, and Google Drive.",
            ),
            ConnectorRecord(
                key="outlook",
                name="Outlook",
                description=CONNECTOR_DESCRIPTIONS["outlook"],
                state="coming_soon",
                mode="demo",
                todo="Planned after GitHub, Slack, and Google Drive.",
            ),
        ]
        return [record.__dict__ for record in live_records + demo_records]


def mark_connector_connected(provider: str, external_id: str | None, display_name: str | None) -> dict:
    with SessionLocal() as db:
        account = db.execute(
            select(ConnectorAccount).where(
                ConnectorAccount.organization_id == settings.teamgraph_org_id,
                ConnectorAccount.provider == provider,
            )
        ).scalar_one_or_none()
        if account is None:
            account = ConnectorAccount(
                id=f"conn_{uuid.uuid4().hex[:12]}",
                organization_id=settings.teamgraph_org_id,
                provider=provider,
                mode="live",
                status="connected",
                display_name=display_name,
                external_id=external_id,
                metadata_json="{}",
            )
            db.add(account)
        else:
            account.status = "connected"
            account.mode = "live"
            account.display_name = display_name or account.display_name
            account.external_id = external_id or account.external_id
            account.updated_at = datetime.datetime.utcnow()
        db.commit()
        return {"status": "connected", "provider": provider}


def disconnect_connector(provider: str) -> dict:
    with SessionLocal() as db:
        account = db.execute(
            select(ConnectorAccount).where(
                ConnectorAccount.organization_id == settings.teamgraph_org_id,
                ConnectorAccount.provider == provider,
            )
        ).scalar_one_or_none()
        if account is None:
            return {"status": "disconnected", "provider": provider}
        account.status = "disconnected"
        account.updated_at = datetime.datetime.utcnow()
        db.commit()
        return {"status": "disconnected", "provider": provider}


def mark_connector_synced(provider: str) -> dict:
    with SessionLocal() as db:
        account = db.execute(
            select(ConnectorAccount).where(
                ConnectorAccount.organization_id == settings.teamgraph_org_id,
                ConnectorAccount.provider == provider,
            )
        ).scalar_one_or_none()
        if account is None:
            return {"status": "missing", "provider": provider}
        account.last_synced_at = datetime.datetime.utcnow()
        metadata = json.loads(account.metadata_json or "{}")
        metadata["lastSyncStatus"] = "manual_sync_triggered"
        account.metadata_json = json.dumps(metadata)
        account.updated_at = datetime.datetime.utcnow()
        db.commit()
        return {
            "status": "sync_triggered",
            "provider": provider,
            "last_synced_at": account.last_synced_at.isoformat(),
        }
