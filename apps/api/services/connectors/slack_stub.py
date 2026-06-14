from .base import ConnectorStub


SLACK_CONNECTOR = ConnectorStub(
    key="slack",
    name="Slack",
    description="Ingest channels, threads, and messages into the TeamGraph live brain.",
    state="coming_soon",
    mode="demo",
    todo="OAuth, workspace selection, and background sync remain intentionally unfinished.",
)
