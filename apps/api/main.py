from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
    connectors,
    context,
    graph,
    health,
    mcp,
    settings as settings_router,
    team,
)
from services.bootstrap_service import ensure_neo4j_bootstrap
from services.graphiti.service import graphiti_service
from services.postgres_seed import seed_postgres


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_postgres(db)
    neo4j_db.connect()
    ensure_neo4j_bootstrap()
    await graphiti_service.initialize_graphiti()
    yield
    await graphiti_service.close()
    neo4j_db.close()


app = FastAPI(title="TeamGraph Live Brain API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(api_keys.router)
app.include_router(context.router)
app.include_router(approvals.router)
app.include_router(brain.router)
app.include_router(graph.router)
app.include_router(activity.router)
app.include_router(team.router)
app.include_router(connectors.router)
app.include_router(settings_router.router)
app.include_router(mcp.router)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=settings.api_port, reload=True)
