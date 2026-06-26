from fastapi import APIRouter, Depends

from auth.demo_auth import require_admin
from config import settings
from database import neo4j_db
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from models import ApprovalRecord, ContextRecord, Organization, Project, RawContextRecord
from postgres import engine, get_db
from services.graphiti.service import graphiti_service
from services.optimizer import run_optimizer


router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("")
async def get_settings(
    user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    graphiti_health = await graphiti_service.health_check()
    postgres_status = "ok"
    try:
        with engine.connect() as connection:
            connection.exec_driver_sql("SELECT 1")
    except Exception as exc:
        postgres_status = f"error: {exc}"

    org_id = user["org_id"]
    organization = db.get(Organization, org_id)
    latest_ingest = db.execute(
        select(ContextRecord).where(ContextRecord.organization_id == org_id).order_by(ContextRecord.updated_at.desc()).limit(1)
    ).scalar_one_or_none()

    return {
        "organization": organization.name if organization else "Organization",
        "postgres_status": postgres_status,
        "neo4j_status": neo4j_db.health_check().get("status", "unknown"),
        "graphiti_mode": graphiti_health.mode,
        "graphiti_provider": graphiti_health.provider,
        "graphiti_reason": graphiti_health.reason,
        "latest_episode_ingested": latest_ingest.updated_at.isoformat() if latest_ingest else None,
        "pending_approvals": db.scalar(select(func.count()).select_from(ApprovalRecord).where(ApprovalRecord.organization_id == org_id, ApprovalRecord.status == "pending")) or 0,
        "auto_curated_count": db.scalar(select(func.count()).select_from(ContextRecord).where(ContextRecord.organization_id == org_id)) or 0,
        "quarantined_count": db.scalar(select(func.count()).select_from(ApprovalRecord).where(ApprovalRecord.organization_id == org_id, ApprovalRecord.status == "quarantined")) or 0,
        "project_count": db.scalar(select(func.count()).select_from(Project).where(Project.organization_id == org_id)) or 0,
        "raw_context_count": db.scalar(select(func.count()).select_from(RawContextRecord).where(RawContextRecord.organization_id == org_id)) or 0,
        "gemini_mode": "live" if settings.gemini_api_key else "mock",
    }


@router.post("/optimize")
def trigger_optimization(user: dict = Depends(require_admin)):
    return run_optimizer()
