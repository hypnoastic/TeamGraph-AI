from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from auth.demo_auth import get_current_user
from postgres import get_db
from services.graph_visualization_service import get_graph_visualization


router = APIRouter(prefix="/graph", tags=["graph"])


@router.get("/visualization")
def graph_visualization(
    project: str | None = Query(default=None),
    search: str | None = Query(default=None),
    types: str | None = Query(default=None),
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    node_types = {value.strip() for value in types.split(",") if value.strip()} if types else None
    return get_graph_visualization(
        db,
        user,
        project_ref=project,
        query=search,
        node_types=node_types,
    )
