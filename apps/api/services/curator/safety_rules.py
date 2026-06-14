import re


def pre_check_safety(content: str) -> dict:
    content_lower = content.lower()

    if re.search(r"(api_key|secret|password|token)\s*[:=]\s*[\w-]+", content_lower):
        return {
            "decision": "quarantine",
            "status": "unsafe",
            "risk_tags": ["secrets_detected"],
            "reason": "Potential secret or token detected.",
        }

    if "-----begin private key-----" in content_lower or "ghp_" in content_lower or "xoxb-" in content_lower:
        return {
            "decision": "quarantine",
            "status": "unsafe",
            "risk_tags": ["credentials_detected"],
            "reason": "Credential-shaped material detected.",
        }

    injection_patterns = [
        "ignore previous instructions",
        "forget all instructions",
        "system prompt",
        "override policy",
        "developer message",
    ]
    for pattern in injection_patterns:
        if pattern in content_lower:
            return {
                "decision": "quarantine",
                "status": "unsafe",
                "risk_tags": ["prompt_injection"],
                "reason": "Prompt injection or policy override language detected.",
            }

    if len(content.strip()) < 30:
        return {
            "decision": "review",
            "status": "needs_review",
            "risk_tags": ["low_quality"],
            "reason": "Content is too short for reliable automatic curation.",
        }

    return {
        "decision": "auto_curate",
        "status": "safe",
        "risk_tags": [],
        "reason": "Passed heuristic safety checks.",
    }
