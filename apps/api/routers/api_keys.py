import datetime
import json
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from auth.api_keys import generate_api_key, validate_scopes
from auth.demo_auth import get_current_user
from models import ApiKeyRecord
from postgres import get_db
from services.team_service import user_can_access_project


router = APIRouter(prefix="/api-keys", tags=["api-keys"])

ALLOWED_SCOPES = ["context.read", "context.write", "graph.optimize"]


class CreateApiKeyRequest(BaseModel):
    purpose: str
    scopes: list[str]
    project_id: str | None = None
    project_name: str | None = None


class ApiKeyResponse(BaseModel):
    id: str
    raw_key: str | None = None
    key_prefix: str
    purpose: str
    scopes: list[str] = Field(default_factory=list)
    status: str
    project_name: str | None = None
    created_at: str
    last_used_at: str | None = None


@router.post("", response_model=ApiKeyResponse)
def create_api_key(
    request: CreateApiKeyRequest,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not validate_scopes(request.scopes, ALLOWED_SCOPES):
        raise HTTPException(status_code=400, detail="One or more requested scopes are invalid.")

    if request.project_name and not user_can_access_project(user, request.project_name):
        raise HTTPException(status_code=403, detail="You do not have access to that project.")
    if user["role"] != "admin" and "graph.optimize" in request.scopes:
        raise HTTPException(status_code=403, detail="Members cannot create optimizer-scoped API keys.")

    raw_key, key_hash, prefix = generate_api_key()
    created_at = datetime.datetime.utcnow()
    key = ApiKeyRecord(
        id=f"key_{uuid.uuid4().hex[:12]}",
        user_id=user["id"],
        key_hash=key_hash,
        key_prefix=prefix,
        purpose=request.purpose,
        scopes=json.dumps(request.scopes),
        status="active",
        project_name=request.project_name,
        created_at=created_at,
    )
    db.add(key)
    db.commit()

    return {
        "id": key.id,
        "raw_key": raw_key,
        "key_prefix": key.key_prefix,
        "purpose": key.purpose,
        "scopes": request.scopes,
        "status": key.status,
        "project_name": key.project_name,
        "created_at": created_at.isoformat(),
        "last_used_at": None,
    }


@router.get("", response_model=list[ApiKeyResponse])
def list_api_keys(user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    keys = db.execute(
        select(ApiKeyRecord).where(ApiKeyRecord.user_id == user["id"]).order_by(ApiKeyRecord.created_at.desc())
    ).scalars().all()
    return [
        {
            "id": key.id,
            "key_prefix": key.key_prefix,
            "purpose": key.purpose,
            "scopes": json.loads(key.scopes),
            "status": key.status,
            "project_name": key.project_name,
            "created_at": key.created_at.isoformat(),
            "last_used_at": key.last_used_at.isoformat() if key.last_used_at else None,
        }
        for key in keys
    ]


@router.delete("/{key_id}")
def revoke_api_key(key_id: str, user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    key = db.execute(
        select(ApiKeyRecord).where(ApiKeyRecord.id == key_id, ApiKeyRecord.user_id == user["id"])
    ).scalar_one_or_none()
    if key is None:
        raise HTTPException(status_code=404, detail="API key not found or not owned by user")
    key.status = "revoked"
    db.commit()
    return {"status": "success"}
