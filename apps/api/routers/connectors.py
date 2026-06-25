import uuid
import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select

from auth.demo_auth import get_current_user
from postgres import get_db
from models import ConnectorAccount
from services.connectors.registry import list_connectors, is_connector_configured

router = APIRouter(prefix="/connectors", tags=["connectors"])


@router.get("/")
def get_connectors(
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Fetch active integration accounts for organization
    rows = db.execute(
        select(ConnectorAccount).where(ConnectorAccount.organization_id == user["org_id"])
    ).scalars().all()
    connected_map = {conn.provider: conn for conn in rows}

    return {"connectors": list_connectors(connected_map)}


@router.post("/{provider}/connect")
def connect_connector(
    provider: str,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only organization administrators can manage connectors."
        )

    if not is_connector_configured(provider):
        raise HTTPException(
            status_code=400,
            detail=f"Connector '{provider}' is not configured in the environment. Please add keys to .env."
        )

    # Check if already connected
    existing = db.execute(
        select(ConnectorAccount).where(
            ConnectorAccount.organization_id == user["org_id"],
            ConnectorAccount.provider == provider,
        )
    ).scalar_one_or_none()

    if existing:
        existing.status = "connected"
        existing.updated_at = datetime.datetime.utcnow()
        existing.display_name = f"Demo {provider.title()} Workspace"
        existing.last_synced_at = datetime.datetime.utcnow()
    else:
        new_conn = ConnectorAccount(
            id=f"conn_{uuid.uuid4().hex[:12]}",
            organization_id=user["org_id"],
            provider=provider,
            status="connected",
            mode="demo",
            display_name=f"Demo {provider.title()} Workspace",
            last_synced_at=datetime.datetime.utcnow(),
        )
        db.add(new_conn)

    db.commit()
    return {"status": "success", "message": f"Connected {provider} successfully."}


@router.post("/{provider}/disconnect")
def disconnect_connector(
    provider: str,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only organization administrators can manage connectors."
        )

    existing = db.execute(
        select(ConnectorAccount).where(
            ConnectorAccount.organization_id == user["org_id"],
            ConnectorAccount.provider == provider,
        )
    ).scalar_one_or_none()

    if not existing:
        raise HTTPException(status_code=404, detail="Connector account not found.")

    existing.status = "disconnected"
    existing.updated_at = datetime.datetime.utcnow()
    db.commit()
    return {"status": "success", "message": f"Disconnected {provider} successfully."}
