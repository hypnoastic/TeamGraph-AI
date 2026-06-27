from __future__ import annotations

import datetime
import json
import uuid

from fastapi import HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from models import BrainConversation, BrainMessage


class CreateConversationRequest(BaseModel):
    title: str = Field(default="New chat", min_length=1, max_length=255)


class ConversationSummary(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str
    message_count: int = 0


class StoredBrainMessage(BaseModel):
    id: str
    role: str
    text: str
    answer: dict | None = None
    created_at: str


class ConversationDetail(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str
    messages: list[StoredBrainMessage] = Field(default_factory=list)


def _conversation_summary(conversation: BrainConversation, message_count: int) -> ConversationSummary:
    return ConversationSummary(
        id=conversation.id,
        title=conversation.title,
        created_at=conversation.created_at.isoformat(),
        updated_at=conversation.updated_at.isoformat(),
        message_count=message_count,
    )


def _get_owned_conversation(conversation_id: str, user: dict, db: Session) -> BrainConversation:
    conversation = db.execute(
        select(BrainConversation).where(
            BrainConversation.id == conversation_id,
            BrainConversation.user_id == user["id"],
            BrainConversation.organization_id == user.get("org_id"),
        )
    ).scalar_one_or_none()
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    return conversation


def list_conversations(user: dict, db: Session) -> list[ConversationSummary]:
    if not user.get("org_id"):
        return []
    conversations = db.execute(
        select(BrainConversation)
        .where(
            BrainConversation.user_id == user["id"],
            BrainConversation.organization_id == user["org_id"],
        )
        .order_by(BrainConversation.updated_at.desc())
        .limit(50)
    ).scalars().all()
    summaries: list[ConversationSummary] = []
    for conversation in conversations:
        message_count = db.scalar(
            select(func.count()).select_from(BrainMessage).where(BrainMessage.conversation_id == conversation.id)
        ) or 0
        summaries.append(_conversation_summary(conversation, message_count))
    return summaries


def create_conversation(user: dict, db: Session, *, title: str = "New chat") -> ConversationSummary:
    if not user.get("org_id"):
        raise HTTPException(status_code=400, detail="Organization required.")
    now = datetime.datetime.utcnow()
    conversation = BrainConversation(
        id=f"chat_{uuid.uuid4().hex[:12]}",
        user_id=user["id"],
        organization_id=user["org_id"],
        title=title[:255],
        created_at=now,
        updated_at=now,
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return _conversation_summary(conversation, 0)


def get_conversation_detail(conversation_id: str, user: dict, db: Session) -> ConversationDetail:
    conversation = _get_owned_conversation(conversation_id, user, db)
    messages = db.execute(
        select(BrainMessage)
        .where(BrainMessage.conversation_id == conversation.id)
        .order_by(BrainMessage.created_at.asc())
    ).scalars().all()
    return ConversationDetail(
        id=conversation.id,
        title=conversation.title,
        created_at=conversation.created_at.isoformat(),
        updated_at=conversation.updated_at.isoformat(),
        messages=[
            StoredBrainMessage(
                id=message.id,
                role=message.role,
                text=message.text,
                answer=json.loads(message.payload_json) if message.payload_json else None,
                created_at=message.created_at.isoformat(),
            )
            for message in messages
        ],
    )


def delete_conversation(conversation_id: str, user: dict, db: Session) -> dict:
    conversation = _get_owned_conversation(conversation_id, user, db)
    db.execute(delete(BrainMessage).where(BrainMessage.conversation_id == conversation.id))
    db.delete(conversation)
    db.commit()
    return {"status": "success"}


def append_message(
    *,
    conversation_id: str,
    user: dict,
    db: Session,
    role: str,
    text: str,
    payload: dict | None = None,
) -> StoredBrainMessage:
    conversation = _get_owned_conversation(conversation_id, user, db)
    now = datetime.datetime.utcnow()
    message = BrainMessage(
        id=f"msg_{uuid.uuid4().hex[:12]}",
        conversation_id=conversation.id,
        role=role,
        text=text,
        payload_json=json.dumps(payload) if payload else None,
        created_at=now,
    )
    conversation.updated_at = now
    if role == "user" and conversation.title == "New chat":
        conversation.title = text.strip()[:255] or "New chat"
    db.add(message)
    db.commit()
    db.refresh(message)
    return StoredBrainMessage(
        id=message.id,
        role=message.role,
        text=message.text,
        answer=json.loads(message.payload_json) if message.payload_json else None,
        created_at=message.created_at.isoformat(),
    )
