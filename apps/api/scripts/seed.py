import logging
import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from config import settings
from graph.neo4j_client import Neo4jClient


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def seed_database() -> None:
    neo4j_db = Neo4jClient(settings.neo4j_uri, settings.neo4j_username, settings.neo4j_password)
    neo4j_db.connect()

    schema_file = os.path.join(os.path.dirname(__file__), "..", "graph", "schema.cypher")
    with open(schema_file, "r", encoding="utf-8") as handle:
        schema_queries = handle.read().split(";")

    for query in schema_queries:
        statement = query.strip()
        if statement:
            logger.info("Executing schema query: %s", statement.splitlines()[0])
            neo4j_db.execute_query(statement)

    seed_queries = [
        """
        MERGE (o:Organization {id: 'org_1'})
        SET o.name = 'Acme AI Lab',
            o.domain = 'acme.local',
            o.createdAt = datetime().toString()
        """,
        """
        MERGE (u1:User {id: 'usr_admin'})
        SET u1.email = 'admin@teamgraph.local',
            u1.name = 'Admin User',
            u1.role = 'admin'
        """,
        """
        MERGE (u2:User {id: 'usr_member'})
        SET u2.email = 'member@teamgraph.local',
            u2.name = 'Member User',
            u2.role = 'member'
        """,
        """
        MERGE (p1:Project {id: 'proj_1'})
        SET p1.name = 'Core Platform',
            p1.visibility = 'org'
        """,
        """
        MERGE (p2:Project {id: 'proj_2'})
        SET p2.name = 'Agent Workflows',
            p2.visibility = 'org'
        """,
        """
        MATCH (o:Organization {id: 'org_1'}),
              (u1:User {id: 'usr_admin'}),
              (u2:User {id: 'usr_member'}),
              (p1:Project {id: 'proj_1'}),
              (p2:Project {id: 'proj_2'})
        MERGE (o)-[:HAS_MEMBER]->(u1)
        MERGE (o)-[:HAS_MEMBER]->(u2)
        MERGE (u1)-[:MEMBER_OF]->(o)
        MERGE (u2)-[:MEMBER_OF]->(o)
        MERGE (o)-[:HAS_PROJECT]->(p1)
        MERGE (o)-[:HAS_PROJECT]->(p2)
        MERGE (u1)-[:CAN_ACCESS]->(p1)
        MERGE (u1)-[:CAN_ACCESS]->(p2)
        MERGE (u2)-[:CAN_ACCESS]->(p1)
        """,
    ]

    for query in seed_queries:
        logger.info("Executing seed query")
        neo4j_db.execute_query(query)

    neo4j_db.close()
    logger.info("Seeding complete.")


if __name__ == "__main__":
    seed_database()
