from .mock_curator import run_mock_curator
from .gemini_curator import run_gemini_curator
from .safety_rules import pre_check_safety
from .schemas import CuratorOutput
from config import settings

def curate_context(input_data: dict) -> CuratorOutput:
    # 1. Pre-check safety
    safety_status = pre_check_safety(input_data.get("content", ""))
    
    # 2. Run model
    output = None
    if settings.gemini_api_key:
        output = run_gemini_curator(input_data)
        
    if not output:
        output = run_mock_curator(input_data)
        
    # 3. Override lane if heuristic failed
    if safety_status == "quarantine":
        output.lane.decision = "quarantine"
        output.safety.status = "unsafe"
        output.safety.reason = "Heuristic detected quarantine material."
        
    return output
