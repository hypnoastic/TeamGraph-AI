from .schemas import CuratorOutput, Safety, Quality, Classification, Retrieval, Lane, GraphOperation

def run_mock_curator(input_data: dict) -> CuratorOutput:
    # A simple deterministic mock curator based on input content heuristics
    content = input_data.get("content", "").lower()
    
    status = "safe"
    decision = "auto_curate"
    risk_tags = []
    
    if "secret" in content or "password" in content or "token" in content:
        status = "unsafe"
        decision = "quarantine"
        risk_tags.append("secrets_detected")
    elif "decision:" in content or "task:" in content:
        status = "needs_review"
        decision = "review"
        risk_tags.append("major_claim")
        
    return CuratorOutput(
        safety=Safety(status=status, risk_tags=risk_tags, reason="Mock safety check."),
        quality=Quality(score=0.85, signals=["mock_signal"]),
        classification=Classification(
            context_type="note",
            canonical_title="Mock Title",
            summary=input_data.get("content", "Mock summary")[:50] + "...",
            suggested_project=input_data.get("project"),
            suggested_visibility=input_data.get("visibility_requested", "project"),
            suggested_tags=["mock"]
        ),
        relationships=[],
        duplicates=[],
        conflicts=[],
        retrieval=Retrieval(importance_score=0.8, freshness_score=1.0, retrieval_priority=0.8),
        lane=Lane(decision=decision, reason=f"Mock decision: {decision}"),
        graph_operations=[
            GraphOperation(
                operation="CREATE_CONTEXT",
                title="Mock Title",
                context_type="note",
                summary="Mock summary",
                visibility=input_data.get("visibility_requested", "project")
            )
        ]
    )
