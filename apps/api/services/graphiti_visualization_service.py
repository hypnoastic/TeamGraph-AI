from __future__ import annotations

import logging
from typing import Any

from database import neo4j_db

logger = logging.getLogger(__name__)

EPISODE_QUERY = """
MATCH (e:Episodic)
WHERE e.group_id = $group_id
RETURN e
ORDER BY e.created_at DESC
LIMIT $episode_limit
"""

GRAPH_QUERY = """
MATCH (e:Episodic {group_id: $group_id})
OPTIONAL MATCH (e)-[r]-(n)
WHERE n:Entity OR n:Episodic
RETURN e, r, n
LIMIT $limit
"""


def _node_id(node: Any) -> str | None:
    if node is None:
        return None
    props = _graph_props(node)
    return props.get("uuid") or props.get("id") or props.get("name")


def _graph_props(value: Any) -> dict[str, Any]:
    if value is None:
        return {}
    if isinstance(value, dict):
        return value
    items = getattr(value, "items", None)
    if callable(items):
        return dict(items())
    properties = getattr(value, "_properties", None)
    if isinstance(properties, dict):
        return properties
    try:
        return dict(value)
    except (TypeError, ValueError):
        return {}


def _node_label(node: Any) -> str:
    if isinstance(node, dict):
        return "node"
    labels = list(getattr(node, "labels", []) or [])
    if "Episodic" in labels:
        return "episode"
    if "Entity" in labels:
        return "entity"
    return labels[0].lower() if labels else "node"


def get_graphiti_visualization(
    user: dict,
    *,
    query: str | None = None,
    node_types: set[str] | None = None,
    limit: int = 120,
) -> dict:
    org_id = user.get("org_id")
    if not org_id:
        return {"nodes": [], "edges": [], "timeline": [], "source": "graphiti", "reason": "missing_org"}

    if neo4j_db.driver is None:
        neo4j_db.connect()
    if neo4j_db.health_check().get("status") != "ok":
        return {"nodes": [], "edges": [], "timeline": [], "source": "graphiti", "reason": "neo4j_unavailable"}

    group_id = f"org_{org_id}"

    def include(kind: str) -> bool:
        return not node_types or kind in node_types

    nodes_by_id: dict[str, dict] = {}
    edges: list[dict] = []
    timeline: list[dict] = []
    seen_edges: set[str] = set()

    try:
        rows = neo4j_db.execute_query(GRAPH_QUERY, {"group_id": group_id, "limit": limit})
    except Exception as exc:
        logger.exception("Graphiti visualization query failed")
        return {"nodes": [], "edges": [], "timeline": [], "source": "graphiti", "reason": str(exc)}

    for row in rows:
        episode = row.get("e")
        related = row.get("n")
        rel = row.get("r")

        for node in (episode, related):
            if node is None:
                continue
            node_id = _node_id(node)
            if not node_id:
                continue
            kind = _node_label(node)
            if not include(kind):
                continue
            props = _graph_props(node)
            label = props.get("name") or props.get("title") or node_id
            if node_id not in nodes_by_id:
                nodes_by_id[node_id] = {
                    "id": node_id,
                    "label": str(label)[:120],
                    "type": kind,
                    "meta": {
                        k: v
                        for k, v in props.items()
                        if k in ("group_id", "source_description", "created_at", "summary", "uuid")
                    },
                }
            if kind == "episode":
                created = props.get("created_at")
                created_str = created.isoformat() if hasattr(created, "isoformat") else str(created or "")
                if query and query.lower() not in str(label).lower() and query.lower() not in str(props.get("summary", "")).lower():
                    continue
                timeline.append(
                    {
                        "id": node_id,
                        "title": str(label)[:120],
                        "summary": str(props.get("summary") or props.get("source_description") or "")[:200],
                        "projectName": props.get("source_description"),
                        "sourceType": "graphiti",
                        "createdAt": created_str,
                    }
                )

        if rel is not None and episode is not None and related is not None:
            source_id = _node_id(episode)
            target_id = _node_id(related)
            if source_id and target_id:
                rel_props = _graph_props(rel)
                rel_type = getattr(rel, "type", None) or rel_props.get("type") or "RELATED"
                rel_label = rel_props.get("fact") or rel_props.get("name") or rel_type
                edge_id = f"{source_id}-{target_id}-{rel_type}"
                if edge_id not in seen_edges:
                    seen_edges.add(edge_id)
                    edges.append(
                        {
                            "id": edge_id,
                            "source": source_id,
                            "target": target_id,
                            "label": str(rel_label)[:80],
                        }
                    )

    if query:
        q = query.lower()
        filtered_ids = {
            nid
            for nid, node in nodes_by_id.items()
            if q in node["label"].lower() or q in str(node.get("meta", {})).lower()
        }
        nodes_by_id = {nid: node for nid, node in nodes_by_id.items() if nid in filtered_ids}
        edges = [e for e in edges if e["source"] in filtered_ids and e["target"] in filtered_ids]
        timeline = [t for t in timeline if t["id"] in filtered_ids]

    timeline.sort(key=lambda item: item.get("createdAt") or "", reverse=True)

    return {
        "nodes": list(nodes_by_id.values()),
        "edges": edges,
        "timeline": timeline[:12],
        "source": "graphiti",
    }
