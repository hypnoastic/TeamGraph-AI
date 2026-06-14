from fastapi import APIRouter

from database import neo4j_db
from postgres import engine
from services.graphiti.service import graphiti_service


router = APIRouter()


@router.get("/health")
async def health_check():
    postgres_status = "ok"
    try:
        with engine.connect() as connection:
            connection.exec_driver_sql("SELECT 1")
    except Exception as exc:
        postgres_status = f"error: {exc}"

    return {
        "status": "ok",
        "service": "teamgraph-live-brain",
        "postgres": {"status": postgres_status},
        "neo4j": neo4j_db.health_check(),
        "graphiti": (await graphiti_service.health_check()).model_dump(),
    }
