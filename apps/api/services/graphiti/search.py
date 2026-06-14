from datetime import datetime
from typing import Any

from .schemas import BrainSearchResult, SearchCitation, SearchFact


def _normalize_created_at(value: Any) -> str | None:
    if isinstance(value, datetime):
        return value.isoformat()
    if value is None:
        return None
    return str(value)


def normalize_search_results(results: Any, *, provider: str, mode: str) -> BrainSearchResult:
    nodes = getattr(results, "nodes", []) or []
    edges = getattr(results, "edges", []) or []

    citations: list[SearchCitation] = []
    related_facts: list[SearchFact] = []
    context_parts: list[str] = []

    for node in nodes[:5]:
        metadata = getattr(node, "episode_metadata", None) or getattr(node, "attributes", {}) or {}
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
