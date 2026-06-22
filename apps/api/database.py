from config import settings
from graph.neo4j_client import Neo4jClient


neo4j_db = Neo4jClient(
    settings.neo4j_uri,
    settings.neo4j_username,
    settings.neo4j_password,
    settings.neo4j_database,
)
