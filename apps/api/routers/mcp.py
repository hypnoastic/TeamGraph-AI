from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel

from auth.api_keys import has_scope, hash_api_key
from config import settings
from database import neo4j_db
from services.brain_service import BrainQueryRequest, execute_brain_query
from services.context_service import UploadContextRequest, process_upload
from services.optimizer import run_optimizer


router = APIRouter(prefix="/mcp", tags=["mcp"])


class ProjectRequest(BaseModel):
    project: str


class UserContextRequest(BaseModel):
    user_id: str | None = None
    query: str | None = None


class HandoffRequest(BaseModel):
    query: str


def verify_mcp_key(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid MCP API key")

    token = authorization.split(" ")[1]
    if token == settings.teamgraph_api_key:
        return {
            "id": "mcp_dev",
            "email": "mcp_agent@teamgraph.local",
            "role": "member",
            "org_id": settings.teamgraph_org_id,
            "org_name": settings.teamgraph_org_name,
            "project_names": [settings.teamgraph_default_project],
            "scopes": ["*"],
            "key_id": "dev",
        }

    key_hash = hash_api_key(token)
    query = """
    MATCH (u:User)-[:OWNS_API_KEY]->(k:ApiKeyRef {keyHash: $hash, status: 'active'})
    OPTIONAL MATCH (u)-[:CAN_ACCESS]->(p:Project)
    RETURN u, k, collect(DISTINCT p.name) AS projects
    LIMIT 1
    """
    results = neo4j_db.execute_query(query, {"hash": key_hash})
    if not results:
        raise HTTPException(status_code=401, detail="Invalid API key")

    user = results[0]["u"]
    key = results[0]["k"]
    projects = [project for project in results[0].get("projects", []) if project]
    scopes = key.get("scopes", [])
    if isinstance(scopes, str):
        scopes = [scopes]

    neo4j_db.execute_query(
        """
        MATCH (k:ApiKeyRef {id: $key_id})
        SET k.lastUsedAt = $now
        """,
        {"key_id": key["id"], "now": __import__("datetime").datetime.utcnow().isoformat()},
    )

    return {
        "id": user.get("id"),
        "email": user.get("email"),
        "role": user.get("role", "member"),
        "org_id": settings.teamgraph_org_id,
        "org_name": settings.teamgraph_org_name,
        "project_names": projects,
        "scopes": scopes,
        "key_id": key.get("id"),
    }


def require_scope(user: dict, required_scope: str) -> dict:
    if not has_scope(required_scope, user.get("scopes", [])):
        raise HTTPException(status_code=403, detail=f"Missing required scope: {required_scope}")
    return user


@router.post("/validate-key")
def validate_key(user: dict = Depends(verify_mcp_key)):
    return {"status": "valid", "scopes": user.get("scopes", [])}


@router.get("/tools")
def get_tools(user: dict = Depends(verify_mcp_key)):
    return {
        "tools": [
            {"name": "get_context", "description": "Get live brain context for a query", "scope": "context.read"},
            {"name": "search_context_graph", "description": "Search the context graph", "scope": "context.read"},
            {"name": "get_project_context", "description": "Get project-scoped context", "scope": "context.read"},
            {"name": "get_user_context", "description": "Get user-scoped context", "scope": "context.read"},
            {"name": "get_handoff_context", "description": "Get handoff context", "scope": "context.read"},
            {"name": "upload_context", "description": "Upload new context", "scope": "context.write"},
            {"name": "list_context_sources", "description": "List context sources by type", "scope": "context.read"},
            {"name": "optimize_graph", "description": "Optimize the live brain graph", "scope": "graph.optimize"},
        ]
    }


@router.post("/tool/get-context")
async def tool_get_context(request: BrainQueryRequest, user: dict = Depends(verify_mcp_key)):
    require_scope(user, "context.read")
    return await execute_brain_query(request, user)


@router.post("/tool/search-context-graph")
async def tool_search_context_graph(request: BrainQueryRequest, user: dict = Depends(verify_mcp_key)):
    require_scope(user, "context.read")
    return await execute_brain_query(request, user)


@router.post("/tool/get-project-context")
async def tool_get_project_context(request: ProjectRequest, user: dict = Depends(verify_mcp_key)):
    require_scope(user, "context.read")
    return await execute_brain_query(
        BrainQueryRequest(query=request.project, project=request.project),
        user,
    )


@router.post("/tool/get-user-context")
async def tool_get_user_context(request: UserContextRequest, user: dict = Depends(verify_mcp_key)):
    require_scope(user, "context.read")
    query = request.query or request.user_id or user["email"]
    return await execute_brain_query(BrainQueryRequest(query=query), user)


@router.post("/tool/get-handoff-context")
async def tool_get_handoff_context(request: HandoffRequest, user: dict = Depends(verify_mcp_key)):
    require_scope(user, "context.read")
    return await execute_brain_query(BrainQueryRequest(query=request.query), user)


@router.post("/tool/upload-context")
async def tool_upload_context(request: UploadContextRequest, user: dict = Depends(verify_mcp_key)):
    require_scope(user, "context.write")
    mcp_request = request.model_copy(update={"upload_channel": "mcp"})
    return await process_upload(mcp_request, user)


@router.get("/tool/list-context-sources")
def tool_list_context_sources(user: dict = Depends(verify_mcp_key)):
    require_scope(user, "context.read")
    query = """
    MATCH (c:Context)
    RETURN c.sourceType AS sourceType, count(*) AS count
    ORDER BY count DESC, sourceType ASC
    """
    results = neo4j_db.execute_query(query)
    return {"sources": results}


@router.post("/tool/optimize-graph")
def tool_optimize_graph(user: dict = Depends(verify_mcp_key)):
    require_scope(user, "graph.optimize")
    return run_optimizer()
