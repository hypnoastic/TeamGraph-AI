from fastapi import APIRouter, Depends

from auth.demo_auth import require_admin
from services.team_service import list_team_members


router = APIRouter(prefix="/team", tags=["team"])


@router.get("/")
def get_team(user: dict = Depends(require_admin)):
    return list_team_members()
