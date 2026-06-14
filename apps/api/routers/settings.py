from fastapi import APIRouter, Depends
from auth.demo_auth import require_admin
from services.optimizer import run_optimizer
from config import settings

router = APIRouter(prefix="/settings", tags=["settings"])

@router.get("/")
def get_settings(user: dict = Depends(require_admin)):
    return {
        "organization": "Acme AI Lab",
        "neo4j_status": "configured",
        "gemini_mode": "live" if settings.gemini_api_key else "mock"
    }

@router.post("/optimize")
def trigger_optimization(user: dict = Depends(require_admin)):
    return run_optimizer()
