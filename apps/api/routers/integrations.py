import uuid
import datetime
import json
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy import select

from auth.demo_auth import get_current_user
from postgres import get_db
from models import IntegrationOAuthState, IntegrationConnection, ConnectorAccount
from config import settings
from utils.encryption import encrypt_token
from services.integrations.registry import get_provider
from services.connectors.registry import list_connectors

router = APIRouter(prefix="/integrations", tags=["integrations"])


@router.get("/")
def get_integrations(
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # For backwards compatibility with frontend, map IntegrationConnection back to the format expected
    rows = db.execute(
        select(IntegrationConnection).where(IntegrationConnection.organization_id == user["org_id"])
    ).scalars().all()
    
    # We still have ConnectorAccount that was used. To avoid breaking UI immediately,
    # we can also fetch those, or just treat IntegrationConnection as the source of truth.
    connected_map = {}
    for conn in rows:
        connected_map[conn.provider] = type('obj', (object,), {
            'provider': conn.provider,
            'status': conn.status,
            'display_name': conn.display_name,
            'updated_at': conn.updated_at
        })()

    return {"connectors": list_connectors(connected_map)}


@router.get("/{provider}/connect")
def connect_integration(
    provider: str,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only organization administrators can manage integrations."
        )

    try:
        integration_provider = get_provider(provider)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    state_hash = uuid.uuid4().hex
    oauth_state = IntegrationOAuthState(
        id=f"state_{uuid.uuid4().hex[:12]}",
        state_hash=state_hash,
        provider=provider,
        organization_id=user["org_id"],
        user_id=user["sub"],
        expires_at=datetime.datetime.utcnow() + datetime.timedelta(minutes=15)
    )
    db.add(oauth_state)
    db.commit()

    auth_url = integration_provider.get_authorization_url(state=state_hash)
    
    return {"url": auth_url}


@router.get("/{provider}/callback")
async def integration_callback(
    provider: str,
    request: Request,
    state: str = Query(None),
    code: str = Query(None),
    installation_id: str = Query(None),
    setup_action: str = Query(None),
    db: Session = Depends(get_db)
):
    # GitHub App flow uses installation_id instead of code
    if provider == "github" and installation_id:
        code = installation_id

    if not state:
        raise HTTPException(status_code=400, detail="State parameter is missing.")
    if not code:
        raise HTTPException(status_code=400, detail="Code/Installation ID parameter is missing.")

    oauth_state = db.execute(
        select(IntegrationOAuthState).where(
            IntegrationOAuthState.state_hash == state,
            IntegrationOAuthState.provider == provider,
            IntegrationOAuthState.expires_at > datetime.datetime.utcnow()
        )
    ).scalar_one_or_none()

    if not oauth_state:
        raise HTTPException(status_code=400, detail="Invalid or expired state.")

    try:
        integration_provider = get_provider(provider)
        token_data = await integration_provider.exchange_code_for_tokens(code)
        identity = await integration_provider.get_identity(token_data.get("access_token"))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Integration failed: {str(e)}")

    existing = db.execute(
        select(IntegrationConnection).where(
            IntegrationConnection.organization_id == oauth_state.organization_id,
            IntegrationConnection.provider == provider,
        )
    ).scalar_one_or_none()

    if existing:
        existing.status = "connected"
        existing.access_token_enc = encrypt_token(token_data.get("access_token"))
        existing.refresh_token_enc = encrypt_token(token_data.get("refresh_token"))
        existing.external_id = identity.get("external_id")
        existing.display_name = identity.get("display_name")
        existing.metadata_json = json.dumps(identity.get("metadata", {}))
        existing.updated_at = datetime.datetime.utcnow()
        existing.last_synced_at = datetime.datetime.utcnow()
        existing.connected_by_user_id = oauth_state.user_id
    else:
        new_conn = IntegrationConnection(
            id=f"conn_{uuid.uuid4().hex[:12]}",
            organization_id=oauth_state.organization_id,
            provider=provider,
            status="connected",
            access_token_enc=encrypt_token(token_data.get("access_token")),
            refresh_token_enc=encrypt_token(token_data.get("refresh_token")),
            external_id=identity.get("external_id"),
            display_name=identity.get("display_name"),
            metadata_json=json.dumps(identity.get("metadata", {})),
            connected_by_user_id=oauth_state.user_id,
            last_synced_at=datetime.datetime.utcnow()
        )
        db.add(new_conn)
    
    # Delete the used state
    db.delete(oauth_state)
    db.commit()

    frontend_redirect = f"{settings.frontend_origin}/dashboard/connectors"
    return RedirectResponse(url=frontend_redirect)


@router.post("/{provider}/disconnect")
def disconnect_integration(
    provider: str,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only organization administrators can manage integrations."
        )

    existing = db.execute(
        select(IntegrationConnection).where(
            IntegrationConnection.organization_id == user["org_id"],
            IntegrationConnection.provider == provider,
        )
    ).scalar_one_or_none()

    if not existing:
        raise HTTPException(status_code=404, detail="Integration connection not found.")

    existing.status = "disconnected"
    existing.access_token_enc = None
    existing.refresh_token_enc = None
    existing.updated_at = datetime.datetime.utcnow()
    db.commit()
    
    return {"status": "success", "message": f"Disconnected {provider} successfully."}
