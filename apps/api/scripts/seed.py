import sys
import os

# Add the apps/api directory to sys.path so we can import modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from config import settings
from graph.neo4j_client import Neo4jClient
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def seed_database():
    neo4j_db = Neo4jClient(settings.neo4j_uri, settings.neo4j_username, settings.neo4j_password)
    neo4j_db.connect()

    schema_file = os.path.join(os.path.dirname(__file__), "..", "graph", "schema.cypher")
    
    with open(schema_file, "r") as f:
        schema_queries = f.read().split(";")
        
    for query in schema_queries:
        q = query.strip()
        if q:
            logger.info(f"Executing: {q}")
            neo4j_db.execute_query(q)
            
    # Seed Data
    seed_queries = [
        "MERGE (o:Organization {id: 'org_1'}) SET o.name = 'Acme AI Lab', o.domain = 'acme.local'",
        "MERGE (u1:User {id: 'usr_admin'}) SET u1.email = 'admin@teamgraph.local', u1.role = 'admin'",
        "MERGE (u2:User {id: 'usr_member'}) SET u2.email = 'member@teamgraph.local', u2.role = 'member'",
        "MERGE (p1:Project {id: 'proj_1'}) SET p1.name = 'Core Platform'",
        "MERGE (p2:Project {id: 'proj_2'}) SET p2.name = 'Agent Workflows'",
        """
        MATCH (o:Organization {id: 'org_1'}), (u1:User {id: 'usr_admin'}), (u2:User {id: 'usr_member'}),
              (p1:Project {id: 'proj_1'}), (p2:Project {id: 'proj_2'})
        MERGE (o)-[:HAS_MEMBER]->(u1)
        MERGE (o)-[:HAS_MEMBER]->(u2)
        MERGE (o)-[:HAS_PROJECT]->(p1)
        MERGE (o)-[:HAS_PROJECT]->(p2)
        """
    ]
    
    for q in seed_queries:
        logger.info(f"Executing seed: {q}")
        neo4j_db.execute_query(q)

    neo4j_db.close()
    logger.info("Seeding complete.")

if __name__ == "__main__":
    seed_database()
