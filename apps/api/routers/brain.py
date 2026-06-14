from fastapi import APIRouter, Depends
from auth.demo_auth import get_current_user
from services.brain_service import BrainQueryRequest, execute_brain_query

router = APIRouter(prefix="/brain", tags=["brain"])

@router.post("/query")
def query_brain(request: BrainQueryRequest, user: dict = Depends(get_current_user)):
    return execute_brain_query(request, user)
