from .base import ConnectorRecord
from config import settings


def is_connector_configured(key: str) -> bool:
    if key == "github":
        return bool(settings.github_client_id and (settings.github_client_secret or settings.github_private_key))
    elif key == "slack":
        return bool(settings.slack_client_id and settings.slack_client_secret)
    elif key == "google":
        return bool(settings.google_client_id and settings.google_client_secret)
    elif key == "gmail":
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
    ("google", "Google Drive", "Documents, folders, and shared knowledge."),
    ("notion", "Notion", "Pages and workspace knowledge."),
    ("jira", "Jira", "Tickets, epics, and decisions."),
    ("linear", "Linear", "Issues, projects, and roadmaps."),
    ("gmail", "Gmail", "Selected email context."),
    ("calendar", "Calendar", "Meetings and event context."),
]


def list_connectors(connected_map: dict = None) -> list[dict]:
    if connected_map is None:
        connected_map = {}
    res = []
    for key, name, description in CONNECTORS:
        configured = is_connector_configured(key)
        conn_db = connected_map.get(key)
        is_connected = conn_db is not None and conn_db.status == "connected"

        # Determine state and todo
        if is_connected:
            state = "connected"
            todo = f"Connected to {conn_db.display_name or 'Workspace'}"
        elif configured:
            state = "configured"
            todo = "Ready to connect"
        else:
            state = "coming_soon"
            todo = "Coming soon (requires env keys)"


        res.append(
            ConnectorRecord(
                key=key,
                name=name,
                description=description,
                state=state,
                mode="live" if configured else "placeholder",
                todo=todo,
                ready=configured,
                connected_account=conn_db.display_name if is_connected else None,
                last_synced_at=conn_db.last_synced_at.isoformat() if (is_connected and conn_db.last_synced_at) else None,
            ).__dict__
        )
    return res
