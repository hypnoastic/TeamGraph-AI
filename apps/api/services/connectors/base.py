from dataclasses import dataclass


@dataclass(slots=True)
class ConnectorStub:
    key: str
    name: str
    description: str
    state: str
    mode: str
    todo: str
