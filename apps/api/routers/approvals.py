from fastapi import APIRouter, Depends, HTTPException
from auth.demo_auth import require_admin
from database import neo4j_db
import datetime
import uuid
import json

router = APIRouter(prefix="/approvals", tags=["approvals"])

@router.get("/")
def list_approvals(user: dict = Depends(require_admin)):
    query = """
    MATCH (r:RawContext)-[:QUEUED_AS]->(ri:ReviewItem {status: 'pending'})
    RETURN r, ri
    ORDER BY ri.createdAt DESC
    """
    results = neo4j_db.execute_query(query)
    
    approvals = []
    for rec in results:
        approvals.append({
            "raw": rec["r"],
            "review_item": rec["ri"]
        })
    return approvals

@router.post("/{review_id}/approve")
def approve_item(review_id: str, user: dict = Depends(require_admin)):
    now = datetime.datetime.utcnow().isoformat()
    # 1. Fetch operations
    fetch_query = "MATCH (ri:ReviewItem {id: $review_id}) RETURN ri.proposedOperations AS ops, ri"
    res = neo4j_db.execute_query(fetch_query, {"review_id": review_id})
    if not res:
        raise HTTPException(status_code=404, detail="Review item not found")
        
    ops = json.loads(res[0]["ops"] or "[]")
    
    # 2. Mark as approved
    upd_query = """
    MATCH (r:RawContext)-[:QUEUED_AS]->(ri:ReviewItem {id: $review_id})
    SET ri.status = 'approved', ri.reviewedAt = $now
    RETURN r
    """
    neo4j_db.execute_query(upd_query, {"review_id": review_id, "now": now})
    raw = neo4j_db.execute_query("MATCH (r)-[:QUEUED_AS]->(ri {id: $rev_id}) RETURN r", {"rev_id": review_id})[0]["r"]
    
    # 3. Apply operations (simplified for P0)
    ctx_id = f"ctx_{uuid.uuid4().hex[:12]}"
    for op in ops:
        if op.get("operation") == "CREATE_CONTEXT":
            ctx_query = """
            MATCH (r:RawContext {id: $raw_id})
            CREATE (c:Context {
                id: $ctx_id,
                title: $title,
                type: $type,
                summary: $summary,
                content: $content,
                visibility: $visibility,
                status: 'trusted',
                createdAt: $now,
                updatedAt: $now
            })
            MERGE (r)-[:APPROVED_AS]->(c)
            """
            neo4j_db.execute_query(ctx_query, {
                "raw_id": raw["id"],
                "ctx_id": ctx_id,
                "title": op.get("title", "Approved Context"),
                "type": op.get("context_type", "note"),
                "summary": op.get("summary", ""),
                "content": raw["content"],
                "visibility": op.get("visibility", "project"),
                "now": now
            })
        elif op.get("operation") == "LINK_CONTEXT_TO_PROJECT":
            proj_query = """
            MATCH (c:Context {id: $ctx_id})
            MATCH (p:Project {name: $project})
            MERGE (c)-[:BELONGS_TO]->(p)
            MERGE (p)-[:HAS_CONTEXT]->(c)
            """
            neo4j_db.execute_query(proj_query, {"ctx_id": ctx_id, "project": op.get("project")})

    return {"status": "approved"}

@router.post("/{review_id}/reject")
def reject_item(review_id: str, user: dict = Depends(require_admin)):
    now = datetime.datetime.utcnow().isoformat()
    upd_query = """
    MATCH (ri:ReviewItem {id: $review_id})
    SET ri.status = 'rejected', ri.reviewedAt = $now
    RETURN ri
    """
    res = neo4j_db.execute_query(upd_query, {"review_id": review_id, "now": now})
    if not res:
        raise HTTPException(status_code=404, detail="Review item not found")
    return {"status": "rejected"}
