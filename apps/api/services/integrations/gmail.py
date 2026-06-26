import httpx
from typing import Any, Dict
import urllib.parse
from config import settings
from .google import GoogleDriveProvider

class GmailProvider(GoogleDriveProvider):
    def get_authorization_url(self, state: str) -> str:
        client_id = settings.google_client_id
        if not client_id:
            raise ValueError("Google Client ID is not configured.")
        redirect_uri = f"{settings.api_base_url}/api/integrations/gmail/callback"
        scopes = "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email"
        
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
        redirect_uri = f"{settings.api_base_url}/api/integrations/gmail/callback"
        
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
