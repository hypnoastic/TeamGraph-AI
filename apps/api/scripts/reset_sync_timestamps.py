#!/usr/bin/env python3
"""Reset last_synced_at for all connected integrations to trigger a full re-sync."""
from sqlalchemy import update

from models import IntegrationConnection
from postgres import SessionLocal


def main() -> None:
    with SessionLocal() as db:
        result = db.execute(
            update(IntegrationConnection)
            .where(IntegrationConnection.status == "connected")
            .values(last_synced_at=None)
        )
        db.commit()
        print(f"Reset last_synced_at for {result.rowcount} connected integration(s).")


if __name__ == "__main__":
    main()
