from fastapi import FastAPI
from contextlib import asynccontextmanager
from config import settings
from routers import health, auth, api_keys, context, approvals, brain, settings as settings_router, mcp
from database import neo4j_db
from fastapi.middleware.cors import CORSMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    neo4j_db.connect()
    yield
    neo4j_db.close()

app = FastAPI(title="TeamGraph Live Brain API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
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
app.include_router(settings_router.router)
app.include_router(mcp.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.api_port, reload=True)
