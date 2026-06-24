from .base import ConnectorRecord


GITHUB_CONNECTOR = ConnectorRecord(
    key="github",
    name="GitHub",
    description="Ingest repositories, pull requests, issues, and docs into the TeamGraph live brain.",
    state="coming_soon",
    mode="demo",
    todo="OAuth, installation flow, and real repo syncing remain intentionally unfinished.",
)
