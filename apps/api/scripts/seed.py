import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from database import neo4j_db
from models import Base
from postgres import SessionLocal, engine
from services.bootstrap_service import ensure_neo4j_bootstrap
from services.postgres_seed import seed_postgres


def seed_all() -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_postgres(db)

    neo4j_db.connect()
    ensure_neo4j_bootstrap(seed_demo=True)
    neo4j_db.close()


if __name__ == "__main__":
    seed_all()
