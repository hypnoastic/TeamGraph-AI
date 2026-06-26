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
        redirect_uri = f"{settings.frontend_origin}/api/integrations/gmail/callback"
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
        redirect_uri = f"{settings.frontend_origin}/api/integrations/gmail/callback"
        
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

    async def sync_data(self, access_token: str, last_synced_at: Any = None, config: Dict[str, Any] = None) -> list[Dict[str, Any]]:
        import datetime
        import base64
        
        episodes = []
        async with httpx.AsyncClient() as client:
            # Query for recent emails
            query = ""
            if last_synced_at:
                if isinstance(last_synced_at, str):
                    time_val = datetime.datetime.fromisoformat(last_synced_at)
                else:
                    time_val = last_synced_at
                timestamp = int(time_val.timestamp())
                query = f"after:{timestamp}"
                
            params = {
                "maxResults": 10,
            }
            if query:
                params["q"] = query
                
            response = await client.get(
                "https://gmail.googleapis.com/gmail/v1/users/me/messages",
                headers={"Authorization": f"Bearer {access_token}"},
                params=params
            )
            
            if response.status_code == 401:
                return []
                
            response.raise_for_status()
            data = response.json()
            
            messages = data.get("messages", [])
            for msg_ref in messages:
                msg_id = msg_ref.get("id")
                msg_resp = await client.get(
                    f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{msg_id}",
                    headers={"Authorization": f"Bearer {access_token}"},
                    params={"format": "full"}
                )
                if msg_resp.status_code == 200:
                    msg_data = msg_resp.json()
                    
                    # Extract headers
                    headers = msg_data.get("payload", {}).get("headers", [])
                    subject = next((h["value"] for h in headers if h["name"].lower() == "subject"), "No Subject")
                    sender = next((h["value"] for h in headers if h["name"].lower() == "from"), "Unknown Sender")
                    date_str = next((h["value"] for h in headers if h["name"].lower() == "date"), datetime.datetime.utcnow().isoformat())
                    
                    # Extract body (simplistic)
                    body_data = ""
                    parts = msg_data.get("payload", {}).get("parts", [])
                    if not parts:
                        body_data = msg_data.get("payload", {}).get("body", {}).get("data", "")
                    else:
                        for part in parts:
                            if part.get("mimeType") == "text/plain":
                                body_data = part.get("body", {}).get("data", "")
                                break
                    
                    content = ""
                    if body_data:
                        try:
                            # Replace URL-safe base64 characters
                            padded_data = body_data.replace("-", "+").replace("_", "/")
                            # Pad with '=' to make length multiple of 4
                            padded_data += "=" * ((4 - len(padded_data) % 4) % 4)
                            content = base64.b64decode(padded_data).decode("utf-8")
                        except Exception:
                            content = "Failed to decode email body."
                    else:
                        content = msg_data.get("snippet", "")

                    full_content = f"From: {sender}\nSubject: {subject}\nDate: {date_str}\n\n{content}"
                    
                    episodes.append({
                        "title": f"Email: {subject}",
                        "content": full_content,
                        "summary": f"Email from {sender} about {subject}",
                        "metadata": {
                            "source": "gmail",
                            "message_id": msg_id,
                            "url": f"https://mail.google.com/mail/u/0/#inbox/{msg_id}",
                            "created_at": date_str,
                            "author": sender
                        }
                    })
                    
        return episodes
