from database import neo4j_db

from .schemas import BrainSearchResult, SearchCitation, SearchFact


def fallback_search(
    query: str,
    *,
    project: str | None = None,
    user: dict | None = None,
    limit: int = 5,
    reason: str | None = None,
) -> BrainSearchResult:
    clauses = [
        "MATCH (c:Context)",
        "OPTIONAL MATCH (c)-[:BELONGS_TO]->(p:Project)",
        "WHERE c.status = 'trusted'",
        "AND (toLower(c.content) CONTAINS toLower($query) OR toLower(c.title) CONTAINS toLower($query))",
    ]
    params = {"query": query, "limit": limit}

    if project:
        clauses.append("AND p.name = $project")
        params["project"] = project

    if user and user.get("role") != "admin":
        clauses.append(
            "AND (c.visibility <> 'private' OR c.userId = $user_id OR c.uploaderEmail = $user_email)"
        )
        params["user_id"] = user.get("id")
        params["user_email"] = user.get("email")

    query_text = "\n".join(
        clauses
        + [
            "RETURN c, p",
            "ORDER BY coalesce(c.updatedAt, c.createdAt) DESC",
            "LIMIT $limit",
        ]
    )
    records = neo4j_db.execute_query(query_text, params)

    citations: list[SearchCitation] = []
    facts: list[SearchFact] = []
    context_parts: list[str] = []

    for record in records:
        context = record["c"]
        project_node = record.get("p")
        citations.append(
            SearchCitation(
                context_id=context.get("id"),
                graphiti_episode_uuid=context.get("graphitiEpisodeUuid"),
                title=context.get("title", "Untitled Context"),
                summary=context.get("summary"),
                source_type=context.get("sourceType"),
                project_name=project_node.get("name") if project_node else None,
                uploader_email=context.get("uploaderEmail"),
                created_at=context.get("createdAt"),
                score=0.5,
            )
        )
        facts.append(
            SearchFact(
                id=context.get("id", "unknown"),
                label=context.get("title", "Untitled Context"),
                kind="context",
                summary=context.get("summary"),
            )
        )
        context_parts.append(
            "\n".join(
                [
                    f"Title: {context.get('title', 'Untitled Context')}",
                    f"Summary: {context.get('summary', 'No summary available.')}",
                    f"Content: {context.get('content', '')}",
                ]
            )
        )

    if not citations:
        return BrainSearchResult(
            mode="fallback",
            provider="mock",
            answer_context="",
            citations=[],
            related_facts=[],
            timeline=[],
            confidence=0.0,
            reason=reason or "No relevant TeamGraph fallback context found.",
        )

    return BrainSearchResult(
        mode="fallback",
        provider="mock",
        answer_context="\n\n".join(context_parts),
        citations=citations,
        related_facts=facts,
        timeline=[],
        confidence=0.55,
        reason=reason,
    )
