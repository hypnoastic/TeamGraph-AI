import re

def pre_check_safety(content: str) -> str:
    """Returns 'quarantine', 'review', or 'safe' based on heuristics."""
    content_lower = content.lower()
    
    # Secrets regex
    if re.search(r'(api_key|secret|password|token)\s*=\s*\w+', content_lower):
        return "quarantine"
    if "-----begin private key-----" in content_lower or "ghp_" in content_lower or "xoxb-" in content_lower:
        return "quarantine"
        
    # Prompt injection
    injection_patterns = [
        "ignore previous instructions",
        "forget all instructions",
        "system prompt",
        "override policy",
        "developer message"
    ]
    for pattern in injection_patterns:
        if pattern in content_lower:
            return "quarantine"
            
    return "safe"
