from fastapi import APIRouter, Depends

from auth.demo_auth import get_current_user
from services.activity_service import list_activity


router = APIRouter(prefix="/activity", tags=["activity"])


@router.get("/")
def get_activity(user: dict = Depends(get_current_user)):
    return list_activity()
