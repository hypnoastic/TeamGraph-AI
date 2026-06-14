import secrets
import hashlib
from typing import List

def generate_api_key() -> tuple[str, str, str]:
    """Generates a raw key, its hash, and a prefix for display."""
    raw_key = f"tg_{secrets.token_urlsafe(32)}"
    key_hash = hash_api_key(raw_key)
    prefix = raw_key[:8]
    return raw_key, key_hash, prefix

def hash_api_key(raw_key: str) -> str:
    """Hashes the API key using SHA-256 for storage."""
    return hashlib.sha256(raw_key.encode()).hexdigest()

def validate_scopes(requested_scopes: List[str], allowed_scopes: List[str]) -> bool:
    """Validates that all requested scopes are in the allowed scopes."""
    return all(scope in allowed_scopes for scope in requested_scopes)
