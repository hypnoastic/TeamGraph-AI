from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from auth.demo_auth import require_admin
from postgres import get_db
from services.context_service import approve_review_item, list_approvals, reject_review_item


router = APIRouter(prefix="/approvals", tags=["approvals"])


@router.get("")
def get_approvals(user: dict = Depends(require_admin), db: Session = Depends(get_db)):
    return list_approvals(user, db)


@router.post("/{review_id}/approve")
async def approve_item(
    review_id: str,
    user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return await approve_review_item(review_id, user, db)


@router.post("/{review_id}/reject")
def reject_item(
    review_id: str,
    user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return reject_review_item(review_id, user, db)
