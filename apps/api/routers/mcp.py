from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import Optional, List
from config import settings
from services.context_service import process_upload, UploadContextRequest
from services.brain_service import execute_brain_query, BrainQueryRequest
from services.optimizer import run_optimizer
from database import neo4j_db

router = APIRouter(prefix="/mcp", tags=["mcp"])

def verify_mcp_key(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid MCP API key")
    
    token = authorization.split(" ")[1]
    
    # We validate the API key. For P0, checking against static config or db
    # In a real scenario we'd hash it and query Neo4j.
    # To keep simple, let's just check if it's the static dev key or if it exists in db.
    if token == settings.teamgraph_api_key:
        return {"id": "mcp_dev", "email": "mcp_agent@teamgraph.local", "role": "member"}
        
    # Check DB
    import hashlib
    key_hash = hashlib.sha256(token.encode()).hexdigest()
    query = "MATCH (u:User)-[:OWNS_API_KEY]->(k:ApiKeyRef {keyHash: $hash, status: 'active'}) RETURN u"
    res = neo4j_db.execute_query(query, {"hash": key_hash})
    if not res:
        raise HTTPException(status_code=401, detail="Invalid API key")
        
    return res[0]["u"]

@router.post("/validate-key")
def validate_key(user: dict = Depends(verify_mcp_key)):
    return {"status": "valid"}

@router.get("/tools")
def get_tools(user: dict = Depends(verify_mcp_key)):
    return {
        "tools": [
            {"name": "get_context", "description": "Get brain context by query"},
            {"name": "upload_context", "description": "Upload new context"},
            {"name": "optimize_graph", "description": "Optimize the context graph"}
        ]
    }

@router.post("/tool/get-context")
def tool_get_context(request: BrainQueryRequest, user: dict = Depends(verify_mcp_key)):
    return execute_brain_query(request, user)

@router.post("/tool/upload-context")
def tool_upload_context(request: UploadContextRequest, user: dict = Depends(verify_mcp_key)):
    return process_upload(request, user)

@router.post("/tool/optimize-graph")
def tool_optimize_graph(user: dict = Depends(verify_mcp_key)):
    return run_optimizer()
