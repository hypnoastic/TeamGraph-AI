import os
from dataclasses import dataclass
from typing import Any

from config import settings

from .config import GraphitiRuntimeConfig


@dataclass(slots=True)
class GraphitiClientBundle:
    graphiti: Any
    episode_type: Any


def _disable_graphiti_telemetry() -> None:
    os.environ.setdefault("GRAPHITI_TELEMETRY_ENABLED", "false")


def create_graphiti_client(runtime_config: GraphitiRuntimeConfig) -> GraphitiClientBundle:
    _disable_graphiti_telemetry()

    from graphiti_core import Graphiti
    from graphiti_core.driver.neo4j_driver import Neo4jDriver
    from graphiti_core.nodes import EpisodeType

    graph_driver = Neo4jDriver(
        settings.neo4j_uri,
        settings.neo4j_username,
        settings.neo4j_password,
        database=settings.neo4j_database,
    )

    if runtime_config.provider == "gemini":
        from graphiti_core.cross_encoder.gemini_reranker_client import GeminiRerankerClient
        from graphiti_core.embedder.gemini import GeminiEmbedder, GeminiEmbedderConfig
        from graphiti_core.llm_client.gemini_client import GeminiClient, LLMConfig

        llm_config = LLMConfig(
            api_key=settings.gemini_api_key,
            model=settings.gemini_model,
        )

        graphiti = Graphiti(
            graph_driver=graph_driver,
            llm_client=GeminiClient(config=llm_config),
            embedder=GeminiEmbedder(
                config=GeminiEmbedderConfig(
                    api_key=settings.gemini_api_key,
                    embedding_model="embedding-001",
                )
            ),
            cross_encoder=GeminiRerankerClient(config=llm_config),
        )
        return GraphitiClientBundle(graphiti=graphiti, episode_type=EpisodeType)

    if runtime_config.provider == "openai-compatible":
        from graphiti_core.cross_encoder.openai_reranker_client import OpenAIRerankerClient
        from graphiti_core.embedder.openai import OpenAIEmbedder, OpenAIEmbedderConfig
        from graphiti_core.llm_client.config import LLMConfig
        from graphiti_core.llm_client.openai_generic_client import OpenAIGenericClient

        llm_config = LLMConfig(
            api_key=settings.openai_api_key or "local",
            model=settings.openai_model,
            small_model=settings.openai_model,
            base_url=settings.openai_base_url,
        )
        llm_client = OpenAIGenericClient(config=llm_config)
        graphiti = Graphiti(
            graph_driver=graph_driver,
            llm_client=llm_client,
            embedder=OpenAIEmbedder(
                config=OpenAIEmbedderConfig(
                    api_key=settings.openai_api_key or "local",
                    embedding_model=settings.openai_embedding_model,
                    base_url=settings.openai_base_url,
                )
            ),
            cross_encoder=OpenAIRerankerClient(client=llm_client, config=llm_config),
        )
        return GraphitiClientBundle(graphiti=graphiti, episode_type=EpisodeType)

    raise RuntimeError(f"Unsupported Graphiti provider: {runtime_config.provider}")
