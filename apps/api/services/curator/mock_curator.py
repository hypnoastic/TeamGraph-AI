from .schemas import (
    Classification,
    CuratorOutput,
    GraphOperation,
    Lane,
    Quality,
    Retrieval,
    Safety,
)


def run_mock_curator(input_data: dict) -> CuratorOutput:
    content = input_data.get("content", "").lower()
    title = input_data.get("title", "Untitled Context")

    status = "safe"
    decision = "auto_curate"
    risk_tags: list[str] = []
    quality_score = 0.88

    if "decision:" in content or "task:" in content:
        status = "needs_review"
        decision = "review"
        risk_tags.append("major_claim")
        quality_score = 0.72

    if "password" in content or "secret" in content or "token" in content:
        status = "unsafe"
        decision = "quarantine"
        risk_tags.append("secrets_detected")
        quality_score = 0.12

    project = input_data.get("project")
    visibility = input_data.get("visibility_requested", "project")
    summary = input_data.get("content", "").strip()[:180]

    return CuratorOutput(
        safety=Safety(
            status=status,
            risk_tags=risk_tags,
            reason=f"Mock safety check marked this item as {status}.",
        ),
        quality=Quality(score=quality_score, signals=["mock_curator"]),
        classification=Classification(
            context_type=input_data.get("type", "note"),
            canonical_title=title,
            summary=f"{summary}..." if summary else "No summary available.",
            suggested_project=project,
            suggested_visibility=visibility,
            suggested_tags=input_data.get("tags", ["mock"]),
        ),
        relationships=[],
        duplicates=[],
        conflicts=[],
        retrieval=Retrieval(importance_score=0.8, freshness_score=1.0, retrieval_priority=0.84),
        lane=Lane(decision=decision, reason=f"Mock curator decision: {decision}"),
        graph_operations=[
            GraphOperation(
                operation="CREATE_CONTEXT",
                title=title,
                context_type=input_data.get("type", "note"),
                summary=f"{summary}..." if summary else "No summary available.",
                visibility=visibility,
                project=project,
            )
        ],
    )
