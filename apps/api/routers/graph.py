from fastapi import APIRouter, Depends

from auth.demo_auth import get_current_user
from services.graph_visualization_service import get_graph_visualization


router = APIRouter(prefix="/graph", tags=["graph"])


@router.get("/visualization")
def graph_visualization(user: dict = Depends(get_current_user)):
    return get_graph_visualization()
