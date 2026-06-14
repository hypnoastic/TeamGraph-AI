from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse

from auth.demo_auth import get_current_user
from services.activity_service import record_activity
from services.connectors.registry import (
    disconnect_connector,
    list_connectors,
    mark_connector_connected,
    mark_connector_synced,
)


router = APIRouter(prefix="/connectors", tags=["connectors"])

LIVE_PROVIDERS = {"github", "slack", "google-drive"}


def _require_provider(provider: str) -> None:
    if provider not in LIVE_PROVIDERS:
        raise HTTPException(status_code=404, detail="Connector provider not found.")


@router.get("/")
def get_connectors(user: dict = Depends(get_current_user)):
    return {"connectors": list_connectors()}


@router.get("/{provider}/start")
def start_connector(provider: str, user: dict = Depends(get_current_user)):
    _require_provider(provider)
    connectors = {connector["key"]: connector for connector in list_connectors()}
    connector = connectors[provider]
    if not connector.get("ready") or not connector.get("auth_url"):
        raise HTTPException(status_code=400, detail="Connector credentials are not configured on the backend.")

    record_activity(
        event_type="connector.start",
        title=f"Connector start: {provider}",
        description=f"{user['email']} initiated the {provider} connector flow.",
        actor=user,
        metadata={"provider": provider},
    )
    return {"auth_url": connector["auth_url"]}


@router.get("/{provider}/callback")
def connector_callback(
    provider: str,
    code: str | None = Query(default=None),
    installation_id: str | None = Query(default=None),
    team_id: str | None = Query(default=None),
):
    _require_provider(provider)
    identifier = installation_id or team_id or code
    mark_connector_connected(provider, identifier, f"{provider.title()} Workspace")
    record_activity(
        event_type="connector.connected",
        title=f"Connector connected: {provider}",
        description=f"{provider} connector callback completed.",
        metadata={"provider": provider, "identifier": identifier},
    )
    return RedirectResponse(url="/dashboard/connectors")


@router.post("/{provider}/sync")
def sync_connector(provider: str, user: dict = Depends(get_current_user)):
    _require_provider(provider)
    result = mark_connector_synced(provider)
    record_activity(
        event_type="connector.sync",
        title=f"Connector sync: {provider}",
        description=f"{user['email']} triggered a {provider} sync.",
        actor=user,
        metadata=result,
    )
    return result


@router.post("/{provider}/disconnect")
def disconnect(provider: str, user: dict = Depends(get_current_user)):
    _require_provider(provider)
    result = disconnect_connector(provider)
    record_activity(
        event_type="connector.disconnect",
        title=f"Connector disconnected: {provider}",
        description=f"{user['email']} disconnected {provider}.",
        actor=user,
        metadata=result,
    )
    return result
