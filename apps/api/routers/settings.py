from fastapi import APIRouter, Depends

from auth.demo_auth import require_admin
from config import settings
from database import neo4j_db
from services.graphiti.service import graphiti_service
from services.optimizer import run_optimizer


router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("/")
async def get_settings(user: dict = Depends(require_admin)):
    graphiti_health = await graphiti_service.health_check()

    counts_query = """
    MATCH (o:Organization {id: $org_id})
    CALL {
        WITH o
        OPTIONAL MATCH (o)-[:HAS_PROJECT]->(p:Project)
        RETURN count(DISTINCT p) AS project_count
    }
    CALL {
        OPTIONAL MATCH (r:RawContext)
        RETURN count(DISTINCT r) AS raw_count
    }
    CALL {
        OPTIONAL MATCH (c:Context)
        RETURN count(DISTINCT c) AS curated_count
    }
    CALL {
        OPTIONAL MATCH (pending:ReviewItem {status: 'pending'})
        RETURN count(DISTINCT pending) AS pending_count
    }
    CALL {
        OPTIONAL MATCH (quarantined:ReviewItem {status: 'quarantined'})
        RETURN count(DISTINCT quarantined) AS quarantined_count
    }
    RETURN project_count, raw_count, curated_count, pending_count, quarantined_count
    """
    counts = neo4j_db.execute_query(counts_query, {"org_id": settings.teamgraph_org_id})
    stats = counts[0] if counts else {}

    latest_ingest_query = """
    MATCH (c:Context)
    RETURN c.updatedAt AS updatedAt
    ORDER BY c.updatedAt DESC
    LIMIT 1
    """
    latest_ingest = neo4j_db.execute_query(latest_ingest_query)

    return {
        "organization": settings.teamgraph_org_name,
        "neo4j_status": neo4j_db.health_check().get("status", "unknown"),
        "graphiti_mode": graphiti_health.mode,
        "graphiti_provider": graphiti_health.provider,
        "graphiti_reason": graphiti_health.reason,
        "latest_episode_ingested": latest_ingest[0]["updatedAt"] if latest_ingest else None,
        "pending_approvals": stats.get("pending_count", 0),
        "auto_curated_count": stats.get("curated_count", 0),
        "quarantined_count": stats.get("quarantined_count", 0),
        "project_count": stats.get("project_count", 0),
        "raw_context_count": stats.get("raw_count", 0),
        "gemini_mode": "live" if settings.gemini_api_key else "mock",
    }


@router.post("/optimize")
def trigger_optimization(user: dict = Depends(require_admin)):
    return run_optimizer()
