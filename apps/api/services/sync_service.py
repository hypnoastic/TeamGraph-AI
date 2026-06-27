import asyncio
import logging
import datetime
import json
from sqlalchemy import select
from sqlalchemy.orm import Session

from postgres import SessionLocal
from models import IntegrationConnection
from services.integrations.registry import get_provider
from services.graphiti.service import graphiti_service
from services.graphiti.schemas import EpisodeMetadata
from utils.encryption import decrypt_token

logger = logging.getLogger(__name__)


async def _sync_single_connection(conn: IntegrationConnection, db: Session) -> None:
    if not conn.access_token_enc:
        return

    provider = get_provider(conn.provider)
    access_token = decrypt_token(conn.access_token_enc)
    config = json.loads(conn.config_json) if conn.config_json else {}

    episodes = await provider.sync_data(
        access_token=access_token,
        last_synced_at=conn.last_synced_at,
        config=config,
    )

    if not episodes:
        conn.last_synced_at = datetime.datetime.utcnow()
        db.commit()
        return

    for ep in episodes:
        try:
            import uuid as _uuid
            from email.utils import parsedate_to_datetime as _rfc_parse

            created_at_str = ep.get("metadata", {}).get("created_at")
            try:
                if created_at_str:
                    try:
                        created_dt = _rfc_parse(created_at_str).replace(tzinfo=None)
                    except Exception:
                        created_dt = datetime.datetime.fromisoformat(str(created_at_str)[:19])
                else:
                    created_dt = datetime.datetime.utcnow()
            except Exception:
                created_dt = datetime.datetime.utcnow()

            raw_id = (
                ep.get("metadata", {}).get("message_id")
                or ep.get("metadata", {}).get("file_id")
                or _uuid.uuid4().hex
            )

            metadata = EpisodeMetadata(
                raw_context_id=f"sync_{raw_id}",
                organization_id=conn.organization_id,
                uploader_email=ep.get("metadata", {}).get("author", "System"),
                source_type=ep.get("metadata", {}).get("source", conn.provider),
                created_at=created_dt,
                upload_channel="sync",
            )

            group_id = f"org_{conn.organization_id}"

            await graphiti_service.add_episode_for_context(
                title=ep.get("title", "Integration Data"),
                content=ep.get("content", ""),
                metadata=metadata,
                summary=ep.get("summary"),
                group_id=group_id,
            )
        except Exception as e:
            logger.error(f"Failed to ingest episode from {conn.provider}: {str(e)}")

    conn.last_synced_at = datetime.datetime.utcnow()
    db.commit()


async def sync_connection_by_id(connection_id: str) -> None:
    with SessionLocal() as db:
        conn = db.get(IntegrationConnection, connection_id)
        if conn is None or conn.status != "connected":
            return
        try:
            await _sync_single_connection(conn, db)
        except Exception as e:
            logger.error(f"Sync failed for connection {connection_id}: {str(e)}")


def schedule_immediate_sync(connection_id: str) -> None:
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(sync_connection_by_id(connection_id))
        logger.info(f"Scheduled immediate sync for connection {connection_id}")
    except RuntimeError:
        logger.warning(f"No event loop available to sync connection {connection_id}")


async def run_sync_cycle():
    """
    Runs a single synchronization cycle for all connected integrations.
    """
    with SessionLocal() as db:
        connections = db.execute(
            select(IntegrationConnection).where(IntegrationConnection.status == "connected")
        ).scalars().all()

        for conn in connections:
            try:
                await _sync_single_connection(conn, db)
            except Exception as e:
                logger.error(f"Sync failed for {conn.provider} connection {conn.id}: {str(e)}")


async def sync_loop():
    """
    Infinite loop to periodically run sync cycles in the background.
    """
    logger.info("Background sync worker started.")
    while True:
        try:
            await run_sync_cycle()
        except Exception as e:
            logger.error(f"Error in background sync loop: {str(e)}")

        await asyncio.sleep(60)


_sync_task = None


def start_sync_worker():
    """
    Starts the background synchronization task.
    """
    global _sync_task
    if _sync_task is None:
        loop = asyncio.get_running_loop()
        _sync_task = loop.create_task(sync_loop())
        logger.info("Scheduled background sync task.")


def stop_sync_worker():
    """
    Stops the background synchronization task.
    """
    global _sync_task
    if _sync_task is not None:
        _sync_task.cancel()
        _sync_task = None
        logger.info("Cancelled background sync task.")
