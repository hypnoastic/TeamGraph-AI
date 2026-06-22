import logging
from typing import Any

from neo4j import GraphDatabase


logger = logging.getLogger(__name__)


class Neo4jClient:
    def __init__(self, uri: str, user: str, password: str, database: str = "neo4j"):
        self.uri = uri
        self.user = user
        self.password = password
        self.database = database
        self.driver = None

    def connect(self) -> None:
        try:
            self.driver = GraphDatabase.driver(self.uri, auth=(self.user, self.password))
            self.driver.verify_connectivity()
            logger.info("Connected to Neo4j successfully.")
        except Exception as exc:
            logger.error("Failed to connect to Neo4j: %s", exc)
            self.driver = None

    def close(self) -> None:
        if self.driver:
            self.driver.close()
            self.driver = None

    def health_check(self) -> dict[str, Any]:
        if not self.driver:
            return {"status": "disconnected", "reason": "driver_not_initialized"}

        try:
            self.driver.verify_connectivity()
            return {"status": "ok"}
        except Exception as exc:
            logger.error("Neo4j health check failed: %s", exc)
            return {"status": "error", "reason": str(exc)}

    def execute_query(self, query: str, parameters: dict[str, Any] | None = None) -> list[dict[str, Any]]:
        if not self.driver:
            logger.error("Driver not initialized. Call connect() first.")
            return []

        with self.driver.session(database=self.database) as session:
            result = session.run(query, parameters or {})
            return [record.data() for record in result]
