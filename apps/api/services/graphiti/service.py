from __future__ import annotations

import logging
from datetime import datetime
from typing import Any

from .client import GraphitiClientBundle, create_graphiti_client
from .config import GraphitiRuntimeConfig, resolve_runtime_config
from .episodes import build_episode_payload
from .fallback import fallback_search
from .schemas import BrainSearchResult, EpisodeIngestionResult, EpisodeMetadata, GraphitiHealth
from .search import normalize_search_results


logger = logging.getLogger(__name__)


class GraphitiService:
    def __init__(self) -> None:
        self.runtime_config: GraphitiRuntimeConfig = resolve_runtime_config()
        self.bundle: GraphitiClientBundle | None = None
        self.health = GraphitiHealth(
            mode=self.runtime_config.mode,
            provider=self.runtime_config.provider,
            status="degraded" if self.runtime_config.mode == "fallback" else "initializing",
            reason=self.runtime_config.reason,
            group_id=self.runtime_config.group_id,
        )

    async def initialize_graphiti(self) -> GraphitiHealth:
        self.runtime_config = resolve_runtime_config()
        self.bundle = None
        self.health = GraphitiHealth(
            mode=self.runtime_config.mode,
            provider=self.runtime_config.provider,
            status="degraded" if self.runtime_config.mode == "fallback" else "initializing",
            reason=self.runtime_config.reason,
            group_id=self.runtime_config.group_id,
        )

        if self.runtime_config.mode == "fallback":
            return self.health

        try:
            self.bundle = create_graphiti_client(self.runtime_config)
            if self.runtime_config.build_indices:
                await self.bundle.graphiti.build_indices_and_constraints()

            self.health = GraphitiHealth(
                mode="live",
                provider=self.runtime_config.provider,
                status="ok",
                reason=None,
                initialized_at=datetime.utcnow(),
                group_id=self.runtime_config.group_id,
            )
        except Exception as exc:
            logger.exception("Graphiti initialization failed")
            self.bundle = None
            self.health = GraphitiHealth(
                mode="fallback",
                provider=self.runtime_config.provider,
                status="degraded",
                reason=str(exc),
                group_id=self.runtime_config.group_id,
            )

        return self.health

    async def close(self) -> None:
        if self.bundle is not None:
            await self.bundle.graphiti.close()
            self.bundle = None

    async def add_episode_for_context(
        self,
        *,
        title: str,
        content: str,
        metadata: EpisodeMetadata,
        summary: str | None = None,
    ) -> EpisodeIngestionResult:
        if self.bundle is None or self.health.mode != "live":
            return EpisodeIngestionResult(
                mode="fallback",
                provider=self.health.provider,
                status="skipped",
                reason=self.health.reason or "Graphiti is not available.",
            )

        payload = build_episode_payload(
            title=title,
            content=content,
            metadata=metadata,
            summary=summary,
            group_id=self.health.group_id,
        )

        result = await self.bundle.graphiti.add_episode(
            source=self.bundle.episode_type.text,
            **payload,
        )
        episode_uuid = getattr(getattr(result, "episode", None), "uuid", None)

        return EpisodeIngestionResult(
            mode="live",
            provider=self.health.provider,
            status="ingested",
            episode_uuid=episode_uuid,
            group_id=self.health.group_id,
            metadata=metadata.model_dump(),
        )

    async def add_episode_bulk_if_needed(
        self,
        episodes: list[dict[str, Any]],
    ) -> EpisodeIngestionResult:
        if not episodes:
            return EpisodeIngestionResult(
                mode=self.health.mode,
                provider=self.health.provider,
                status="skipped",
                reason="No episodes were provided.",
            )

        if self.bundle is None or self.health.mode != "live":
            return EpisodeIngestionResult(
                mode="fallback",
                provider=self.health.provider,
                status="skipped",
                reason=self.health.reason or "Graphiti is not available.",
            )

        awaitables = []
        for episode in episodes:
            metadata = EpisodeMetadata(**episode["metadata"])
            awaitables.append(
                self.add_episode_for_context(
                    title=episode["title"],
                    content=episode["content"],
                    metadata=metadata,
                    summary=episode.get("summary"),
                )
            )

        last_result: EpisodeIngestionResult | None = None
        for awaitable in awaitables:
            last_result = await awaitable

        return last_result or EpisodeIngestionResult(
            mode="fallback",
            provider=self.health.provider,
            status="skipped",
            reason="Bulk ingestion produced no result.",
        )

    async def search_brain(
        self,
        query: str,
        *,
        project: str | None = None,
        user: dict | None = None,
        limit: int = 5,
    ) -> BrainSearchResult:
        if self.bundle is None or self.health.mode != "live":
            return await self.fallback_search(query, project=project, user=user, limit=limit)

        try:
            results = await self.bundle.graphiti.search_(query)
            normalized = normalize_search_results(
                results,
                provider=self.health.provider,
                mode="live",
            )
            if normalized.answer_context:
                return normalized
        except Exception as exc:
            logger.exception("Graphiti search failed")
            self.health = self.health.model_copy(
                update={"mode": "fallback", "status": "degraded", "reason": str(exc)}
            )

        return await self.fallback_search(
            query,
            project=project,
            user=user,
            limit=limit,
            reason=self.health.reason or "Graphiti search failed.",
        )

    async def get_context_for_query(
        self,
        query: str,
        *,
        project: str | None = None,
        user: dict | None = None,
    ) -> BrainSearchResult:
        return await self.search_brain(query, project=project, user=user)

    async def get_project_memory(self, project: str, *, user: dict | None = None) -> BrainSearchResult:
        return await self.search_brain(project, project=project, user=user)

    async def get_user_memory(self, user_id: str, *, user: dict | None = None) -> BrainSearchResult:
        return await self.search_brain(user_id, user=user)

    async def get_handoff_context(self, query: str, *, user: dict | None = None) -> BrainSearchResult:
        return await self.search_brain(query, user=user)

    async def health_check(self) -> GraphitiHealth:
        return self.health

    async def fallback_search(
        self,
        query: str,
        *,
        project: str | None = None,
        user: dict | None = None,
        limit: int = 5,
        reason: str | None = None,
    ) -> BrainSearchResult:
        return fallback_search(
            query,
            project=project,
            user=user,
            limit=limit,
            reason=reason or self.health.reason,
        )


graphiti_service = GraphitiService()
