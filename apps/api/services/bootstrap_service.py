from __future__ import annotations

from pathlib import Path

from config import settings
from database import neo4j_db


ROOT_DIR = Path(__file__).resolve().parents[1]
SCHEMA_FILE = ROOT_DIR / "graph" / "schema.cypher"


def ensure_neo4j_bootstrap(seed_demo: bool = False) -> None:
    if SCHEMA_FILE.exists():
        schema_queries = SCHEMA_FILE.read_text(encoding="utf-8").split(";")
        for query in schema_queries:
            statement = query.strip()
            if statement:
                neo4j_db.execute_query(statement)

    if not seed_demo:
        return

    seed_queries = [
        """
        MERGE (o:Organization {id: 'org_1'})
        SET o.name = 'Acme AI Lab',
            o.domain = 'acme.local',
            o.createdAt = coalesce(o.createdAt, toString(datetime()))
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
        MERGE (u3:User {id: 'usr_demo'})
        SET u3.email = 'demo@teamgraph.local',
            u3.name = 'Demo Operator',
            u3.role = 'admin'
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
              (u3:User {id: 'usr_demo'}),
              (p1:Project {id: 'proj_1'}),
              (p2:Project {id: 'proj_2'})
        MERGE (o)-[:HAS_MEMBER]->(u1)
        MERGE (o)-[:HAS_MEMBER]->(u2)
        MERGE (o)-[:HAS_MEMBER]->(u3)
        MERGE (u1)-[:MEMBER_OF]->(o)
        MERGE (u2)-[:MEMBER_OF]->(o)
        MERGE (u3)-[:MEMBER_OF]->(o)
        MERGE (o)-[:HAS_PROJECT]->(p1)
        MERGE (o)-[:HAS_PROJECT]->(p2)
        MERGE (u1)-[:CAN_ACCESS]->(p1)
        MERGE (u1)-[:CAN_ACCESS]->(p2)
        MERGE (u2)-[:CAN_ACCESS]->(p1)
        MERGE (u3)-[:CAN_ACCESS]->(p1)
        MERGE (u3)-[:CAN_ACCESS]->(p2)
        """,
    ]
    for query in seed_queries:
        neo4j_db.execute_query(query)

    seed_demo_context()


def seed_demo_context() -> None:
    sample_contexts = [
        {
            "id": "ctx_demo_launch",
            "title": "Hackathon launch checklist",
            "summary": "TeamGraph is deployed with Postgres for auth and Graphiti for organizational memory.",
            "content": "TeamGraph now uses Neon Postgres for auth, API keys, connectors, and activity logs. Graphiti stays the live brain layer on Neo4j. Demo account can answer questions about launch readiness, deployment, and connector roadmap.",
            "project_id": "proj_1",
            "project_name": "Core Platform",
            "user_id": "usr_demo",
            "uploader_email": "demo@teamgraph.local",
            "source_type": "seed",
            "brain_mode": "fallback",
            "graphiti_episode_uuid": "demo-episode-launch",
            "visibility": "project",
        },
        {
            "id": "ctx_demo_connectors",
            "title": "Connector ingestion policy",
            "summary": "Slack, GitHub, and Google Drive sync through TeamGraph and are curated before memory ingestion.",
            "content": "Live connectors are read-only. GitHub App syncs repositories, issues, and pull requests. Slack syncs channels and threads through a bot token. Google Drive syncs chosen files and folders after user consent. All ingested content goes through safety review before Graphiti ingestion.",
            "project_id": "proj_2",
            "project_name": "Agent Workflows",
            "user_id": "usr_demo",
            "uploader_email": "demo@teamgraph.local",
            "source_type": "seed",
            "brain_mode": "fallback",
            "graphiti_episode_uuid": "demo-episode-connectors",
            "visibility": "org",
        },
        {
            "id": "ctx_demo_deploy",
            "title": "AWS EC2 deployment shape",
            "summary": "A single EC2 host runs the reverse proxy, web app, API, and Neo4j, while Neon hosts Postgres.",
            "content": "Production hosting uses Docker Compose on EC2. Nginx fronts the Next.js app and FastAPI API. Neo4j runs in the same compose stack, and Neon Postgres stores control-plane data. Environment variables provide callback URLs and connector credentials.",
            "project_id": "proj_1",
            "project_name": "Core Platform",
            "user_id": "usr_demo",
            "uploader_email": "demo@teamgraph.local",
            "source_type": "seed",
            "brain_mode": "fallback",
            "graphiti_episode_uuid": "demo-episode-deploy",
            "visibility": "project",
        },
    ]

    for context in sample_contexts:
        neo4j_db.execute_query(
            """
            MATCH (u:User {id: $user_id})
            MATCH (p:Project {id: $project_id})
            MERGE (c:Context {id: $id})
            SET c.title = $title,
                c.type = 'note',
                c.summary = $summary,
                c.content = $content,
                c.visibility = $visibility,
                c.status = 'trusted',
                c.approvalStatus = 'approved',
                c.brainMode = $brain_mode,
                c.graphitiEpisodeUuid = $graphiti_episode_uuid,
                c.sourceType = $source_type,
                c.uploadChannel = 'seed',
                c.tags = ['demo', 'hackathon'],
                c.riskTags = [],
                c.organizationId = $organization_id,
                c.projectId = $project_id,
                c.projectName = $project_name,
                c.userId = $user_id,
                c.uploaderEmail = $uploader_email,
                c.scopeKeys = ['org:org_1', 'org:org_1:project:' + $project_id, 'org:org_1:user:' + $user_id],
                c.createdAt = coalesce(c.createdAt, toString(datetime())),
                c.updatedAt = toString(datetime())
            MERGE (u)-[:OWNS_CONTEXT]->(c)
            MERGE (c)-[:BELONGS_TO]->(p)
            MERGE (p)-[:HAS_CONTEXT]->(c)
            """,
            {
                **context,
                "organization_id": settings.teamgraph_org_id,
            },
        )
