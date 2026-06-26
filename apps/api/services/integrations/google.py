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
        redirect_uri = f"{settings.frontend_origin}/api/integrations/google/callback"
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
        redirect_uri = f"{settings.frontend_origin}/api/integrations/google/callback"
        
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

    async def sync_data(self, access_token: str, last_synced_at: Any = None, config: Dict[str, Any] = None) -> list[Dict[str, Any]]:
        import datetime
        
        episodes = []
        async with httpx.AsyncClient() as client:
            # Query for recently modified files
            query = ""
            if last_synced_at:
                if isinstance(last_synced_at, str):
                    time_str = last_synced_at
                else:
                    time_str = last_synced_at.isoformat()
                query = f"modifiedTime > '{time_str}'"
                
            params = {
                "pageSize": 10,
                "fields": "files(id, name, mimeType, modifiedTime)",
                "orderBy": "modifiedTime desc"
            }
            if query:
                params["q"] = query
                
            response = await client.get(
                "https://www.googleapis.com/drive/v3/files",
                headers={"Authorization": f"Bearer {access_token}"},
                params=params
            )
            
            if response.status_code == 401:
                # Token expired, would normally use refresh token here
                return []
                
            response.raise_for_status()
            data = response.json()
            
            for item in data.get("files", []):
                file_id = item.get("id")
                name = item.get("name")
                mime_type = item.get("mimeType")
                modified_time = item.get("modifiedTime")
                
                content = f"File: {name}\nMIME Type: {mime_type}\nLink: https://drive.google.com/file/d/{file_id}/view"
                
                # If it's a google doc or text file, we can try to fetch the text content
                if mime_type == "application/vnd.google-apps.document":
                    try:
                        export_resp = await client.get(
                            f"https://www.googleapis.com/drive/v3/files/{file_id}/export",
                            headers={"Authorization": f"Bearer {access_token}"},
                            params={"mimeType": "text/plain"}
                        )
                        if export_resp.status_code == 200:
                            content += "\n\nContent:\n" + export_resp.text[:5000] # Cap at 5000 chars for demo
                    except Exception:
                        pass
                elif mime_type == "text/plain":
                    try:
                        get_resp = await client.get(
                            f"https://www.googleapis.com/drive/v3/files/{file_id}",
                            headers={"Authorization": f"Bearer {access_token}"},
                            params={"alt": "media"}
                        )
                        if get_resp.status_code == 200:
                            content += "\n\nContent:\n" + get_resp.text[:5000]
                    except Exception:
                        pass

                episodes.append({
                    "title": name,
                    "content": content,
                    "summary": f"Google Drive file '{name}' modified at {modified_time}",
                    "metadata": {
                        "source": "google_drive",
                        "file_id": file_id,
                        "url": f"https://drive.google.com/file/d/{file_id}/view",
                        "created_at": modified_time,
                        "author": "Google Drive User"
                    }
                })
                
        return episodes
