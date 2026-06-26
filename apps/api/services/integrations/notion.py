from typing import Any, Dict
import urllib.parse
from config import settings
from .base import BaseIntegrationProvider

class NotionProvider(BaseIntegrationProvider):
    def get_authorization_url(self, state: str) -> str:
        client_id = settings.notion_client_id
        if not client_id:
            raise ValueError("Notion Client ID is not configured.")
        redirect_uri = f"{settings.frontend_origin}/api/integrations/notion/callback"
        
        params = {
            "client_id": client_id,
            "response_type": "code",
            "owner": "user",
            "redirect_uri": redirect_uri,
            "state": state
        }
        return "https://api.notion.com/v1/oauth/authorize?" + urllib.parse.urlencode(params)

    async def exchange_code_for_tokens(self, code: str) -> Dict[str, Any]:
        return {
            "access_token": f"notion-mock-token-{code}",
            "refresh_token": None
        }

    async def get_identity(self, access_token: str) -> Dict[str, Any]:
        return {
            "external_id": "workspace_mock_id",
            "display_name": "Notion Workspace",
            "metadata": {"workspace_name": "Demo Notion"}
        }

    async def sync_data(self, access_token: str, last_synced_at: Any = None, config: Dict[str, Any] = None) -> list[Dict[str, Any]]:
        # Mock notion sync
        return []
