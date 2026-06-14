from typing import Any

from fastapi import HTTPException
from google import genai
from pydantic import BaseModel, Field

from config import settings
from services.graphiti.service import graphiti_service
from services.graphiti.schemas import SearchCitation, SearchFact
from services.team_service import user_can_access_project


class BrainQueryRequest(BaseModel):
    query: str
    project: str | None = None


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


def _render_deterministic_answer(query: str, citations: list[Citation], related_facts: list[RelatedFact]) -> str:
    if not citations and not related_facts:
        return "I couldn't find relevant live-brain context for that query."

    lines = [f"Query: {query}", ""]
    if citations:
        lines.append("Most relevant memory:")
        for citation in citations[:3]:
            snippet = citation.summary or "No summary available."
            lines.append(f"- {citation.title}: {snippet}")
    if related_facts:
        lines.append("")
        lines.append("Related graph facts:")
        for fact in related_facts[:4]:
            lines.append(f"- {fact.label}")
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


async def execute_brain_query(request: BrainQueryRequest, user: dict) -> BrainQueryResponse:
    if request.project and not user_can_access_project(user, request.project):
        raise HTTPException(status_code=403, detail="You do not have access to that project.")

    search_result = await graphiti_service.search_brain(
        request.query,
        project=request.project,
        user=user,
    )

    citations = [Citation(**citation.model_dump()) for citation in search_result.citations]
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
        prompt = f"""
You are the TeamGraph Brain Answerer.
Answer the user's question using only the provided TeamGraph memory.
Be concise, source-grounded, and technical.

Question:
{request.query}

Memory:
{search_result.answer_context}
"""
        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=prompt,
        )
        answer = response.text
    else:
        answer = _render_deterministic_answer(request.query, citations, related_facts)

    return BrainQueryResponse(
        answer=answer,
        confidence=search_result.confidence,
        citations=citations,
        related_facts=related_facts,
        timeline=timeline,
        suggested_next_actions=_render_suggested_actions(request.project, len(citations)),
        mode=search_result.mode,
        provider=search_result.provider,
    )
