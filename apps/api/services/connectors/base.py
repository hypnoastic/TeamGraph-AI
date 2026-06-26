from dataclasses import dataclass


@dataclass
class ConnectorRecord:
    key: str
    name: str
    description: str
    state: str
    mode: str
    todo: str
    auth_url: str | None = None
    ready: bool = False
    connected_account: str | None = None
    last_synced_at: str | None = None
