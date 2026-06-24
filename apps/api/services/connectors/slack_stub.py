from .base import ConnectorRecord


SLACK_CONNECTOR = ConnectorRecord(
    key="slack",
    name="Slack",
    description="Ingest channels, threads, and messages into the TeamGraph live brain.",
    state="coming_soon",
    mode="demo",
    todo="OAuth, workspace selection, and background sync remain intentionally unfinished.",
)
