from .gemini_curator import run_gemini_curator
from .mock_curator import run_mock_curator
from .safety_rules import pre_check_safety
from .schemas import CuratorOutput
from config import settings


def curate_context(input_data: dict) -> CuratorOutput:
    heuristic = pre_check_safety(input_data.get("content", ""))

    output = None
    if settings.gemini_api_key:
        output = run_gemini_curator(input_data)

    if not output:
        output = run_mock_curator(input_data)

    if heuristic["decision"] == "quarantine":
        output.lane.decision = "quarantine"
        output.lane.reason = heuristic["reason"]
        output.safety.status = heuristic["status"]
        output.safety.reason = heuristic["reason"]
        output.safety.risk_tags = sorted(set(output.safety.risk_tags + heuristic["risk_tags"]))
    elif heuristic["decision"] == "review" and output.lane.decision == "auto_curate":
        output.lane.decision = "review"
        output.lane.reason = heuristic["reason"]
        output.safety.status = heuristic["status"]
        output.safety.reason = heuristic["reason"]
        output.safety.risk_tags = sorted(set(output.safety.risk_tags + heuristic["risk_tags"]))

    return output
