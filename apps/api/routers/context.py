from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from auth.demo_auth import get_current_user
from postgres import get_db
from services.context_service import UploadContextRequest, list_inbox, process_upload


router = APIRouter(prefix="/context", tags=["context"])


@router.post("/upload")
async def upload_context(
    request: UploadContextRequest,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return await process_upload(request, user, db)


@router.get("/inbox")
def get_inbox(user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    return list_inbox(user, db)
