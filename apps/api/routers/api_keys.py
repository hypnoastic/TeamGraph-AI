from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
import uuid
from auth.demo_auth import get_current_user
from auth.api_keys import generate_api_key
from database import neo4j_db
import datetime

router = APIRouter(prefix="/api-keys", tags=["api-keys"])

class CreateApiKeyRequest(BaseModel):
    purpose: str
    scopes: List[str]
    project_id: str | None = None

class ApiKeyResponse(BaseModel):
    id: str
    raw_key: str | None = None
    key_prefix: str
    scopes: List[str]
    status: str
    created_at: str

@router.post("/", response_model=ApiKeyResponse)
def create_api_key(request: CreateApiKeyRequest, user: dict = Depends(get_current_user)):
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
        purpose: $purpose,
        scopes: $scopes,
        status: 'active',
        createdAt: $created_at
    })
    MERGE (u)-[:OWNS_API_KEY]->(k)
    RETURN k
    """
    
    params = {
        "user_id": user["id"],
        "key_id": key_id,
        "key_hash": key_hash,
        "prefix": prefix,
        "project_id": request.project_id,
        "purpose": request.purpose,
        "scopes": request.scopes,
        "created_at": created_at
    }
    
    result = neo4j_db.execute_query(query, params)
    if not result:
        raise HTTPException(status_code=500, detail="Failed to create API key")
        
    node = result[0]["k"]
    
    return {
        "id": node["id"],
        "raw_key": raw_key,
        "key_prefix": node["keyPrefix"],
        "scopes": node["scopes"],
        "status": node["status"],
        "created_at": node["createdAt"]
    }

@router.get("/", response_model=List[ApiKeyResponse])
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
        keys.append({
            "id": node["id"],
            "key_prefix": node["keyPrefix"],
            "scopes": node["scopes"],
            "status": node["status"],
            "created_at": node["createdAt"]
        })
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
