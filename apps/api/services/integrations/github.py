from typing import Any, Dict
import httpx
from config import settings
from .base import BaseIntegrationProvider

class GitHubProvider(BaseIntegrationProvider):
    def get_authorization_url(self, state: str) -> str:
        app_slug = settings.github_app_slug or "demo-github-app"
        return f"https://github.com/apps/{app_slug}/installations/new?state={state}"

    async def exchange_code_for_tokens(self, code: str) -> Dict[str, Any]:
        # For GitHub Apps, the 'code' we receive is actually the 'installation_id'.
        # We don't exchange it for a token right away, we just save the installation_id.
        return {
            "access_token": code,
            "refresh_token": None
        }

    async def get_identity(self, access_token: str) -> Dict[str, Any]:
        # access_token here is the installation_id.
        # Ideally, we would authenticate as the GitHub App using JWT to get installation details.
        # For this demo, we'll return a mock identity based on the installation ID.
        return {
            "external_id": access_token,
            "display_name": f"GitHub Installation {access_token}",
            "metadata": {"type": "github_app"}
        }
