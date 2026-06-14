from dataclasses import dataclass

from config import settings


@dataclass(slots=True)
class GraphitiRuntimeConfig:
    provider: str
    mode: str
    reason: str | None = None
    group_id: str = "org_1"
    build_indices: bool = True


def resolve_runtime_config() -> GraphitiRuntimeConfig:
    requested_provider = (settings.graphiti_llm_provider or "").strip().lower()
    group_id = settings.graphiti_group_id

    if requested_provider == "gemini":
        if settings.gemini_api_key:
            return GraphitiRuntimeConfig(
                provider="gemini",
                mode="live",
                group_id=group_id,
                build_indices=settings.graphiti_build_indices,
            )
        return GraphitiRuntimeConfig(
            provider="gemini",
            mode="fallback",
            reason="GEMINI_API_KEY is not configured.",
            group_id=group_id,
            build_indices=settings.graphiti_build_indices,
        )

    if requested_provider in {"openai", "openai-compatible", "openai_compatible"}:
        if settings.openai_api_key:
            return GraphitiRuntimeConfig(
                provider="openai-compatible",
                mode="live",
                group_id=group_id,
                build_indices=settings.graphiti_build_indices,
            )
        return GraphitiRuntimeConfig(
            provider="openai-compatible",
            mode="fallback",
            reason="OPENAI_API_KEY is not configured.",
            group_id=group_id,
            build_indices=settings.graphiti_build_indices,
        )

    if settings.gemini_api_key:
        return GraphitiRuntimeConfig(
            provider="gemini",
            mode="live",
            group_id=group_id,
            build_indices=settings.graphiti_build_indices,
        )

    if settings.openai_api_key:
        return GraphitiRuntimeConfig(
            provider="openai-compatible",
            mode="live",
            group_id=group_id,
            build_indices=settings.graphiti_build_indices,
        )

    return GraphitiRuntimeConfig(
        provider="mock",
        mode="fallback",
        reason="No Gemini or OpenAI-compatible credentials are configured.",
        group_id=group_id,
        build_indices=False,
    )
