from fastapi import APIRouter, Depends
from auth.demo_auth import get_current_user
from services.context_service import UploadContextRequest, process_upload
from database import neo4j_db

router = APIRouter(prefix="/context", tags=["context"])

@router.post("/upload")
def upload_context(request: UploadContextRequest, user: dict = Depends(get_current_user)):
    return process_upload(request, user)

@router.get("/inbox")
def get_inbox(user: dict = Depends(get_current_user)):
    # Returns items across lanes for the inbox UI
    query = """
    MATCH (r:RawContext)
    OPTIONAL MATCH (r)-[:CURATED_INTO]->(c:Context)
    OPTIONAL MATCH (r)-[:QUEUED_AS]->(p:ReviewItem {status: 'pending'})
    OPTIONAL MATCH (r)-[:QUARANTINED_AS]->(q:ReviewItem {status: 'quarantined'})
    RETURN r, c, p, q
    ORDER BY r.createdAt DESC LIMIT 50
    """
    results = neo4j_db.execute_query(query)
    
    inbox = []
    for rec in results:
        raw = rec["r"]
        lane = "unknown"
        if rec.get("c"): lane = "auto_curated"
        elif rec.get("p"): lane = "pending_review"
        elif rec.get("q"): lane = "quarantined"
        
        inbox.append({
            "raw": raw,
            "lane": lane
        })
    return inbox
