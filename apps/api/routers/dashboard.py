from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from auth.demo_auth import get_current_user
from models import ApprovalRecord, ApiKeyRecord, ContextRecord, Project, User
from postgres import get_db
from services.activity_service import list_activity


router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary")
def dashboard_summary(
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not user.get("org_id"):
        return {
            "trusted_memories": 0,
            "pending_approvals": 0,
            "projects": 0,
            "agent_keys": 0,
            "recent_context": [],
            "recent_activity": [],
        }
    org_id = user["org_id"]
    trusted = db.scalar(
        select(func.count()).select_from(ContextRecord).where(
            ContextRecord.organization_id == org_id,
            ContextRecord.approval_status.in_(["safe", "approved"]),
        )
    ) or 0
    pending = db.scalar(
        select(func.count()).select_from(ApprovalRecord).where(
            ApprovalRecord.organization_id == org_id,
            ApprovalRecord.status == "pending",
        )
    ) or 0
    projects = db.scalar(
        select(func.count()).select_from(Project).where(Project.organization_id == org_id)
    ) or 0
    agent_keys = db.scalar(
        select(func.count())
        .select_from(ApiKeyRecord)
        .join(User, ApiKeyRecord.user_id == User.id)
        .where(ApiKeyRecord.status == "active", User.organization_id == org_id)
    ) or 0
    contexts = db.execute(
        select(ContextRecord, Project)
        .outerjoin(Project, ContextRecord.project_id == Project.id)
        .where(ContextRecord.organization_id == org_id)
        .order_by(ContextRecord.updated_at.desc())
        .limit(8)
    ).all()
    return {
        "trusted_memories": trusted,
        "pending_approvals": pending,
        "projects": projects,
        "agent_keys": agent_keys,
        "recent_context": [
            {
                "id": context.id,
                "title": context.title,
                "type": context.context_type,
                "source": context.source_type,
                "project": project.name if project else None,
                "created_at": context.created_at.isoformat(),
            }
            for context, project in contexts
        ],
        "recent_activity": list_activity(org_id, limit=8),
    }
