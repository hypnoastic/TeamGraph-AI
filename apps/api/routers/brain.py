from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from auth.demo_auth import get_current_user
from postgres import get_db
from services.brain_chat_service import (
    ConversationDetail,
    ConversationSummary,
    CreateConversationRequest,
    create_conversation,
    delete_conversation,
    get_conversation_detail,
    list_conversations,
)
from services.brain_service import BrainQueryRequest, execute_brain_query
from services.brain_source_service import BrainSourceDetail, get_brain_source_detail


router = APIRouter(prefix="/brain", tags=["brain"])


@router.post("/query")
async def query_brain(
    request: BrainQueryRequest,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return await execute_brain_query(request, user, db)


@router.get("/sources/{source_ref}", response_model=BrainSourceDetail)
def get_source_detail(
    source_ref: str,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_brain_source_detail(source_ref, user, db)


@router.get("/conversations", response_model=list[ConversationSummary])
def get_conversations(user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    return list_conversations(user, db)


@router.post("/conversations", response_model=ConversationSummary)
def start_conversation(
    request: CreateConversationRequest = CreateConversationRequest(),
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    title = request.title.strip() or "New chat"
    return create_conversation(user, db, title=title)


@router.get("/conversations/{conversation_id}", response_model=ConversationDetail)
def read_conversation(
    conversation_id: str,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_conversation_detail(conversation_id, user, db)


@router.delete("/conversations/{conversation_id}")
def remove_conversation(
    conversation_id: str,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return delete_conversation(conversation_id, user, db)
