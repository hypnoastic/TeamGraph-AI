from fastapi import APIRouter, Depends, HTTPException

from auth.demo_auth import get_current_user
from services.connectors.registry import list_connectors


router = APIRouter(prefix="/connectors", tags=["connectors"])


@router.get("/")
def get_connectors(user: dict = Depends(get_current_user)):
    return {"connectors": list_connectors()}


@router.api_route("/{provider}/{action}", methods=["GET", "POST"])
def connector_placeholder(provider: str, action: str, user: dict = Depends(get_current_user)):
    raise HTTPException(status_code=501, detail=f"{provider} connector is coming soon.")
