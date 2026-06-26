from typing import Any, Dict
import httpx
import urllib.parse
from config import settings
from .base import BaseIntegrationProvider

class SlackProvider(BaseIntegrationProvider):
    def get_authorization_url(self, state: str) -> str:
        client_id = settings.slack_client_id
        if not client_id:
            raise ValueError("Slack Client ID is not configured.")
        redirect_uri = f"{settings.frontend_origin}/api/integrations/slack/callback"
        scopes = settings.slack_bot_scopes
        
        params = {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "scope": scopes,
            "state": state,
        }
        return "https://slack.com/oauth/v2/authorize?" + urllib.parse.urlencode(params)

    async def exchange_code_for_tokens(self, code: str) -> Dict[str, Any]:
        client_id = settings.slack_client_id
        client_secret = settings.slack_client_secret
        redirect_uri = f"{settings.frontend_origin}/api/integrations/slack/callback"
        # In a real scenario we'd do a POST to slack.com/api/oauth.v2.access
        # async with httpx.AsyncClient() as client:
        #     resp = await client.post(...)
        # For demo, just mock it if real credentials are not set
        return {
            "access_token": f"xoxb-mock-token-{code}",
            "refresh_token": None
        }

    async def get_identity(self, access_token: str) -> Dict[str, Any]:
        # Mock identity for Slack
        return {
            "external_id": "T123456",
            "display_name": "Slack Workspace",
            "metadata": {"team_name": "Acme Corp"}
        }
