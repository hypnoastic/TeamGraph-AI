from datetime import datetime
from typing import Any

from .schemas import BrainSearchResult, SearchCitation, SearchFact


def _normalize_created_at(value: Any) -> str | None:
    if isinstance(value, datetime):
        return value.isoformat()
    if value is None:
        return None
    return str(value)


def _parse_episode_body_fields(episode_body: str | None) -> dict[str, str]:
    if not episode_body:
        return {}
    fields: dict[str, str] = {}
    for line in str(episode_body).split("\n"):
        if not line.strip():
            break
        if ":" not in line:
            continue
        key, _, value = line.partition(":")
        fields[key.strip()] = value.strip()
    return fields


def _episode_metadata_from_node(node: Any) -> dict[str, Any]:
    metadata = getattr(node, "episode_metadata", None) or getattr(node, "attributes", {}) or {}
    if not isinstance(metadata, dict):
        metadata = dict(metadata) if metadata else {}

    episode_body = getattr(node, "episode_body", None) or metadata.get("episode_body")
    parsed = _parse_episode_body_fields(episode_body)
    for key in ("context_id", "raw_context_id", "source_type", "project_name", "uploader_email"):
        if parsed.get(key) and not metadata.get(key):
            metadata[key] = parsed[key]
    return metadata


def normalize_search_results(results: Any, *, provider: str, mode: str) -> BrainSearchResult:
    nodes = getattr(results, "nodes", []) or []
    edges = getattr(results, "edges", []) or []

    citations: list[SearchCitation] = []
    related_facts: list[SearchFact] = []
    context_parts: list[str] = []

    for node in nodes[:5]:
        metadata = _episode_metadata_from_node(node)
        title = getattr(node, "name", None) or metadata.get("title") or "Graphiti Memory"
        summary = getattr(node, "summary", None) or metadata.get("summary")

        citations.append(
            SearchCitation(
                context_id=metadata.get("context_id"),
                graphiti_episode_uuid=getattr(node, "uuid", None),
                title=title,
                summary=summary,
                source_type=metadata.get("source_type"),
                project_name=metadata.get("project_name"),
                uploader_email=metadata.get("uploader_email"),
                created_at=_normalize_created_at(getattr(node, "created_at", None)),
                score=None,
            )
        )
        related_facts.append(
            SearchFact(
                id=getattr(node, "uuid", title),
                label=title,
                kind="entity",
                summary=summary,
            )
        )
        context_parts.append("\n".join(filter(None, [f"Title: {title}", f"Summary: {summary or ''}"])).strip())

    for edge in edges[:8]:
        description = getattr(edge, "fact", None) or getattr(edge, "name", None)
        if not description:
            continue
        related_facts.append(
            SearchFact(
                id=getattr(edge, "uuid", description),
                label=description,
                kind="fact",
                summary=description,
            )
        )
        context_parts.append(f"Fact: {description}")

    return BrainSearchResult(
        mode=mode,
        provider=provider,
        answer_context="\n\n".join(part for part in context_parts if part).strip(),
        citations=citations,
        related_facts=related_facts,
        timeline=[],
        confidence=0.82 if citations or related_facts else 0.0,
    )
