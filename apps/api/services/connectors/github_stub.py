from .base import ConnectorRecord
import json

class GithubStubConnector:
    """
    Mock implementation of a GitHub Connector sync process.
    In a real system, this would:
    1. Fetch the user's selected repositories from IntegrationConnection.config_json
    2. Extract files, issues, and PRs via the GitHub API
    3. Feed them into the graph pipeline (Neo4j / Graphiti)
    """
    
    @staticmethod
    def sync_repositories(config_json: str | None) -> list[str]:
        if not config_json:
            return []
            
        config = json.loads(config_json)
        selected_repos = config.get("repositories", [])
        
        synced = []
        for repo in selected_repos:
            # Simulate syncing
            print(f"Syncing repository to Graph: {repo}")
            synced.append(repo)
            
        return synced

GITHUB_CONNECTOR = ConnectorRecord(
    key="github",
    name="GitHub",
    description="Ingest repositories, pull requests, issues, and docs into the TeamGraph live brain.",
    state="coming_soon",
    mode="live",
    todo="Sync adapter uses repo selection config.",
)
