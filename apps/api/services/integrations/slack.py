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
        
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://slack.com/api/oauth.v2.access",
                data={
                    "client_id": client_id,
                    "client_secret": client_secret,
                    "code": code,
                    "redirect_uri": redirect_uri
                }
            )
            resp.raise_for_status()
            data = resp.json()
            if not data.get("ok"):
                raise Exception(f"Slack OAuth failed: {data.get('error')}")
                
            return {
                "access_token": data.get("access_token"),
                "refresh_token": None
            }

    async def get_identity(self, access_token: str) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://slack.com/api/auth.test",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            resp.raise_for_status()
            data = resp.json()
            if not data.get("ok"):
                raise Exception(f"Slack auth.test failed: {data.get('error')}")
                
            return {
                "external_id": data.get("team_id"),
                "display_name": data.get("team", "Slack Workspace"),
                "metadata": {"team_name": data.get("team"), "bot_id": data.get("bot_id")}
            }

    async def sync_data(self, access_token: str, last_synced_at: Any = None, config: Dict[str, Any] = None) -> list[Dict[str, Any]]:
        import datetime
        
        episodes = []
        async with httpx.AsyncClient() as client:
            # 1. Get channels
            resp = await client.get(
                "https://slack.com/api/conversations.list",
                headers={"Authorization": f"Bearer {access_token}"},
                params={"types": "public_channel", "exclude_archived": True, "limit": 100}
            )
            if not resp.json().get("ok"):
                return []
                
            channels = resp.json().get("channels", [])
            
            # 2. For each channel, get history since last_synced_at
            oldest = 0
            if last_synced_at:
                if isinstance(last_synced_at, str):
                    time_val = datetime.datetime.fromisoformat(last_synced_at)
                else:
                    time_val = last_synced_at
                oldest = time_val.timestamp()
                
            for channel in channels:
                chan_id = channel.get("id")
                chan_name = channel.get("name")
                
                hist_resp = await client.get(
                    "https://slack.com/api/conversations.history",
                    headers={"Authorization": f"Bearer {access_token}"},
                    params={"channel": chan_id, "oldest": oldest, "limit": 50}
                )
                
                hist_data = hist_resp.json()
                if not hist_data.get("ok"):
                    continue
                    
                messages = hist_data.get("messages", [])
                for msg in messages:
                    if msg.get("subtype"):
                        continue # Skip bot joins, etc
                        
                    text = msg.get("text", "")
                    if not text.strip():
                        continue
                        
                    user = msg.get("user", "Unknown")
                    ts = msg.get("ts", "0")
                    
                    try:
                        dt = datetime.datetime.fromtimestamp(float(ts))
                        date_str = dt.isoformat()
                    except:
                        date_str = datetime.datetime.utcnow().isoformat()
                        
                    episodes.append({
                        "title": f"Slack Message in #{chan_name}",
                        "content": f"User {user} said in #{chan_name}:\n{text}",
                        "summary": f"A message posted in #{chan_name}",
                        "metadata": {
                            "source": "slack",
                            "channel_id": chan_id,
                            "message_ts": ts,
                            "created_at": date_str,
                            "author": user
                        }
                    })
                    
        return episodes
