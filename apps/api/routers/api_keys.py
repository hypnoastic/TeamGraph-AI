import datetime
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from auth.api_keys import generate_api_key, validate_scopes
from auth.demo_auth import get_current_user
from database import neo4j_db
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


def _requested_project_name(request: CreateApiKeyRequest) -> str | None:
    return request.project_name


@router.post("/", response_model=ApiKeyResponse)
def create_api_key(request: CreateApiKeyRequest, user: dict = Depends(get_current_user)):
    if not validate_scopes(request.scopes, ALLOWED_SCOPES):
        raise HTTPException(status_code=400, detail="One or more requested scopes are invalid.")

    project_name = _requested_project_name(request)
    if project_name and not user_can_access_project(user, project_name):
        raise HTTPException(status_code=403, detail="You do not have access to that project.")

    if user["role"] != "admin" and "graph.optimize" in request.scopes:
        raise HTTPException(status_code=403, detail="Members cannot create optimizer-scoped API keys.")

    raw_key, key_hash, prefix = generate_api_key()
    key_id = f"key_{uuid.uuid4().hex[:12]}"
    created_at = datetime.datetime.utcnow().isoformat()

    query = """
    MATCH (u:User {id: $user_id})
    CREATE (k:ApiKeyRef {
        id: $key_id,
        keyHash: $key_hash,
        keyPrefix: $prefix,
        userId: $user_id,
        projectId: $project_id,
        projectName: $project_name,
        purpose: $purpose,
        scopes: $scopes,
        status: 'active',
        createdAt: $created_at,
        lastUsedAt: null
    })
    MERGE (u)-[:OWNS_API_KEY]->(k)
    RETURN k
    """
    result = neo4j_db.execute_query(
        query,
        {
            "user_id": user["id"],
            "key_id": key_id,
            "key_hash": key_hash,
            "prefix": prefix,
            "project_id": request.project_id,
            "project_name": project_name,
            "purpose": request.purpose,
            "scopes": request.scopes,
            "created_at": created_at,
        },
    )
    if not result:
        raise HTTPException(status_code=500, detail="Failed to create API key")

    node = result[0]["k"]
    return {
        "id": node["id"],
        "raw_key": raw_key,
        "key_prefix": node["keyPrefix"],
        "purpose": node["purpose"],
        "scopes": node["scopes"],
        "status": node["status"],
        "project_name": node.get("projectName"),
        "created_at": node["createdAt"],
        "last_used_at": node.get("lastUsedAt"),
    }


@router.get("/", response_model=list[ApiKeyResponse])
def list_api_keys(user: dict = Depends(get_current_user)):
    query = """
    MATCH (u:User {id: $user_id})-[:OWNS_API_KEY]->(k:ApiKeyRef)
    RETURN k
    ORDER BY k.createdAt DESC
    """
    results = neo4j_db.execute_query(query, {"user_id": user["id"]})
    keys = []
    for record in results:
        node = record["k"]
        keys.append(
            {
                "id": node["id"],
                "key_prefix": node["keyPrefix"],
                "purpose": node.get("purpose", "API key"),
                "scopes": node.get("scopes", []),
                "status": node["status"],
                "project_name": node.get("projectName"),
                "created_at": node["createdAt"],
                "last_used_at": node.get("lastUsedAt"),
            }
        )
    return keys


@router.delete("/{key_id}")
def revoke_api_key(key_id: str, user: dict = Depends(get_current_user)):
    query = """
    MATCH (u:User {id: $user_id})-[:OWNS_API_KEY]->(k:ApiKeyRef {id: $key_id})
    SET k.status = 'revoked'
    RETURN k
    """
    result = neo4j_db.execute_query(query, {"user_id": user["id"], "key_id": key_id})
    if not result:
        raise HTTPException(status_code=404, detail="API key not found or not owned by user")
    return {"status": "success"}
