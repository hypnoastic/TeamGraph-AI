import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    api_port: int = 8000
    secret_key: str = "demo_secret_key_change_me"
    environment: str = "local"
    
    neo4j_uri: str = "bolt://localhost:7687"
    neo4j_user: str = "neo4j"
    neo4j_password: str = "teamgraph_demo_pass"
    
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-3.1-flash-lite"
    
    teamgraph_api_key: str = "mcp_dev_key_123"

    class Config:
        env_file = "../../.env"

settings = Settings()
