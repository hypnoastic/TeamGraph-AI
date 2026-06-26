from .base import BaseIntegrationProvider
from .github import GitHubProvider
from .slack import SlackProvider
from .notion import NotionProvider
from .google import GoogleDriveProvider
from .gmail import GmailProvider

_PROVIDERS = {
    "github": GitHubProvider(),
    "slack": SlackProvider(),
    "notion": NotionProvider(),
    "google": GoogleDriveProvider(),
    "gmail": GmailProvider(),
}

def get_provider(provider_name: str) -> BaseIntegrationProvider:
    provider = _PROVIDERS.get(provider_name)
    if not provider:
        raise ValueError(f"Unknown integration provider: {provider_name}")
    return provider
