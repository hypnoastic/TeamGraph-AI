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
                if not conn.access_token_enc:
                    continue
                    
                provider = get_provider(conn.provider)
                access_token = decrypt_token(conn.access_token_enc)
                config = json.loads(conn.config_json) if conn.config_json else {}
                
                # Fetch recent data
                episodes = await provider.sync_data(
                    access_token=access_token,
                    last_synced_at=conn.last_synced_at,
                    config=config
                )
                
                if not episodes:
                    # Update sync timestamp even if no new data to prevent retries of the same period
                    conn.last_synced_at = datetime.datetime.utcnow()
                    db.commit()
                    continue
                    
                # Ingest episodes into Graphiti
                for ep in episodes:
                    try:
                        metadata = EpisodeMetadata(
                            author=ep.get("metadata", {}).get("author", "System"),
                            source_type=ep.get("metadata", {}).get("source", conn.provider),
                            created_at=ep.get("metadata", {}).get("created_at", datetime.datetime.utcnow().isoformat()),
                            reference_url=ep.get("metadata", {}).get("url")
                        )
                        
                        group_id = f"org:{conn.organization_id}"
                        
                        await graphiti_service.add_episode_for_context(
                            title=ep.get("title", "Integration Data"),
                            content=ep.get("content", ""),
                            metadata=metadata,
                            summary=ep.get("summary"),
                            group_id=group_id
                        )
                    except Exception as e:
                        logger.error(f"Failed to ingest episode from {conn.provider}: {str(e)}")
                        
                conn.last_synced_at = datetime.datetime.utcnow()
                db.commit()
                
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
            
        # Wait 60 seconds before next poll
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
