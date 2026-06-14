from .base import ConnectorStub
from .github_stub import GITHUB_CONNECTOR
from .slack_stub import SLACK_CONNECTOR


def list_connectors() -> list[dict]:
    connectors: list[ConnectorStub] = [
        SLACK_CONNECTOR,
        GITHUB_CONNECTOR,
        ConnectorStub(
            key="google-drive",
            name="Google Drive",
            description="Demo card for docs and spreadsheet ingestion.",
            state="coming_soon",
            mode="demo",
            todo="No OAuth or sync implementation yet.",
        ),
        ConnectorStub(
            key="notion",
            name="Notion",
            description="Demo card for workspace ingestion.",
            state="coming_soon",
            mode="demo",
            todo="No OAuth or sync implementation yet.",
        ),
        ConnectorStub(
            key="jira",
            name="Jira",
            description="Demo card for ticket and epic ingestion.",
            state="coming_soon",
            mode="demo",
            todo="No OAuth or sync implementation yet.",
        ),
        ConnectorStub(
            key="teams",
            name="Teams",
            description="Demo card for chats and meeting notes.",
            state="coming_soon",
            mode="demo",
            todo="No OAuth or sync implementation yet.",
        ),
        ConnectorStub(
            key="outlook",
            name="Outlook",
            description="Demo card for email-based context ingestion.",
            state="coming_soon",
            mode="demo",
            todo="No OAuth or sync implementation yet.",
        ),
    ]
    return [connector.__dict__ for connector in connectors]
