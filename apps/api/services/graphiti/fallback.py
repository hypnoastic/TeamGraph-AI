from sqlalchemy import or_, select

from models import ContextRecord, Project
from postgres import SessionLocal

from .schemas import BrainSearchResult, SearchCitation, SearchFact


def fallback_search(
    query: str,
    *,
    project: str | None = None,
    user: dict | None = None,
    limit: int = 5,
    reason: str | None = None,
) -> BrainSearchResult:
    if not user or not user.get("org_id"):
        return BrainSearchResult(
            mode="fallback",
            provider="mock",
            answer_context="",
            confidence=0.0,
            reason=reason or "Organization context is not configured.",
        )

    ignored_words = {"what", "when", "where", "which", "with", "from", "this", "that", "have", "about", "your", "team"}
    search_terms = [
        term.strip(".,?!:;()[]{}").lower()
        for term in query.split()
        if len(term.strip(".,?!:;()[]{}")) >= 3
        and term.strip(".,?!:;()[]{}").lower() not in ignored_words
    ]
    search_terms = search_terms[:8] or [query]
    text_filters = []
    for term in search_terms:
        pattern = f"%{term}%"
        text_filters.extend(
            [
                ContextRecord.title.ilike(pattern),
                ContextRecord.summary.ilike(pattern),
                ContextRecord.content.ilike(pattern),
            ]
        )

    with SessionLocal() as session:
        statement = (
            select(ContextRecord, Project)
            .outerjoin(Project, ContextRecord.project_id == Project.id)
            .where(
                ContextRecord.organization_id == user["org_id"],
                ContextRecord.approval_status.in_(["safe", "approved"]),
                or_(*text_filters),
            )
            .order_by(ContextRecord.updated_at.desc())
            .limit(limit)
        )
        if project:
            statement = statement.where(or_(Project.id == project, Project.name == project))
        if user.get("role") != "admin":
            statement = statement.where(
                or_(
                    ContextRecord.project_id.is_(None),
                    ContextRecord.project_id.in_(user.get("project_ids", [])),
                    ContextRecord.user_id == user.get("id"),
                )
            )
        rows = session.execute(statement).all()

    citations: list[SearchCitation] = []
    facts: list[SearchFact] = []
    context_parts: list[str] = []
    for context, project_row in rows:
        citations.append(
            SearchCitation(
                context_id=context.id,
                graphiti_episode_uuid=context.graphiti_episode_uuid,
                title=context.title,
                summary=context.summary,
                source_type=context.source_type,
                project_name=project_row.name if project_row else None,
                created_at=context.created_at.isoformat(),
                score=0.5,
            )
        )
        facts.append(
            SearchFact(
                id=context.id,
                label=context.title,
                kind="context",
                summary=context.summary,
            )
        )
        context_parts.append(
            f"Title: {context.title}\nSummary: {context.summary}\nContent: {context.content}"
        )

    return BrainSearchResult(
        mode="fallback",
        provider="mock",
        answer_context="\n\n".join(context_parts),
        citations=citations,
        related_facts=facts,
        confidence=0.55 if citations else 0.0,
        reason=reason if citations else reason or "No relevant TeamGraph context found.",
    )
