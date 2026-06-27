from typing import Any

from fastapi import HTTPException
from google import genai
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from config import settings
from postgres import SessionLocal
from services.brain_chat_service import append_message
from services.brain_source_service import enrich_citations_from_postgres
from services.graphiti.service import graphiti_service
from services.graphiti.schemas import SearchCitation, SearchFact
from services.team_service import user_can_access_project


class BrainQueryRequest(BaseModel):
    query: str
    project: str | None = None
    conversation_id: str | None = None


class Citation(BaseModel):
    context_id: str | None = None
    graphiti_episode_uuid: str | None = None
    title: str
    summary: str | None = None
    source_type: str | None = None
    project_name: str | None = None
    uploader_email: str | None = None
    created_at: str | None = None
    score: float | None = None


class TimelineEvent(BaseModel):
    event: str
    context_id: str | None = None


class RelatedFact(BaseModel):
    id: str
    label: str
    kind: str
    summary: str | None = None


class BrainQueryResponse(BaseModel):
    answer: str
    confidence: float
    citations: list[Citation] = Field(default_factory=list)
    related_facts: list[RelatedFact] = Field(default_factory=list)
    timeline: list[TimelineEvent] = Field(default_factory=list)
    suggested_next_actions: list[str] = Field(default_factory=list)
    mode: str = "fallback"
    provider: str = "mock"
    conversation_id: str | None = None


def _format_citations_for_prompt(citations: list[Citation]) -> str:
    lines: list[str] = []
    for index, citation in enumerate(citations, start=1):
        lines.append(
            "\n".join(
                filter(
                    None,
                    [
                        f"[{index}] {citation.title}",
                        f"Summary: {citation.summary or 'No summary available.'}",
                        f"Project: {citation.project_name or 'Organization'}",
                        f"Source: {citation.source_type or 'unknown'}",
                    ],
                )
            )
        )
    return "\n\n".join(lines)


def _format_facts_for_prompt(related_facts: list[RelatedFact]) -> str:
    if not related_facts:
        return "No related graph facts."
    return "\n".join(f"- {fact.label}: {fact.summary or ''}".strip() for fact in related_facts[:8])


def _render_deterministic_answer(query: str, citations: list[Citation], related_facts: list[RelatedFact]) -> str:
    if not citations and not related_facts:
        return "I couldn't find relevant live-brain context for that query. Try uploading more context or broadening your question."

    lines = [f"Here's what I found for **{query}**:", ""]
    if citations:
        lines.append("**Most relevant memory**")
        for index, citation in enumerate(citations[:5], start=1):
            snippet = citation.summary or "No summary available."
            lines.append(f"- [{index}] **{citation.title}**: {snippet}")
    if related_facts:
        lines.append("")
        lines.append("**Related graph facts**")
        for fact in related_facts[:4]:
            lines.append(f"- {fact.label}")
    lines.append("")
    lines.append("_Review cited sources before acting on this answer._")
    return "\n".join(lines).strip()


def _render_suggested_actions(project: str | None, result_count: int) -> list[str]:
    actions = ["Upload more context if the answer is incomplete."]
    if project:
        actions.append(f"Open the {project} graph view for deeper inspection.")
    if result_count == 0:
        actions.append("Try a broader query or search another project.")
    else:
        actions.append("Review cited episodes before using this in an external agent.")
    return actions


def _build_gemini_prompt(query: str, citations: list[Citation], related_facts: list[RelatedFact], answer_context: str) -> str:
    return f"""
You are TeamGraph Brain, a source-grounded assistant for an organization's live memory graph.

Rules:
- Answer ONLY from the provided memory and facts.
- Use concise markdown: short intro, bullet points where helpful, and a brief "Next steps" section when useful.
- Insert inline citation markers like [1], [2] that map to the numbered sources below.
- If memory is thin or ambiguous, say so clearly instead of guessing.
- Do not invent people, projects, or decisions that are not in the memory.

Question:
{query}

Retrieved memory:
{answer_context or "No memory retrieved."}

Numbered sources:
{_format_citations_for_prompt(citations) or "No numbered sources."}

Related graph facts:
{_format_facts_for_prompt(related_facts)}
""".strip()


async def execute_brain_query(request: BrainQueryRequest, user: dict, db: Session | None = None) -> BrainQueryResponse:
    if request.project and not user_can_access_project(user, request.project):
        raise HTTPException(status_code=403, detail="You do not have access to that project.")

    if request.conversation_id and db is not None:
        append_message(
            conversation_id=request.conversation_id,
            user=user,
            db=db,
            role="user",
            text=request.query,
        )

    search_result = await graphiti_service.search_brain(
        request.query,
        project=request.project,
        user=user,
    )

    raw_citations = [Citation(**citation.model_dump()) for citation in search_result.citations]

    enrich_db = db
    close_enrich_db = False
    if enrich_db is None:
        enrich_db = SessionLocal()
        close_enrich_db = True
    try:
        citations = enrich_citations_from_postgres(raw_citations, user, enrich_db)
    finally:
        if close_enrich_db:
            enrich_db.close()

    related_facts = [RelatedFact(**fact.model_dump()) for fact in search_result.related_facts[:10]]
    timeline = [
        TimelineEvent(
            event=citation.title,
            context_id=citation.context_id,
        )
        for citation in citations[:5]
    ]

    if settings.gemini_api_key and search_result.answer_context:
        client = genai.Client(api_key=settings.gemini_api_key)
        prompt = _build_gemini_prompt(request.query, citations, related_facts, search_result.answer_context)
        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=prompt,
        )
        answer = (response.text or "").strip() or _render_deterministic_answer(request.query, citations, related_facts)
    else:
        answer = _render_deterministic_answer(request.query, citations, related_facts)

    payload = BrainQueryResponse(
        answer=answer,
        confidence=search_result.confidence,
        citations=citations,
        related_facts=related_facts,
        timeline=timeline,
        suggested_next_actions=_render_suggested_actions(request.project, len(citations)),
        mode=search_result.mode,
        provider=search_result.provider,
        conversation_id=request.conversation_id,
    )

    if request.conversation_id and db is not None:
        append_message(
            conversation_id=request.conversation_id,
            user=user,
            db=db,
            role="assistant",
            text=payload.answer,
            payload=payload.model_dump(),
        )

    return payload
