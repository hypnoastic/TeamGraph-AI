import asyncio
from datetime import datetime

from database import neo4j_db
from services.graphiti.schemas import EpisodeMetadata
from services.graphiti.service import graphiti_service


def _build_scope_keys(org_id: str, project_id: str | None, user_id: str | None) -> list[str]:
    scope_keys = [f"org:{org_id}"]
    if project_id:
        scope_keys.append(f"org:{org_id}:project:{project_id}")
    if user_id:
        scope_keys.append(f"org:{org_id}:user:{user_id}")
    return scope_keys


def _load_contexts_without_graphiti() -> list[dict]:
    query = """
    MATCH (c:Context)
    WHERE coalesce(c.status, 'trusted') = 'trusted'
      AND c.graphitiEpisodeUuid IS NULL
    RETURN c
    ORDER BY c.createdAt ASC
    """
    return [record["c"] for record in neo4j_db.execute_query(query)]


async def main() -> None:
    neo4j_db.connect()
    await graphiti_service.initialize_graphiti()

    if graphiti_service.health.mode != "live":
        print(f"Graphiti backfill skipped: {graphiti_service.health.reason or 'live mode unavailable'}")
        await graphiti_service.close()
        neo4j_db.close()
        return

    contexts = _load_contexts_without_graphiti()
    if not contexts:
        print("No trusted contexts require Graphiti backfill.")
        await graphiti_service.close()
        neo4j_db.close()
        return

    migrated = 0
    skipped = 0

    for context in contexts:
        created_at_raw = context.get("createdAt") or datetime.utcnow().isoformat()
        try:
            created_at = datetime.fromisoformat(created_at_raw)
        except ValueError:
            created_at = datetime.utcnow()

        metadata = EpisodeMetadata(
            raw_context_id=context.get("id"),
            context_id=context.get("id"),
            organization_id=context.get("organizationId", "org_1"),
            organization_name=context.get("organizationName"),
            project_id=context.get("projectId"),
            project_name=context.get("projectName"),
            user_id=context.get("userId"),
            uploader_email=context.get("uploaderEmail"),
            source_type=context.get("sourceType", "manual"),
            context_type=context.get("type", "note"),
            visibility=context.get("visibility", "project"),
            tags=context.get("tags", []),
            upload_channel=context.get("uploadChannel", "seed"),
            approval_status=context.get("approvalStatus", "approved"),
            created_at=created_at,
            scope_keys=context.get("scopeKeys")
            or _build_scope_keys(
                context.get("organizationId", "org_1"),
                context.get("projectId"),
                context.get("userId"),
            ),
        )

        result = await graphiti_service.add_episode_for_context(
            title=context.get("title", "Backfilled Context"),
            content=context.get("content") or context.get("summary") or "",
            metadata=metadata,
            summary=context.get("summary"),
        )

        if not result.episode_uuid:
            skipped += 1
            continue

        neo4j_db.execute_query(
            """
            MATCH (c:Context {id: $context_id})
            SET c.graphitiEpisodeUuid = $episode_uuid,
                c.brainMode = $brain_mode,
                c.updatedAt = $now
            """,
            {
                "context_id": context.get("id"),
                "episode_uuid": result.episode_uuid,
                "brain_mode": result.mode,
                "now": datetime.utcnow().isoformat(),
            },
        )
        migrated += 1

    print(f"Graphiti backfill complete. migrated={migrated} skipped={skipped}")
    await graphiti_service.close()
    neo4j_db.close()


if __name__ == "__main__":
    asyncio.run(main())
