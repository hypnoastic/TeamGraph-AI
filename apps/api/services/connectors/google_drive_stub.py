import datetime
import httpx
from typing import Dict, Any, List

from .base import BaseConnector

class GoogleDriveConnector(BaseConnector):
    provider_name = "google"

    async def fetch_recent_activity(self, since: datetime.datetime) -> List[Dict[str, Any]]:
        # In a real implementation, this would use the Google Drive API to fetch files modified since the timestamp
        # For this stub, we just return a test document if we can successfully query the API.
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://www.googleapis.com/drive/v3/files",
                headers={"Authorization": f"Bearer {self.access_token}"},
                params={"pageSize": 5, "fields": "files(id, name, mimeType, modifiedTime)"}
            )
            
            if response.status_code == 401:
                raise Exception("Authentication failed. Token may be expired.")
            
            response.raise_for_status()
            data = response.json()
            
            activities = []
            for item in data.get("files", []):
                activities.append({
                    "id": item.get("id"),
                    "type": "file",
                    "title": item.get("name"),
                    "url": f"https://drive.google.com/file/d/{item.get('id')}/view",
                    "author": "Google Drive User",
                    "timestamp": item.get("modifiedTime") or datetime.datetime.utcnow().isoformat(),
                    "source": "google",
                })
                
            return activities

    async def extract_content(self, activity_id: str) -> str:
        return f"Content of Google Drive document {activity_id} (not fetched in stub)"
