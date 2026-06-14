from typing import Any

from database import neo4j_db


def get_graph_visualization(limit: int = 80) -> dict[str, list[dict[str, Any]]]:
    nodes: list[dict[str, Any]] = []
    edges: list[dict[str, Any]] = []
    seen_nodes: set[str] = set()

    records = neo4j_db.execute_query(
        """
        MATCH (o:Organization {id: 'org_1'})
        OPTIONAL MATCH (o)-[:HAS_MEMBER]->(u:User)
        OPTIONAL MATCH (o)-[:HAS_PROJECT]->(p:Project)
        OPTIONAL MATCH (p)<-[:BELONGS_TO]-(c:Context)
        RETURN o, collect(DISTINCT u) AS users, collect(DISTINCT p) AS projects, collect(DISTINCT c)[0..$limit] AS contexts
        """,
        {"limit": limit},
    )
    if not records:
        return {"nodes": [], "edges": []}

    record = records[0]
    org = record["o"]
    org_id = org.get("id", "org_1")
    nodes.append(
        {
            "id": org_id,
            "label": org.get("name", "Organization"),
            "type": "organization",
            "meta": {"domain": org.get("domain")},
        }
    )
    seen_nodes.add(org_id)

    for user in record.get("users", []):
        if not user:
            continue
        user_id = user.get("id")
        if user_id not in seen_nodes:
            nodes.append(
                {
                    "id": user_id,
                    "label": user.get("name", user.get("email")),
                    "type": "user",
                    "meta": {"email": user.get("email"), "role": user.get("role")},
                }
            )
            seen_nodes.add(user_id)
        edges.append({"id": f"edge-{org_id}-{user_id}", "source": org_id, "target": user_id, "label": "HAS_MEMBER"})

    for project in record.get("projects", []):
        if not project:
            continue
        project_id = project.get("id")
        if project_id not in seen_nodes:
            nodes.append(
                {
                    "id": project_id,
                    "label": project.get("name", "Project"),
                    "type": "project",
                    "meta": {"visibility": project.get("visibility", "org")},
                }
            )
            seen_nodes.add(project_id)
        edges.append({"id": f"edge-{org_id}-{project_id}", "source": org_id, "target": project_id, "label": "HAS_PROJECT"})

    for context in record.get("contexts", []):
        if not context:
            continue
        context_id = context.get("id")
        if context_id not in seen_nodes:
            nodes.append(
                {
                    "id": context_id,
                    "label": context.get("title", "Context"),
                    "type": "context",
                    "meta": {
                        "status": context.get("approvalStatus", context.get("status")),
                        "visibility": context.get("visibility"),
                        "sourceType": context.get("sourceType"),
                        "graphitiEpisodeUuid": context.get("graphitiEpisodeUuid"),
                    },
                }
            )
            seen_nodes.add(context_id)

        project_id = context.get("projectId")
        if project_id:
            edges.append(
                {
                    "id": f"edge-{context_id}-{project_id}",
                    "source": context_id,
                    "target": project_id,
                    "label": "BELONGS_TO",
                }
            )

        user_id = context.get("userId")
        if user_id:
            edges.append(
                {
                    "id": f"edge-{user_id}-{context_id}",
                    "source": user_id,
                    "target": context_id,
                    "label": "OWNS_CONTEXT",
                }
            )

        episode_uuid = context.get("graphitiEpisodeUuid")
        if episode_uuid and episode_uuid not in seen_nodes:
            nodes.append(
                {
                    "id": episode_uuid,
                    "label": f"Episode {episode_uuid[:8]}",
                    "type": "episode",
                    "meta": {"mode": context.get("brainMode", "fallback")},
                }
            )
            seen_nodes.add(episode_uuid)
        if episode_uuid:
            edges.append(
                {
                    "id": f"edge-{context_id}-{episode_uuid}",
                    "source": context_id,
                    "target": episode_uuid,
                    "label": "INGESTED_AS",
                }
            )

    return {"nodes": nodes, "edges": edges}
