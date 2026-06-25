import httpx
from typing import Any, Dict
import urllib.parse
from config import settings
from .base import BaseIntegrationProvider

class GoogleDriveProvider(BaseIntegrationProvider):
    def get_authorization_url(self, state: str) -> str:
        client_id = settings.google_client_id
        if not client_id:
            raise ValueError("Google Client ID is not configured.")
        redirect_uri = f"{settings.api_base_url}/api/integrations/google/callback"
        scopes = settings.google_drive_scopes
        
        params = {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": scopes,
            "state": state,
            "access_type": "offline",
            "prompt": "consent"
        }
        return "https://accounts.google.com/o/oauth2/v2/auth?" + urllib.parse.urlencode(params)

    async def exchange_code_for_tokens(self, code: str) -> Dict[str, Any]:
        client_id = settings.google_client_id
        client_secret = settings.google_client_secret
        redirect_uri = f"{settings.api_base_url}/api/integrations/google/callback"
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": client_id,
                    "client_secret": client_secret,
                    "redirect_uri": redirect_uri,
                    "grant_type": "authorization_code",
                }
            )
            response.raise_for_status()
            data = response.json()
            return {
                "access_token": data.get("access_token"),
                "refresh_token": data.get("refresh_token"),
                "expires_in": data.get("expires_in")
            }

    async def get_identity(self, access_token: str) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            response.raise_for_status()
            data = response.json()
            
            return {
                "external_id": data.get("id"),
                "display_name": data.get("name", "Google User"),
                "metadata": {"email": data.get("email")}
            }
