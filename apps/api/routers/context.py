from fastapi import APIRouter, Depends

from auth.demo_auth import get_current_user
from services.context_service import UploadContextRequest, list_inbox, process_upload


router = APIRouter(prefix="/context", tags=["context"])


@router.post("/upload")
async def upload_context(request: UploadContextRequest, user: dict = Depends(get_current_user)):
    return await process_upload(request, user)


@router.get("/inbox")
def get_inbox(user: dict = Depends(get_current_user)):
    return list_inbox(user)
