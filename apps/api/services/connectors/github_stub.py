from .base import ConnectorStub


GITHUB_CONNECTOR = ConnectorStub(
    key="github",
    name="GitHub",
    description="Ingest repositories, pull requests, issues, and docs into the TeamGraph live brain.",
    state="coming_soon",
    mode="demo",
    todo="OAuth, installation flow, and real repo syncing remain intentionally unfinished.",
)
