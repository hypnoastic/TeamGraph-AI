from .base import ConnectorRecord


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
    return [
        ConnectorRecord(
            key=key,
            name=name,
            description=description,
            state="coming_soon",
            mode="placeholder",
            todo="Coming soon",
            ready=False,
        ).__dict__
        for key, name, description in CONNECTORS
    ]
