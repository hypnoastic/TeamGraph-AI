from __future__ import annotations

import datetime
import json
import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from config import settings
from models import ActivityRecord
from postgres import SessionLocal


def record_activity(
    *,
    event_type: str,
    title: str,
    description: str,
    actor: dict | None = None,
    metadata: dict[str, Any] | None = None,
    db: Session | None = None,
) -> dict[str, Any]:
    created_session = db is None
    session = db or SessionLocal()
    try:
        event = ActivityRecord(
            id=f"act_{uuid.uuid4().hex[:12]}",
            organization_id=(actor or {}).get("org_id", settings.teamgraph_org_id),
            type=event_type,
            title=title,
            description=description,
            actor_id=(actor or {}).get("id"),
            actor_email=(actor or {}).get("email"),
            metadata_json=json.dumps(metadata or {}),
            created_at=datetime.datetime.utcnow(),
        )
        session.add(event)
        session.commit()
        return {
            "id": event.id,
            "type": event.type,
            "title": event.title,
            "description": event.description,
            "actorId": event.actor_id,
            "actorEmail": event.actor_email,
            "metadataJson": event.metadata_json,
            "createdAt": event.created_at.isoformat(),
        }
    finally:
        if created_session:
            session.close()


def list_activity(organization_id: str, limit: int = 50) -> list[dict[str, Any]]:
    with SessionLocal() as session:
        events = session.execute(
            select(ActivityRecord)
            .where(ActivityRecord.organization_id == organization_id)
            .order_by(ActivityRecord.created_at.desc())
            .limit(limit)
        ).scalars().all()
        return [
            {
                "id": event.id,
                "type": event.type,
                "title": event.title,
                "description": event.description,
                "actorId": event.actor_id,
                "actorEmail": event.actor_email,
                "metadataJson": event.metadata_json,
                "createdAt": event.created_at.isoformat(),
            }
            for event in events
        ]
