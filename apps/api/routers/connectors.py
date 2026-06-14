from fastapi import APIRouter, Depends

from auth.demo_auth import get_current_user
from services.connectors.registry import list_connectors


router = APIRouter(prefix="/connectors", tags=["connectors"])


@router.get("/")
def get_connectors(user: dict = Depends(get_current_user)):
    return {"connectors": list_connectors()}
