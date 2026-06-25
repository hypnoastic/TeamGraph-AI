import os
import tempfile

# Set environment variables BEFORE any app imports
_db_file = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
_db_file.close()

os.environ.setdefault("DATABASE_URL", f"sqlite:///{_db_file.name}")
os.environ.setdefault("DEMO_MODE", "false")
os.environ.setdefault("GEMINI_API_KEY", "")
os.environ.setdefault("OPENAI_API_KEY", "")
os.environ.setdefault("NEO4J_URI", "bolt://127.0.0.1:1")
os.environ.setdefault("SECRET_KEY", "test_secret_key")
os.environ.setdefault("ENVIRONMENT", "test")

import pytest
from fastapi.testclient import TestClient

from models import Base
from postgres import engine


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """Create all tables once for the entire test session."""
    Base.metadata.create_all(bind=engine)
    yield
    engine.dispose()
    try:
        os.unlink(_db_file.name)
    except OSError:
        pass


@pytest.fixture(scope="session")
def client():
    """Shared test client for the entire session."""
    from main import app
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c
