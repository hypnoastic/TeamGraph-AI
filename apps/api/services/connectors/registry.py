from .base import ConnectorRecord
from config import settings


def is_connector_configured(key: str) -> bool:
    if key == "github":
        return bool(settings.github_client_id and settings.github_client_secret)
    elif key == "slack":
        return bool(settings.slack_client_id and settings.slack_client_secret)
    elif key == "google-drive":
        return bool(settings.google_client_id and settings.google_client_secret)
    elif key == "notion":
        return bool(
            settings.notion_integration_token
            or (settings.notion_client_id and settings.notion_client_secret)
        )
    return False


CONNECTORS = [
    ("github", "GitHub", "Repositories, pull requests, issues, and docs."),
    ("slack", "Slack", "Channels, threads, and team conversations."),
    ("google-drive", "Google Drive", "Documents, folders, and shared knowledge."),
    ("notion", "Notion", "Pages and workspace knowledge."),
    ("jira", "Jira", "Tickets, epics, and decisions."),
    ("linear", "Linear", "Issues, projects, and roadmaps."),
    ("gmail", "Gmail", "Selected email context."),
    ("calendar", "Calendar", "Meetings and event context."),
]


def list_connectors() -> list[dict]:
    res = []
    for key, name, description in CONNECTORS:
        configured = is_connector_configured(key)
        res.append(
            ConnectorRecord(
                key=key,
                name=name,
                description=description,
                state="active" if configured else "coming_soon",
                mode="live" if configured else "placeholder",
                todo="Configured" if configured else "Coming soon",
                ready=configured,
            ).__dict__
        )
    return res
