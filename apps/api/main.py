from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware

from config import settings
from database import neo4j_db
from models import Base
from postgres import SessionLocal, engine
from routers import (
    activity,
    api_keys,
    approvals,
    auth,
    brain,
    context,
    dashboard,
    graph,
    health,
    integrations,
    mcp,
    organizations,
    projects,
    settings as settings_router,
    team,
)
from services.bootstrap_service import ensure_neo4j_bootstrap
from services.graphiti.service import graphiti_service
from services.postgres_seed import seed_postgres
from services.sync_service import start_sync_worker, stop_sync_worker

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Startup: creating Postgres tables")
    Base.metadata.create_all(bind=engine)
    if settings.demo_mode:
        logger.info("Startup: seeding demo defaults")
        with SessionLocal() as db:
            seed_postgres(db)
    try:
        logger.info("Startup: connecting to Neo4j")
        neo4j_db.connect()
        if neo4j_db.health_check()["status"] == "ok":
            logger.info("Startup: bootstrapping Neo4j graph")
            ensure_neo4j_bootstrap(seed_demo=settings.demo_mode)
        else:
            logger.warning("Neo4j unavailable; skipping graph bootstrap")
    except Exception:
        logger.exception("Neo4j startup failed; continuing in degraded mode")
    logger.info("Startup: initializing Graphiti")
    await graphiti_service.initialize_graphiti()
    
    # Start the data synchronization engine
    start_sync_worker()
    
    logger.info("Startup: complete")
    yield
    
    # Stop the sync worker on shutdown
    stop_sync_worker()
    
    await graphiti_service.close()
    neo4j_db.close()


app = FastAPI(title="TeamGraph Live Brain API", lifespan=lifespan)

# Trust X-Forwarded-* from nginx so trailing-slash redirects use the public HTTPS URL.
app.add_middleware(ProxyHeadersMiddleware, trusted_hosts="*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(organizations.router)
app.include_router(projects.router)
app.include_router(api_keys.router)
app.include_router(context.router)
app.include_router(dashboard.router)
app.include_router(approvals.router)
app.include_router(brain.router)
app.include_router(graph.router)
app.include_router(activity.router)
app.include_router(team.router)
app.include_router(integrations.router)
app.include_router(settings_router.router)
app.include_router(mcp.router)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=settings.api_port, reload=True)
