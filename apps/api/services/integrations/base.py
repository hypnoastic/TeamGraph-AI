from abc import ABC, abstractmethod
from typing import Any, Dict, Optional

class BaseIntegrationProvider(ABC):
    """
    Base class for all integration providers (OAuth and App flows).
    """

    @abstractmethod
    def get_authorization_url(self, state: str) -> str:
        """
        Returns the authorization/installation URL for the provider.
        """
        pass

    @abstractmethod
    async def exchange_code_for_tokens(self, code: str) -> Dict[str, Any]:
        """
        Exchanges the authorization code for access tokens (and refresh tokens if applicable).
        Must return a dict containing at minimum:
        - access_token
        - refresh_token (optional)
        - expires_in (optional)
        """
        pass

    @abstractmethod
    async def get_identity(self, access_token: str) -> Dict[str, Any]:
        """
        Fetches the connected user's/workspace's identity using the access token.
        Must return a dict containing at minimum:
        - external_id
        - display_name
        - metadata (optional)
        """
        pass

    @abstractmethod
    async def sync_data(self, access_token: str, last_synced_at: Optional[Any], config: Optional[Dict[str, Any]] = None) -> list[Dict[str, Any]]:
        """
        Fetches recent data modified since `last_synced_at`.
        Returns a list of episodes (dicts) matching the Graphiti add_episode_for_context payload.
        Episodes should have: title, content, summary, metadata (dict).
        """
        pass
