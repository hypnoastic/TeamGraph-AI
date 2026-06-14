from fastapi import APIRouter

from database import neo4j_db
from services.graphiti.service import graphiti_service


router = APIRouter()


@router.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "teamgraph-live-brain",
        "neo4j": neo4j_db.health_check(),
        "graphiti": (await graphiti_service.health_check()).model_dump(),
    }
