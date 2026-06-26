import time
import jwt
from typing import Any, Dict
import httpx
from config import settings
from .base import BaseIntegrationProvider

def get_github_jwt() -> str:
    if not settings.github_app_id or not settings.github_private_key:
        raise ValueError("GitHub App credentials not configured")
    now = int(time.time())
    payload = {
        "iat": now - 60,
        "exp": now + (10 * 60),
        "iss": settings.github_app_id
    }
    private_key = settings.github_private_key.replace("\\n", "\n")
    encoded_jwt = jwt.encode(payload, private_key, algorithm="RS256")
    return encoded_jwt

def get_installation_token(installation_id: str) -> str:
    jwt_token = get_github_jwt()
    headers = {
        "Authorization": f"Bearer {jwt_token}",
        "Accept": "application/vnd.github.v3+json"
    }
    with httpx.Client() as client:
        response = client.post(
            f"https://api.github.com/app/installations/{installation_id}/access_tokens",
            headers=headers
        )
        response.raise_for_status()
        return response.json()["token"]

class GitHubProvider(BaseIntegrationProvider):
    def get_authorization_url(self, state: str) -> str:
        app_slug = settings.github_app_slug or "demo-github-app"
        return f"https://github.com/apps/{app_slug}/installations/new?state={state}"

    async def exchange_code_for_tokens(self, code: str) -> Dict[str, Any]:
        # For GitHub Apps, the 'code' is the installation_id
        return {
            "access_token": code,
            "refresh_token": None
        }

    async def get_identity(self, access_token: str) -> Dict[str, Any]:
        installation_id = access_token
        
        # Fallback for demo if keys aren't configured yet
        if not settings.github_app_id or not settings.github_private_key:
            return {
                "external_id": str(installation_id),
                "display_name": f"GitHub Installation {installation_id}",
                "metadata": {"type": "github_app"}
            }

        jwt_token = get_github_jwt()
        headers = {
            "Authorization": f"Bearer {jwt_token}",
            "Accept": "application/vnd.github.v3+json"
        }
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.github.com/app/installations/{installation_id}",
                headers=headers
            )
            response.raise_for_status()
            data = response.json()
            
            account_login = data.get("account", {}).get("login", "Unknown")
            
            return {
                "external_id": str(installation_id),
                "display_name": f"GitHub ({account_login})",
                "metadata": {"type": "github_app", "account": account_login}
            }

    async def sync_data(self, access_token: str, last_synced_at: Any = None, config: Dict[str, Any] = None) -> list[Dict[str, Any]]:
        import datetime
        import asyncio
        
        episodes = []
        
        if not config or not config.get("repositories"):
            return []
            
        repos = config.get("repositories", [])
        
        # Get an installation token to make API requests
        try:
            # We can run synchronous get_installation_token in a thread, or just convert it to async
            # For simplicity, since it uses httpx.Client, we'll just run it blockingly or recreate the logic
            jwt_token = get_github_jwt()
            async with httpx.AsyncClient() as client:
                headers = {
                    "Authorization": f"Bearer {jwt_token}",
                    "Accept": "application/vnd.github.v3+json"
                }
                resp = await client.post(
                    f"https://api.github.com/app/installations/{access_token}/access_tokens",
                    headers=headers
                )
                resp.raise_for_status()
                install_token = resp.json()["token"]
        except Exception:
            return []

        async with httpx.AsyncClient() as client:
            headers = {
                "Authorization": f"Bearer {install_token}",
                "Accept": "application/vnd.github.v3+json"
            }
            
            since_str = ""
            if last_synced_at:
                if isinstance(last_synced_at, str):
                    since_str = last_synced_at
                else:
                    since_str = last_synced_at.isoformat()
                    
            for repo in repos:
                params = {}
                if since_str:
                    params["since"] = since_str
                    
                try:
                    commits_resp = await client.get(
                        f"https://api.github.com/repos/{repo}/commits",
                        headers=headers,
                        params=params
                    )
                    if commits_resp.status_code == 200:
                        commits = commits_resp.json()
                        for commit in commits[:20]: # Limit to 20 for demo
                            sha = commit.get("sha")
                            commit_info = commit.get("commit", {})
                            msg = commit_info.get("message", "")
                            author = commit_info.get("author", {}).get("name", "Unknown")
                            date_str = commit_info.get("author", {}).get("date", datetime.datetime.utcnow().isoformat())
                            url = commit.get("html_url", "")
                            
                            episodes.append({
                                "title": f"Commit in {repo}: {msg.splitlines()[0] if msg else sha}",
                                "content": f"Commit {sha} by {author} in {repo}:\n\n{msg}",
                                "summary": f"A commit by {author} in repository {repo}",
                                "metadata": {
                                    "source": "github",
                                    "repo": repo,
                                    "commit_sha": sha,
                                    "url": url,
                                    "created_at": date_str,
                                    "author": author
                                }
                            })
                except Exception:
                    pass
                    
        return episodes
