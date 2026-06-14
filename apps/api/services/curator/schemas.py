from pydantic import BaseModel
from typing import List, Optional

class Safety(BaseModel):
    status: str
    risk_tags: List[str]
    reason: str

class Quality(BaseModel):
    score: float
    signals: List[str]

class Classification(BaseModel):
    context_type: str
    canonical_title: str
    summary: str
    suggested_project: Optional[str]
    suggested_visibility: str
    suggested_tags: List[str]

class Relationship(BaseModel):
    from_title: str
    relation: str
    to_title: str
    confidence: float

class Retrieval(BaseModel):
    importance_score: float
    freshness_score: float
    retrieval_priority: float

class Lane(BaseModel):
    decision: str
    reason: str

class GraphOperation(BaseModel):
    operation: str
    title: Optional[str] = None
    context_type: Optional[str] = None
    summary: Optional[str] = None
    visibility: Optional[str] = None
    project: Optional[str] = None

class CuratorOutput(BaseModel):
    safety: Safety
    quality: Quality
    classification: Classification
    relationships: List[Relationship]
    duplicates: List[str]
    conflicts: List[str]
    retrieval: Retrieval
    lane: Lane
    graph_operations: List[GraphOperation]
