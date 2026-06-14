from fastapi import APIRouter, Depends

from auth.demo_auth import require_admin
from database import neo4j_db
from services.context_service import approve_review_item, reject_review_item


router = APIRouter(prefix="/approvals", tags=["approvals"])


@router.get("/")
def list_approvals(user: dict = Depends(require_admin)):
    query = """
    MATCH (r:RawContext)-[:QUEUED_AS]->(ri:ReviewItem {status: 'pending'})
    RETURN r, ri
    ORDER BY ri.createdAt DESC
    """
    results = neo4j_db.execute_query(query)
    return [{"raw": record["r"], "review_item": record["ri"]} for record in results]


@router.post("/{review_id}/approve")
async def approve_item(review_id: str, user: dict = Depends(require_admin)):
    return await approve_review_item(review_id, user)


@router.post("/{review_id}/reject")
def reject_item(review_id: str, user: dict = Depends(require_admin)):
    return reject_review_item(review_id, user)
