import datetime
import uuid
from typing import Any

from database import neo4j_db


def record_activity(
    *,
    event_type: str,
    title: str,
    description: str,
    actor: dict | None = None,
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    event_id = f"act_{uuid.uuid4().hex[:12]}"
    created_at = datetime.datetime.utcnow().isoformat()
    actor_id = actor.get("id") if actor else None
    actor_email = actor.get("email") if actor else None

    query = """
    CREATE (a:ActivityEvent {
        id: $event_id,
        type: $event_type,
        title: $title,
        description: $description,
        actorId: $actor_id,
        actorEmail: $actor_email,
        metadataJson: $metadata_json,
        createdAt: $created_at
    })
    RETURN a
    """
    result = neo4j_db.execute_query(
        query,
        {
            "event_id": event_id,
            "event_type": event_type,
            "title": title,
            "description": description,
            "actor_id": actor_id,
            "actor_email": actor_email,
            "metadata_json": str(metadata or {}),
            "created_at": created_at,
        },
    )
    return result[0]["a"] if result else {}


def list_activity(limit: int = 50) -> list[dict[str, Any]]:
    query = """
    MATCH (a:ActivityEvent)
    RETURN a
    ORDER BY a.createdAt DESC
    LIMIT $limit
    """
    results = neo4j_db.execute_query(query, {"limit": limit})
    return [record["a"] for record in results]
