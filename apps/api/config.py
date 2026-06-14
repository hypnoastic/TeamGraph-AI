from pathlib import Path

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


ROOT_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(ROOT_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    api_port: int = Field(default=8000, alias="API_PORT")
    secret_key: str = Field(default="demo_secret_key_change_me", alias="SECRET_KEY")
    environment: str = Field(default="local", alias="ENVIRONMENT")
    frontend_origin: str = Field(default="http://localhost:3000", alias="FRONTEND_ORIGIN")

    neo4j_uri: str = Field(default="bolt://localhost:7687", alias="NEO4J_URI")
    neo4j_username: str = Field(
        default="neo4j",
        validation_alias=AliasChoices("NEO4J_USERNAME", "NEO4J_USER"),
    )
    neo4j_password: str = Field(default="teamgraph_demo_pass", alias="NEO4J_PASSWORD")

    gemini_api_key: str | None = Field(default=None, alias="GEMINI_API_KEY")
    gemini_model: str = Field(default="gemini-2.5-flash-lite", alias="GEMINI_MODEL")

    openai_api_key: str | None = Field(default=None, alias="OPENAI_API_KEY")
    openai_model: str = Field(default="gpt-4.1-mini", alias="OPENAI_MODEL")
    openai_base_url: str | None = Field(default=None, alias="OPENAI_BASE_URL")
    openai_embedding_model: str = Field(
        default="text-embedding-3-small",
        alias="OPENAI_EMBEDDING_MODEL",
    )

    graphiti_llm_provider: str | None = Field(default=None, alias="GRAPHITI_LLM_PROVIDER")
    graphiti_group_id: str = Field(default="org_1", alias="GRAPHITI_GROUP_ID")
    graphiti_build_indices: bool = Field(default=True, alias="GRAPHITI_BUILD_INDICES")

    teamgraph_api_key: str = Field(default="mcp_dev_key_123", alias="TEAMGRAPH_API_KEY")
    teamgraph_org_id: str = Field(default="org_1", alias="TEAMGRAPH_ORG_ID")
    teamgraph_org_name: str = Field(default="Acme AI Lab", alias="TEAMGRAPH_ORG_NAME")
    teamgraph_default_project: str = Field(
        default="Core Platform",
        alias="TEAMGRAPH_DEFAULT_PROJECT",
    )


settings = Settings()
