from fastapi import APIRouter, Depends, Query

from auth.demo_auth import get_current_user
from services.graphiti_visualization_service import get_graphiti_visualization


router = APIRouter(prefix="/graph", tags=["graph"])


@router.get("/visualization")
def graph_visualization(
    project: str | None = Query(default=None),
    search: str | None = Query(default=None),
    types: str | None = Query(default=None),
    user: dict = Depends(get_current_user),
):
    node_types = {value.strip() for value in types.split(",") if value.strip()} if types else None
    return get_graphiti_visualization(
        user,
        query=search,
        node_types=node_types,
    )
